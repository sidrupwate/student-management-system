import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
    baseURL: `${API_URL}/api`,
    headers: {
        Accept: 'application/json',
    },
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            const { data, status } = error.response;

            const normalizedError = {
                message: data?.message || 'Something went wrong. Please try again.',
                fieldErrors: data?.errors || undefined,
                status,
            };

            return Promise.reject(normalizedError);
        }

        if (error.request) {
            return Promise.reject({
                message: 'Cannot reach the server. Please check your connection and try again.',
                fieldErrors: undefined,
                status: undefined,
            });
        }

        return Promise.reject({
            message: error.message || 'An unexpected error occurred.',
            fieldErrors: undefined,
            status: undefined,
        });
    }
);

export default api;
export { API_URL };