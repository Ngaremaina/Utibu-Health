import base64

import pytest
import requests

from app.config import ProductionConfig, get_config, normalize_database_url
from app.services import mpesa
from app.services.mpesa import MpesaClient, MpesaError, normalize_phone


class FakeResponse:
    def __init__(self, status_code=200, payload=None):
        self.status_code = status_code
        self._payload = payload or {}

    def json(self):
        return self._payload

    def raise_for_status(self):
        if self.status_code >= 400:
            raise requests.HTTPError(str(self.status_code))


@pytest.mark.parametrize(
    "raw, expected",
    [("0712345678", "254712345678"), ("712345678", "254712345678"), ("+254712345678", "254712345678")],
)
def test_normalize_phone(raw, expected):
    assert normalize_phone(raw) == expected


def test_stk_push_builds_daraja_request(app, monkeypatch):
    posted = {}
    monkeypatch.setattr(
        mpesa.requests, "get", lambda *a, **kw: FakeResponse(payload={"access_token": "tok", "expires_in": "3599"})
    )

    def fake_post(url, json, headers, timeout):
        posted.update(url=url, json=json, headers=headers)
        return FakeResponse(payload={"ResponseCode": "0", "CheckoutRequestID": "ws_CO_1"})

    monkeypatch.setattr(mpesa.requests, "post", fake_post)

    result = MpesaClient().stk_push(phone_number="0712345678", amount=700, reference="UTIBU1", description="Medication")

    assert result["CheckoutRequestID"] == "ws_CO_1"
    body = posted["json"]
    assert posted["url"].startswith("https://sandbox.safaricom.co.ke/")
    assert posted["headers"]["Authorization"] == "Bearer tok"
    assert body["PartyA"] == body["PhoneNumber"] == "254712345678"
    assert body["Amount"] == 700
    assert body["CallBackURL"].endswith("?token=test-callback-token")
    expected_password = base64.b64encode(f"174379test-passkey{body['Timestamp']}".encode()).decode()
    assert body["Password"] == expected_password


def test_stk_push_rejection_raises(app, monkeypatch):
    monkeypatch.setattr(mpesa.requests, "get", lambda *a, **kw: FakeResponse(payload={"access_token": "tok"}))
    monkeypatch.setattr(
        mpesa.requests, "post", lambda *a, **kw: FakeResponse(400, {"errorMessage": "Invalid PhoneNumber"})
    )
    with pytest.raises(MpesaError, match="Invalid PhoneNumber"):
        MpesaClient().stk_push(phone_number="0712345678", amount=1, reference="r", description="d")


def test_token_failure_raises(app, monkeypatch):
    def boom(*a, **kw):
        raise requests.ConnectionError("down")

    monkeypatch.setattr(mpesa.requests, "get", boom)
    with pytest.raises(MpesaError, match="authenticate"):
        MpesaClient().stk_push(phone_number="0712345678", amount=1, reference="r", description="d")


def test_unconfigured_client_raises(app):
    app.config["MPESA_PASSKEY"] = None
    with pytest.raises(MpesaError, match="not configured"):
        MpesaClient().stk_push(phone_number="0712345678", amount=1, reference="r", description="d")


@pytest.mark.parametrize(
    "url, expected",
    [
        ("postgres://u:p@h/db", "postgresql+psycopg://u:p@h/db"),
        ("postgresql://u:p@h/db?sslmode=require", "postgresql+psycopg://u:p@h/db?sslmode=require"),
        ("postgresql+psycopg://u:p@h/db", "postgresql+psycopg://u:p@h/db"),
        ("sqlite://", "sqlite://"),
        (None, None),
    ],
)
def test_normalize_database_url(url, expected):
    assert normalize_database_url(url) == expected


def test_production_config_requires_secrets(monkeypatch):
    monkeypatch.setattr(ProductionConfig, "JWT_SECRET_KEY", None)
    with pytest.raises(RuntimeError, match="JWT_SECRET_KEY"):
        ProductionConfig.validate()


def test_production_config_rejects_short_jwt_secret(monkeypatch):
    monkeypatch.setattr(ProductionConfig, "SECRET_KEY", "x")
    monkeypatch.setattr(ProductionConfig, "JWT_SECRET_KEY", "short")
    monkeypatch.setattr(ProductionConfig, "SQLALCHEMY_DATABASE_URI", "postgresql+psycopg://h/db")
    with pytest.raises(RuntimeError, match="32 characters"):
        ProductionConfig.validate()


def test_unknown_app_env():
    with pytest.raises(RuntimeError):
        get_config("staging-ish")
