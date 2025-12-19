import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add token to requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Handle response errors (auto-logout on 401/403)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Only auto-logout on authentication errors, not on permission errors
        // For example, students getting 401 on /users is expected and shouldn't log them out
        if (error.response?.status === 401 || error.response?.status === 403) {
            const url = error.config?.url || '';

            // Only logout if it's an auth-related endpoint (not /users, /courses, etc.)
            // This prevents students from being logged out when they can't access admin endpoints
            const isAuthEndpoint = url.includes('/auth/') || url.includes('/me');

            if (isAuthEndpoint && localStorage.getItem('token')) {
                localStorage.removeItem('token');
                localStorage.removeItem('userData');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    register: (data: { email: string; password: string; enrollment?: string; role?: string }) =>
        api.post('/auth/register', data),
    login: (data: { email: string; password: string }) =>
        api.post('/auth/login', data),
    getMe: () => api.get('/auth/me'),
    forgotPassword: (data: { email: string }) =>
        api.post('/auth/forgot-password', data),
    resetPassword: (token: string, data: { password: string }) =>
        api.post(`/auth/reset-password/${token}`, data)
};

// Courses API
export const coursesAPI = {
    getAll: () => api.get('/courses'),
    getOne: (id: string) => api.get(`/courses/${id}`),
    create: (data: any) => api.post('/courses', data),
    update: (id: string, data: any) => api.put(`/courses/${id}`, data),
    delete: (id: string) => api.delete(`/courses/${id}`)
};

// Users API
export const usersAPI = {
    getAll: () => api.get('/users'),
    getOne: (id: string) => api.get(`/users/${id}`),
    update: (id: string, data: any) => api.put(`/users/${id}`, data),
    delete: (id: string) => api.delete(`/users/${id}`),
    enroll: (userId: string, courseId: string) =>
        api.post(`/users/${userId}/enroll`, { courseId }),
    bulkUpload: (formData: FormData) => api.post('/users/bulk-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    })
};

// Support API
export const supportAPI = {
    contactAdmin: (data: { name: string; email: string; message: string; subject?: string }) =>
        api.post('/support/contact-admin', data),
    getTickets: () => api.get('/support'),
    updateTicket: (id: string, data: { status: string }) => api.put(`/support/${id}`, data)
};

// Payment API
export const paymentAPI = {
    createOrder: (courseId: string) => api.post('/payment/create-order', { courseId }),
    verifyPayment: (data: { transactionId: string }) =>
        api.post('/payment/verify', data)
};

// Progress API
export const progressAPI = {
    update: (data: { courseId: string; lessonId: string; completed?: boolean; lastPosition?: number; totalDuration?: number }) =>
        api.post('/progress/update', data),
    getCourseProgress: (courseId: string) => api.get(`/progress/${courseId}`)
};

// Quizzes API
export const quizzesAPI = {
    createQuiz: (data: any) => api.post('/quizzes', data),
    getQuizzes: () => api.get('/quizzes'),
    getQuiz: (id: string) => api.get(`/quizzes/${id}`), // Student view
    getForEdit: (id: string) => api.get(`/quizzes/${id}/edit`), // Admin view
    submit: (id: string, answers: any[]) => api.post(`/quizzes/${id}/submit`, { answers }),
    getAttempts: (id: string) => api.get(`/quizzes/${id}/attempts`)
};

// Tests API (Standalone Test System)
export const testsAPI = {
    // Admin endpoints
    create: (data: any) => api.post('/tests', data),
    getAll: () => api.get('/tests'),
    getOne: (id: string) => api.get(`/tests/${id}`),
    update: (id: string, data: any) => api.put(`/tests/${id}`, data),
    delete: (id: string) => api.delete(`/tests/${id}`),
    togglePublish: (id: string) => api.put(`/tests/${id}/publish`),
    getStats: (id: string) => api.get(`/tests/${id}/stats`),
    sendInvitations: (id: string) => api.post(`/tests/${id}/send-invitations`),
    // User endpoints
    getAttempts: (id: string) => api.get(`/tests/${id}/attempts`),
    authenticate: (slug: string, email: string, accessPassword?: string) =>
        api.post(`/tests/${slug}/authenticate`, { email, password: accessPassword }),
    getBySlug: (slug: string) => api.get(`/tests/access/${slug}`),
    submit: (id: string, answers: any[], token?: string) =>
        api.post(`/tests/${id}/submit`, { answers }, token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
    getResult: (id: string, token?: string) =>
        api.get(`/tests/${id}/result`, token ? { headers: { Authorization: `Bearer ${token}` } } : {})
};

// Settings API
export const settingsAPI = {
    getAll: () => api.get('/settings'),
    update: (data: any) => api.put('/settings', data)
};

// Certificate API
export const certificateAPI = {
    download: (courseId: string) => api.get(`/certificate/${courseId}?t=${Date.now()}`, { responseType: 'blob' })
};

export default api;
