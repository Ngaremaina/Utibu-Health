from __future__ import annotations

import logging
import sys
import time
import uuid

from dotenv import load_dotenv
from flask import Flask, g, request
from werkzeug.middleware.proxy_fix import ProxyFix

load_dotenv()

from app.config import Config, ProductionConfig, get_config  # noqa: E402
from app.extensions import cors, db, jwt, limiter, migrate  # noqa: E402


def create_app(config: str | type[Config] | None = None) -> Flask:
    config_cls = config if isinstance(config, type) else get_config(config)
    if issubclass(config_cls, ProductionConfig):
        config_cls.validate()

    app = Flask(__name__)
    app.config.from_object(config_cls)
    app.json.sort_keys = False

    _configure_logging(app)

    if app.config["TRUST_PROXY"]:
        app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1)

    db.init_app(app)
    migrate.init_app(app, db, compare_type=True)
    jwt.init_app(app)
    limiter.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}})

    from app import auth  # noqa: F401  registers JWT loaders
    from app.api import api
    from app.cli import register_cli
    from app.errors import register_error_handlers

    app.register_blueprint(api)
    register_error_handlers(app)
    register_cli(app)
    _register_request_hooks(app)

    return app


def _configure_logging(app: Flask) -> None:
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(logging.Formatter("%(asctime)s %(levelname)s [%(name)s] %(message)s"))
    root = logging.getLogger()
    root.handlers = [handler]
    root.setLevel(app.config["LOG_LEVEL"])


def _register_request_hooks(app: Flask) -> None:
    access_log = logging.getLogger("app.access")

    @app.before_request
    def start_timer():
        g.request_id = request.headers.get("X-Request-ID") or uuid.uuid4().hex
        g.start = time.perf_counter()

    @app.after_request
    def finalize(response):
        response.headers["X-Request-ID"] = g.get("request_id", "")
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("Referrer-Policy", "no-referrer")
        if request.is_secure:
            response.headers.setdefault("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
        if "start" in g:
            access_log.info(
                "%s %s %s %.1fms rid=%s",
                request.method,
                request.path,
                response.status_code,
                (time.perf_counter() - g.start) * 1000,
                g.request_id,
            )
        return response
