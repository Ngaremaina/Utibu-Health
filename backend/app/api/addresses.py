from flask_jwt_extended import current_user, jwt_required
from sqlalchemy import select

from app.api import api
from app.auth import parse_body
from app.errors import NotFound
from app.extensions import db
from app.models import ShippingAddress
from app.schemas import ShippingAddressSchema


@api.get("/addresses")
@jwt_required()
def list_addresses():
    return ShippingAddressSchema(many=True).dump(current_user.addresses)


@api.post("/addresses")
@jwt_required()
def create_address():
    data = parse_body(ShippingAddressSchema())
    address = ShippingAddress(user_id=current_user.id, **data)
    db.session.add(address)
    db.session.commit()
    return ShippingAddressSchema().dump(address), 201


@api.delete("/addresses/<int:address_id>")
@jwt_required()
def delete_address(address_id: int):
    address = db.session.scalar(
        select(ShippingAddress).where(ShippingAddress.id == address_id, ShippingAddress.user_id == current_user.id)
    )
    if address is None:
        raise NotFound("Address not found.")
    db.session.delete(address)
    db.session.commit()
    return "", 204
