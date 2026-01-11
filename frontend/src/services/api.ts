import { AUTH_ENDPOINTS, PROPERTY_ENDPOINTS, AGENT_ENDPOINTS, CONTACT_ENDPOINTS, CATEGORY_ENDPOINTS, SERVICE_ENDPOINTS, PROJECT_ENDPOINTS, NEW_PROJECT_ENDPOINTS, ADMIN_PROJECT_ENDPOINTS, PROPERTY_ENDPOINTS_PUBLIC, ADMIN_PROPERTY_ENDPOINTS, STORIES_ENDPOINTS } from '@/config/api';
import type { Property, Agent, Category, ContactForm, AuthResponse, ApiResponse, User, Service, Project, Story, Contact } from '@/types';
import type { Project as NewProject, PaymentMilestone } from '@/types/project';

// Helper to get auth token
const getToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

// Helper for authenticated requests
const authHeaders = (): HeadersInit => {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// Auth Service
export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    console.log('[Auth Service] Login endpoint:', AUTH_ENDPOINTS.LOGIN);
    const response = await fetch(AUTH_ENDPOINTS.LOGIN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    if (data.success && data.token) {
      localStorage.setItem('auth_token', data.token);
    }
    return data;
  },

  async register(name: string, email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(AUTH_ENDPOINTS.REGISTER, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await response.json();
    if (data.success && data.token) {
      localStorage.setItem('auth_token', data.token);
    }
    return data;
  },

  async getCurrentUser(): Promise<ApiResponse<User>> {
    const response = await fetch(AUTH_ENDPOINTS.ME, {
      headers: authHeaders(),
    });
    return response.json();
  },

  logout(): void {
    localStorage.removeItem('auth_token');
  },

  isAuthenticated(): boolean {
    return !!getToken();
  },
};

// Property Service
export const propertyService = {
  async getAll(): Promise<ApiResponse<Property[]>> {
    const response = await fetch(PROPERTY_ENDPOINTS.LIST, {
      headers: authHeaders(),
    });
    return response.json();
  },

  async getFeatured(): Promise<ApiResponse<Property[]>> {
    const response = await fetch(PROPERTY_ENDPOINTS.FEATURED, {
      headers: authHeaders(),
    });
    return response.json();
  },

  async getById(id: number): Promise<ApiResponse<Property>> {
    const response = await fetch(PROPERTY_ENDPOINTS.SINGLE(id), {
      headers: authHeaders(),
    });
    return response.json();
  },

  async search(query: string, filters?: Record<string, string>): Promise<ApiResponse<Property[]>> {
    const params = new URLSearchParams({ query, ...filters });
    const response = await fetch(`${PROPERTY_ENDPOINTS.SEARCH}?${params}`, {
      headers: authHeaders(),
    });
    return response.json();
  },

  async getByCategory(category: string): Promise<ApiResponse<Property[]>> {
    const response = await fetch(PROPERTY_ENDPOINTS.BY_CATEGORY(category), {
      headers: authHeaders(),
    });
    return response.json();
  },
};

// Agent Service
export const agentService = {
  async getAll(): Promise<ApiResponse<Agent[]>> {
    const response = await fetch(AGENT_ENDPOINTS.LIST, {
      headers: authHeaders(),
    });
    return response.json();
  },

  async getById(id: number): Promise<ApiResponse<Agent>> {
    const response = await fetch(AGENT_ENDPOINTS.SINGLE(id), {
      headers: authHeaders(),
    });
    return response.json();
  },

  async create(agentData: Partial<Agent>): Promise<ApiResponse<Agent>> {
    const response = await fetch(AGENT_ENDPOINTS.CREATE, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(agentData),
    });
    return response.json();
  },

  // Admin-only: Create user + agent in one transaction
  async createAdminAgent(payload: {
    name: string;
    email: string;
    password?: string;
    title?: string;
    phone?: string;
    whatsapp?: string;
    bio?: string;
    profile_photo?: string;
    image?: string;
    experience?: number;
    specialization?: string;
    specialty?: string;
    languages?: string;
    city?: string;
    company?: string;
    is_active?: number;
  }): Promise<ApiResponse<any>> {
    const apiUrl = import.meta.env.VITE_API_URL ;
    const url = `${apiUrl}/admin/agents`;
    console.log('[AgentService] createAdminAgent URL:', url);
    console.log('[AgentService] createAdminAgent payload:', { ...payload, password: payload.password ? '***' : undefined });
    
    const response = await fetch(url, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw {
        response: { data },
        message: data.message || data.error || 'Failed to create agent'
      };
    }
    
    return data;
  },

  async update(id: number, agentData: Partial<Agent>): Promise<ApiResponse<Agent>> {
    const response = await fetch(AGENT_ENDPOINTS.UPDATE(id), {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(agentData),
    });
    return response.json();
  },

  async getProperties(agentId: number): Promise<ApiResponse<Property[]>> {
    const apiUrl = import.meta.env.VITE_API_URL ;
    const response = await fetch(`${apiUrl}/agents/${agentId}/properties`, {
      headers: authHeaders(),
    });
    return response.json();
  },

  async delete(id: number): Promise<ApiResponse<void>> {
    const response = await fetch(AGENT_ENDPOINTS.DELETE(id), {
      method: 'DELETE',
      headers: authHeaders(),
    });
    return response.json();
  },
};

