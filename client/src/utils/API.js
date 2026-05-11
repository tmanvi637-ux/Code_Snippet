import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5100/api',
});

// Attach JWT token to every request if available
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ====== Auth ======
export const registerUser = (data) => API.post('/auth/register', data);
export const loginUser = (data) => API.post('/auth/login', data);

// ====== Snippets ======
export const getPublicSnippets = () => API.get('/snippets/');
export const getMySnippets = () => API.get('/snippets/mine');
export const getSnippetById = (id) => API.get(`/snippets/${id}`);
export const createSnippet = (data) => API.post('/snippets/', data);
export const updateSnippet = (id, data) => API.put(`/snippets/${id}`, data);
export const deleteSnippet = (id) => API.delete(`/snippets/${id}`);
export const forkSnippet = (id) => API.post(`/snippets/fork/${id}`);

export default API;
