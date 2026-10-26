from flask import current_app
from flask_jwt_extended import current_user, jwt_required
from sqlalchemy import delete, select

from app.api import api
from app.auth import parse_body
from app.errors import APIError, NotFound
from app.extensions import db
from app.models import CartItem, Product
from app.schemas import CartItemCreateSchema, CartItemSchema, CartItemUpdateSchema


def serialize_cart(user) -> dict:
    items = list(user.cart_items)
    return {
        "items": CartItemSchema(many=True).dump(items),
        "subtotal": sum(item.line_total for item in items),
        "count": sum(item.quantity for item in items),
        "delivery_fee": current_app.config["DELIVERY_FEE"],
    }


def _ensure_stock(product: Product, quantity: int) -> None:
    if quantity > product.stock:
        raise APIError(
            f"Only {product.stock} unit(s) of {product.name} in stock.",
            409,
            "insufficient_stock",
        )


def _get_own_item(item_id: int) -> CartItem:
    item = db.session.scalar(select(CartItem).where(CartItem.id == item_id, CartItem.user_id == current_user.id))
    if item is None:
        raise NotFound("Cart item not found.")
    return item


@api.get("/cart")
@jwt_required()
def get_cart():
    return serialize_cart(current_user)


@api.post("/cart/items")
@jwt_required()
def add_cart_item():
    data = parse_body(CartItemCreateSchema())
    product = db.session.get(Product, data["product_id"])
    if product is None or not product.is_active:
        raise NotFound("Product not found.")

    item = db.session.scalar(
        select(CartItem).where(CartItem.user_id == current_user.id, CartItem.product_id == product.id)
    )
    # Adding a product already in the cart increments its quantity.
    new_quantity = data["quantity"] + (item.quantity if item else 0)
    _ensure_stock(product, new_quantity)

    if item is None:
        item = CartItem(user_id=current_user.id, product=product, quantity=new_quantity)
        db.session.add(item)
    else:
        item.quantity = new_quantity
    db.session.commit()
    db.session.refresh(current_user)
    return serialize_cart(current_user), 201


@api.patch("/cart/items/<int:item_id>")
@jwt_required()
def update_cart_item(item_id: int):
    item = _get_own_item(item_id)
    data = parse_body(CartItemUpdateSchema())
    _ensure_stock(item.product, data["quantity"])
    item.quantity = data["quantity"]
    db.session.commit()
    return serialize_cart(current_user)


@api.delete("/cart/items/<int:item_id>")
@jwt_required()
def remove_cart_item(item_id: int):
    item = _get_own_item(item_id)
    db.session.delete(item)
    db.session.commit()
    db.session.refresh(current_user)
    return serialize_cart(current_user)


@api.delete("/cart")
@jwt_required()
def clear_cart():
    db.session.execute(delete(CartItem).where(CartItem.user_id == current_user.id))
    db.session.commit()
    db.session.refresh(current_user)
    return serialize_cart(current_user)
