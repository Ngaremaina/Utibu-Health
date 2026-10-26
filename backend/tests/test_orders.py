import pytest

from app.models import Product
from app.services.mpesa import MpesaClient, MpesaError


@pytest.fixture
def address_id(client, auth_headers):
    res = client.post(
        "/api/v1/addresses", json={"region": "Nairobi", "address": "Moi Ave", "city": "Nairobi"}, headers=auth_headers
    )
    return res.get_json()["id"]


@pytest.fixture
def filled_cart(client, auth_headers, make_product):
    a = make_product(price=100, stock=10)
    b = make_product(price=250, stock=3)
    client.post("/api/v1/cart/items", json={"product_id": a.id, "quantity": 2}, headers=auth_headers)
    client.post("/api/v1/cart/items", json={"product_id": b.id, "quantity": 1}, headers=auth_headers)
    return a.id, b.id


@pytest.fixture
def stk_push(monkeypatch):
    calls = []

    def fake(self, **kwargs):
        calls.append(kwargs)
        return {"CheckoutRequestID": f"ws_CO_{len(calls)}", "ResponseCode": "0"}

    monkeypatch.setattr(MpesaClient, "stk_push", fake)
    return calls


def _checkout(client, headers, address_id, **overrides):
    payload = {"shipping_address_id": address_id, "payment_method": "cash_on_delivery", **overrides}
    return client.post("/api/v1/orders", json=payload, headers=headers)


def test_cash_checkout_creates_order_and_clears_cart(client, db, auth_headers, address_id, filled_cart):
    res = _checkout(client, auth_headers, address_id)
    assert res.status_code == 201
    order = res.get_json()
    assert order["status"] == "confirmed"
    assert order["subtotal"] == 450
    assert order["delivery_fee"] == 250
    assert order["total"] == 700
    assert [i["quantity"] for i in order["items"]] == [2, 1]
    assert order["shipping_address"]["id"] == address_id

    assert client.get("/api/v1/cart", headers=auth_headers).get_json()["items"] == []
    a, b = filled_cart
    assert db.session.get(Product, a).stock == 8
    assert db.session.get(Product, b).stock == 2

    listed = client.get("/api/v1/orders", headers=auth_headers).get_json()
    assert [o["id"] for o in listed] == [order["id"]]


def test_checkout_without_delivery(client, auth_headers, address_id, filled_cart):
    order = _checkout(client, auth_headers, address_id, include_delivery=False).get_json()
    assert order["delivery_fee"] == 0
    assert order["total"] == 450


def test_order_item_snapshot_survives_price_change(client, db, auth_headers, address_id, filled_cart):
    order = _checkout(client, auth_headers, address_id).get_json()
    db.session.get(Product, filled_cart[0]).price = 999
    db.session.commit()
    again = client.get(f"/api/v1/orders/{order['id']}", headers=auth_headers).get_json()
    assert again["items"][0]["unit_price"] == 100


def test_checkout_empty_cart(client, auth_headers, address_id):
    res = _checkout(client, auth_headers, address_id)
    assert res.status_code == 400
    assert res.get_json()["error"]["code"] == "empty_cart"


def test_checkout_with_someone_elses_address(client, auth_headers, filled_cart, make_user, headers_for):
    other = headers_for(make_user())
    foreign = client.post(
        "/api/v1/addresses", json={"region": "X", "address": "Y", "city": "Z"}, headers=other
    ).get_json()["id"]
    assert _checkout(client, auth_headers, foreign).status_code == 404


def test_checkout_insufficient_stock_rolls_back(client, db, auth_headers, address_id, filled_cart):
    a, b = filled_cart
    db.session.get(Product, b).stock = 0
    db.session.commit()

    res = _checkout(client, auth_headers, address_id)
    assert res.status_code == 409
    db.session.expire_all()
    assert db.session.get(Product, a).stock == 10
    assert len(client.get("/api/v1/cart", headers=auth_headers).get_json()["items"]) == 2


def test_mpesa_checkout_requires_phone(client, auth_headers, address_id, filled_cart):
    res = _checkout(client, auth_headers, address_id, payment_method="mpesa")
    assert res.status_code == 422
    assert "phone_number" in res.get_json()["error"]["details"]


def test_mpesa_checkout_sends_stk_push(client, auth_headers, address_id, filled_cart, stk_push):
    res = _checkout(client, auth_headers, address_id, payment_method="mpesa", phone_number="0712345678")
    assert res.status_code == 201
    order = res.get_json()
    assert order["status"] == "pending_payment"
    assert stk_push == [
        {"phone_number": "0712345678", "amount": 700, "reference": f"UTIBU{order['id']}", "description": "Medication"}
    ]


def test_mpesa_failure_marks_order_and_allows_retry(client, auth_headers, address_id, filled_cart, monkeypatch):
    def boom(self, **kwargs):
        raise MpesaError("Could not reach M-Pesa.")

    monkeypatch.setattr(MpesaClient, "stk_push", boom)
    res = _checkout(client, auth_headers, address_id, payment_method="mpesa", phone_number="0712345678")
    assert res.status_code == 502
    order_id = res.get_json()["error"]["details"]["order_id"]
    assert client.get(f"/api/v1/orders/{order_id}", headers=auth_headers).get_json()["status"] == "payment_failed"

    monkeypatch.setattr(MpesaClient, "stk_push", lambda self, **kw: {"CheckoutRequestID": "ws_CO_retry"})
    retry = client.post(f"/api/v1/orders/{order_id}/pay", json={"phone_number": "0712345678"}, headers=auth_headers)
    assert retry.status_code == 200
    assert retry.get_json()["status"] == "pending_payment"


def test_cannot_pay_cash_order(client, auth_headers, address_id, filled_cart):
    order = _checkout(client, auth_headers, address_id).get_json()
    res = client.post(f"/api/v1/orders/{order['id']}/pay", json={"phone_number": "0712345678"}, headers=auth_headers)
    assert res.status_code == 409


def test_cancel_restores_stock(client, db, auth_headers, address_id, filled_cart):
    order = _checkout(client, auth_headers, address_id).get_json()
    res = client.post(f"/api/v1/orders/{order['id']}/cancel", headers=auth_headers)
    assert res.get_json()["status"] == "cancelled"
    db.session.expire_all()
    assert db.session.get(Product, filled_cart[0]).stock == 10

    again = client.post(f"/api/v1/orders/{order['id']}/cancel", headers=auth_headers)
    assert again.status_code == 409


def test_orders_are_private(client, auth_headers, address_id, filled_cart, make_user, headers_for):
    order = _checkout(client, auth_headers, address_id).get_json()
    other = headers_for(make_user())
    assert client.get(f"/api/v1/orders/{order['id']}", headers=other).status_code == 404
    assert client.get("/api/v1/orders", headers=other).get_json() == []
