import axios from 'axios';
import Cookies from 'js-cookie';

const COOKIE_OPTIONS = {
  secure: true,
  sameSite: 'lax' as const,
  path: '/',
};

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3837/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('accessToken');
    if (token && token.startsWith('mock-')) {
      config.adapter = async () => {
        if (config.url?.includes('/auth/me')) {
          return {
            data: {
              data: {
                id: 'doneto-mock-admin-id',
                email: 'doneto@example.com',
                name: 'Doneto Admin',
                role: 'Admin',
                isVerified: true,
              }
            },
            status: 200,
            statusText: 'OK',
            headers: {},
            config,
          };
        }
        if (config.url?.includes('/auth/refresh')) {
          return {
            data: {
              accessToken: token,
              refreshToken: 'mock-refresh-token',
            },
            status: 200,
            statusText: 'OK',
            headers: {},
            config,
          };
        }
        return {
          data: {
            data: [],
            total: 0,
            page: 1,
            lastPage: 1
          },
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        };
      };
    } else if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Avoid infinite loop if refresh token request itself fails with 401
    if (error.response?.status === 401 && originalRequest.url?.includes('/auth/refresh')) {
      handleLogout();
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = Cookies.get('refreshToken');
      if (!refreshToken) {
        isRefreshing = false;
        handleLogout();
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          {},
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${refreshToken}`,
            },
          }
        );
        const resData = response.data.data || response.data;
        const { accessToken, refreshToken: newRefreshToken } = resData;
        Cookies.set('accessToken', accessToken, COOKIE_OPTIONS);
        if (newRefreshToken) {
          Cookies.set('refreshToken', newRefreshToken, COOKIE_OPTIONS);
        }

        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        processQueue(null, accessToken);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        handleLogout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

function handleLogout() {
  Cookies.remove('accessToken', COOKIE_OPTIONS);
  Cookies.remove('refreshToken', COOKIE_OPTIONS);
  if (typeof window !== 'undefined') {
    window.location.href = '/';
  }
}

export default api;
