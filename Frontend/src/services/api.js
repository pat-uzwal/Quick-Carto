import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add the auth token header to requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        
        // Skip auth for public endpoints to prevent 401 errors on expired tokens
        const isPublicEndpoint = config.url && (
            config.url.startsWith('products') || 
            config.url.startsWith('categories') ||
            config.url.startsWith('offers')
        );

        if (token && !isPublicEndpoint) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If error is 401 and we haven't tried to refresh yet
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refreshToken');
                if (!refreshToken) {
                    // No refresh token, force logout
                    localStorage.removeItem('accessToken');
                    window.location.href = '/login';
                    return Promise.reject(error);
                }

                // Try to get a new access token
                const res = await axios.post(`${api.defaults.baseURL}auth/refresh/`, {
                    refresh: refreshToken,
                });

                if (res.data?.access) {
                    localStorage.setItem('accessToken', res.data.access);
                    // Update original request header and retry
                    originalRequest.headers.Authorization = `Bearer ${res.data.access}`;
                    api.defaults.headers.common['Authorization'] = `Bearer ${res.data.access}`;
                    return api(originalRequest);
                }
            } catch (refreshError) {
                // Refresh failed, force logout
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
