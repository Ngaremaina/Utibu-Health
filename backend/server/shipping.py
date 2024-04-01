from server import app, db
from flask import request, make_response, jsonify
from server.models import Shipping
from server.schemas import ShippingSchema

@app.route("/shipping", methods = ["GET", "POST"])
def shipping_data():
    if request.method == "GET":
        shipping_list = Shipping.query.all()
        shipping = ShippingSchema(many = True).dump(shipping_list)  
        return make_response(jsonify(shipping), 200)
    
    if request.method == "POST":
        data = request.get_json()
        shipping = ShippingSchema().load(data)
        new_shipping = Shipping(**shipping)
        db.session.add(new_shipping)
        db.session.commit()
        shipping_schema = ShippingSchema().dump(new_shipping)
        return make_response(jsonify(shipping_schema))
        
@app.route("/shipping/<int:id>", methods = ["GET", "PATCH", "DELETE"])
def shipping_by_id(id):
    if request.method == "GET":
        shipping_name = Shipping.query.filter_by(id = id).first()
        shipping_data = ShippingSchema().dump(shipping_name)
        return make_response(jsonify(shipping_data), 200)
    
    if request.method == "DELETE":
        shipping_item = Shipping.query.filter_by(id = id).first()
        db.session.delete(shipping_item)
        db.session.commit()
        return make_response(jsonify(message = "Shipping deleted successfully"), 200)
    
    if request.method == "PATCH":
        shipping = Shipping.query.filter_by(id = id).first()
        data = request.get_json()
        shippings = ShippingSchema().load(data)
        for field, value in shippings.items():
            setattr(shipping, field, value)
        db.session.add(shipping)
        db.session.commit() 

        shipping_data = ShippingSchema().dump(shipping)
        return make_response(jsonify(shipping_data))