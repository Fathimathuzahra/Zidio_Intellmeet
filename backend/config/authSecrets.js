const crypto = require('node:crypto');

const SECRET_NAMES = ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];

function isValidSecret(secret) {
  if (typeof secret !== 'string') return false;
  const value = secret.trim();
  return value.length >= 32 && !value.startsWith('replace-with-');
}

function configureAuthSecrets(env = process.env) {
  const isLocalDemo = env.NODE_ENV !== 'production' && env.USE_IN_MEMORY_DB === 'true';

  if (isLocalDemo) {
    for (const name of SECRET_NAMES) {
      if (!isValidSecret(env[name])) {
        env[name] = crypto.randomBytes(32).toString('hex');
      }
    }
    console.warn('Using process-only JWT secrets for local demo mode; sessions expire when the backend restarts.');
  }

  const invalidSecrets = SECRET_NAMES.filter((name) => !isValidSecret(env[name]));
  if (invalidSecrets.length) {
    throw new Error(`${invalidSecrets.join(' and ')} must each be configured with at least 32 characters.`);
  }
  if (env.JWT_ACCESS_SECRET === env.JWT_REFRESH_SECRET) {
    throw new Error('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different.');
  }
}

module.exports = { configureAuthSecrets };
