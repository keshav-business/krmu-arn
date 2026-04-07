import axios from 'axios';

// Create axios instance with ngrok-compatible headers
const axiosInstance = axios.create({
  headers: {
    // Required for ngrok to allow browser requests
    'ngrok-skip-browser-warning': 'true',
    'User-Agent': 'SecureChat-Frontend'
  }
});

// Add request interceptor to include auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosInstance;
