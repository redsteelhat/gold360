import axios from 'axios';

// API URL'sini çevre değişkeninden al veya varsayılan olarak localhost kullan
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Axios instance oluştur
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Kimlik doğrulama kontrolü
const hasAuthToken = () => {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('token');
};

// İstek interceptor'ı ekle
api.interceptors.request.use(
  (config) => {
    // Tarayıcıda çalışıyorsa ve localStorage erişilebilir ise
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Yanıt interceptor'ı ekle
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // 401 Unauthorized hatası aldığında oturumu sonlandır
    if (error.response && error.response.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Korumali API istekleri
const secureApi = {
  get: async (url: string, config = {}) => {
    if (!hasAuthToken()) {
      return Promise.reject({ noAuth: true });
    }
    return api.get(url, config);
  },
  post: async (url: string, data = {}, config = {}) => {
    if (!hasAuthToken()) {
      return Promise.reject({ noAuth: true });
    }
    return api.post(url, data, config);
  },
  put: async (url: string, data = {}, config = {}) => {
    if (!hasAuthToken()) {
      return Promise.reject({ noAuth: true });
    }
    return api.put(url, data, config);
  },
  patch: async (url: string, data = {}, config = {}) => {
    if (!hasAuthToken()) {
      return Promise.reject({ noAuth: true });
    }
    return api.patch(url, data, config);
  },
  delete: async (url: string, config = {}) => {
    if (!hasAuthToken()) {
      return Promise.reject({ noAuth: true });
    }
    return api.delete(url, config);
  }
};

export { secureApi };
export default api; 