import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE,
  timeout: 90000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("ml_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("ml_token");
      localStorage.removeItem("ml_user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;

export const authAPI = {
  register: (email, password) => api.post("/auth/register", { email, password }),
  login: (email, password) => api.post("/auth/login", { email, password }),
};

export const uploadAPI = {
  upload: (formData, onProgress) =>
    api.post("/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: onProgress,
    }),
  getStatus: (uploadId) => api.get(`/uploads/${uploadId}/status`),
  getResult: (resultId) => api.get(`/results/${resultId}`),
  getHistory: () => api.get("/history"),
  health: () => api.get("/health"),
};
