from flask import current_app
from flask_jwt_extended import current_user, jwt_required
from marshmallow import fields
from sqlalchemy import select

from app.api import api
from app.auth import parse_body
from app.errors import APIError, NotFound
from app.extensions import db
from app.models import CartItem, Order, OrderItem, OrderStatus, PaymentMethod, Product, ShippingAddress
from app.schemas import KENYAN_PHONE, BaseSchema, CheckoutSchema, OrderSchema
from app.services.mpesa import MpesaClient, MpesaError, normalize_phone

PAYABLE_STATUSES = {OrderStatus.PENDING_PAYMENT, OrderStatus.PAYMENT_FAILED}
CANCELLABLE_STATUSES = {OrderStatus.PENDING_PAYMENT, OrderStatus.PAYMENT_FAILED, OrderStatus.CONFIRMED}


class PayOrderSchema(BaseSchema):
    phone_number = fields.String(required=True, validate=KENYAN_PHONE)


def _get_own_order(order_id: int) -> Order:
    order = db.session.scalar(select(Order).where(Order.id == order_id, Order.user_id == current_user.id))
    if order is None:
        raise NotFound("Order not found.")
    return order


def _request_mpesa_payment(order: Order, phone_number: str) -> None:
    """Send the STK push and record its checkout id. Leaves the order payable on failure."""
    order.mpesa_phone_number = normalize_phone(phone_number)
    try:
        result = MpesaClient().stk_push(
            phone_number=phone_number,
            amount=order.total,
            reference=f"UTIBU{order.id}",
            description="Medication",
        )
    except MpesaError as exc:
        order.status = OrderStatus.PAYMENT_FAILED
        db.session.commit()
        raise APIError(str(exc), 502, "payment_initiation_failed", {"order_id": order.id}) from exc

    order.status = OrderStatus.PENDING_PAYMENT
    order.mpesa_checkout_request_id = result["CheckoutRequestID"]
    db.session.commit()


@api.get("/orders")
@jwt_required()
def list_orders():
    return OrderSchema(many=True).dump(current_user.orders)


@api.get("/orders/<int:order_id>")
@jwt_required()
def get_order(order_id: int):
    return OrderSchema().dump(_get_own_order(order_id))


@api.post("/orders")
@jwt_required()
def checkout():
    data = parse_body(CheckoutSchema())

    address = db.session.scalar(
        select(ShippingAddress).where(
            ShippingAddress.id == data["shipping_address_id"], ShippingAddress.user_id == current_user.id
        )
    )
    if address is None:
        raise NotFound("Shipping address not found.")

    cart_items = db.session.scalars(
        select(CartItem).where(CartItem.user_id == current_user.id).order_by(CartItem.id)
    ).all()
    if not cart_items:
        raise APIError("Your cart is empty.", 400, "empty_cart")

    # Lock product rows so concurrent checkouts can't oversell stock.
    product_ids = [item.product_id for item in cart_items]
    products = {
        p.id: p
        for p in db.session.scalars(
            select(Product).where(Product.id.in_(product_ids)).order_by(Product.id).with_for_update()
        )
    }

    order = Order(
        user_id=current_user.id,
        shipping_address=address,
        payment_method=data["payment_method"],
        status=OrderStatus.CONFIRMED
        if data["payment_method"] == PaymentMethod.CASH_ON_DELIVERY
        else OrderStatus.PENDING_PAYMENT,
        subtotal=0,
        delivery_fee=current_app.config["DELIVERY_FEE"] if data["include_delivery"] else 0,
        total=0,
    )
    for cart_item in cart_items:
        product = products.get(cart_item.product_id)
        if product is None or not product.is_active:
            raise APIError("A product in your cart is no longer available.", 409, "product_unavailable")
        if cart_item.quantity > product.stock:
            raise APIError(f"Only {product.stock} unit(s) of {product.name} in stock.", 409, "insufficient_stock")
        product.stock -= cart_item.quantity
        line_total = product.price * cart_item.quantity
        order.subtotal += line_total
        order.items.append(
            OrderItem(
                product_id=product.id,
                name=product.name,
                image_url=product.image_url,
                unit_price=product.price,
                quantity=cart_item.quantity,
                line_total=line_total,
            )
        )
        db.session.delete(cart_item)

    order.total = order.subtotal + order.delivery_fee
    db.session.add(order)
    db.session.commit()

    if order.payment_method == PaymentMethod.MPESA:
        _request_mpesa_payment(order, data["phone_number"])

    return OrderSchema().dump(order), 201


@api.post("/orders/<int:order_id>/pay")
@jwt_required()
def retry_payment(order_id: int):
    order = _get_own_order(order_id)
    if order.payment_method != PaymentMethod.MPESA or order.status not in PAYABLE_STATUSES:
        raise APIError("This order cannot be paid via M-Pesa.", 409, "not_payable")
    data = parse_body(PayOrderSchema())
    _request_mpesa_payment(order, data["phone_number"])
    return OrderSchema().dump(order)


@api.post("/orders/<int:order_id>/cancel")
@jwt_required()
def cancel_order(order_id: int):
    order = _get_own_order(order_id)
    if order.status not in CANCELLABLE_STATUSES:
        raise APIError("This order can no longer be cancelled.", 409, "not_cancellable")

    # Return reserved stock.
    for item in order.items:
        if item.product_id is not None:
            product = db.session.get(Product, item.product_id, with_for_update=True)
            if product is not None:
                product.stock += item.quantity
    order.status = OrderStatus.CANCELLED
    db.session.commit()
    return OrderSchema().dump(order)
