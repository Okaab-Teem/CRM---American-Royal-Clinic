import axios, { AxiosError } from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("flowcrm.token");
  if (token) {
    if (!useMocks && token.startsWith("mock-token-")) {
      localStorage.removeItem("flowcrm.token");
      localStorage.removeItem("flowcrm.user");
      return config;
    }
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string; detail?: string }>) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("flowcrm.token");
      localStorage.removeItem("flowcrm.user");
      if (!window.location.pathname.startsWith("/login")) {
        window.location.assign("/login");
      }
    }
    return Promise.reject(error);
  },
);

export function getApiErrorMessage(error: unknown) {
  if (axios.isAxiosError<{ message?: string; detail?: string; details?: Record<string, string[]> }>(error)) {
    if (error.response?.data?.details) {
      const entries = Object.entries(error.response.data.details);
      if (entries.length > 0) {
        const [field, messages] = entries[0];
        if (messages && messages.length > 0) {
          return `${field}: ${messages[0]}`;
        }
      }
    }
    return error.response?.data?.message ?? error.response?.data?.detail ?? "Unable to complete the request.";
  }
  return "Something went wrong.";
}

export const useMocks = import.meta.env.VITE_USE_MOCKS === "true";
