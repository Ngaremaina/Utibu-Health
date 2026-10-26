from flask import request
from flask_jwt_extended import current_user, verify_jwt_in_request
from sqlalchemy import func, or_, select

from app.api import api
from app.auth import admin_required, parse_body
from app.errors import Conflict, NotFound
from app.extensions import db
from app.models import Product
from app.schemas import ProductQuerySchema, ProductSchema


def _get_product(product_id: int) -> Product:
    product = db.session.get(Product, product_id)
    if product is None:
        raise NotFound("Product not found.")
    return product


def _is_admin() -> bool:
    verify_jwt_in_request(optional=True)
    return bool(current_user and current_user.is_admin)


def _ensure_unique_name(name: str, exclude_id: int | None = None) -> None:
    query = select(Product.id).where(func.lower(Product.name) == name.lower())
    if exclude_id is not None:
        query = query.where(Product.id != exclude_id)
    if db.session.scalar(query):
        raise Conflict("A product with this name already exists.")


@api.get("/products")
def list_products():
    args = ProductQuerySchema().load(request.args)
    query = select(Product).where(Product.is_active.is_(True)).order_by(Product.name)
    if args["q"]:
        term = f"%{args['q']}%"
        query = query.where(or_(Product.name.ilike(term), Product.description.ilike(term)))

    page = db.paginate(query, page=args["page"], per_page=args["per_page"], error_out=False)
    return {
        "items": ProductSchema(many=True).dump(page.items),
        "page": page.page,
        "per_page": page.per_page,
        "total": page.total,
        "pages": page.pages,
    }


@api.get("/products/<int:product_id>")
def get_product(product_id: int):
    product = _get_product(product_id)
    if not product.is_active and not _is_admin():
        raise NotFound("Product not found.")
    return ProductSchema().dump(product)


@api.post("/products")
@admin_required
def create_product():
    data = parse_body(ProductSchema())
    _ensure_unique_name(data["name"])
    product = Product(**data)
    db.session.add(product)
    db.session.commit()
    return ProductSchema().dump(product), 201


@api.patch("/products/<int:product_id>")
@admin_required
def update_product(product_id: int):
    product = _get_product(product_id)
    data = parse_body(ProductSchema(), partial=True)
    if "name" in data:
        _ensure_unique_name(data["name"], exclude_id=product.id)
    for field, value in data.items():
        setattr(product, field, value)
    db.session.commit()
    return ProductSchema().dump(product)


@api.delete("/products/<int:product_id>")
@admin_required
def delete_product(product_id: int):
    # Soft delete: past orders keep pointing at the product row.
    product = _get_product(product_id)
    product.is_active = False
    db.session.commit()
    return "", 204
