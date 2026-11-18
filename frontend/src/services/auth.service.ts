import api from "../lib/api";
import { API_URL } from "../lib/config";
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
    });
    return data;
  },

  logout: async () => {
    await api.post("/auth/logout");
  },

  loginWithGoogle: () => {
    window.location.href = `${API_URL}/auth/google`;
  },
};
