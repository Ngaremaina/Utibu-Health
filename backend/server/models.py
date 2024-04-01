from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class Users(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key = True, autoincrement = True)
    email = db.Column(db.String(255), nullable = False)
    password = db.Column(db.String(255), nullable = False)
    username = db.Column(db.String(255), nullable = False)

class Profile(db.Model):
    __tablename__ = "profile"

    id = db.Column(db.Integer, primary_key = True, autoincrement = True)
    firstname = db.Column(db.String(255), nullable = False)
    lastname = db.Column(db.String(255), nullable = False)
    address = db.Column(db.String(255), nullable = False)
    city = db.Column(db.String(255), nullable = False)
    country = db.Column(db.String(255), nullable = False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable = False)

    user = db.relationship('Users', backref = 'profile')
    

class Products(db.Model):
    __tablename__ = "products"

    id = db.Column(db.Integer, primary_key = True, autoincrement = True)
    name = db.Column(db.String(255), nullable = False)
    description = db.Column(db.String(255), nullable = False)
    manufacturer= db.Column(db.String(255), nullable = False)
    price = db.Column(db.Integer, nullable = False)
    quantity = db.Column(db.Integer, nullable = False)
    expiration_date = db.Column(db.String(255), nullable = False)
    usage_instructions = db.Column(db.String(255), nullable = False)
    warnings = db.Column(db.String(255), nullable = False)
    image_url = db.Column(db.String(255), nullable = False)
    

class Ingredients(db.Model):
    __tablename__ = "ingredients"

    id = db.Column(db.Integer, primary_key = True, autoincrement = True)
    name = db.Column(db.String(255), nullable = True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable = False)

    products = db.relationship('Products', backref = 'ingredients')

class Cart(db.Model):
    __tablename__ = "cart"

    id = db.Column(db.Integer, primary_key = True)
    name = db.Column(db.String(255))
    price = db.Column(db.Integer)
    description = db.Column(db.String(255))
    image_url = db.Column(db.String(255))
    quantity = db.Column(db.Integer)
    total = db.Column(db.Integer)

    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable = False)
    user = db.relationship('Users', backref = "cart")

class Shipping(db.Model):
    __tablename__ = "shipping"

    id = db.Column(db.Integer, primary_key = True)
    region = db.Column(db.String(255))
    address = db.Column(db.String(255))
    city = db.Column(db.String(255))

    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable = False)
    user = db.relationship('Users', backref = "shipping")

class Orders(db.Model):
    __tablename__ = "orders"

    id = db.Column(db.Integer, primary_key = True)
    name = db.Column(db.String(255))
    price = db.Column(db.Integer)
    description = db.Column(db.String(255))
    image_url = db.Column(db.String(255))
    quantity = db.Column(db.Integer)
    total = db.Column(db.Integer)
    payment_description = db.Column(db.String(255), nullable = False)
    

    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable = False)
    shipping_id = db.Column(db.Integer,db.ForeignKey('shipping.id'), nullable = False)
    
    user = db.relationship('Users', backref = "orders")
    shipping = db.relationship('Shipping', backref = "orders")
