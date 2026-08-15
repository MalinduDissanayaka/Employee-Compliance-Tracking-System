import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface ApiErrorShape {
  message: string | string[];
  error?: string;
  statusCode?: number;
}

export function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError<ApiErrorShape>(error)) {
    const data = error.response?.data;
    if (data?.message) {
      return Array.isArray(data.message) ? data.message.join(', ') : data.message;
    }
    return error.message;
  }
  return 'An unexpected error occurred';
}
