import pytest

from app.models import Order, OrderStatus, PaymentMethod, User

CALLBACK = "/api/v1/payments/mpesa/callback?token=test-callback-token"


@pytest.fixture
def pending_order(db, user):
    order = Order(
        user_id=user.id,
        status=OrderStatus.PENDING_PAYMENT,
        payment_method=PaymentMethod.MPESA,
        subtotal=450,
        delivery_fee=250,
        total=700,
        mpesa_checkout_request_id="ws_CO_123",
    )
    db.session.add(order)
    db.session.commit()
    return order


def _payload(result_code=0, amount=700, checkout_id="ws_CO_123"):
    callback = {
        "MerchantRequestID": "m-1",
        "CheckoutRequestID": checkout_id,
        "ResultCode": result_code,
        "ResultDesc": "ok" if result_code == 0 else "Request cancelled by user",
    }
    if result_code == 0:
        callback["CallbackMetadata"] = {
            "Item": [
                {"Name": "Amount", "Value": amount},
                {"Name": "MpesaReceiptNumber", "Value": "NLJ7RT61SV"},
                {"Name": "PhoneNumber", "Value": 254712345678},
            ]
        }
    return {"Body": {"stkCallback": callback}}


def _status(db, order):
    db.session.expire_all()
    return db.session.get(Order, order.id).status


def test_callback_rejects_bad_token(client, db, pending_order):
    res = client.post("/api/v1/payments/mpesa/callback?token=wrong", json=_payload())
    assert res.status_code == 403
    assert _status(db, pending_order) == OrderStatus.PENDING_PAYMENT


def test_successful_callback_marks_order_paid(client, db, pending_order):
    res = client.post(CALLBACK, json=_payload())
    assert res.get_json() == {"ResultCode": 0, "ResultDesc": "Accepted"}
    db.session.expire_all()
    order = db.session.get(Order, pending_order.id)
    assert order.status == OrderStatus.PAID
    assert order.mpesa_receipt_number == "NLJ7RT61SV"


def test_failed_callback_marks_payment_failed(client, db, pending_order):
    client.post(CALLBACK, json=_payload(result_code=1032))
    assert _status(db, pending_order) == OrderStatus.PAYMENT_FAILED


def test_amount_mismatch_is_not_marked_paid(client, db, pending_order):
    client.post(CALLBACK, json=_payload(amount=1))
    assert _status(db, pending_order) == OrderStatus.PAYMENT_FAILED


def test_duplicate_callback_is_idempotent(client, db, pending_order):
    client.post(CALLBACK, json=_payload())
    client.post(CALLBACK, json=_payload(result_code=1032))
    assert _status(db, pending_order) == OrderStatus.PAID


@pytest.mark.parametrize("body", [{}, {"Body": {"stkCallback": {}}}, _payload(checkout_id="unknown")])
def test_callback_tolerates_unknown_payloads(client, body):
    res = client.post(CALLBACK, json=body)
    assert res.status_code == 200


def test_user_can_see_paid_status(client, db, pending_order, auth_headers, user):
    assert db.session.get(User, user.id).orders[0].id == pending_order.id
    client.post(CALLBACK, json=_payload())
    res = client.get(f"/api/v1/orders/{pending_order.id}", headers=auth_headers)
    assert res.get_json()["status"] == "paid"
    assert res.get_json()["mpesa_receipt_number"] == "NLJ7RT61SV"
