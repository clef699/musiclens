import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE,
  timeout: 300000, // 5 min — large file uploads + long analysis
});

export default api;

export const uploadAPI = {
  upload: (formData, onProgress) =>
    api.post("/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: onProgress,
    }),
  // Single endpoint: returns { job_id, status, progress_message, result }
  getJobStatus: (jobId) => api.get(`/results/${jobId}`),
  health: () => api.get("/health"),
};
