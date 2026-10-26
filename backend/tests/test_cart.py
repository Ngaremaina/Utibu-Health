def test_cart_requires_auth(client):
    assert client.get("/api/v1/cart").status_code == 401


def test_add_and_increment_cart_item(client, auth_headers, make_product):
    product = make_product(price=150, stock=5)
    res = client.post("/api/v1/cart/items", json={"product_id": product.id, "quantity": 2}, headers=auth_headers)
    assert res.status_code == 201
    res = client.post("/api/v1/cart/items", json={"product_id": product.id}, headers=auth_headers)
    cart = res.get_json()
    assert len(cart["items"]) == 1
    assert cart["items"][0]["quantity"] == 3
    assert cart["subtotal"] == 450
    assert cart["count"] == 3


def test_add_cart_item_respects_stock(client, auth_headers, make_product):
    product = make_product(stock=2)
    res = client.post("/api/v1/cart/items", json={"product_id": product.id, "quantity": 3}, headers=auth_headers)
    assert res.status_code == 409
    assert res.get_json()["error"]["code"] == "insufficient_stock"


def test_add_unknown_or_inactive_product(client, auth_headers, make_product):
    inactive = make_product(is_active=False)
    for product_id in (inactive.id, 9999):
        res = client.post("/api/v1/cart/items", json={"product_id": product_id}, headers=auth_headers)
        assert res.status_code == 404


def test_update_and_remove_cart_item(client, auth_headers, make_product):
    product = make_product(price=100)
    item_id = client.post("/api/v1/cart/items", json={"product_id": product.id}, headers=auth_headers).get_json()[
        "items"
    ][0]["id"]

    res = client.patch(f"/api/v1/cart/items/{item_id}", json={"quantity": 4}, headers=auth_headers)
    assert res.get_json()["subtotal"] == 400

    res = client.patch(f"/api/v1/cart/items/{item_id}", json={"quantity": 0}, headers=auth_headers)
    assert res.status_code == 422

    res = client.delete(f"/api/v1/cart/items/{item_id}", headers=auth_headers)
    assert res.get_json() == {"items": [], "subtotal": 0, "count": 0, "delivery_fee": 250}


def test_cannot_touch_another_users_cart(client, auth_headers, make_user, headers_for, make_product):
    product = make_product()
    other_headers = headers_for(make_user())
    item_id = client.post("/api/v1/cart/items", json={"product_id": product.id}, headers=other_headers).get_json()[
        "items"
    ][0]["id"]

    assert client.get("/api/v1/cart", headers=auth_headers).get_json()["items"] == []
    assert client.patch(f"/api/v1/cart/items/{item_id}", json={"quantity": 2}, headers=auth_headers).status_code == 404
    assert client.delete(f"/api/v1/cart/items/{item_id}", headers=auth_headers).status_code == 404


def test_clear_cart(client, auth_headers, make_product):
    for _ in range(2):
        client.post("/api/v1/cart/items", json={"product_id": make_product().id}, headers=auth_headers)
    res = client.delete("/api/v1/cart", headers=auth_headers)
    assert res.get_json()["items"] == []
