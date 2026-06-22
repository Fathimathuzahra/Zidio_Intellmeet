import api from "@/lib/api";



export const userService = {
  updateProfile: (data: { name?: string; bio?: string; avatarUrl?: string }) =>
    api.put('/users/me', data),
  
  updatePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put('/users/me/password', data),
  
  deleteAccount: () =>
    api.delete('/users/me'),
  
};