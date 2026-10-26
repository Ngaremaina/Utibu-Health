from flask import Blueprint

api = Blueprint("api", __name__, url_prefix="/api/v1")

# Route modules register themselves on the blueprint when imported.
from app.api import addresses, auth, cart, health, orders, payments, products, profile  # noqa: E402,F401
