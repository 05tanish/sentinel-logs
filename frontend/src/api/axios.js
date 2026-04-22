import axios from 'axios';

const api = axios.create({
  // use current origin so it works in both dev and production
  baseURL: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:4000',
});

// attach token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// redirect to login on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.clear();
      window.location.href = '/';
    }
    return Promise.reject(err);
  }
);

export default api;
