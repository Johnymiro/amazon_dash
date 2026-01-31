import { api } from './axios';
import type { User, LoginCredentials, RegisterData } from '../types/auth';

export const authApi = {
    // Login - sets HttpOnly cookie automatically
    login: async (credentials: LoginCredentials): Promise<User> => {
        const { data } = await api.post<User>('/auth/login', credentials);
        return data;
    },

    // Register new user
    register: async (userData: RegisterData): Promise<User> => {
        const { data } = await api.post<User>('/auth/register', userData);
        return data;
    },

    // Get current user (validates HttpOnly cookie)
    me: async (): Promise<User> => {
        const { data } = await api.get<User>('/auth/me');
        return data;
    },

    // Logout - clears HttpOnly cookie
    logout: async (): Promise<void> => {
        await api.post('/auth/logout');
    },
};
