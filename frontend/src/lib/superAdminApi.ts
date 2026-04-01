// ============================================================
// SUPER ADMIN API
// API calls for the Super Admin triple-step auth and org management
// ============================================================

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({ baseURL: API_URL });

// Attach JWT token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('superadmin_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// ── Triple-step auth ──────────────────────────────────────

// Step 1: Verify secret key
export const step1 = (secretKey: string) =>
    api.post('/superadmin/auth/step1', { secretKey });

// Step 2: Verify passphrase
export const step2 = (stepToken: string, passphrase: string) =>
    api.post('/superadmin/auth/step2', { stepToken, passphrase });

// Step 3: Verify email + password, get full JWT
export const step3 = (stepToken: string, email: string, password: string) =>
    api.post('/superadmin/auth/step3', { stepToken, email, password });

// ── Organization management ───────────────────────────────

export const getOrganizations = () =>
    api.get('/superadmin/organizations');

export const createOrganization = (data: {
    name: string;
    adminEmail: string;
    adminPassphrase: string;
    adminName?: string;
    adminPassword?: string;
}) => api.post('/superadmin/organizations', data);

export const updateOrganization = (id: string, data: {
    isActive?: boolean;
    adminPassphrase?: string;
    name?: string;
}) => api.put(`/superadmin/organizations/${id}`, data);

export const getOrgStats = (id: string) =>
    api.get(`/superadmin/organizations/${id}/stats`);

export const getAllUsers = (orgId?: string) =>
    api.get('/superadmin/users', { params: orgId ? { orgId } : {} });

// ── Organization detail operations ────────────────────────

export const deleteOrganization = (id: string) =>
    api.delete(`/superadmin/organizations/${id}`);

export const getOrgUsers = (id: string) =>
    api.get(`/superadmin/organizations/${id}/users`);

export const createOrgUser = (id: string, data: {
    name: string; email: string; password: string; role?: string; enrollment?: string;
}) => api.post(`/superadmin/organizations/${id}/users`, data);

export const updateOrgUser = (orgId: string, userId: string, data: {
    name?: string; email?: string; role?: string; password?: string;
}) => api.put(`/superadmin/organizations/${orgId}/users/${userId}`, data);

export const deleteOrgUser = (orgId: string, userId: string) =>
    api.delete(`/superadmin/organizations/${orgId}/users/${userId}`);

export const getOrgCourses = (id: string) =>
    api.get(`/superadmin/organizations/${id}/courses`);
