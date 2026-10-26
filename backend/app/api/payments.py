import hmac
import logging

from flask import current_app, request
from sqlalchemy import select

from app.api import api
from app.extensions import db, limiter
from app.models import Order, OrderStatus

logger = logging.getLogger(__name__)

# Daraja retries callbacks that don't get this acknowledgement.
ACK = {"ResultCode": 0, "ResultDesc": "Accepted"}


def _metadata(callback: dict) -> dict:
    items = (callback.get("CallbackMetadata") or {}).get("Item") or []
    return {item.get("Name"): item.get("Value") for item in items if isinstance(item, dict)}


@api.post("/payments/mpesa/callback")
@limiter.exempt
def mpesa_callback():
    # Daraja doesn't sign callbacks, so the callback URL carries a shared secret.
    expected = current_app.config["MPESA_CALLBACK_TOKEN"]
    provided = request.args.get("token", "")
    if not expected or not hmac.compare_digest(provided, expected):
        return {"ResultCode": 1, "ResultDesc": "Rejected"}, 403

    payload = request.get_json(silent=True) or {}
    callback = (payload.get("Body") or {}).get("stkCallback") or {}
    checkout_id = callback.get("CheckoutRequestID")
    if not checkout_id:
        logger.warning("M-Pesa callback without CheckoutRequestID")
        return ACK

    order = db.session.scalar(select(Order).where(Order.mpesa_checkout_request_id == checkout_id).with_for_update())
    if order is None:
        logger.warning("M-Pesa callback for unknown checkout %s", checkout_id)
        return ACK
    if order.status != OrderStatus.PENDING_PAYMENT:
        # Duplicate delivery; already processed.
        return ACK

    if str(callback.get("ResultCode")) == "0":
        meta = _metadata(callback)
        amount = meta.get("Amount")
        if amount is not None and int(float(amount)) != order.total:
            logger.error("M-Pesa amount mismatch for order %s: got %s, expected %s", order.id, amount, order.total)
            order.status = OrderStatus.PAYMENT_FAILED
        else:
            order.status = OrderStatus.PAID
            order.mpesa_receipt_number = meta.get("MpesaReceiptNumber")
    else:
        logger.info("M-Pesa payment failed for order %s: %s", order.id, callback.get("ResultDesc"))
        order.status = OrderStatus.PAYMENT_FAILED

    db.session.commit()
    return ACK
