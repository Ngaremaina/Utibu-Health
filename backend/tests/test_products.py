NEW_PRODUCT = {
    "name": "Amoxil",
    "description": "Antibiotic",
    "manufacturer": "GSK",
    "price": 450,
    "stock": 20,
    "expiration_date": "2027-06-30",
    "image_url": "https://example.com/amoxil.jpg",
}


def test_list_products_is_public_and_paginated(client, make_product):
    for _ in range(3):
        make_product()
    res = client.get("/api/v1/products?per_page=2")
    assert res.status_code == 200
    body = res.get_json()
    assert body["total"] == 3
    assert body["pages"] == 2
    assert len(body["items"]) == 2


def test_list_products_search_and_hides_inactive(client, make_product):
    make_product(name="Paracetamol")
    make_product(name="Brufen")
    make_product(name="Paracetamol Extra", is_active=False)
    body = client.get("/api/v1/products?q=para").get_json()
    assert [p["name"] for p in body["items"]] == ["Paracetamol"]


def test_list_products_validates_query(client):
    res = client.get("/api/v1/products?per_page=1000")
    assert res.status_code == 422


def test_get_product(client, make_product):
    product = make_product()
    assert client.get(f"/api/v1/products/{product.id}").get_json()["name"] == product.name
    assert client.get("/api/v1/products/9999").status_code == 404


def test_inactive_product_only_visible_to_admin(client, make_product, auth_headers, admin_headers):
    product = make_product(is_active=False)
    assert client.get(f"/api/v1/products/{product.id}").status_code == 404
    assert client.get(f"/api/v1/products/{product.id}", headers=auth_headers).status_code == 404
    assert client.get(f"/api/v1/products/{product.id}", headers=admin_headers).status_code == 200


def test_create_product_requires_admin(client, auth_headers):
    assert client.post("/api/v1/products", json=NEW_PRODUCT).status_code == 401
    res = client.post("/api/v1/products", json=NEW_PRODUCT, headers=auth_headers)
    assert res.status_code == 403


def test_admin_product_lifecycle(client, admin_headers):
    created = client.post("/api/v1/products", json=NEW_PRODUCT, headers=admin_headers)
    assert created.status_code == 201
    product_id = created.get_json()["id"]

    dup = client.post("/api/v1/products", json={**NEW_PRODUCT, "name": "amoxil"}, headers=admin_headers)
    assert dup.status_code == 409

    updated = client.patch(f"/api/v1/products/{product_id}", json={"price": 500}, headers=admin_headers)
    assert updated.status_code == 200
    assert updated.get_json()["price"] == 500
    assert updated.get_json()["name"] == "Amoxil"

    assert client.delete(f"/api/v1/products/{product_id}", headers=admin_headers).status_code == 204
    assert client.get("/api/v1/products").get_json()["total"] == 0


def test_create_product_validation(client, admin_headers):
    res = client.post("/api/v1/products", json={**NEW_PRODUCT, "price": -1, "unknown": 1}, headers=admin_headers)
    assert res.status_code == 422
    assert {"price", "unknown"} <= res.get_json()["error"]["details"].keys()
