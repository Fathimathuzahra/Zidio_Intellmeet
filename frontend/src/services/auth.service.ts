import api from "../lib/api";
import type { AuthResponse, LoginCredentials, RegisterCredentials } from "../types/auth";
import type { User } from "../types/user";

export const authService = {
  getMe: async (): Promise<User> => {
    const { data } = await api.get<User>("/users/me");
    return data;
  },

  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>("/auth/login", credentials);
    return data;
  },

  register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>("/auth/register", {
      name: credentials.name,
      email: credentials.email,
      password: credentials.password,
      role: credentials.role,
    });
    return data;
  },

  logout: async () => {
    await api.post("/auth/logout");
  },

  loginWithGoogle: () => {
    const base = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    window.location.href = `${base}/auth/google`;
  },
};
