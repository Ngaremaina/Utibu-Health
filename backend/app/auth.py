from __future__ import annotations

from functools import wraps

from flask import request
from flask_jwt_extended import current_user, jwt_required
from marshmallow import Schema

from app.errors import APIError
from app.extensions import db, jwt
from app.models import User


@jwt.user_identity_loader
def user_identity(user: User | int | str) -> str:
    # PyJWT requires the "sub" claim to be a string.
    return str(user.id if isinstance(user, User) else user)


@jwt.user_lookup_loader
def load_user(_header, payload) -> User | None:
    return db.session.get(User, int(payload["sub"]))


@jwt.user_lookup_error_loader
def user_not_found(_header, _payload):
    from app.errors import error_response

    return error_response("User no longer exists.", 401, "invalid_token")


def admin_required(fn):
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        if not current_user.is_admin:
            raise APIError("Admin privileges required.", 403, "forbidden")
        return fn(*args, **kwargs)

    return wrapper


def parse_body(schema: Schema, *, partial: bool = False) -> dict:
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        raise APIError("Request body must be a JSON object.", 400, "invalid_json")
    return schema.load(data, partial=partial)
