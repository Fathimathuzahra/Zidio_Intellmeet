import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../store/useAuthStore';

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
  });

  it('should initialize with null user and token', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
  });

  it('should set auth correctly', () => {
    const user = { id: '1', name: 'Test User', email: 'test@example.com', role: 'member' as const };
    const token = 'test-token';
    useAuthStore.getState().setAuth(user, token);
    const state = useAuthStore.getState();
    expect(state.user).toEqual(user);
    expect(state.accessToken).toBe(token);
  });

  it('should clear auth correctly', () => {
    useAuthStore.getState().setAuth({ id: '1', name: 'Test', email: 'test@test.com', role: 'member' }, 'token');
    useAuthStore.getState().clearAuth();
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().accessToken).toBeNull();
  });

  it('should check isAuthenticated', () => {
    expect(useAuthStore.getState().isAuthenticated()).toBe(false);
    useAuthStore.getState().setAuth({ id: '1', name: 'Test', email: 'test@test.com', role: 'member' }, 'token');
    expect(useAuthStore.getState().isAuthenticated()).toBe(true);
  });

  it('should check isAdmin', () => {
    useAuthStore.getState().setAuth({ id: '1', name: 'Admin', email: 'admin@test.com', role: 'admin' }, 'token');
    expect(useAuthStore.getState().isAdmin()).toBe(true);
    expect(useAuthStore.getState().isMember()).toBe(false);
  });

  it('should update user partially', () => {
    useAuthStore.getState().setAuth({ id: '1', name: 'Test', email: 'test@test.com', role: 'member' }, 'token');
    useAuthStore.getState().updateUser({ name: 'Updated Name' });
    expect(useAuthStore.getState().user?.name).toBe('Updated Name');
    expect(useAuthStore.getState().user?.email).toBe('test@test.com');
  });
});
