import axios from 'axios';

const api = axios.create({ baseURL: (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api' });

// attach the JWT to every request
api.interceptors.request.use((c) => {
  const t = localStorage.getItem('token');
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});
// expired/invalid token -> back to login
api.interceptors.response.use((r) => r, (e) => {
  if (e.response?.status === 401 && !e.config.url.includes('/auth/login')) {
    localStorage.clear();
    window.location.href = '/login';
  }
  return Promise.reject(e);
});

export const errMsg = (e) => {
  const d = e.response?.data;
  return d?.errors?.length ? `${d.message}: ${d.errors.join(', ')}` : d?.message || e.message;
};
export const money = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
export default api;
