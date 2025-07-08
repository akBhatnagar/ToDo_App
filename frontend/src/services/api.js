import axios from 'axios';

// const API_BASE_URL = 'http://192.168.1.238:5757/api';
const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5757/api';


const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Groups API
export const groupsAPI = {
  getAll: () => api.get('/groups'),
  create: (data) => api.post('/groups', data),
  update: (id, data) => api.put(`/groups/${id}`, data),
  delete: (id) => api.delete(`/groups/${id}`),
};

// Todos API
export const todosAPI = {
  getAll: (params = {}) => api.get('/todos', { params }),
  create: (data) => api.post('/todos', data),
  update: (id, data) => api.put(`/todos/${id}`, data),
  delete: (id) => api.delete(`/todos/${id}`),
};

export default api;
