const crypto = require('crypto');

const DEFAULT_ADMIN_USERNAME = 'admin';
const DEFAULT_ADMIN_PASSWORD = 'admin123';

function normalizeLoginValue(value) {
  return String(value ?? '').trim().toLowerCase();
}

function getAdminCredentials() {
  const username = process.env.ADMIN_USERNAME || DEFAULT_ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;

  return {
    username,
    password,
    usesDefaultCredentials: !process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD
  };
}

function isValidAdminLogin(username, password) {
  const { username: expectedUsername, password: expectedPassword } = getAdminCredentials();

  const normalizedUsername = normalizeLoginValue(username);
  const normalizedExpectedUsername = normalizeLoginValue(expectedUsername);

  if (normalizedUsername !== normalizedExpectedUsername) {
    return false;
  }

  if (typeof password !== 'string' || typeof expectedPassword !== 'string') {
    return false;
  }

  const candidate = Buffer.from(password, 'utf8');
  const expected = Buffer.from(expectedPassword, 'utf8');

  if (candidate.length !== expected.length) {
    return false;
  }

  try {
    return crypto.timingSafeEqual(candidate, expected);
  } catch (error) {
    return false;
  }
}

module.exports = {
  DEFAULT_ADMIN_USERNAME,
  DEFAULT_ADMIN_PASSWORD,
  getAdminCredentials,
  isValidAdminLogin,
  normalizeLoginValue
};
