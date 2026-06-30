const test = require('node:test');
const assert = require('node:assert/strict');
const { detectIntent, buildFallbackReply } = require('../src/controllers/chatbotController');

test('detects order tracking intent', () => {
  assert.equal(detectIntent('Where is my order?').intent, 'track_order');
});

test('detects food search intent', () => {
  assert.equal(detectIntent('Find chicken biryani').intent, 'search_food');
});

test('builds a polite fallback reply', () => {
  const reply = buildFallbackReply('Show my wallet');
  assert.match(reply, /wallet/i);
});
