"""Consistent JSON error responses.

Every error body has the shape ``{"error": {"code": str, "message": str, "details"?: any}}``.
"""

from __future__ import annotations

import logging

from flask import Flask, jsonify
from marshmallow import ValidationError
from werkzeug.exceptions import HTTPException

from app.extensions import db, jwt

logger = logging.getLogger(__name__)


class APIError(Exception):
    def __init__(self, message: str, status: int = 400, code: str = "bad_request", details=None):
        super().__init__(message)
        self.message = message
        self.status = status
        self.code = code
        self.details = details


class NotFound(APIError):
    def __init__(self, message: str = "Resource not found."):
        super().__init__(message, 404, "not_found")


class Conflict(APIError):
    def __init__(self, message: str):
        super().__init__(message, 409, "conflict")


def error_response(message: str, status: int, code: str, details=None):
    body = {"code": code, "message": message}
    if details is not None:
        body["details"] = details
    return jsonify(error=body), status


def register_error_handlers(app: Flask) -> None:
    @app.errorhandler(APIError)
    def handle_api_error(err: APIError):
        # Discard any partial work (e.g. a checkout that failed half way).
        db.session.rollback()
        return error_response(err.message, err.status, err.code, err.details)

    @app.errorhandler(ValidationError)
    def handle_validation_error(err: ValidationError):
        db.session.rollback()
        return error_response("Validation failed.", 422, "validation_error", err.messages)

    @app.errorhandler(HTTPException)
    def handle_http_exception(err: HTTPException):
        code = (err.name or "error").lower().replace(" ", "_")
        return error_response(err.description or err.name, err.code or 500, code)

    @app.errorhandler(Exception)
    def handle_unexpected(err: Exception):
        db.session.rollback()
        logger.exception("Unhandled exception")
        return error_response("An unexpected error occurred.", 500, "internal_error")

    @jwt.unauthorized_loader
    def missing_token(reason: str):
        return error_response("Authentication required.", 401, "unauthorized")

    @jwt.invalid_token_loader
    def invalid_token(reason: str):
        return error_response("Invalid token.", 401, "invalid_token")

    @jwt.expired_token_loader
    def expired_token(header, payload):
        return error_response("Token has expired.", 401, "token_expired")
