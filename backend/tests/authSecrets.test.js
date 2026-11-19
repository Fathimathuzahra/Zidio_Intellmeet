const assert = require('node:assert/strict');
const test = require('node:test');
const { configureAuthSecrets } = require('../config/authSecrets');

test('local development generates distinct strong process-only JWT secrets', () => {
  const env = { NODE_ENV: 'development' };
  configureAuthSecrets(env);

  assert.equal(env.JWT_ACCESS_SECRET.length, 64);
  assert.equal(env.JWT_REFRESH_SECRET.length, 64);
  assert.notEqual(env.JWT_ACCESS_SECRET, env.JWT_REFRESH_SECRET);

  const accessSecret = env.JWT_ACCESS_SECRET;
  configureAuthSecrets(env);
  assert.equal(env.JWT_ACCESS_SECRET, accessSecret);
});

test('production startup rejects missing or reused JWT secrets', () => {
  assert.throws(
    () => configureAuthSecrets({ NODE_ENV: 'production' }),
    /JWT_ACCESS_SECRET and JWT_REFRESH_SECRET/
  );
  assert.throws(
    () => configureAuthSecrets({
      NODE_ENV: 'production',
      JWT_ACCESS_SECRET: 'a'.repeat(32),
      JWT_REFRESH_SECRET: 'a'.repeat(32),
    }),
    /must be different/
  );
});
