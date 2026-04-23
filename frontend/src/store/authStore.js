import { create } from "zustand";

const getStoredUser = () => {
  try {
    const u = localStorage.getItem("ml_user");
    return u ? JSON.parse(u) : null;
  } catch {
    return null;
  }
};

const useAuthStore = create((set) => ({
  token: localStorage.getItem("ml_token") || null,
  user: getStoredUser(),
  isAuthenticated: !!localStorage.getItem("ml_token"),

  login: (token, user) => {
    localStorage.setItem("ml_token", token);
    localStorage.setItem("ml_user", JSON.stringify(user));
    set({ token, user, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem("ml_token");
    localStorage.removeItem("ml_user");
    set({ token: null, user: null, isAuthenticated: false });
  },
}));

export default useAuthStore;
