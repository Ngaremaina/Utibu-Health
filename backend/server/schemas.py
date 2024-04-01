from marshmallow import Schema, fields

class ProductsSchema(Schema):
    name = fields.String()
    description = fields.String()
    manufacturer= fields.String()
    price = fields.Integer()
    quantity = fields.Integer()
    expiration_date = fields.String()
    usage_instructions = fields.String()
    warnings = fields.String()
    image_url = fields.String()

class CartSchema(Schema):
    id = fields.Integer()
    name = fields.String()
    price = fields.Integer()
    description = fields.String()
    image_url = fields.String()
    quantity = fields.Integer()
    total = fields.Integer()
    user_id = fields.Integer()

class OrdersSchema(Schema):
    id = fields.Integer()
    name = fields.String()
    price = fields.Integer()
    description = fields.String()
    image_url = fields.String()
    quantity = fields.Integer()
    total = fields.Integer()
    user_id = fields.Integer()
    payment_description = fields.String()
    shipping_id = fields.Integer()

class ShippingSchema(Schema):
    id = fields.Integer()
    region = fields.String()
    address = fields.String()
    city = fields.String()
    user_id = fields.Integer()

    orders = fields.Nested(OrdersSchema, many=True)

class ProfileSchema(Schema):
    firstname = fields.String()
    lastname = fields.String()
    address = fields.String()
    city = fields.String()
    country = fields.String()
    user_id = fields.Integer()

class UsersSchema(Schema):
    email = fields.String()
    password = fields.String()
    username = fields.String()

    cart = fields.Nested(CartSchema, many=True)
    # orders = fields.Nested(OrdersSchema, many=True)
    profile = fields.Nested(ProfileSchema, many=True)
    shipping = fields.Nested(ShippingSchema, many=True)