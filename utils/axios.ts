import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const api = axios.create({
    baseURL: API_BASE,
    withCredentials: true,  // Send HttpOnly cookies with every request
    headers: {
        'Content-Type': 'application/json',
    },
});

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Just reject the error, let components handle redirects
        return Promise.reject(error);
    }
);
