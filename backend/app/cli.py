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
    {
        "name": "Amoxicillin 500mg",
        "description": "Penicillin-type antibiotic for chest, ear and urinary tract infections.",
        "manufacturer": "GSK",
        "price": 450,
        "stock": 40,
        "expiration_date": date(2027, 12, 31),
        "usage_instructions": "Take 1 capsule every 8 hours for the full course prescribed.",
        "warnings": "Prescription only. Do not use if allergic to penicillin. Complete the full course.",
    },
    {
        "name": "Augmentin 625mg",
        "description": "Amoxicillin with clavulanic acid, a broad-spectrum antibiotic.",
        "manufacturer": "GSK",
        "price": 1200,
        "stock": 25,
        "expiration_date": date(2027, 12, 31),
        "usage_instructions": "Take 1 tablet every 12 hours with a meal.",
        "warnings": "Prescription only. May cause diarrhoea. Not for penicillin-allergic patients.",
    },
    {
        "name": "Metformin 500mg",
        "description": "First-line oral medicine for managing type 2 diabetes.",
        "manufacturer": "Merck",
        "price": 300,
        "stock": 60,
        "expiration_date": date(2027, 12, 31),
        "usage_instructions": "Take 1 tablet twice daily with meals, or as directed by your doctor.",
        "warnings": "Prescription only. Stop and seek help if you have severe vomiting or unusual muscle pain.",
    },
    {
        "name": "Amlodipine 5mg",
        "description": "Calcium channel blocker used to treat high blood pressure and angina.",
        "manufacturer": "Pfizer",
        "price": 350,
        "stock": 50,
        "expiration_date": date(2027, 12, 31),
        "usage_instructions": "Take 1 tablet once daily at the same time each day.",
        "warnings": "Prescription only. May cause ankle swelling or dizziness.",
    },
    {
        "name": "Losartan 50mg",
        "description": "Angiotensin receptor blocker for high blood pressure and kidney protection in diabetes.",
        "manufacturer": "Cosmos",
        "price": 500,
        "stock": 45,
        "expiration_date": date(2027, 12, 31),
        "usage_instructions": "Take 1 tablet once daily, with or without food.",
        "warnings": "Prescription only. Not for use in pregnancy.",
    },
    {
        "name": "Omeprazole 20mg",
        "description": "Proton pump inhibitor that reduces stomach acid for heartburn and ulcers.",
        "manufacturer": "AstraZeneca",
        "price": 250,
        "stock": 70,
        "expiration_date": date(2027, 12, 31),
        "usage_instructions": "Take 1 capsule daily before breakfast.",
        "warnings": "Consult a doctor if symptoms persist beyond 14 days.",
    },
    {
        "name": "Cetirizine 10mg",
        "description": "Non-drowsy antihistamine for hay fever, hives and other allergies.",
        "manufacturer": "Dawa Ltd",
        "price": 150,
        "stock": 80,
        "expiration_date": date(2027, 12, 31),
        "usage_instructions": "Take 1 tablet once daily.",
        "warnings": "May cause mild drowsiness. Avoid alcohol.",
    },
    {
        "name": "Loratadine 10mg",
        "description": "Antihistamine for relief of sneezing, runny nose and itchy eyes.",
        "manufacturer": "Bayer",
        "price": 200,
        "stock": 60,
        "expiration_date": date(2027, 12, 31),
        "usage_instructions": "Take 1 tablet once daily.",
        "warnings": "Consult a doctor before use if pregnant or breastfeeding.",
    },
    {
        "name": "Coartem 20/120mg",
        "description": "Artemether-lumefantrine combination for treating uncomplicated malaria.",
        "manufacturer": "Novartis",
        "price": 600,
        "stock": 35,
        "expiration_date": date(2027, 12, 31),
        "usage_instructions": "Six-dose course over 3 days, taken with food or milk, as directed.",
        "warnings": "Prescription only. Seek urgent care if symptoms worsen or vomiting prevents dosing.",
    },
    {
        "name": "ORS Sachets",
        "description": "Oral rehydration salts to replace fluids and electrolytes lost through diarrhoea.",
        "manufacturer": "Various",
        "price": 50,
        "stock": 120,
        "expiration_date": date(2027, 12, 31),
        "usage_instructions": "Dissolve 1 sachet in 1 litre of clean, boiled and cooled water. Sip frequently.",
        "warnings": "Use within 24 hours of mixing. Seek care if diarrhoea lasts over 2 days.",
    },
    {
        "name": "Zinc Sulphate 20mg",
        "description": "Zinc supplement used alongside ORS to shorten diarrhoea in children.",
        "manufacturer": "Various",
        "price": 120,
        "stock": 90,
        "expiration_date": date(2027, 12, 31),
        "usage_instructions": "Children over 6 months: 1 tablet dissolved daily for 10-14 days.",
        "warnings": "Keep out of reach of children.",
    },
    {
        "name": "Salbutamol Inhaler 100mcg",
        "description": "Reliever inhaler that opens the airways during asthma attacks.",
        "manufacturer": "GSK",
        "price": 650,
        "stock": 30,
        "expiration_date": date(2027, 12, 31),
        "usage_instructions": "Inhale 1-2 puffs when needed for wheezing or breathlessness.",
        "warnings": "Seek emergency care if you need it more than usual or it stops helping.",
    },
    {
        "name": "Vitamin C 1000mg",
        "description": "Effervescent vitamin C supplement to support the immune system.",
        "manufacturer": "Bayer",
        "price": 400,
        "stock": 75,
        "expiration_date": date(2027, 12, 31),
        "usage_instructions": "Dissolve 1 tablet in a glass of water once daily.",
        "warnings": "Do not exceed the stated dose.",
    },
    {
        "name": "Ferrous Sulphate 200mg",
        "description": "Iron supplement for preventing and treating iron-deficiency anaemia.",
        "manufacturer": "Various",
        "price": 100,
        "stock": 100,
        "expiration_date": date(2027, 12, 31),
        "usage_instructions": "Take 1 tablet daily after a meal.",
        "warnings": "May darken stools or cause constipation. Keep away from children.",
    },
    {
        "name": "Folic Acid 5mg",
        "description": "Vitamin B9 supplement, recommended before and during early pregnancy.",
        "manufacturer": "Various",
        "price": 80,
        "stock": 100,
        "expiration_date": date(2027, 12, 31),
        "usage_instructions": "Take 1 tablet daily, or as directed by your doctor.",
        "warnings": "Consult a doctor for the correct dose in pregnancy.",
    },
    {
        "name": "Diclofenac Gel 1%",
        "description": "Topical anti-inflammatory gel for muscle and joint pain.",
        "manufacturer": "Novartis",
        "price": 450,
        "stock": 40,
        "expiration_date": date(2027, 12, 31),
        "usage_instructions": "Rub gently onto the painful area 3-4 times daily.",
        "warnings": "For external use only. Do not apply to broken skin.",
    },
    {
        "name": "Hydrocortisone Cream 1%",
        "description": "Mild steroid cream for eczema, insect bites and skin irritation.",
        "manufacturer": "Various",
        "price": 300,
        "stock": 50,
        "expiration_date": date(2027, 12, 31),
        "usage_instructions": "Apply a thin layer to the affected area 1-2 times daily.",
        "warnings": "Do not use on the face for more than 7 days without medical advice.",
    },
    {
        "name": "Fluconazole 150mg",
        "description": "Single-dose antifungal for vaginal thrush and other yeast infections.",
        "manufacturer": "Pfizer",
        "price": 350,
        "stock": 40,
        "expiration_date": date(2027, 12, 31),
        "usage_instructions": "Take 1 capsule as a single dose.",
        "warnings": "Consult a doctor if pregnant or if symptoms recur.",
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
