from flask import current_app
from flask_jwt_extended import create_access_token, create_refresh_token, current_user, jwt_required
from sqlalchemy import func, select

from app.api import api
from app.auth import parse_body
from app.errors import APIError, Conflict
from app.extensions import db, limiter
from app.models import User
from app.schemas import AccountUpdateSchema, ChangePasswordSchema, LoginSchema, RegisterSchema, UserSchema


def _auth_limit() -> str:
    return current_app.config["RATELIMIT_AUTH"]


def _tokens(user: User) -> dict:
    return {
        "access_token": create_access_token(identity=user),
        "refresh_token": create_refresh_token(identity=user),
        "user": UserSchema().dump(user),
    }


def _find_by_email(email: str) -> User | None:
    return db.session.scalar(select(User).where(func.lower(User.email) == email.lower()))


@api.post("/auth/register")
@limiter.limit(_auth_limit)
def register():
    data = parse_body(RegisterSchema())
    if _find_by_email(data["email"]):
        raise Conflict("An account with this email already exists.")

    user = User(email=data["email"].lower(), username=data["username"])
    user.set_password(data["password"])
    db.session.add(user)
    db.session.commit()
    return _tokens(user), 201


@api.post("/auth/login")
@limiter.limit(_auth_limit)
def login():
    data = parse_body(LoginSchema())
    user = _find_by_email(data["email"])
    # Same response for unknown email and wrong password to avoid account enumeration.
    if user is None or not user.check_password(data["password"]):
        raise APIError("Invalid email or password.", 401, "invalid_credentials")
    return _tokens(user)


@api.post("/auth/refresh")
@jwt_required(refresh=True)
def refresh():
    return {"access_token": create_access_token(identity=current_user)}


@api.get("/auth/me")
@jwt_required()
def me():
    return UserSchema().dump(current_user)


@api.patch("/auth/me")
@jwt_required()
def update_me():
    data = parse_body(AccountUpdateSchema())
    if "email" in data:
        email = data["email"].lower()
        existing = _find_by_email(email)
        if existing is not None and existing.id != current_user.id:
            raise Conflict("An account with this email already exists.")
        current_user.email = email
    if "username" in data:
        current_user.username = data["username"]
    db.session.commit()
    return UserSchema().dump(current_user)


@api.post("/auth/change-password")
@limiter.limit(_auth_limit)
@jwt_required()
def change_password():
    data = parse_body(ChangePasswordSchema())
    if not current_user.check_password(data["current_password"]):
        raise APIError(
            "Current password is incorrect.",
            422,
            "validation_error",
            {"current_password": ["Current password is incorrect."]},
        )
    current_user.set_password(data["new_password"])
    db.session.commit()
    return "", 204
