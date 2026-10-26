from datetime import date

import click
from flask import Flask
from sqlalchemy import func, select

from app.extensions import db
from app.models import Product, User

SEED_PRODUCTS = [
    {
        "name": "Brufen",
        "description": "Brufen is a nonsteroidal anti-inflammatory drug (NSAID).",
        "manufacturer": "Pfizer",
        "price": 100,
        "stock": 10,
        "expiration_date": date(2027, 12, 31),
        "usage_instructions": "Take 1 tablet by mouth with food.",
        "warnings": "Do not exceed the recommended dose.",
        "image_url": "https://www.goodlife.co.ke/wp-content/uploads/2021/09/BRUFEN-SUSP-100MG-5ML-100ML-1-scaled-1.jpg",
    },
    {
        "name": "Paracetamol",
        "description": "Paracetamol is a common pain reliever and fever reducer.",
        "manufacturer": "Various",
        "price": 100,
        "stock": 50,
        "expiration_date": date(2027, 12, 31),
        "usage_instructions": "Take 1-2 tablets every 4-6 hours as needed.",
        "warnings": "Do not exceed the recommended dosage. Consult a doctor if symptoms persist.",
        "image_url": "https://brennanspharmacy.com/wp-content/uploads/2020/08/b0b158e8-b6a6-4dd9-b32a-d0f828e88bc1__96375.1473853752.jpg",
    },
]


def register_cli(app: Flask) -> None:
    @app.cli.command("seed")
    def seed():
        """Insert the sample product catalogue (idempotent)."""
        created = 0
        for data in SEED_PRODUCTS:
            if not db.session.scalar(select(Product.id).where(Product.name == data["name"])):
                db.session.add(Product(**data))
                created += 1
        db.session.commit()
        click.echo(f"Seeded {created} product(s).")

    @app.cli.command("create-admin")
    @click.option("--email", prompt=True)
    @click.option("--username", prompt=True)
    @click.password_option()
    def create_admin(email: str, username: str, password: str):
        """Create an admin user, or promote an existing one."""
        user = db.session.scalar(select(User).where(func.lower(User.email) == email.lower()))
        if user is None:
            user = User(email=email.lower(), username=username)
            user.set_password(password)
            db.session.add(user)
        user.is_admin = True
        db.session.commit()
        click.echo(f"Admin ready: {user.email}")
