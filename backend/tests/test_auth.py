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


def test_update_account(client, user, auth_headers):
    res = client.patch(
        "/api/v1/auth/me", json={"username": "renamed", "email": "Renamed@Example.com"}, headers=auth_headers
    )
    assert res.status_code == 200
    assert res.get_json()["username"] == "renamed"
    assert res.get_json()["email"] == "renamed@example.com"
    login = client.post("/api/v1/auth/login", json={"email": "renamed@example.com", "password": "password123"})
    assert login.status_code == 200


def test_update_account_keeps_own_email_and_rejects_taken_email(client, user, make_user, auth_headers):
    other = make_user()
    same = client.patch("/api/v1/auth/me", json={"email": user.email.upper()}, headers=auth_headers)
    assert same.status_code == 200
    taken = client.patch("/api/v1/auth/me", json={"email": other.email}, headers=auth_headers)
    assert taken.status_code == 409


def test_update_account_validates_input(client, auth_headers):
    res = client.patch("/api/v1/auth/me", json={"email": "nope", "username": "x"}, headers=auth_headers)
    assert res.status_code == 422
    assert {"email", "username"} <= res.get_json()["error"]["details"].keys()


def test_change_password(client, user, auth_headers):
    res = client.post(
        "/api/v1/auth/change-password",
        json={"current_password": "password123", "new_password": "new-password-456"},
        headers=auth_headers,
    )
    assert res.status_code == 204
    old = client.post("/api/v1/auth/login", json={"email": user.email, "password": "password123"})
    new = client.post("/api/v1/auth/login", json={"email": user.email, "password": "new-password-456"})
    assert old.status_code == 401
    assert new.status_code == 200


def test_change_password_rejects_wrong_current_password(client, auth_headers):
    res = client.post(
        "/api/v1/auth/change-password",
        json={"current_password": "wrong-password", "new_password": "new-password-456"},
        headers=auth_headers,
    )
    assert res.status_code == 422
    assert "current_password" in res.get_json()["error"]["details"]


def test_seed_is_idempotent(app, db):
    from app.cli import SEED_PRODUCTS
    from app.models import Product

    runner = app.test_cli_runner()
    assert f"Seeded {len(SEED_PRODUCTS)} product(s)." in runner.invoke(args=["seed"]).output
    assert "Seeded 0 product(s)." in runner.invoke(args=["seed"]).output
    assert db.session.query(Product).count() == len(SEED_PRODUCTS)
