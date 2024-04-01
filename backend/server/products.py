from server import app, db
from server.models import Products
from server.schemas import ProductsSchema
from flask import request, jsonify, make_response


@app.route('/products', methods = ["GET", "POST"])
def products_data():
    if request.method == "GET":
        products_list = Products.query.all()
        products_data = ProductsSchema(many=True).dump(products_list)
        return make_response(jsonify(products_data))
    
    if request.method == "POST":
        data = request.get_json()
        name = data["name"]
        if Products.query.filter_by(name = name).first():
            return jsonify(detail = "Product exists")
        products = ProductsSchema().load(data)
        new_product = Products(**products)
        db.session.add(new_product)
        db.session.commit()
        products_schema = ProductsSchema().dump(new_product)
        return make_response(jsonify(products_schema))
    
@app.route("/products/<int:id>", methods = ["GET", "PATCH", "DELETE"])
def product_by_id(id):
    if request.method == "GET":
        product_name = Products.query.filter_by(id = id).first()
        product_data = ProductsSchema().dump(product_name)
        return make_response(jsonify(product_data), 200)
    
    if request.method == "DELETE":
        product_item = Products.query.filter_by(id = id).first()
        db.session.delete(product_item)
        db.session.commit()
        return make_response(jsonify(message = "product deleted successfully"), 200)
    
    if request.method == "PATCH":
        product = Products.query.filter_by(id = id).first()
        data = request.get_json()
        product_data = ProductsSchema().load(data)
        for field, value in product_data.items():
            setattr(product, field, value)
        db.session.add(product)
        db.session.commit() 

        products_data = ProductsSchema().dump(product)
        return make_response(jsonify(products_data))