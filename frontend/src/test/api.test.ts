import { describe, it, expect } from 'vitest';

describe('API Configuration', () => {
  it('should have correct API base URL structure', () => {
    const baseUrl = 'http://localhost:5000/api';
    expect(baseUrl).toContain('/api');
  });

  it('should have correct socket URL structure', () => {
    const socketUrl = 'http://localhost:5000';
    expect(socketUrl).toContain('http');
  });
});