// Category Service
export const categoryService = {
  async getAll(): Promise<ApiResponse<Category[]>> {
    const response = await fetch(CATEGORY_ENDPOINTS.LIST, {
      headers: authHeaders(),
    });
    return response.json();
  },

  async getAllAdmin(): Promise<ApiResponse<Category[]>> {
    const response = await fetch(CATEGORY_ENDPOINTS.ALL, {
      headers: authHeaders(),
    });
    return response.json();
  },

  async getById(id: number): Promise<ApiResponse<Category>> {
    const response = await fetch(CATEGORY_ENDPOINTS.SINGLE(id), {
      headers: authHeaders(),
    });
    return response.json();
  },

  async create(category: Partial<Category>): Promise<ApiResponse<Category>> {
    const response = await fetch(CATEGORY_ENDPOINTS.CREATE, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(category),
    });
    return response.json();
  },

  async update(id: number, category: Partial<Category>): Promise<ApiResponse<Category>> {
    const response = await fetch(CATEGORY_ENDPOINTS.UPDATE(id), {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(category),
    });
    return response.json();
  },

  async delete(id: number): Promise<ApiResponse<void>> {
    const response = await fetch(CATEGORY_ENDPOINTS.DELETE(id), {
      method: 'DELETE',
      headers: authHeaders(),
    });
    return response.json();
  },

  async toggle(id: number): Promise<ApiResponse<void>> {
    const response = await fetch(CATEGORY_ENDPOINTS.TOGGLE(id), {
      method: 'PATCH',
      headers: authHeaders(),
    });
    return response.json();
  },
};

// Contact Service
export const contactService = {
  async submit(form: ContactForm): Promise<ApiResponse<{ id: number }>> {
    const response = await fetch(CONTACT_ENDPOINTS.SUBMIT, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(form),
    });
    return response.json();
  },

  async getAll(): Promise<ApiResponse<Contact[]>> {
    const response = await fetch(CONTACT_ENDPOINTS.LIST, {
      headers: authHeaders(),
    });
    return response.json();
  },

  async getById(id: number): Promise<ApiResponse<Contact>> {
    const response = await fetch(CONTACT_ENDPOINTS.SINGLE(id), {
      headers: authHeaders(),
    });
    return response.json();
  },
};

// Service Service
export const serviceService = {
  async getAll(): Promise<ApiResponse<Service[]>> {
    const response = await fetch(SERVICE_ENDPOINTS.LIST, {
      headers: authHeaders(),
    });
    return response.json();
  },

  async getById(id: number): Promise<ApiResponse<Service>> {
    const response = await fetch(SERVICE_ENDPOINTS.SINGLE(id), {
      headers: authHeaders(),
    });
    return response.json();
  },
};

