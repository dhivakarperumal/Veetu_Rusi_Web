const pool = require('../config/db');

function normalizeMessage(message) {
  return String(message || '').toLowerCase().trim();
}

function looksLikeFoodSearch(text) {
  const normalized = normalizeMessage(text);
  if (!normalized) return false;

  if (/(order|cart|coupon|wallet|support|contact|payment|refund|cancel|track|where|status|notification|faq|help|login|signup|register)/.test(normalized)) {
    return false;
  }

  const stopWords = ['hello', 'hi', 'hey', 'thanks', 'thank', 'ok', 'okay', 'yes', 'no', 'what', 'who', 'when', 'how', 'why', 'can', 'could', 'please', 'show', 'give'];
  if (stopWords.includes(normalized)) return false;

  const words = normalized.split(/\s+/).filter(Boolean);
  if (words.length <= 3) {
    return !words.some((word) => word.length <= 2 && !/\d/.test(word));
  }

  return false;
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

  if (/(search|find|look for).*(food|dish|meal|snack|biryani|pizza|burger|rice|chicken)/.test(text) || /(biryani|pizza|burger|chicken|pasta|roll|sandwich|idli|dosa|sambar|parotta|rice|noodles|fried rice|biriyani)/.test(text) || looksLikeFoodSearch(text)) {
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
  // Prefer the food cart used by regular users, fallback to Chef_cart if present
  try {
    const [userFoodRows] = await pool.execute('SELECT * FROM `user_food_cart` WHERE user_id = ? ORDER BY updated_at DESC', [userId]);
    if (userFoodRows && userFoodRows.length) {
      return userFoodRows.map((r) => ({ ...r, source: 'user_food_cart' }));
    }
  } catch (err) {
    console.warn('Chatbot user_food_cart lookup failed:', err.message);
  }

  try {
    const [rows] = await pool.execute('SELECT * FROM `Chef_cart` WHERE user_id = ? ORDER BY updated_at DESC', [userId]);
    return rows.map((r) => ({ ...r, source: 'Chef_cart' }));
  } catch (error) {
    console.warn('Chatbot Chef_cart lookup failed:', error.message);
    return [];
  }
}

async function getActiveCoupons() {
  const [rows] = await pool.execute('SELECT * FROM coupons WHERE status = ? ORDER BY created_at DESC LIMIT 5', ['Active']);
  return rows;
}

async function getNearbyChefs() {
  try {
    const [rows] = await pool.execute('SELECT * FROM home_chefs ORDER BY created_at DESC LIMIT 10');
    const normalized = rows.map((row) => ({
      id: row.id,
      name: row.name || row.full_name || row.chef_name || 'Home Chef',
      city: row.city || row.district || row.area_name || row.location || 'Location not set',
      district: row.district || row.city || '',
      status: row.status || 'Active',
      phone: row.mobile || row.phone || row.contact_number || '',
      email: row.email || '',
    }));
    return normalized.filter((row) => row.name);
  } catch (error) {
    console.warn('Chatbot nearby chefs lookup failed:', error.message);
    return [];
  }
}

function matchesSearchTerm(term, row) {
  const searchTerm = String(term || '').trim().toLowerCase();
  if (!searchTerm) return false;

  const searchTokens = searchTerm.split(/\s+/).filter(Boolean);
  if (!searchTokens.length) return false;

  const searchableValues = Object.values(row || {})
    .filter((value) => typeof value === 'string' || typeof value === 'number' || value === null)
    .map((value) => String(value || '').toLowerCase());

  return searchableValues.some((value) => searchTokens.every((token) => value.includes(token)));
}

async function searchProducts(term) {
  const searchTerm = String(term || '').trim().toLowerCase();
  const results = [];

  const tablesToSearch = [
    { tableName: 'chef_food_table', columns: ['name', 'description', 'category', 'cuisine', 'ingredients', 'dietary_tag', 'instructions', 'variants'] },
    { tableName: 'chef_products', columns: ['name', 'description', 'category', 'product_type', 'subcategory', 'ingredients', 'dietary_tag', 'instructions', 'variants'] },
    { tableName: 'franchise_products', columns: ['name', 'description', 'category', 'product_type', 'subcategory', 'ingredients', 'dietary_tag', 'instructions', 'variants'] },
  ];
  for (const { tableName, columns } of tablesToSearch) {
    try {
      const [rows] = await pool.execute(`SELECT * FROM \`${tableName}\` LIMIT 50`);
      const matchedRows = rows.filter((row) => {
        const values = columns.reduce((acc, column) => {
          acc[column] = row[column];
          return acc;
        }, {});
        return matchesSearchTerm(searchTerm, values);
      }).slice(0, 5);

      results.push(...matchedRows.map((row) => ({ ...row, source: tableName })));
    } catch (error) {
      console.warn(`Chatbot product search failed for ${tableName}:`, error.message);
    }
  }

  return results.slice(0, 10);
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
exports.matchesSearchTerm = matchesSearchTerm;

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
        return res.json({ response: 'Your cart is empty right now. I can help you add something tasty from the menu.', data: [], resultType: 'cart' });
      }

      // Normalize cart items and compute distinct product count
      const normalized = cart.map((item) => {
        const price = Number(item.price ?? item.mrp ?? item.offer_price ?? 0);
        const quantity = Number(item.quantity ?? 1);
        const total_price = Number(item.total_price ?? price * quantity);
        return {
          id: item.id,
          product_id: item.product_id || item.productId || item.product_id,
          name: item.name || item.product_name || item.food_name || item.title || 'Item',
          quantity,
          price,
          total_price,
          source: item.source || null
        };
      });

      const distinctProductIds = new Set(normalized.map((i) => String(i.product_id || i.id || '')).filter(Boolean));
      const totalDistinct = distinctProductIds.size;
      const totalQuantity = normalized.reduce((s, it) => s + (Number(it.quantity) || 0), 0);

      return res.json({
        response: `You have ${totalDistinct} item(s) in your cart (${totalQuantity} unit(s)).`,
        data: normalized.slice(0, 10),
        meta: { totalDistinct, totalQuantity },
        resultType: 'cart'
      });
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
        return res.json({ response: `I could not find anything matching “${term}” right now. Try another dish name such as biryani, pizza, or burger.`, data: [], resultType: 'search' });
      }
      return res.json({ response: `I found ${items.length} matching item(s) for “${term}”.`, data: items.slice(0, 5), resultType: 'search' });
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

