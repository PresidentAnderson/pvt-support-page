// API Configuration and Helper Functions
const API_BASE_URL = window.location.origin + '/api';

// Token management
const tokenManager = {
  getToken: () => localStorage.getItem('authToken'),
  setToken: (token) => localStorage.setItem('authToken', token),
  getRefreshToken: () => localStorage.getItem('refreshToken'),
  setRefreshToken: (token) => localStorage.setItem('refreshToken', token),
  removeTokens: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
  }
};

// API helper class
class API {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Generic fetch wrapper with authentication
  async fetch(endpoint, options = {}) {
    const token = tokenManager.getToken();
    
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, config);
      
      // Handle token refresh if unauthorized
      if (response.status === 401 && tokenManager.getRefreshToken()) {
        const refreshed = await this.refreshToken();
        if (refreshed) {
          // Retry the original request with new token
          config.headers.Authorization = `Bearer ${tokenManager.getToken()}`;
          const retryResponse = await fetch(`${this.baseURL}${endpoint}`, config);
          return await this.handleResponse(retryResponse);
        }
      }
      
      return await this.handleResponse(response);
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Handle API response
  async handleResponse(response) {
    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');
    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const error = (data && data.message) || response.statusText;
      throw new Error(error);
    }

    return data;
  }

  // Refresh authentication token
  async refreshToken() {
    try {
      const refreshToken = tokenManager.getRefreshToken();
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });

      if (response.ok) {
        const data = await response.json();
        tokenManager.setToken(data.token);
        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }

    // Clear tokens and redirect to login
    tokenManager.removeTokens();
    window.location.href = '/login.html';
    return false;
  }

  // Authentication endpoints
  async register(userData) {
    const response = await this.fetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    
    if (response.token) {
      tokenManager.setToken(response.token);
      tokenManager.setRefreshToken(response.refreshToken);
    }
    
    return response;
  }

  async login(email, password) {
    const response = await this.fetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    
    if (response.token) {
      tokenManager.setToken(response.token);
      tokenManager.setRefreshToken(response.refreshToken);
    }
    
    return response;
  }

  async logout() {
    await this.fetch('/auth/logout', { method: 'POST' });
    tokenManager.removeTokens();
    window.location.href = '/';
  }

  async getCurrentUser() {
    return await this.fetch('/auth/me');
  }

  // MAC Requests endpoints
  async getMacRequests(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return await this.fetch(`/mac-requests${queryString ? '?' + queryString : ''}`);
  }

  async getMacRequest(id) {
    return await this.fetch(`/mac-requests/${id}`);
  }

  async createMacRequest(data) {
    return await this.fetch('/mac-requests', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateMacRequest(id, data) {
    return await this.fetch(`/mac-requests/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteMacRequest(id) {
    return await this.fetch(`/mac-requests/${id}`, {
      method: 'DELETE'
    });
  }

  // Support Tickets endpoints
  async getSupportTickets() {
    return await this.fetch('/support/tickets');
  }

  async createSupportTicket(data) {
    return await this.fetch('/support/tickets', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Chat endpoints
  async getChatMessages(ticketId) {
    return await this.fetch(`/support/chat/${ticketId}`);
  }

  async sendChatMessage(data) {
    return await this.fetch('/support/chat', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // System Status endpoints
  async getSystemStatus() {
    return await this.fetch('/system/status');
  }

  async updateSystemStatus(id, data) {
    return await this.fetch(`/system/status/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  // User endpoints
  async getUsers() {
    return await this.fetch('/users');
  }

  async updateProfile(data) {
    return await this.fetch('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }
}

// Create global API instance
window.api = new API();

// Check authentication on page load
document.addEventListener('DOMContentLoaded', async () => {
  if (tokenManager.getToken()) {
    try {
      const user = await api.getCurrentUser();
      if (user && user.user) {
        // Update UI with user info
        updateUserInterface(user.user);
      }
    } catch (error) {
      console.error('Failed to get current user:', error);
      // Clear invalid tokens
      tokenManager.removeTokens();
    }
  }
});

// Update UI based on user authentication
function updateUserInterface(user) {
  // Show/hide elements based on auth status
  document.querySelectorAll('.auth-required').forEach(el => {
    el.style.display = user ? 'block' : 'none';
  });
  
  document.querySelectorAll('.guest-only').forEach(el => {
    el.style.display = user ? 'none' : 'block';
  });
  
  // Update user-specific content
  if (user) {
    document.querySelectorAll('.user-name').forEach(el => {
      el.textContent = `${user.firstName} ${user.lastName}`;
    });
    
    document.querySelectorAll('.user-email').forEach(el => {
      el.textContent = user.email;
    });
    
    document.querySelectorAll('.user-organization').forEach(el => {
      el.textContent = user.organization ? user.organization.name : 'No Organization';
    });
  }
}