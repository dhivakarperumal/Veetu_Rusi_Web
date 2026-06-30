const pool = require('../config/db');

function normalizeMessage(message) {
  return String(message || '').toLowerCase().trim();
}

function detectIntent(message) {
  const text = normalizeMessage(message);

  if (/(latest|last).*(order|delivery)/.test(text) || /show my latest order/.test(text)) {
    return { intent: 'latest_order' };
  }

  if (/(where|track|status).*(order|delivery)/.test(text) || /track my order/.test(text) || /where is my order/.test(text)) {
    return { intent: 'track_order' };
  }

  if (/(cart|basket)/.test(text)) {
    return { intent: 'view_cart' };
  }

  if (/(coupon|offer|offers|discount|deal|promo)/.test(text)) {
    return { intent: 'coupons' };
  }

  if (/(nearby|home chef|home chefs|chef near|restaurant near|restaurants)/.test(text)) {
    return { intent: 'nearby_chefs' };
  }

  if (/(search|find|look for).*(food|dish|meal|snack|biryani|pizza|burger|rice|chicken)/.test(text) || /(biryani|pizza|burger|chicken|pasta|roll|sandwich)/.test(text)) {
    return { intent: 'search_food' };
  }

  if (/(payment failed|payment status|payment)/.test(text)) {
    return { intent: 'payment_status' };
  }

  if (/(refund|refund status)/.test(text)) {
    return { intent: 'refund_status' };
  }

  if (/(cancel|cancellation)/.test(text)) {
    return { intent: 'cancel_order' };
  }

  if (/(wallet|balance)/.test(text)) {
    return { intent: 'wallet' };
  }

  if (/(reorder|repeat my last order)/.test(text)) {
    return { intent: 'reorder' };
  }

  if (/(support|help|contact|issue|problem|complaint)/.test(text)) {
    return { intent: 'support' };
  }

  if (/(notification|notifications)/.test(text)) {
    return { intent: 'notifications' };
  }

  if (/(faq|how do|how can|what is)/.test(text)) {
    return { intent: 'faq' };
  }

  return { intent: 'general' };
}

function buildFallbackReply(message) {
  return `I can help with your orders, cart, nearby home chefs, food search, coupons, payments, wallet, and support. Try one of the quick actions or ask me something like “Show my latest order”.`;
}

function extractSearchTerm(message) {
  const words = normalizeMessage(message)
    .split(/\s+/)
    .filter((word) => !['show', 'find', 'search', 'for', 'me', 'my', 'the', 'a', 'an', 'please', 'can', 'you', 'i', 'need'].includes(word));

  return words.slice(0, 4).join(' ').trim() || 'food';
}

async function getUserOrders(userId) {
  if (!userId) return [];
  try {
    const [foodRows] = await pool.execute(
      'SELECT * FROM user_food_order_table WHERE user_id = ? ORDER BY ordered_at DESC LIMIT 5',
      [userId]
    );
    if (foodRows.length) {
      return foodRows.map((row) => ({ ...row, source: 'user_food_order_table' }));
    }
  } catch (error) {
    console.warn('Chatbot user_food_order_table lookup failed:', error.message);
  }

  try {
    const [rows] = await pool.execute(
      'SELECT * FROM Chef_Order WHERE user_id = ? ORDER BY ordered_date DESC LIMIT 5',
      [userId]
    );
    return rows.map((row) => ({ ...row, source: 'Chef_Order' }));
  } catch (error) {
    console.warn('Chatbot Chef_Order lookup failed:', error.message);
    return [];
  }
}

async function getUserCart(userId) {
  if (!userId) return [];
  const [rows] = await pool.execute('SELECT * FROM `Chef_cart` WHERE user_id = ? ORDER BY updated_at DESC', [userId]);
  return rows;
}

async function getActiveCoupons() {
  const [rows] = await pool.execute('SELECT * FROM coupons WHERE status = ? ORDER BY created_at DESC LIMIT 5', ['Active']);
  return rows;
}

async function getNearbyChefs() {
  try {
    const [rows] = await pool.execute('SELECT * FROM home_chefs WHERE status = ? ORDER BY created_at DESC LIMIT 5', ['Active']);
    return rows;
  } catch (error) {
    console.warn('Chatbot nearby chefs lookup failed:', error.message);
    return [];
  }
}

async function searchProducts(term) {
  const likeTerm = `%${term}%`;
  const [chefRows] = await pool.execute('SELECT id, name, price, mrp, images, category FROM chef_products WHERE LOWER(name) LIKE ? LIMIT 5', [likeTerm]);
  const [franchiseRows] = await pool.execute('SELECT id, name, price, mrp, images, category FROM franchise_products WHERE LOWER(name) LIKE ? LIMIT 5', [likeTerm]);
  return [...chefRows, ...franchiseRows];
}

async function getSupportInfo() {
  const [rows] = await pool.execute('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 3');
  return rows;
}

async function getCustomerWallet(userId) {
  if (!userId) return null;
  try {
    const [rows] = await pool.execute('SELECT balance FROM wallet WHERE user_id = ? LIMIT 1', [userId]);
    return rows[0] || null;
  } catch (error) {
    return null;
  }
}