// Project Service
export const projectService = {
  async getAll(filters?: Record<string, string>): Promise<ApiResponse<Project[]>> {
    const params = new URLSearchParams(filters);
    const response = await fetch(`${PROJECT_ENDPOINTS.LIST}?${params}`, {
      headers: authHeaders(),
    });
    return response.json();
  },

  async getFeatured(): Promise<ApiResponse<Project[]>> {
    const response = await fetch(PROJECT_ENDPOINTS.FEATURED, {
      headers: authHeaders(),
    });
    return response.json();
  },

  async getById(id: number): Promise<ApiResponse<Project>> {
    const response = await fetch(PROJECT_ENDPOINTS.SINGLE(id), {
      headers: authHeaders(),
    });
    return response.json();
  },
};

// New Project Service (public)
export const newProjectService = {
  async getAll(filters?: Record<string, string>): Promise<NewProject[]> {
    const params = new URLSearchParams(filters);
    const response = await fetch(`${NEW_PROJECT_ENDPOINTS.LIST}?${params}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.statusText}`);
    }
    const data = await response.json();
    // Handle both array and wrapped response
    return Array.isArray(data) ? data : (data.data || []);
  },

  async getBySlug(slug: string): Promise<NewProject> {
    const response = await fetch(NEW_PROJECT_ENDPOINTS.SINGLE(slug));
    if (!response.ok) {
      throw new Error(`Failed to fetch project: ${response.statusText}`);
    }
    const data = await response.json();
    // Handle both object and wrapped response
    return data.data || data;
  },
};

// Admin Project Service
export const adminProjectService = {
  async getAll(search?: string): Promise<ApiResponse<NewProject[]>> {
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    const response = await fetch(`${ADMIN_PROJECT_ENDPOINTS.LIST}${params}`, {
      headers: authHeaders(),
    });
    return response.json();
  },

  async getById(id: number): Promise<ApiResponse<NewProject>> {
    const response = await fetch(ADMIN_PROJECT_ENDPOINTS.SINGLE(id), {
      headers: authHeaders(),
    });
    return response.json();
  },

  async create(project: Partial<NewProject>): Promise<ApiResponse<{ id: number }>> {
    const response = await fetch(ADMIN_PROJECT_ENDPOINTS.CREATE, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(project),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `Failed to create project: ${response.statusText}`);
    }
    
    return data;
  },

  async update(id: number, project: Partial<NewProject>): Promise<ApiResponse<void>> {
    const response = await fetch(ADMIN_PROJECT_ENDPOINTS.UPDATE(id), {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(project),
    });
    return response.json();
  },

  async delete(id: number): Promise<ApiResponse<void>> {
    const response = await fetch(ADMIN_PROJECT_ENDPOINTS.DELETE(id), {
      method: 'DELETE',
      headers: authHeaders(),
    });
    return response.json();
  },

  async uploadImages(id: number, files: File[]): Promise<ApiResponse<string[]>> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('images', file);
    });

    const token = localStorage.getItem('auth_token');
    const response = await fetch(ADMIN_PROJECT_ENDPOINTS.UPLOAD_IMAGES(id), {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });
    return response.json();
  },

  async deleteImage(id: number, imageId: number): Promise<ApiResponse<void>> {
    const response = await fetch(ADMIN_PROJECT_ENDPOINTS.DELETE_IMAGE(id, imageId), {
      method: 'DELETE',
      headers: authHeaders(),
    });
    return response.json();
  },
};

