"""Safaricom Daraja (M-Pesa Express / STK Push) client."""

from __future__ import annotations

import base64
import logging
import threading
import time
from datetime import datetime
from zoneinfo import ZoneInfo

import requests
from flask import current_app

logger = logging.getLogger(__name__)

BASE_URLS = {
    "sandbox": "https://sandbox.safaricom.co.ke",
    "production": "https://api.safaricom.co.ke",
}
NAIROBI = ZoneInfo("Africa/Nairobi")


class MpesaError(Exception):
    pass


def normalize_phone(phone: str) -> str:
    """Return the phone number in the 2547XXXXXXXX format Daraja expects."""
    digits = phone.strip().lstrip("+")
    if digits.startswith("0"):
        digits = "254" + digits[1:]
    elif not digits.startswith("254"):
        digits = "254" + digits
    return digits


class MpesaClient:
    _token_lock = threading.Lock()
    _token: tuple[str, float] | None = None

    def __init__(self, config=None):
        cfg = config or current_app.config
        self.base_url = BASE_URLS.get(cfg["MPESA_ENVIRONMENT"], BASE_URLS["sandbox"])
        self.consumer_key = cfg["MPESA_CONSUMER_KEY"]
        self.consumer_secret = cfg["MPESA_CONSUMER_SECRET"]
        self.shortcode = cfg["MPESA_SHORTCODE"]
        self.passkey = cfg["MPESA_PASSKEY"]
        self.callback_url = cfg["MPESA_CALLBACK_URL"]
        self.callback_token = cfg["MPESA_CALLBACK_TOKEN"]
        self.timeout = cfg["MPESA_TIMEOUT_SECONDS"]

    @property
    def configured(self) -> bool:
        return all([self.consumer_key, self.consumer_secret, self.shortcode, self.passkey, self.callback_url])

    def _access_token(self) -> str:
        with self._token_lock:
            cached = MpesaClient._token
            if cached and cached[1] > time.monotonic():
                return cached[0]
            try:
                response = requests.get(
                    f"{self.base_url}/oauth/v1/generate",
                    params={"grant_type": "client_credentials"},
                    auth=(self.consumer_key, self.consumer_secret),
                    timeout=self.timeout,
                )
                response.raise_for_status()
                payload = response.json()
            except (requests.RequestException, ValueError) as exc:
                logger.warning("M-Pesa token request failed: %s", exc)
                raise MpesaError("Could not authenticate with M-Pesa.") from exc
            # Refresh a minute before Daraja's stated expiry.
            ttl = int(payload.get("expires_in", 3599)) - 60
            MpesaClient._token = (payload["access_token"], time.monotonic() + max(ttl, 0))
            return payload["access_token"]

    def stk_push(self, *, phone_number: str, amount: int, reference: str, description: str) -> dict:
        if not self.configured:
            raise MpesaError("M-Pesa payments are not configured.")

        timestamp = datetime.now(NAIROBI).strftime("%Y%m%d%H%M%S")
        password = base64.b64encode(f"{self.shortcode}{self.passkey}{timestamp}".encode()).decode()
        callback_url = self.callback_url
        if self.callback_token:
            separator = "&" if "?" in callback_url else "?"
            callback_url = f"{callback_url}{separator}token={self.callback_token}"

        phone = normalize_phone(phone_number)
        payload = {
            "BusinessShortCode": self.shortcode,
            "Password": password,
            "Timestamp": timestamp,
            "TransactionType": "CustomerPayBillOnline",
            "Amount": int(amount),
            "PartyA": phone,
            "PartyB": self.shortcode,
            "PhoneNumber": phone,
            "CallBackURL": callback_url,
            "AccountReference": reference[:12],
            "TransactionDesc": description[:13],
        }
        try:
            response = requests.post(
                f"{self.base_url}/mpesa/stkpush/v1/processrequest",
                json=payload,
                headers={"Authorization": f"Bearer {self._access_token()}"},
                timeout=self.timeout,
            )
            data = response.json()
        except (requests.RequestException, ValueError) as exc:
            logger.warning("M-Pesa STK push failed: %s", exc)
            raise MpesaError("Could not reach M-Pesa.") from exc

        if response.status_code != 200 or str(data.get("ResponseCode")) != "0":
            logger.warning("M-Pesa STK push rejected: %s", data)
            raise MpesaError(
                data.get("errorMessage") or data.get("ResponseDescription") or "M-Pesa rejected the request."
            )
        return data
