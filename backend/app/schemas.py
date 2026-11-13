from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime, date, time
from .models import UserRole, VerificationStatus, OfferStatus, BookingStatus

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    user_id: Optional[int] = None
    role: Optional[UserRole] = None

# Auth Schemas
class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: UserRole
    first_name: str
    last_name: str
    city: str
    postal_code: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

# Profile Schemas
class ProfileBase(BaseModel):
    first_name: str
    last_name: str
    city: str
    postal_code: str
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    birth_date: Optional[date] = None
    hourly_rate: Optional[float] = None
    experience_years: Optional[int] = None

class ProfileUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    city: Optional[str] = None
    postal_code: Optional[str] = None
    bio: Optional[str] = None
    birth_date: Optional[date] = None
    hourly_rate: Optional[float] = None
    experience_years: Optional[int] = None

class ProfileResponse(ProfileBase):
    user_id: int
    is_verified: bool
    verification_doc_url: Optional[str] = None
    verification_status: VerificationStatus
    calculated_age: Optional[int] = None
    average_rating: Optional[float] = 0.0
    reviews_count: Optional[int] = 0

    class Config:
        from_attributes = True

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    role: UserRole
    is_active: bool
    created_at: datetime
    profile: Optional[ProfileResponse] = None

    class Config:
        from_attributes = True

# Offer Schemas
class OfferCreate(BaseModel):
    title: str
    description: str
    date: date
    start_time: time
    end_time: time
    hourly_rate: float
    city: str

class OfferResponse(BaseModel):
    id: int
    parent_id: int
    title: str
    description: str
    date: date
    start_time: time
    end_time: time
    hourly_rate: float
    city: str
    status: OfferStatus
    parent: Optional[UserResponse] = None

    class Config:
        from_attributes = True

# Booking Schemas
class BookingCreate(BaseModel):
    babysitter_id: int
    date: date
    start_time: time
    end_time: time
    children_count: int = Field(default=1, ge=1)
    notes: Optional[str] = None

class BookingStatusUpdate(BaseModel):
    status: BookingStatus

class BookingResponse(BaseModel):
    id: int
    parent_id: int
    babysitter_id: int
    date: date
    start_time: time
    end_time: time
    children_count: int
    notes: Optional[str] = None
    total_price: float
    status: BookingStatus
    parent: Optional[UserResponse] = None
    babysitter: Optional[UserResponse] = None
    review: Optional["ReviewResponse"] = None

    class Config:
        from_attributes = True

# Conversation & Message Schemas
class MessageCreate(BaseModel):
    conversation_id: int
    content: str

class MessageResponse(BaseModel):
    id: int
    conversation_id: int
    sender_id: int
    content: str
    created_at: datetime

    class Config:
        from_attributes = True

class ConversationStart(BaseModel):
    recipient_id: int

class ConversationResponse(BaseModel):
    id: int
    parent_id: int
    babysitter_id: int
    updated_at: datetime
    parent: Optional[UserResponse] = None
    babysitter: Optional[UserResponse] = None
    last_message: Optional[MessageResponse] = None

    class Config:
        from_attributes = True

# Review Schemas
class ReviewCreate(BaseModel):
    booking_id: int
    rating: int = Field(..., ge=1, le=5)
    comment: str

class ReviewResponse(BaseModel):
    id: int
    booking_id: int
    parent_id: int
    babysitter_id: int
    rating: int
    comment: str
    created_at: datetime
    parent: Optional[UserResponse] = None

    class Config:
        from_attributes = True

BookingResponse.model_rebuild()

# Admin Schemas
class VerifyUserRequest(BaseModel):
    user_id: int
    action: str = Field(..., pattern="^(APPROVE|REJECT)$")

