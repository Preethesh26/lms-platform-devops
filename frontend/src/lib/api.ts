import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add token to requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        const userDataString = localStorage.getItem('userData');

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // --- Demo Mode Safeguard ---
        // If the user is logged in as 'demo-admin@academypro.com', block all non-GET requests
        if (userDataString) {
            try {
                const userData = JSON.parse(userDataString);
                const isDemoUser = userData.email === 'demo-admin@academypro.com';
                const isMutation = ['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase() || '');

                // Allow login and me requests even for demo user
                const isLoginOrAuth = config.url?.includes('/auth/login') || config.url?.includes('/auth/me');

                if (isDemoUser && isMutation && !isLoginOrAuth) {
                    // Create a descriptive error for the UI
                    const error: any = new Error('Demo Mode: Changes are not saved in the preview.');
                    error.response = {
                        status: 403,
                        data: { message: 'This is a public demo account. Administrative changes are disabled to protect the live data.' }
                    };
                    return Promise.reject(error);
                }
            } catch (e) {
                // Silently fail if JSON parsing fails
            }
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
        const status = error.response?.status;
        const message = error.response?.data?.message || '';
        const url = error.config?.url || '';

        // If org is inactive — force full logout and redirect to admin login
        if (status === 403 && message === 'Organization is inactive') {
            localStorage.removeItem('token');
            localStorage.removeItem('userData');
            sessionStorage.removeItem('admin_gate_verified_org');
            localStorage.removeItem('admin_last_org_id'); // clear remembered org too
            window.location.href = '/admin/login';
            return Promise.reject(error);
        }

        // Only auto-logout on authentication errors for auth endpoints
        if (status === 401 || status === 403) {
            const isAuthEndpoint = url.includes('/auth/') || url.includes('/me');

            if (isAuthEndpoint && localStorage.getItem('token')) {
                localStorage.removeItem('token');
                localStorage.removeItem('userData');
                sessionStorage.removeItem('admin_gate_verified_org'); // force org ID re-entry

                const isManagementArea = window.location.pathname.startsWith('/admin') ||
                    window.location.pathname.startsWith('/demo');

                window.location.href = isManagementArea ? '/admin/login' : '/login';
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
    adminLogin: (data: { email: string; password: string; organizationId?: string }) =>
        api.post('/auth/admin-login', data),
    getMe: () => api.get('/auth/me'),
    forgotPassword: (data: { email: string }) =>
        api.post('/auth/forgot-password', data),
    resetPassword: (token: string, data: { password: string }) =>
        api.post(`/auth/reset-password/${token}`, data),
    setup2FA: () => api.post('/auth/2fa/setup'),
    enable2FA: (data: { token: string }) => api.post('/auth/2fa/enable', data),
    disable2FA: (data: { password: string }) => api.post('/auth/2fa/disable', data),
    impersonate: (data: { email: string }) => api.post('/auth/impersonate', data),
    masterUnlock: (data: { email: string, token: string }) => api.post('/auth/master-unlock', data),
    verify2FA: (data: { token: string }, tempToken?: string | null) => {
        const config = tempToken ? { headers: { Authorization: `Bearer ${tempToken}` } } : {};
        return api.post('/auth/2fa/verify', data, config);
    }
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
    }),
    createAdmin: (data: { name: string; email: string; password: string }) =>
        api.post('/users/create-admin', data),
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
    createOrder: (data: { courseId: string; couponCode?: string; planType?: 'one_time' | 'subscription'; billingCycle?: 'one_time' | 'monthly' | 'quarterly' | 'yearly' }) => api.post('/payment/create-order', data),
    verifyPayment: (data: { transactionId: string }) =>
        api.post('/payment/verify', data)
};

// Progress API
export const progressAPI = {
    update: (data: { courseId: string; lessonId: string; completed?: boolean; lastPosition?: number; totalDuration?: number }) =>
        api.post('/progress/update', data),
    getCourseProgress: (courseId: string) => api.get(`/progress/${courseId}`),
    getAllProgress: () => api.get('/progress/all'),
    adminUpdateProgress: (data: { userId: string; courseId: string; action: 'complete' | 'reset' }) =>
        api.post('/progress/admin/update-course', data)
};

// Quizzes API
export const quizzesAPI = {
    createQuiz: (data: any) => api.post('/quizzes', data),
    getQuizzes: () => api.get('/quizzes'),
    getQuiz: (id: string) => api.get(`/quizzes/${id}`), // Student view
    getForEdit: (id: string) => api.get(`/quizzes/${id}/edit`), // Admin view
    submit: (id: string, answers: any[]) => api.post(`/quizzes/${id}/submit`, { answers }),
    getAttempts: (id: string) => api.get(`/quizzes/${id}/attempts`),
    update: (id: string, data: any) => api.put(`/quizzes/${id}`, data),
    delete: (id: string) => api.delete(`/quizzes/${id}`)
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
    submit: (id: string, answers: any[], token?: string, proctoring?: { warningsCount: number; events: any[] }) =>
        api.post(`/tests/${id}/submit`, { answers, proctoring }, token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
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



// Upload API
export const uploadAPI = {
    upload: (formData: FormData) => api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    })
};

export default api;
