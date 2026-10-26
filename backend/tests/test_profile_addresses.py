ADDRESS = {"region": "Nairobi", "address": "Moi Avenue 1", "city": "Nairobi"}


def test_profile_get_and_update(client, auth_headers, user):
    body = client.get("/api/v1/profile", headers=auth_headers).get_json()
    assert body["user"]["email"] == user.email
    assert body["profile"] is None

    res = client.put("/api/v1/profile", json={"first_name": "Jane", "phone_number": "0712345678"}, headers=auth_headers)
    assert res.status_code == 200
    assert res.get_json()["profile"]["first_name"] == "Jane"

    res = client.put("/api/v1/profile", json={"last_name": "Doe"}, headers=auth_headers)
    profile = res.get_json()["profile"]
    assert profile["first_name"] == "Jane" and profile["last_name"] == "Doe"


def test_profile_rejects_bad_phone(client, auth_headers):
    res = client.put("/api/v1/profile", json={"phone_number": "12345"}, headers=auth_headers)
    assert res.status_code == 422


def test_addresses_crud_and_isolation(client, auth_headers, make_user, headers_for):
    created = client.post("/api/v1/addresses", json=ADDRESS, headers=auth_headers)
    assert created.status_code == 201
    address_id = created.get_json()["id"]

    assert len(client.get("/api/v1/addresses", headers=auth_headers).get_json()) == 1

    other = headers_for(make_user())
    assert client.get("/api/v1/addresses", headers=other).get_json() == []
    assert client.delete(f"/api/v1/addresses/{address_id}", headers=other).status_code == 404

    assert client.delete(f"/api/v1/addresses/{address_id}", headers=auth_headers).status_code == 204
    assert client.get("/api/v1/addresses", headers=auth_headers).get_json() == []


def test_address_validation(client, auth_headers):
    res = client.post("/api/v1/addresses", json={"region": ""}, headers=auth_headers)
    assert res.status_code == 422
    assert {"region", "address", "city"} <= res.get_json()["error"]["details"].keys()
