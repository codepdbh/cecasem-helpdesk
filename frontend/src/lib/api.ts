import axios from 'axios';

export const API_BASE_URL =
  normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL || '/api');
export const SERVER_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '') || '';

export const api = axios.create({ baseURL: API_BASE_URL, timeout: 20000 });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cecasem_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function dataOf<T>(response: { data: { data: T } }): T {
  return response.data.data;
}

export function fileUrl(path?: string): string | undefined {
  return path ? `${SERVER_BASE_URL}${path}` : undefined;
}

export function errorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || 'No se pudo completar la solicitud.';
  }
  return 'Ocurrio un error inesperado.';
}

export async function downloadFile(path: string, filename: string): Promise<void> {
  const response = await api.get(path, { responseType: 'blob' });
  const url = URL.createObjectURL(response.data);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function normalizeApiBaseUrl(value: string): string {
  return value.trim().replace(/\/+$/, '');
}
