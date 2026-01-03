/**
 * API fetch wrapper with automatic token handling
 */

// Ensure VITE_API_URL is set to http://localhost:5001/api in .env file
const envApiUrl = import.meta.env.VITE_API_URL;
const API_BASE_URL = envApiUrl || 'http://localhost:5001/api';

// Debug log to verify API URL (only in development)
if (import.meta.env.DEV) {
  console.log('[API Fetch] VITE_API_URL from env:', envApiUrl);
  console.log('[API Fetch] Using API_BASE_URL:', API_BASE_URL);
}

export interface ApiError {
  message?: string;
  errors?: Array<{ msg?: string; message?: string }>;
}

export class ApiException extends Error {
  constructor(
    message: string,
    public status?: number,
    public errors?: Array<{ msg?: string; message?: string }>
  ) {
    super(message);
    this.name = 'ApiException';
  }
}

/**
 * Fetch wrapper that automatically attaches auth token and handles errors
 */
export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('auth_token');
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  // Ensure endpoint doesn't start with /api if API_BASE_URL already includes it
  let cleanEndpoint = endpoint;
  if (endpoint.startsWith('/api/') && API_BASE_URL.includes('/api')) {
    cleanEndpoint = endpoint.replace(/^\/api/, '');
  }
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${cleanEndpoint}`;
  
  // Debug log in development
  if (import.meta.env.DEV && !endpoint.startsWith('http')) {
    console.log('[apiFetch]', {
      originalEndpoint: endpoint,
      cleanEndpoint,
      apiBaseUrl: API_BASE_URL,
      finalUrl: url
    });
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      // Extract error message
      let errorMessage = 'An error occurred';
      
      if (data.message) {
        errorMessage = data.message;
      } else if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
        errorMessage = data.errors[0].msg || data.errors[0].message || errorMessage;
      } else if (data.error) {
        errorMessage = data.error;
      }

      const exception = new ApiException(errorMessage, response.status, data.errors);
      // Preserve SQL error details for debugging
      if (data.sqlMessage) {
        (exception as any).sqlMessage = data.sqlMessage;
      }
      if (data.code) {
        (exception as any).code = data.code;
      }
      throw exception;
    }

    return data;
  } catch (error) {
    if (error instanceof ApiException) {
      throw error;
    }
    throw new ApiException(
      error instanceof Error ? error.message : 'Network error occurred',
      0
    );
  }
}

