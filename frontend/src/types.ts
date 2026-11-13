export type UserRole = 'VISITOR' | 'PARENT' | 'BABYSITTER' | 'ADMIN';
export type VerificationStatus = 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';
export type OfferStatus = 'OPEN' | 'CLOSED';
export type BookingStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED';

export interface Profile {
  user_id: number;
  first_name: string;
  last_name: string;
  city: string;
  postal_code: string;
  avatar_url?: string;
  bio?: string;
  birth_date?: string;
  hourly_rate?: number;
  experience_years?: number;
  is_verified: boolean;
  verification_doc_url?: string;
  verification_status: VerificationStatus;
  calculated_age?: number;
  average_rating: number;
  reviews_count: number;
}

export interface User {
  id: number;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  profile?: Profile;
}

export interface Offer {
  id: number;
  parent_id: number;
  title: string;
  description: string;
  date: string;
  start_time: string;
  end_time: string;
  hourly_rate: number;
  city: string;
  status: OfferStatus;
  parent?: User;
}

export interface Booking {
  id: number;
  parent_id: number;
  babysitter_id: number;
  date: string;
  start_time: string;
  end_time: string;
  children_count: number;
  notes?: string;
  total_price: number;
  status: BookingStatus;
  parent?: User;
  babysitter?: User;
  review?: Review;
}

export interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  content: string;
  created_at: string;
}

export interface Conversation {
  id: number;
  parent_id: number;
  babysitter_id: number;
  updated_at: string;
  parent?: User;
  babysitter?: User;
  last_message?: Message;
}

export interface Review {
  id: number;
  booking_id: number;
  parent_id: number;
  babysitter_id: number;
  rating: number;
  comment: string;
  created_at: string;
  parent?: User;
}

