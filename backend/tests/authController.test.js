const assert = require('node:assert/strict');
const test = require('node:test');
const User = require('../models/User');
const { register } = require('../controllers/authController');

test('public registration always creates a member, even if an admin role is requested', async () => {
  const originalFindOne = User.findOne;
  const originalCreate = User.create;
  const originalAccessSecret = process.env.JWT_ACCESS_SECRET;
  const originalRefreshSecret = process.env.JWT_REFRESH_SECRET;
  let createdUser;
  let responseBody;
  let statusCode;

  process.env.JWT_ACCESS_SECRET = 'test-registration-access-secret';
  process.env.JWT_REFRESH_SECRET = 'test-registration-refresh-secret';
  User.findOne = async () => null;
  User.create = async (data) => {
    createdUser = data;
    return {
      ...data,
      _id: { toString: () => 'new-user-id' },
      tokenVersion: 0,
    };
  };

  const response = {
    status(code) {
      statusCode = code;
      return this;
    },
    cookie() {
      return this;
    },
    json(body) {
      responseBody = body;
      return this;
    },
  };

  try {
    await register({
      body: {
        name: 'New Account',
        email: 'NEW@EXAMPLE.INVALID',
        password: 'LocalCheck-2026!',
        role: 'admin',
      },
    }, response, (error) => {
      throw error;
    });

    assert.equal(statusCode, 201);
    assert.equal(createdUser.email, 'new@example.invalid');
    assert.equal(createdUser.role, 'member');
    assert.equal(responseBody.user.role, 'member');
  } finally {
    User.findOne = originalFindOne;
    User.create = originalCreate;
    if (originalAccessSecret === undefined) delete process.env.JWT_ACCESS_SECRET;
    else process.env.JWT_ACCESS_SECRET = originalAccessSecret;
    if (originalRefreshSecret === undefined) delete process.env.JWT_REFRESH_SECRET;
    else process.env.JWT_REFRESH_SECRET = originalRefreshSecret;
  }
});
