const test = require('node:test');
const assert = require('node:assert/strict');

process.env.JWT_ACCESS_SECRET = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
const { signAccessToken, verifyAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/tokens');

test('access tokens retain the authenticated user and role', () => {
  const token = signAccessToken({ id: 'user-123', role: 'admin' });
  const payload = verifyAccessToken(token);
  assert.equal(payload.sub, 'user-123');
  assert.equal(payload.role, 'admin');
});

test('refresh tokens retain token version for session invalidation', () => {
  const token = signRefreshToken('user-456', 3);
  const payload = verifyRefreshToken(token);
  assert.equal(payload.sub, 'user-456');
  assert.equal(payload.tokenVersion, 3);
});
