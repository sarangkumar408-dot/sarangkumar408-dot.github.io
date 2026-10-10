const test = require('node:test');
const assert = require('node:assert/strict');

const { getAdminCredentials, isValidAdminLogin } = require('../lib/security');

test('admin credentials resolve from environment or defaults', () => {
  const creds = getAdminCredentials();
  assert.ok(creds.username);
  assert.ok(creds.password);
  assert.equal(typeof creds.username, 'string');
  assert.equal(typeof creds.password, 'string');
});

test('admin login accepts the configured credentials and rejects invalid values', () => {
  const creds = getAdminCredentials();
  assert.equal(isValidAdminLogin(creds.username, creds.password), true);
  assert.equal(isValidAdminLogin('wrong-user', 'wrong-pass'), false);
});
