// API Configuration - Update this to point to your external backend
// Ensure VITE_API_URL is set to http://localhost:5001/api in .env file
const envApiUrl = import.meta.env.VITE_API_URL;
// Use env value directly if provided, otherwise default
// Don't add /api if it's already in the env variable
let baseUrl = envApiUrl || 'http://localhost:5001/api';
// Normalize: remove trailing slashes, but don't add /api if env already has it
baseUrl = baseUrl.trim().replace(/\/+$/, '');
export const API_BASE_URL = baseUrl;

// Debug log to verify API URL (only in development)
if (import.meta.env.DEV) {
  console.log('[API Config] VITE_API_URL from env:', envApiUrl);
  console.log('[API Config] Using API_BASE_URL:', API_BASE_URL);
}

// Auth endpoints
export const AUTH_ENDPOINTS = {
  LOGIN: `${API_BASE_URL}/auth/login`,
  REGISTER: `${API_BASE_URL}/auth/register`,
  LOGOUT: `${API_BASE_URL}/auth/logout`,
  ME: `${API_BASE_URL}/auth/me`,
};

// Property endpoints
export const PROPERTY_ENDPOINTS = {
  LIST: `${API_BASE_URL}/properties`,
  FEATURED: `${API_BASE_URL}/properties/featured`,
  SINGLE: (id: number) => `${API_BASE_URL}/properties/${id}`,
  SEARCH: `${API_BASE_URL}/properties/search`,
  BY_CATEGORY: (category: string) => `${API_BASE_URL}/properties/category/${category}`,
};

// Agent endpoints
export const AGENT_ENDPOINTS = {
  LIST: `${API_BASE_URL}/agents`,
  SINGLE: (id: number) => `${API_BASE_URL}/agents/${id}`,
  CREATE: `${API_BASE_URL}/agents`,
  UPDATE: (id: number) => `${API_BASE_URL}/agents/${id}`,
  DELETE: (id: number) => `${API_BASE_URL}/agents/${id}`,
};

// Contact endpoints
export const CONTACT_ENDPOINTS = {
  SUBMIT: `${API_BASE_URL}/contacts`,
  LIST: `${API_BASE_URL}/contacts`,
  SINGLE: (id: number) => `${API_BASE_URL}/contacts/${id}`,
};

// Category endpoints
export const CATEGORY_ENDPOINTS = {
  LIST: `${API_BASE_URL}/categories`,
  ALL: `${API_BASE_URL}/categories/all`,
  SINGLE: (id: number) => `${API_BASE_URL}/categories/${id}`,
  CREATE: `${API_BASE_URL}/categories`,
  UPDATE: (id: number) => `${API_BASE_URL}/categories/${id}`,
  DELETE: (id: number) => `${API_BASE_URL}/categories/${id}`,
  TOGGLE: (id: number) => `${API_BASE_URL}/categories/${id}/toggle`,
};

// Service endpoints
export const SERVICE_ENDPOINTS = {
  LIST: `${API_BASE_URL}/services`,
  ALL: `${API_BASE_URL}/services/all`,
  SINGLE: (id: number) => `${API_BASE_URL}/services/${id}`,
  CREATE: `${API_BASE_URL}/services`,
  UPDATE: (id: number) => `${API_BASE_URL}/services/${id}`,
  DELETE: (id: number) => `${API_BASE_URL}/services/${id}`,
};

// Project endpoints
export const PROJECT_ENDPOINTS = {
  LIST: `${API_BASE_URL}/projects`,
  FEATURED: `${API_BASE_URL}/projects/featured`,
  SINGLE: (id: number) => `${API_BASE_URL}/projects/${id}`,
  CREATE: `${API_BASE_URL}/projects`,
  UPDATE: (id: number) => `${API_BASE_URL}/projects/${id}`,
  DELETE: (id: number) => `${API_BASE_URL}/projects/${id}`,
};

// New Projects endpoints (public)
export const NEW_PROJECT_ENDPOINTS = {
  LIST: `${API_BASE_URL}/new-projects`,
  SINGLE: (slug: string) => `${API_BASE_URL}/new-projects/${slug}`,
};

// Admin Projects endpoints
export const ADMIN_PROJECT_ENDPOINTS = {
  LIST: `${API_BASE_URL}/admin/projects`,
  SINGLE: (id: number) => `${API_BASE_URL}/admin/projects/${id}`,
  CREATE: `${API_BASE_URL}/admin/projects`,
  UPDATE: (id: number) => `${API_BASE_URL}/admin/projects/${id}`,
  DELETE: (id: number) => `${API_BASE_URL}/admin/projects/${id}`,
  UPLOAD_IMAGES: (id: number) => `${API_BASE_URL}/admin/projects/${id}/images`,
  DELETE_IMAGE: (id: number, imageId: number) => `${API_BASE_URL}/admin/projects/${id}/images/${imageId}`,
};

// Public Properties endpoints
export const PROPERTY_ENDPOINTS_PUBLIC = {
  LIST: `${API_BASE_URL}/properties`,
  SINGLE: (slug: string) => `${API_BASE_URL}/properties/${slug}`,
};

// Admin Properties endpoints
export const ADMIN_PROPERTY_ENDPOINTS = {
  LIST: `${API_BASE_URL}/admin/properties`,
  SINGLE: (id: number) => `${API_BASE_URL}/admin/properties/${id}`,
  CREATE: `${API_BASE_URL}/admin/properties`,
  UPDATE: (id: number) => `${API_BASE_URL}/admin/properties/${id}`,
  DELETE: (id: number) => `${API_BASE_URL}/admin/properties/${id}`,
  UPLOAD_IMAGES: (id: number) => `${API_BASE_URL}/admin/properties/${id}/images`,
  DELETE_IMAGE: (imageId: number) => `${API_BASE_URL}/admin/properties/images/${imageId}`,
};

// Stories endpoints
export const STORIES_ENDPOINTS = {
  LIST: `${API_BASE_URL}/stories`,
  AGENT: (agentId: number) => `${API_BASE_URL}/stories/agent/${agentId}`,
  CREATE: `${API_BASE_URL}/stories`,
  DELETE: (id: number) => `${API_BASE_URL}/stories/${id}`,
  ACTIVE: `${API_BASE_URL}/stories/active`, // Legacy - keep for compatibility
  VIEW: (storyId: number) => `${API_BASE_URL}/stories/${storyId}/view`, // Legacy
  DEACTIVATE: (storyId: number) => `${API_BASE_URL}/stories/${storyId}/deactivate`, // Legacy
};
