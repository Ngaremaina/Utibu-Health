from marshmallow import Schema, ValidationError, fields, pre_load, validate, validates_schema

from app.models import OrderStatus, PaymentMethod

KENYAN_PHONE = validate.Regexp(r"^(?:254|\+254|0)?(7|1)\d{8}$", error="Enter a valid Safaricom phone number.")


def _strip_strings(data):
    if isinstance(data, dict):
        return {key: value.strip() if isinstance(value, str) else value for key, value in data.items()}
    return data


class BaseSchema(Schema):
    @pre_load
    def strip(self, data, **kwargs):
        return _strip_strings(data)


# --- auth -----------------------------------------------------------------


class RegisterSchema(BaseSchema):
    email = fields.Email(required=True, validate=validate.Length(max=255))
    username = fields.String(required=True, validate=validate.Length(min=2, max=80))
    password = fields.String(required=True, load_only=True, validate=validate.Length(min=8, max=128))


class LoginSchema(BaseSchema):
    email = fields.Email(required=True)
    password = fields.String(required=True, load_only=True)


class UserSchema(Schema):
    id = fields.Integer()
    email = fields.Email()
    username = fields.String()
    is_admin = fields.Boolean()
    created_at = fields.DateTime()


# --- profile --------------------------------------------------------------


class ProfileSchema(BaseSchema):
    first_name = fields.String(allow_none=True, validate=validate.Length(max=100))
    last_name = fields.String(allow_none=True, validate=validate.Length(max=100))
    phone_number = fields.String(allow_none=True, validate=KENYAN_PHONE)
    address = fields.String(allow_none=True, validate=validate.Length(max=255))
    city = fields.String(allow_none=True, validate=validate.Length(max=100))
    country = fields.String(allow_none=True, validate=validate.Length(max=100))


# --- products -------------------------------------------------------------


class ProductSchema(BaseSchema):
    id = fields.Integer(dump_only=True)
    name = fields.String(required=True, validate=validate.Length(min=1, max=255))
    description = fields.String(required=True, validate=validate.Length(min=1))
    manufacturer = fields.String(required=True, validate=validate.Length(min=1, max=255))
    price = fields.Integer(required=True, strict=True, validate=validate.Range(min=0))
    stock = fields.Integer(load_default=0, strict=True, validate=validate.Range(min=0))
    expiration_date = fields.Date(allow_none=True)
    usage_instructions = fields.String(allow_none=True)
    warnings = fields.String(allow_none=True)
    image_url = fields.URL(allow_none=True, validate=validate.Length(max=1024))
    is_active = fields.Boolean(load_default=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)


class ProductQuerySchema(BaseSchema):
    q = fields.String(load_default=None, validate=validate.Length(max=100))
    page = fields.Integer(load_default=1, validate=validate.Range(min=1))
    per_page = fields.Integer(load_default=20, validate=validate.Range(min=1, max=100))


# --- cart -----------------------------------------------------------------


class CartItemCreateSchema(BaseSchema):
    product_id = fields.Integer(required=True, strict=True)
    quantity = fields.Integer(load_default=1, strict=True, validate=validate.Range(min=1, max=100))


class CartItemUpdateSchema(BaseSchema):
    quantity = fields.Integer(required=True, strict=True, validate=validate.Range(min=1, max=100))


class CartProductSchema(Schema):
    id = fields.Integer()
    name = fields.String()
    description = fields.String()
    price = fields.Integer()
    image_url = fields.String()
    stock = fields.Integer()


class CartItemSchema(Schema):
    id = fields.Integer()
    quantity = fields.Integer()
    line_total = fields.Integer()
    product = fields.Nested(CartProductSchema)


# --- addresses ------------------------------------------------------------


class ShippingAddressSchema(BaseSchema):
    id = fields.Integer(dump_only=True)
    region = fields.String(required=True, validate=validate.Length(min=1, max=100))
    address = fields.String(required=True, validate=validate.Length(min=1, max=255))
    city = fields.String(required=True, validate=validate.Length(min=1, max=100))
    created_at = fields.DateTime(dump_only=True)


# --- orders ---------------------------------------------------------------


class CheckoutSchema(BaseSchema):
    shipping_address_id = fields.Integer(required=True, strict=True)
    payment_method = fields.Enum(PaymentMethod, by_value=True, required=True)
    include_delivery = fields.Boolean(load_default=True)
    phone_number = fields.String(load_default=None, validate=KENYAN_PHONE)

    @validates_schema
    def phone_required_for_mpesa(self, data, **kwargs):
        if data.get("payment_method") == PaymentMethod.MPESA and not data.get("phone_number"):
            raise ValidationError("Phone number is required for M-Pesa payments.", "phone_number")


class OrderItemSchema(Schema):
    id = fields.Integer()
    product_id = fields.Integer(allow_none=True)
    name = fields.String()
    image_url = fields.String(allow_none=True)
    unit_price = fields.Integer()
    quantity = fields.Integer()
    line_total = fields.Integer()


class OrderSchema(Schema):
    id = fields.Integer()
    status = fields.Enum(OrderStatus, by_value=True)
    payment_method = fields.Enum(PaymentMethod, by_value=True)
    subtotal = fields.Integer()
    delivery_fee = fields.Integer()
    total = fields.Integer()
    mpesa_receipt_number = fields.String(allow_none=True)
    shipping_address = fields.Nested(ShippingAddressSchema, allow_none=True)
    items = fields.List(fields.Nested(OrderItemSchema))
    created_at = fields.DateTime()
    updated_at = fields.DateTime()
