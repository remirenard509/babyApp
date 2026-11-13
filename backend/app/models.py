import enum
from datetime import datetime, date, time
from sqlalchemy import (
    Column, Integer, String, Boolean, Float, Date, Time, DateTime,
    ForeignKey, Enum, Text, UniqueConstraint
)
from sqlalchemy.orm import relationship
from .database import Base

class UserRole(str, enum.Enum):
    VISITOR = "VISITOR"
    PARENT = "PARENT"
    BABYSITTER = "BABYSITTER"
    ADMIN = "ADMIN"

class VerificationStatus(str, enum.Enum):
    NONE = "NONE"
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

class OfferStatus(str, enum.Enum):
    OPEN = "OPEN"
    CLOSED = "CLOSED"

class BookingStatus(str, enum.Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    COMPLETED = "COMPLETED"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRole, native_enum=False), nullable=False, default=UserRole.PARENT)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    profile = relationship("Profile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    offers = relationship("Offer", back_populates="parent", cascade="all, delete-orphan")
    bookings_as_parent = relationship("Booking", foreign_keys="Booking.parent_id", back_populates="parent")
    bookings_as_babysitter = relationship("Booking", foreign_keys="Booking.babysitter_id", back_populates="babysitter")
    reviews_written = relationship("Review", foreign_keys="Review.parent_id", back_populates="parent")
    reviews_received = relationship("Review", foreign_keys="Review.babysitter_id", back_populates="babysitter")

class Profile(Base):
    __tablename__ = "profiles"

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    first_name = Column(String(100), nullable=False, default="")
    last_name = Column(String(100), nullable=False, default="")
    city = Column(String(100), nullable=False, default="")
    postal_code = Column(String(20), nullable=False, default="")
    avatar_url = Column(String(255), nullable=True)
    bio = Column(Text, nullable=True)
    birth_date = Column(Date, nullable=True)
    hourly_rate = Column(Float, nullable=True)
    experience_years = Column(Integer, nullable=True)
    is_verified = Column(Boolean, default=False, nullable=False)
    verification_doc_url = Column(String(255), nullable=True)
    verification_status = Column(Enum(VerificationStatus, native_enum=False), default=VerificationStatus.NONE, nullable=False)

    user = relationship("User", back_populates="profile")

class Offer(Base):
    __tablename__ = "offers"

    id = Column(Integer, primary_key=True, index=True)
    parent_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    hourly_rate = Column(Float, nullable=False)
    city = Column(String(100), nullable=False)
    status = Column(Enum(OfferStatus, native_enum=False), default=OfferStatus.OPEN, nullable=False)

    parent = relationship("User", back_populates="offers")

class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    parent_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    babysitter_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    children_count = Column(Integer, nullable=False, default=1)
    notes = Column(Text, nullable=True)
    total_price = Column(Float, nullable=False)
    status = Column(Enum(BookingStatus, native_enum=False), default=BookingStatus.PENDING, nullable=False)

    parent = relationship("User", foreign_keys=[parent_id], back_populates="bookings_as_parent")
    babysitter = relationship("User", foreign_keys=[babysitter_id], back_populates="bookings_as_babysitter")
    review = relationship("Review", back_populates="booking", uselist=False, cascade="all, delete-orphan")

class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    parent_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    babysitter_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan", order_by="Message.created_at")
    parent = relationship("User", foreign_keys=[parent_id])
    babysitter = relationship("User", foreign_keys=[babysitter_id])

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False)
    sender_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    conversation = relationship("Conversation", back_populates="messages")
    sender = relationship("User")

class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False, unique=True)
    parent_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    babysitter_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    rating = Column(Integer, nullable=False)
    comment = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    booking = relationship("Booking", back_populates="review")
    parent = relationship("User", foreign_keys=[parent_id], back_populates="reviews_written")
    babysitter = relationship("User", foreign_keys=[babysitter_id], back_populates="reviews_received")

