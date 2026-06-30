const test = require('node:test');
const assert = require('node:assert/strict');
const { detectIntent, buildFallbackReply, matchesSearchTerm } = require('../src/controllers/chatbotController');

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

test('matches food names from both chef food and product tables', () => {
  assert.equal(matchesSearchTerm('chicken biryani', { name: 'Chicken Biryani', description: 'Spicy rice dish' }), true);
  assert.equal(matchesSearchTerm('idli', { name: 'Idli', cuisine: 'South Indian' }), true);
  assert.equal(matchesSearchTerm('pizza', { name: 'Burger', category: 'Fast Food' }), false);
});
