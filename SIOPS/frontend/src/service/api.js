import axios from 'axios';

// Pastikan menggunakan URL lengkap dari env
const API_URL = process.env.REACT_APP_API_URL || 'https://siops-production.up.railway.app/api';

// Buat instance axios dengan konfigurasi yang benar
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Tambahkan interceptor untuk logging (debugging)
api.interceptors.request.use(request => {
  console.log('Request URL:', request.baseURL + request.url);
  return request;
});

export default api;