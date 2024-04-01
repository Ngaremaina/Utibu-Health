from server import app, os
from server import user, cart, shipping, orders, products, profile, payment


if __name__ == "__main__":
    app.run(host=os.getenv('HOST'), port=5000)

