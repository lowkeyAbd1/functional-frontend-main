export interface Property {
  id: number;
  slug?: string;
  title: string;
  type?: 'Apartment' | 'Villa' | 'House' | 'Land' | 'Office' | 'Shop';
  purpose?: 'Rent' | 'Sale';
  price: number;
  currency?: string;
  rent_period?: 'Monthly' | 'Yearly' | 'Weekly' | 'Daily';
  beds?: number;
  baths?: number;
  area?: number;
  area_unit?: 'sqm' | 'sqft';
  location: string;
  city?: string;
  region?: string; // Legacy field
  bedrooms?: number; // Legacy field
  bathrooms?: number; // Legacy field
  sqft?: number; // Legacy field
  image?: string; // Legacy field
  images?: string[];
  featured?: boolean;
  is_featured?: boolean;
  category?: string;
  description?: string;
  amenities?: string[];
  agent_id?: number;
  agent_name?: string;
  agent_title?: string;
  agent_photo?: string;
  agent_phone?: string;
  agent_whatsapp?: string;
  whatsapp?: string; // Legacy field
  latitude?: number;
  longitude?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Agent {
  id: number;
  name: string;
  title?: string;
  specialty?: string;
  specialization?: string;
  experience?: number;
  rating?: number;
  reviews?: number;
  sales?: string;
  image?: string | null;
  profile_photo?: string | null;
  email?: string;
  city?: string;
  languages?: string;
  company?: string;
  phone?: string;
  whatsapp?: string;
  properties?: Property[];
  properties_count?: number;
  activeStories?: Story[];
}

export interface Story {
  id: number;
  agent_id: number;
  agent_name: string;
  agent_title?: string;
  phone?: string;
  whatsapp?: string;
  agent_photo?: string;
  media_type: 'image' | 'video';
  media_url: string;
  thumbnail_url?: string;
  duration: number;
  created_at: string;
  expires_at?: string;
  title?: string;
  caption?: string;
}

// Bayut-style story grouping
export interface StoryGroup {
  agent_id: number;
  agent_name: string;
  agent_title?: string;
  agent_photo?: string;
  phone?: string;
  whatsapp?: string;
  postedAt?: string;
  stories: Story[]; // Stories for THIS agent only
}

export interface StoryMedia {
  id: number;
  story_id: number;
  media_type: 'image' | 'video';
  media_url: string;
  thumb_url?: string;
  duration_sec?: number;
  sort_order: number;
}

export interface AgentWithStories {
  agent: Agent;
  stories: Story[];
}

export interface Category {
  id: number;
  name: string;
  slug?: string;
  description?: string;
  count: number;
  icon?: string;
  color?: string;
  is_active?: number;
}

export interface Service {
  id: number;
  title: string;
  description?: string;
  icon?: string;
  is_active?: number;
  created_at?: string;
}

export interface Project {
  id: number;
  title: string;
  location: string;
  price_from?: number;
  developer?: string;
  description?: string;
  image?: string;
  status: 'upcoming' | 'ongoing' | 'completed';
  is_featured: boolean;
  created_at?: string;
}

export interface ContactForm {
  name: string;
  email: string;
  phone: string;
  message: string;
  property_id?: number;
}

export interface Contact {
  id: number;
  name: string;
  email: string;
  phone?: string;
  message: string;
  property_id?: number;
  status?: 'new' | 'contacted' | 'closed';
  created_at: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'agent' | 'admin';
  created_at: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  message?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// Re-export Project types
export type { Project, PaymentMilestone } from './project';
