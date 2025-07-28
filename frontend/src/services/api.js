// src/services/api.js
const API_BASE_URL = 'http://localhost:5001/api';

export const getToken = () => {
  return localStorage.getItem('token');
};

export const setToken = (token) => {
  localStorage.setItem('token', token);
};

export const removeToken = () => {
  localStorage.removeItem('token');
};

// Generic fetch wrapper with better error handling
const apiFetch = async (url, options = {}) => {
  const token = getToken();
  const headers = {
    ...(options.headers || {}),
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };

  // Only add Content-Type for non-FormData requests
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      if (response.status === 401) {
        removeToken();
        window.location.href = '/login';
        throw new Error('Session expired. Please log in again.');
      }
      
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Unable to connect to server. Please check if the server is running.');
    }
    throw error;
  }
};

// Auth API calls
export const signup = (email, password) => {
  return apiFetch('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
};

export const login = (email, password) => {
  return apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
};

export const getHomeStats = () => {
  return apiFetch('/auth/stats');
};

export const getProfile = () => {
  return apiFetch('/auth/profile');
};

// NEW: Display name API
export const updateDisplayName = (displayName) => {
  return apiFetch('/auth/display-name', {
    method: 'PUT',
    body: JSON.stringify({ displayName }),
  });
};

// OCR API calls
export const uploadImage = (formData) => {
  const token = getToken();
  return fetch(`${API_BASE_URL}/ocr/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  }).then(async response => {
    if (!response.ok) {
      if (response.status === 401) {
        removeToken();
        window.location.href = '/login';
        throw new Error('Session expired. Please log in again.');
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Upload failed');
    }
    return response.json();
  });
};

export const assignTask = () => {
  return apiFetch('/ocr/assign');
};

export const submitCorrection = (taskId, correctedText) => {
  return apiFetch('/ocr/submit', {
    method: 'POST',
    body: JSON.stringify({ taskId, correctedText }),
  });
};

export const getTaskDetail = (taskId) => {
  return apiFetch(`/ocr/task/${taskId}`);
};

// NEW: History API calls
export const getUserHistory = (page = 1, limit = 10, status = 'all') => {
  return apiFetch(`/ocr/history?page=${page}&limit=${limit}&status=${status}`);
};

export const getUserStats = () => {
  return apiFetch('/ocr/stats');
};

export const getMonthlyProgress = (months = 6) => {
  return apiFetch(`/ocr/progress?months=${months}`);
};

// Add logout function
export const logout = async () => {
  removeToken();
  return Promise.resolve();
};
