// src/services/api.js
import { useNotification } from '../composables/useNotification';

let notificationInstance = null;

// Helper to get notification instance (avoid composition API limitations)
const getNotification = () => {
  if (!notificationInstance) {
    // This is a workaround - in a real app, you might use a different pattern
    notificationInstance = useNotification();
  }
  return notificationInstance;
};

// Global fetch wrapper with token handling
export const apiFetch = async (url, options = {}) => {
  const token = localStorage.getItem('authToken');
  
  // Add auth header
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle 401/403 responses (token expired)
    if (response.status === 401 || response.status === 403) {
      handleAuthError('Session expired. Please login again.');
      throw new Error('Session expired');
    }

    const data = await response.json();

    // Check for auth error in response body
    if (data.code === 401 || data.code === 403 || 
        (data.message && (
          data.message.toLowerCase().includes('token') ||
          data.message.toLowerCase().includes('unauthorized')
        ))) {
      handleAuthError(data.message || 'Authentication failed');
      throw new Error(data.message || 'Authentication failed');
    }

    return data;
  } catch (err) {
    // Network errors or other issues
    console.error('API Error:', err);
    throw err;
  }
};

// Handle authentication errors globally
const handleAuthError = (message) => {
  // Clear all auth data
  localStorage.removeItem('authToken');
  localStorage.removeItem('isAuthenticated');
  localStorage.removeItem('userData');
  localStorage.removeItem('rememberMe');
  
  // Save current path for redirect after login
  const currentPath = window.location.pathname;
  if (currentPath !== '/login') {
    sessionStorage.setItem('redirectAfterLogin', currentPath);
  }
  
  // Show notification
  try {
    getNotification().error(message || 'Session expired. Please login again.');
  } catch (e) {
    console.error('Notification error:', e);
  }
  
  // Redirect to login
  setTimeout(() => {
    window.location.href = '/login';
  }, 1500);
};

// Helper for checking token expiration without API call
export const isTokenExpired = (token) => {
  if (!token) return true;
  
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    
    const payload = JSON.parse(atob(parts[1]));
    if (!payload.exp) return false;
    
    return payload.exp * 1000 < Date.now();
  } catch (e) {
    console.error('Error parsing token:', e);
    return true;
  }
};

// Check auth before route navigation (for your router)
export const checkAuthBeforeRoute = (to) => {
  if (to.path === '/login') return true;
  
  const token = localStorage.getItem('authToken');
  if (isTokenExpired(token)) {
    sessionStorage.setItem('redirectAfterLogin', to.path);
    return '/login';
  }
  return true;
};