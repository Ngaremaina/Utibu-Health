from server import app, db
from flask import request, make_response, jsonify
from server.models import Cart
from server.schemas import CartSchema

@app.route("/cart", methods = ["GET", "POST"])
def cart_data():
    if request.method == "GET":
        cart_list = Cart.query.all()
        cart = CartSchema(many = True).dump(cart_list)  
        return make_response(jsonify(cart), 200)
    
    if request.method == "POST":
        data = request.get_json()
        cart = CartSchema().load(data)
        new_cart = Cart(**cart)
        db.session.add(new_cart)
        db.session.commit()
        cart_schema = CartSchema().dump(new_cart)
        return make_response(jsonify(cart_schema))
        
@app.route("/cart/<int:id>", methods = ["GET", "PATCH", "DELETE"])
def cart_by_id(id):
    if request.method == "GET":
        cart_name = Cart.query.filter_by(id = id).first()
        cart_data = CartSchema().dump(cart_name)
        return make_response(jsonify(cart_data), 200)
    
    if request.method == "DELETE":
        cart_item = Cart.query.filter_by(id = id).first()
        db.session.delete(cart_item)
        db.session.commit()
        return make_response(jsonify(message = "cart deleted successfully"), 200)
    
    if request.method == "PATCH":
        cart = Cart.query.filter_by(id = id).first()
        data = request.get_json()
        carts = CartSchema().load(data)
        for field, value in carts.items():
            setattr(cart, field, value)
        db.session.add(cart)
        db.session.commit() 

        cart_data = CartSchema().dump(cart)
        return make_response(jsonify(cart_data))