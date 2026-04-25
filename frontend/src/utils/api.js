import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE,
  timeout: 90000,
});

export default api;

export const uploadAPI = {
  upload: (formData, onProgress) =>
    api.post("/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: onProgress,
    }),
  getStatus: (uploadId) => api.get(`/uploads/${uploadId}/status`),
  getResult: (resultId) => api.get(`/results/${resultId}`),
  health: () => api.get("/health"),
};
