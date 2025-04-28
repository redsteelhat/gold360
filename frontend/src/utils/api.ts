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
        console.error('401 Unauthorized error, clearing auth data');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Eğer login sayfasında değilsek, login sayfasına yönlendir
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Dummy token ekleme (Test için)
// Bu satırları geliştirme ortamında kullanıp, production'da kaldırın
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development' && !localStorage.getItem('token')) {
  console.log('Setting dummy token for development');
  localStorage.setItem('token', 'dummy-dev-token-for-testing');
  localStorage.setItem('user', JSON.stringify({
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    role: 'admin'
  }));
}

// Korumali API istekleri
const secureApi = {
  get: async (url: string, config = {}) => {
    if (!hasAuthToken()) {
      console.error('No auth token found for secure API request');
      return Promise.reject({ noAuth: true });
    }
    try {
      return await api.get(url, config);
    } catch (error) {
      console.error(`Error in secureApi.get to ${url}:`, error);
      throw error;
    }
  },
  post: async (url: string, data = {}, config = {}) => {
    if (!hasAuthToken()) {
      console.error('No auth token found for secure API request');
      return Promise.reject({ noAuth: true });
    }
    try {
      return await api.post(url, data, config);
    } catch (error) {
      console.error(`Error in secureApi.post to ${url}:`, error);
      throw error;
    }
  },
  put: async (url: string, data = {}, config = {}) => {
    if (!hasAuthToken()) {
      console.error('No auth token found for secure API request');
      return Promise.reject({ noAuth: true });
    }
    try {
      return await api.put(url, data, config);
    } catch (error) {
      console.error(`Error in secureApi.put to ${url}:`, error);
      throw error;
    }
  },
  patch: async (url: string, data = {}, config = {}) => {
    if (!hasAuthToken()) {
      console.error('No auth token found for secure API request');
      return Promise.reject({ noAuth: true });
    }
    try {
      return await api.patch(url, data, config);
    } catch (error) {
      console.error(`Error in secureApi.patch to ${url}:`, error);
      throw error;
    }
  },
  delete: async (url: string, config = {}) => {
    if (!hasAuthToken()) {
      console.error('No auth token found for secure API request');
      return Promise.reject({ noAuth: true });
    }
    try {
      return await api.delete(url, config);
    } catch (error) {
      console.error(`Error in secureApi.delete to ${url}:`, error);
      throw error;
    }
  }
};

export { secureApi };
export default api; 