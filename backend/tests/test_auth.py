def test_health(client):
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    assert res.get_json() == {"status": "ok", "database": "ok"}
    assert res.headers["X-Content-Type-Options"] == "nosniff"
    assert res.headers["X-Request-ID"]


def test_register_returns_tokens(client):
    res = client.post(
        "/api/v1/auth/register",
        json={"email": " New@Example.com ", "username": "newbie", "password": "password123"},
    )
    assert res.status_code == 201
    body = res.get_json()
    assert body["access_token"] and body["refresh_token"]
    assert body["user"]["email"] == "new@example.com"
    assert "password" not in body["user"] and "password_hash" not in body["user"]


def test_register_rejects_duplicate_email_case_insensitively(client, user):
    res = client.post(
        "/api/v1/auth/register",
        json={"email": user.email.upper(), "username": "dup", "password": "password123"},
    )
    assert res.status_code == 409
    assert res.get_json()["error"]["code"] == "conflict"


def test_register_validates_input(client):
    res = client.post("/api/v1/auth/register", json={"email": "not-an-email", "username": "x", "password": "short"})
    assert res.status_code == 422
    details = res.get_json()["error"]["details"]
    assert {"email", "username", "password"} <= details.keys()


def test_register_rejects_non_json_body(client):
    res = client.post("/api/v1/auth/register", data="nope", content_type="text/plain")
    assert res.status_code == 400
    assert res.get_json()["error"]["code"] == "invalid_json"


def test_login_success(client, user):
    res = client.post("/api/v1/auth/login", json={"email": user.email, "password": "password123"})
    assert res.status_code == 200
    assert res.get_json()["user"]["id"] == user.id


def test_login_wrong_password_and_unknown_email_look_the_same(client, user):
    wrong = client.post("/api/v1/auth/login", json={"email": user.email, "password": "wrong-password"})
    unknown = client.post("/api/v1/auth/login", json={"email": "ghost@example.com", "password": "password123"})
    assert wrong.status_code == unknown.status_code == 401
    assert wrong.get_json() == unknown.get_json()


def test_me_requires_token(client):
    res = client.get("/api/v1/auth/me")
    assert res.status_code == 401
    assert res.get_json()["error"]["code"] == "unauthorized"


def test_me_rejects_garbage_token(client):
    res = client.get("/api/v1/auth/me", headers={"Authorization": "Bearer garbage"})
    assert res.status_code == 401
    assert res.get_json()["error"]["code"] == "invalid_token"


def test_me_and_refresh(client, user):
    tokens = client.post("/api/v1/auth/login", json={"email": user.email, "password": "password123"}).get_json()

    me = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {tokens['access_token']}"})
    assert me.get_json()["email"] == user.email

    # Access tokens can't be used to refresh.
    bad = client.post("/api/v1/auth/refresh", headers={"Authorization": f"Bearer {tokens['access_token']}"})
    assert bad.status_code == 401

    refreshed = client.post("/api/v1/auth/refresh", headers={"Authorization": f"Bearer {tokens['refresh_token']}"})
    assert refreshed.status_code == 200
    assert refreshed.get_json()["access_token"]


def test_token_for_deleted_user_is_rejected(client, db, user, auth_headers):
    db.session.delete(user)
    db.session.commit()
    res = client.get("/api/v1/auth/me", headers=auth_headers)
    assert res.status_code == 401


def test_unknown_route_returns_json_404(client):
    res = client.get("/api/v1/nope")
    assert res.status_code == 404
    assert res.get_json()["error"]["code"] == "not_found"


def test_login_is_rate_limited():
    from app import create_app
    from app.config import TestingConfig
    from app.extensions import db

    class RateLimitedConfig(TestingConfig):
        RATELIMIT_ENABLED = True
        RATELIMIT_AUTH = "3 per minute"

    app = create_app(RateLimitedConfig)
    with app.app_context():
        db.create_all()
        client = app.test_client()
        codes = [
            client.post("/api/v1/auth/login", json={"email": "a@b.co", "password": "x"}).status_code for _ in range(4)
        ]
        db.drop_all()
    assert codes == [401, 401, 401, 429]
