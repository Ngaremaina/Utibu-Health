"""WSGI entrypoint: ``gunicorn wsgi:app`` in production, ``flask --app wsgi run`` locally."""

import os

from app import create_app

app = create_app()

if __name__ == "__main__":
    app.run(host=os.getenv("HOST", "127.0.0.1"), port=int(os.getenv("PORT", "5000")))
