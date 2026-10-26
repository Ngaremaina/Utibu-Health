from __future__ import annotations

import enum
from datetime import UTC, date, datetime

import bcrypt
from sqlalchemy import CheckConstraint, Enum, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.extensions import db


def utcnow() -> datetime:
    return datetime.now(UTC)


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(db.DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        db.DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False
    )


class User(TimestampMixin, db.Model):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    username: Mapped[str] = mapped_column(String(80))
    password_hash: Mapped[str] = mapped_column(String(255))
    is_admin: Mapped[bool] = mapped_column(default=False, server_default=db.false())

    profile: Mapped[Profile | None] = relationship(back_populates="user", cascade="all, delete-orphan")
    cart_items: Mapped[list[CartItem]] = relationship(
        back_populates="user", cascade="all, delete-orphan", order_by="CartItem.id"
    )
    addresses: Mapped[list[ShippingAddress]] = relationship(
        back_populates="user", cascade="all, delete-orphan", order_by="ShippingAddress.id"
    )
    orders: Mapped[list[Order]] = relationship(back_populates="user", order_by="Order.id.desc()")

    def set_password(self, password: str) -> None:
        self.password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

    def check_password(self, password: str) -> bool:
        try:
            return bcrypt.checkpw(password.encode(), self.password_hash.encode())
        except ValueError:
            return False


class Profile(TimestampMixin, db.Model):
    __tablename__ = "profiles"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    first_name: Mapped[str | None] = mapped_column(String(100))
    last_name: Mapped[str | None] = mapped_column(String(100))
    phone_number: Mapped[str | None] = mapped_column(String(20))
    address: Mapped[str | None] = mapped_column(String(255))
    city: Mapped[str | None] = mapped_column(String(100))
    country: Mapped[str | None] = mapped_column(String(100))

    user: Mapped[User] = relationship(back_populates="profile")


class Product(TimestampMixin, db.Model):
    __tablename__ = "products"
    __table_args__ = (
        CheckConstraint("price >= 0", name="price_non_negative"),
        CheckConstraint("stock >= 0", name="stock_non_negative"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), unique=True)
    description: Mapped[str] = mapped_column(Text)
    manufacturer: Mapped[str] = mapped_column(String(255))
    # Prices are whole Kenyan shillings; M-Pesa only accepts whole amounts.
    price: Mapped[int]
    stock: Mapped[int] = mapped_column(default=0)
    expiration_date: Mapped[date | None]
    usage_instructions: Mapped[str | None] = mapped_column(Text)
    warnings: Mapped[str | None] = mapped_column(Text)
    image_url: Mapped[str | None] = mapped_column(String(1024))
    is_active: Mapped[bool] = mapped_column(default=True, server_default=db.true())


class CartItem(TimestampMixin, db.Model):
    __tablename__ = "cart_items"
    __table_args__ = (
        UniqueConstraint("user_id", "product_id", name="uq_cart_items_user_product"),
        CheckConstraint("quantity > 0", name="quantity_positive"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id", ondelete="CASCADE"))
    quantity: Mapped[int] = mapped_column(default=1)

    user: Mapped[User] = relationship(back_populates="cart_items")
    product: Mapped[Product] = relationship()

    @property
    def line_total(self) -> int:
        return self.product.price * self.quantity


class ShippingAddress(TimestampMixin, db.Model):
    __tablename__ = "shipping_addresses"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    region: Mapped[str] = mapped_column(String(100))
    address: Mapped[str] = mapped_column(String(255))
    city: Mapped[str] = mapped_column(String(100))

    user: Mapped[User] = relationship(back_populates="addresses")


class OrderStatus(enum.StrEnum):
    PENDING_PAYMENT = "pending_payment"
    CONFIRMED = "confirmed"
    PAID = "paid"
    PAYMENT_FAILED = "payment_failed"
    CANCELLED = "cancelled"
    DELIVERED = "delivered"


class PaymentMethod(enum.StrEnum):
    CASH_ON_DELIVERY = "cash_on_delivery"
    MPESA = "mpesa"


def _enum(enum_cls: type[enum.Enum], name: str) -> Enum:
    return Enum(
        enum_cls,
        name=name,
        native_enum=False,
        length=32,
        validate_strings=True,
        values_callable=lambda members: [m.value for m in members],
    )


class Order(TimestampMixin, db.Model):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), index=True)
    shipping_address_id: Mapped[int | None] = mapped_column(ForeignKey("shipping_addresses.id", ondelete="SET NULL"))
    status: Mapped[OrderStatus] = mapped_column(_enum(OrderStatus, "order_status"), index=True)
    payment_method: Mapped[PaymentMethod] = mapped_column(_enum(PaymentMethod, "payment_method"))
    subtotal: Mapped[int]
    delivery_fee: Mapped[int] = mapped_column(default=0)
    total: Mapped[int]
    mpesa_phone_number: Mapped[str | None] = mapped_column(String(20))
    mpesa_checkout_request_id: Mapped[str | None] = mapped_column(String(100), unique=True)
    mpesa_receipt_number: Mapped[str | None] = mapped_column(String(50))

    user: Mapped[User] = relationship(back_populates="orders")
    shipping_address: Mapped[ShippingAddress | None] = relationship()
    items: Mapped[list[OrderItem]] = relationship(
        back_populates="order", cascade="all, delete-orphan", order_by="OrderItem.id"
    )


class OrderItem(db.Model):
    """Snapshot of a product at checkout time so later price edits don't alter history."""

    __tablename__ = "order_items"
    __table_args__ = (CheckConstraint("quantity > 0", name="quantity_positive"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"), index=True)
    product_id: Mapped[int | None] = mapped_column(ForeignKey("products.id", ondelete="SET NULL"))
    name: Mapped[str] = mapped_column(String(255))
    image_url: Mapped[str | None] = mapped_column(String(1024))
    unit_price: Mapped[int]
    quantity: Mapped[int]
    line_total: Mapped[int]

    order: Mapped[Order] = relationship(back_populates="items")