exports.detectIntent = detectIntent;
exports.buildFallbackReply = buildFallbackReply;

exports.handleChatbotMessage = async (req, res) => {
  try {
    const message = req.body?.message || '';
    const userId = req.user?.user_id || req.user?.id || req.user?.userId || req.body?.user_id;

    if (!message) {
      return res.status(400).json({ message: 'Please enter a message.' });
    }

    if (!userId) {
      return res.status(401).json({ message: 'Please sign in to use the chatbot.' });
    }

    const { intent } = detectIntent(message);

    if (intent === 'track_order' || intent === 'latest_order') {
      const orders = await getUserOrders(userId);
      if (!orders.length) {
        return res.json({ response: 'You do not have any recent orders yet. Once you place one, I can help you track it.', data: [] });
      }

      const latest = orders[0];
      return res.json({
        response: `Your latest order ${latest.order_id || ''} is currently ${latest.status || 'processing'}.`,
        data: orders.slice(0, 3)
      });
    }

    if (intent === 'view_cart') {
      const cart = await getUserCart(userId);
      if (!cart.length) {
        return res.json({ response: 'Your cart is empty right now. I can help you add something tasty from the menu.', data: [] });
      }

      const totalItems = cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
      return res.json({ response: `You have ${totalItems} item(s) in your cart.`, data: cart.slice(0, 5) });
    }

    if (intent === 'coupons') {
      const coupons = await getActiveCoupons();
      if (!coupons.length) {
        return res.json({ response: 'There are no active coupons at the moment, but I can still help you explore your favorite dishes.', data: [] });
      }
      return res.json({ response: `I found ${coupons.length} active offer(s) for you.`, data: coupons.slice(0, 5) });
    }

    if (intent === 'nearby_chefs') {
      const chefs = await getNearbyChefs();
      if (!chefs.length) {
        return res.json({ response: 'I could not find any nearby home chefs right now. Please try again later.', data: [] });
      }
      return res.json({ response: `I found ${chefs.length} nearby home chef profile(s) you can explore.`, data: chefs.slice(0, 5) });
    }

    if (intent === 'search_food') {
      const term = extractSearchTerm(message);
      const items = await searchProducts(term);
      if (!items.length) {
        return res.json({ response: `I could not find anything matching “${term}” right now. Try another dish name such as biryani, pizza, or burger.`, data: [] });
      }
      return res.json({ response: `I found ${items.length} matching item(s) for “${term}”.`, data: items.slice(0, 5) });
    }

    if (intent === 'payment_status') {
      const orders = await getUserOrders(userId);
      const latest = orders[0];
      if (!latest) {
        return res.json({ response: 'I do not see a recent order to check payment status for yet.', data: [] });
      }
      return res.json({ response: `Your latest order payment status is ${latest.payment_status || 'pending'}.`, data: [latest] });
    }

    if (intent === 'refund_status') {
      const orders = await getUserOrders(userId);
      const latest = orders[0];
      if (!latest) {
        return res.json({ response: 'I do not see a recent order to check refund status for yet.', data: [] });
      }
      return res.json({ response: `I can help review refund requests for order ${latest.order_id || ''}. Please contact support if you need a manual update.`, data: [latest] });
    }

    if (intent === 'cancel_order') {
      const orders = await getUserOrders(userId);
      const latest = orders[0];
      if (!latest) {
        return res.json({ response: 'You do not have an order to cancel right now.', data: [] });
      }
      return res.json({ response: `I can help with cancellation for order ${latest.order_id || ''}. Your current order status is ${latest.status || 'processing'}.`, data: [latest] });
    }

    if (intent === 'wallet') {
      const wallet = await getCustomerWallet(userId);
      if (!wallet) {
        return res.json({ response: 'I do not see a wallet balance linked to your account in the current records.', data: [] });
      }
      return res.json({ response: `Your available wallet balance is ${Number(wallet.balance || 0).toFixed(2)}.`, data: [wallet] });
    }

    if (intent === 'reorder') {
      const orders = await getUserOrders(userId);
      const latest = orders[0];
      if (!latest) {
        return res.json({ response: 'There is no previous order available to repeat yet.', data: [] });
      }
      return res.json({ response: `I can help you reorder your latest order ${latest.order_id || ''}.`, data: [latest] });
    }

    if (intent === 'support') {
      const supportItems = await getSupportInfo();
      return res.json({ response: 'I can help you contact support. If your issue is urgent, please use the support contact in the app.', data: supportItems });
    }

    if (intent === 'notifications') {
      const notifications = await getSupportInfo();
      if (!notifications.length) {
        return res.json({ response: 'You do not have any notifications right now.', data: [] });
      }
      return res.json({ response: `You have ${notifications.length} notification(s).`, data: notifications });
    }

    if (intent === 'faq') {
      return res.json({ response: 'Common questions I can help with include order tracking, cart items, nearby chefs, coupons, and delivery updates.', data: [] });
    }

    return res.json({ response: buildFallbackReply(message), data: [] });
  } catch (error) {
    console.error('Chatbot controller error:', error);
    return res.status(500).json({ message: 'The chatbot could not answer that request.', error: error.message });
  }
};
