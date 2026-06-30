const test = require('node:test');
const assert = require('node:assert/strict');
const { generateReferralCodeText, normalizeReferralCodeInput } = require('../src/controllers/referralController');

test('generates a valid referral code', () => {
  const code = generateReferralCodeText();
  assert.match(code, /^USER[A-F0-9]{6}$/i);
  assert.strictEqual(code.length, 10);
});

test('normalizes manual referral codes for admin entry', () => {
  assert.strictEqual(normalizeReferralCodeInput('  user-1234  '), 'USER1234');
  assert.strictEqual(normalizeReferralCodeInput('referral code'), 'REFERRALCODE');
  assert.strictEqual(normalizeReferralCodeInput(''), '');
});