// Public Property Service
export const propertyServicePublic = {
  async getAll(filters?: Record<string, string>): Promise<Property[]> {
    const params = new URLSearchParams(filters);
    // Include auth token if available (for optionalAuth middleware)
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${PROPERTY_ENDPOINTS_PUBLIC.LIST}?${params}`, {
      headers,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Failed to fetch properties: ${response.statusText}`;
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        // Use default errorMessage
      }
      console.error('[propertyServicePublic] API error:', response.status, errorMessage);
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    console.log('[propertyServicePublic] Raw response:', data);
    
    // CRITICAL: Handle ALL possible response formats
    let result: Property[] = [];
    if (Array.isArray(data)) {
      // Direct array: [...]
      result = data;
    } else if (data && typeof data === 'object') {
      // Wrapped formats: { success: true, data: [...] } or { data: [...] } or { properties: [...] }
      if (Array.isArray(data.data)) {
        result = data.data;
      } else if (Array.isArray(data.properties)) {
        result = data.properties;
      } else if (Array.isArray(data.results)) {
        result = data.results;
      } else if (data.success && Array.isArray(data.data)) {
        result = data.data;
      }
    }
    
    // CRITICAL: Always return an array, never null/undefined
    if (!Array.isArray(result)) {
      console.warn('[propertyServicePublic] Response is not a valid array format:', data);
      result = [];
    }
    
    console.log('[propertyServicePublic] Returning:', result.length, 'properties');
    return result;
  },

  async getBySlug(slugOrId: string): Promise<Property> {
    const response = await fetch(PROPERTY_ENDPOINTS_PUBLIC.SINGLE(slugOrId));
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Property not found');
      }
      throw new Error(`Failed to fetch property: ${response.statusText}`);
    }
    const data = await response.json();
    // Backend returns { success: true, data: {...} } format
    if (data.success && data.data) {
      return data.data;
    }
    // Fallback for direct object response
    return data.data || data;
  },
};

// Admin Property Service
export const adminPropertyService = {
  async getAll(search?: string): Promise<ApiResponse<Property[]>> {
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    const response = await fetch(`${ADMIN_PROPERTY_ENDPOINTS.LIST}${params}`, {
      headers: authHeaders(),
    });
    return response.json();
  },

  async getById(id: number): Promise<ApiResponse<Property>> {
    const response = await fetch(ADMIN_PROPERTY_ENDPOINTS.SINGLE(id), {
      headers: authHeaders(),
    });
    return response.json();
  },

  async create(property: Partial<Property>): Promise<ApiResponse<{ id: number }>> {
    const response = await fetch(ADMIN_PROPERTY_ENDPOINTS.CREATE, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(property),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `Failed to create property: ${response.statusText}`);
    }
    
    return data;
  },

  async update(id: number, property: Partial<Property>): Promise<ApiResponse<void>> {
    const response = await fetch(ADMIN_PROPERTY_ENDPOINTS.UPDATE(id), {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(property),
    });
    return response.json();
  },

  async delete(id: number): Promise<ApiResponse<void>> {
    const response = await fetch(ADMIN_PROPERTY_ENDPOINTS.DELETE(id), {
      method: 'DELETE',
      headers: authHeaders(),
    });
    return response.json();
  },

  async uploadImages(id: number, files: File[]): Promise<ApiResponse<string[]>> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('images', file);
    });

    const token = localStorage.getItem('auth_token');
    const response = await fetch(ADMIN_PROPERTY_ENDPOINTS.UPLOAD_IMAGES(id), {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });
    return response.json();
  },

  async deleteImage(imageId: number): Promise<ApiResponse<void>> {
    const response = await fetch(ADMIN_PROPERTY_ENDPOINTS.DELETE_IMAGE(imageId), {
      method: 'DELETE',
      headers: authHeaders(),
    });
    return response.json();
  },
};

