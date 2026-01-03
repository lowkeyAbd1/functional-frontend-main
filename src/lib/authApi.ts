/**
 * Authentication API functions
 */
import { apiFetch } from './api';
import type { User, AuthResponse, ApiResponse } from '@/types';

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

/**
 * Register a new user
 */
export async function registerUser(data: RegisterData): Promise<AuthResponse> {
  // Use /auth/register (not /api/auth/register) since API_BASE_URL already includes /api
  const response = await apiFetch<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  // Store token if successful
  if (response.success && response.token) {
    localStorage.setItem('auth_token', response.token);
    if (response.user) {
      localStorage.setItem('user', JSON.stringify(response.user));
    }
  }

  return response;
}

/**
 * Login user
 */
export async function loginUser(data: LoginData): Promise<AuthResponse> {
  // Use /auth/login (not /api/auth/login) since API_BASE_URL already includes /api
  const response = await apiFetch<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  // Store token if successful
  if (response.success && response.token) {
    localStorage.setItem('auth_token', response.token);
    if (response.user) {
      localStorage.setItem('user', JSON.stringify(response.user));
    }
  }

  return response;
}

/**
 * Get current user (restore session)
 */
export async function me(): Promise<ApiResponse<User>> {
  // Use /auth/me (not /api/auth/me) since API_BASE_URL already includes /api
  return apiFetch<ApiResponse<User>>('/auth/me');
}

/**
 * Logout (clear token)
 */
export function logout(): void {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user');
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!localStorage.getItem('auth_token');
}

/**
 * Request password reset
 */
export async function requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
  return apiFetch<{ success: boolean; message: string }>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

/**
 * Reset password with token
 */
export async function resetPassword(token: string, password: string): Promise<{ success: boolean; message: string }> {
  return apiFetch<{ success: boolean; message: string }>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, password }),
  });
}

