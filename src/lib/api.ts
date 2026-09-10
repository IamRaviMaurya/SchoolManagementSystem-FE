import axios from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://sms-backend-f8hn.onrender.com/api/v1";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    const tenantId = localStorage.getItem("tenant_id");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (tenantId) {
      config.headers["X-Tenant-ID"] = tenantId;
    }
  }
  return config;
});

// Expired / invalid session: clear local state and return to the correct login page.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (typeof window !== "undefined" && err?.response?.status === 401) {
      const isLoginCall = String(err.config?.url || "").includes("/auth/login");
      if (!isLoginCall) {
        const slug = localStorage.getItem("tenant_slug");
        const role = localStorage.getItem("userRole");
        ["token", "username", "userRole", "fullName", "assignedClass", "assignedSection", "teacherId", "studentId", "grNo"]
          .forEach((k) => localStorage.removeItem(k));
        window.location.href = role === "SUPER_ADMIN" || !slug ? "/login" : `/${slug}/login`;
      }
    }
    return Promise.reject(err);
  }
);

export default api;