// Add all items from the user's cart to their wishlist (idempotent)
exports.addAllCartToWishlist = async (req, res) => {
  try {
    const userId = req.user?.user_id || req.user?.id || req.user?.userId || req.body?.user_id;
    if (!userId) return res.status(401).json({ message: 'Please sign in to use this action.' });

    const cart = await getUserCart(userId);
    if (!cart || !cart.length) {
      return res.json({ message: 'Your cart is empty. Nothing to add to favorites.', inserted: 0, skipped: 0, ids: [] });
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const insertedIds = [];
      let skipped = 0;

      for (const item of cart) {
        const product_id = item.product_id || item.productId || item.productId || item.id;
        if (!product_id) continue;

        const [existing] = await conn.execute('SELECT id FROM wishlist WHERE user_id = ? AND product_id = ?', [userId, product_id]);
        if (existing.length > 0) {
          skipped += 1;
          continue;
        }

        const name = item.name || item.product_name || item.food_name || item.title || null;
        const price = Number(item.price ?? item.mrp ?? item.offer_price ?? 0);
        const total_price = Number(item.total_price ?? price * (item.quantity ?? 1));
        const image = item.image || item.images || null;

        const [result] = await conn.execute(
          'INSERT INTO wishlist (user_id, product_id, variant_color, variant_size, image, email, price, total_price) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [userId, product_id, '', '', image, null, price, total_price]
        );

        insertedIds.push(result.insertId);
      }

      await conn.commit();
      return res.json({ message: `Added ${insertedIds.length} item(s) to favorites.`, inserted: insertedIds.length, skipped, ids: insertedIds });
    } catch (err) {
      await conn.rollback();
      console.error('Error adding cart items to wishlist:', err);
      return res.status(500).json({ message: 'Failed to add items to favorites', error: err.message });
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('addAllCartToWishlist error:', error);
    return res.status(500).json({ message: 'Internal error', error: error.message });
  }
};