// Stories Service
export const storiesService = {
  async getAll(): Promise<ApiResponse<Story[]>> {
    const response = await fetch(STORIES_ENDPOINTS.LIST);
    return response.json();
  },

  async getByAgent(agentId: number): Promise<ApiResponse<Story[]>> {
    const token = localStorage.getItem('auth_token');
    const headers: HeadersInit = {
      ...(token && { Authorization: `Bearer ${token}` }),
    };
    const response = await fetch(STORIES_ENDPOINTS.AGENT(agentId), { headers });
    return response.json();
  },

  async create(data: FormData | { media_type: string; media_url?: string; thumbnail_url?: string; duration?: number; title?: string; project_name?: string; caption?: string }): Promise<ApiResponse<Story>> {
    const token = localStorage.getItem('auth_token');
    
    let headers: HeadersInit;
    let body: FormData | string;
    
    if (data instanceof FormData) {
      // For FormData, don't set Content-Type - browser will set it with boundary
      headers = {
        ...(token && { Authorization: `Bearer ${token}` }),
      };
      body = data;
    } else {
      // For JSON, set Content-Type
      headers = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      };
      body = JSON.stringify(data);
    }

    console.log('[Stories Service] Creating story:', {
      endpoint: STORIES_ENDPOINTS.CREATE,
      fullUrl: STORIES_ENDPOINTS.CREATE,
      hasFile: data instanceof FormData,
      headers: Object.keys(headers),
      apiBaseUrl: import.meta.env.VITE_API_URL 
    });

    const response = await fetch(STORIES_ENDPOINTS.CREATE, {
      method: 'POST',
      headers,
      body,
    });
    
    console.log('[Stories Service] Response status:', response.status, response.statusText);
    
    let result;
    try {
      result = await response.json();
    } catch (e) {
      console.error('[Stories Service] Failed to parse JSON response:', e);
      throw new Error(`Server returned invalid response: ${response.statusText}`);
    }
    
    if (!response.ok) {
      console.error('[Stories Service] Create failed:', {
        status: response.status,
        statusText: response.statusText,
        result,
        url: STORIES_ENDPOINTS.CREATE
      });
      // Use sqlMessage if available, otherwise use message or error
      let errorMessage = result?.sqlMessage || result?.message || result?.error || `Failed to create story: ${response.statusText} (${response.status})`;
      const errorObj = new Error(errorMessage);
      (errorObj as any).code = result?.code;
      (errorObj as any).sqlState = result?.sqlState;
      (errorObj as any).response = result;
      throw errorObj;
    }
    
    return result;
  },

  async delete(id: number): Promise<ApiResponse<void>> {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(STORIES_ENDPOINTS.DELETE(id), {
      method: 'DELETE',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    return response.json();
  },

  // Legacy methods (for compatibility)
  async getActive(filters?: { city?: string; agentId?: number }): Promise<ApiResponse<any[]>> {
    return this.getAll();
  },

  async trackView(storyId: number): Promise<ApiResponse<{ ok: boolean; viewsCount: number }>> {
    // No-op for now (can be implemented later if needed)
    return Promise.resolve({ success: true, data: { ok: true, viewsCount: 0 } });
  },

  async deactivate(storyId: number): Promise<ApiResponse<void>> {
    return this.delete(storyId);
  },
};

// Agents Service (enhanced for Find My Agent)
export const agentsServiceEnhanced = {
  async getAll(filters?: {
    city?: string;
    language?: string;
    name?: string;
    specialization?: string;
    purpose?: string;
    limit?: number;
    page?: number;
  }): Promise<ApiResponse<Agent[]>> {
    const params = new URLSearchParams();
    if (filters?.city) params.set('city', filters.city);
    if (filters?.language) params.set('language', filters.language);
    if (filters?.name) params.set('name', filters.name);
    if (filters?.specialization) params.set('specialization', filters.specialization);
    if (filters?.purpose) params.set('purpose', filters.purpose);
    if (filters?.limit) params.set('limit', filters.limit.toString());
    if (filters?.page) params.set('page', filters.page.toString());
    
    const response = await fetch(`${AGENT_ENDPOINTS.LIST}?${params}`);
    return response.json();
  },

  async getById(id: number): Promise<ApiResponse<Agent & { propertiesCount?: number; activeStories?: any[] }>> {
    const response = await fetch(AGENT_ENDPOINTS.SINGLE(id));
    return response.json();
  },
};
