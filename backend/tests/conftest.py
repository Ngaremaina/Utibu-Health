from __future__ import annotations

import itertools

import pytest

from app import create_app
from app.config import TestingConfig
from app.extensions import db as _db
from app.models import Product, User
from app.services.mpesa import MpesaClient

_counter = itertools.count(1)


@pytest.fixture
def app():
    app = create_app(TestingConfig)
    with app.app_context():
        _db.drop_all()
        _db.create_all()
        yield app
        _db.session.remove()
        _db.drop_all()
    MpesaClient._token = None


@pytest.fixture
def db(app):
    return _db


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def make_user(db):
    def _make_user(email: str | None = None, password: str = "password123", is_admin: bool = False) -> User:
        user = User(email=email or f"user{next(_counter)}@example.com", username="tester", is_admin=is_admin)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        return user

    return _make_user


@pytest.fixture
def make_product(db):
    def _make_product(**overrides) -> Product:
        data = {
            "name": f"Product {next(_counter)}",
            "description": "Pain relief",
            "manufacturer": "Acme",
            "price": 100,
            "stock": 10,
        }
        data.update(overrides)
        product = Product(**data)
        db.session.add(product)
        db.session.commit()
        return product

    return _make_product


def _headers_for(client, user: User, password: str = "password123") -> dict:
    res = client.post("/api/v1/auth/login", json={"email": user.email, "password": password})
    assert res.status_code == 200, res.get_json()
    return {"Authorization": f"Bearer {res.get_json()['access_token']}"}


@pytest.fixture
def user(make_user):
    return make_user()


@pytest.fixture
def auth_headers(client, user):
    return _headers_for(client, user)


@pytest.fixture
def admin_headers(client, make_user):
    return _headers_for(client, make_user(is_admin=True))


@pytest.fixture
def headers_for(client):
    return lambda user: _headers_for(client, user)
