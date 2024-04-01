from flask import make_response, jsonify, request
from server import app, db
from server.models import Orders
from server.schemas import OrdersSchema

@app.route("/orders", methods = ["GET", "POST"])
def order_data():
    if request.method == "GET":
        order_list = Orders.query.all()
        orders = OrdersSchema(many = True).dump(order_list)  
        return make_response(jsonify(orders), 200)
    if request.method == "POST":
        data = request.get_json()
        order = OrdersSchema().load(data)
        new_order = Orders(**order)
        db.session.add(new_order)
        db.session.commit()
        order_schema = OrdersSchema().dump(new_order)
        return make_response(jsonify(order_schema))
        
@app.route("/orders/<int:id>", methods = ["GET", "PATCH", "DELETE"])
def order_by_id(id):
    if request.method == "GET":
        order_name = Orders.query.filter_by(id = id).first()
        order_data = OrdersSchema().dump(order_name)
        return make_response(jsonify(order_data), 200)
    
    if request.method == "DELETE":
        order_item = Orders.query.filter_by(id = id).first()
        db.session.delete(order_item)
        db.session.commit()
        return make_response(jsonify(message = "order deleted successfully"), 200)
    
    if request.method == "PATCH":
        order = Orders.query.filter_by(id = id).first()
        data = request.get_json()
        orders = OrdersSchema().load(data)
        for field, value in orders.items():
            setattr(order, field, value)
        db.session.add(order)
        db.session.commit() 

        cart_data = OrdersSchema().dump(order)
        return make_response(jsonify(cart_data))