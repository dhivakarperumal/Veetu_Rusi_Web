const pool = require('../config/db');
const { getAllOrders } = require('./userFoodOrderController');

// Admin Dashboard — returns stats, recentOrders, topProducts, lowStockAlerts, categoryAnalytics, revenueTrends, regionalSales
exports.getDashboardData = async (req, res) => {
  try {
    // ── Stat Cards ────────────────────────────────────────────────
    let totalRevenue = 0, activeOrders = 0, totalProducts = 0, lowStockCount = 0;
    let totalUsers = 0;
    let totalRestaurants = 0;
    let totalHomeChefs = 0;
    let totalDeliveryPartners = 0;
    let totalOrders = 0;
    let cancelledOrders = 0;
    let deliveredOrdersCount = 0;
    let deliveredOrdersRevenue = 0;

    let franchiseOrdersCount = 0;
    let franchiseDeliveredCount = 0;
    let franchiseCancelledCount = 0;
    let franchiseDeliveredRevenue = 0;
    
    let pendingApprovals = 0;
    let activeFranchises = 0;
    let totalFranchises = 0;

    const currentUserId = req.user?.user_id || 'UNKNOWN';
    const currentIdInt = req.user?.id || -1;
    const isSuperAdmin = req.user?.role === 'superadmin';
    const whereCreatedBy = (!isSuperAdmin) ? "WHERE created_by IN (?, ?)" : "";
    const paramsCreatedBy = (!isSuperAdmin) ? [currentUserId, currentIdInt] : [];

    try {
      const [[rev]] = await pool.execute(
        "SELECT COALESCE(SUM(amount), 0) AS total FROM orders WHERE status = 'Delivered'"
      );
      totalRevenue = parseFloat(rev.total) || 0;
    } catch (_) { }

    try {
      const [[ao]] = await pool.execute(
        "SELECT COUNT(*) AS cnt FROM orders WHERE status NOT IN ('Delivered', 'Cancelled')"
      );
      activeOrders = ao.cnt || 0;
    } catch (_) { }

    try {
      if (isSuperAdmin) {
        const [[tp]] = await pool.execute("SELECT COUNT(*) AS cnt FROM franchise_products");
        totalProducts = tp.cnt || 0;
      } else {
        const [[tp]] = await pool.execute("SELECT COUNT(*) AS cnt FROM franchise_products WHERE franchise_user_id = ? OR created_by = ?", [currentUserId, currentUserId]);
        totalProducts = tp.cnt || 0;
      }
    } catch (_) { }

    try {
      if (isSuperAdmin) {
        const [[ls]] = await pool.execute("SELECT COUNT(*) AS cnt FROM franchise_products WHERE total_stock < 5");
        lowStockCount = ls.cnt || 0;
      } else {
        const [[ls]] = await pool.execute("SELECT COUNT(*) AS cnt FROM franchise_products WHERE total_stock < 5 AND (franchise_user_id = ? OR created_by = ?)", [currentUserId, currentUserId]);
        lowStockCount = ls.cnt || 0;
      }
    } catch (_) { }

    // Users
    try {
      if (isSuperAdmin) {
        const [[row]] = await pool.execute(`
          SELECT COUNT(*) AS total
          FROM users
          WHERE role='user'
        `);
        totalUsers = row.total;
      } else {
        const [[row]] = await pool.execute(`
          SELECT COUNT(DISTINCT u.id) AS total
          FROM users u
          JOIN user_food_order_table o ON u.user_id = o.user_id
          JOIN home_chefs hc ON (o.chef_id = hc.id OR o.chef_user_id = hc.user_id)
          WHERE u.role='user' AND hc.created_by IN (?, ?)
        `, paramsCreatedBy);
        totalUsers = row.total;
      }
    } catch (e) { console.error('Error counting users:', e); }

    // Restaurants
    try {
      const [[row]] = await pool.execute(`
        SELECT COUNT(*) AS total
        FROM restaurants
    `);
      totalRestaurants = row.total;
    } catch (e) { }

    // Home Chefs
    try {
      const [[row]] = await pool.execute(`
        SELECT COUNT(*) AS total
        FROM home_chefs
        ${whereCreatedBy}
    `, paramsCreatedBy);
      totalHomeChefs = row.total;
    } catch (e) { }

    // Delivery Partners
    try {
      const [[row]] = await pool.execute(`
        SELECT COUNT(*) AS total
        FROM delivery_partners
        ${whereCreatedBy}
    `, paramsCreatedBy);
      totalDeliveryPartners = row.total;
    } catch (e) { }

    if (!isSuperAdmin) {
      totalUsers += totalHomeChefs + totalDeliveryPartners;
    }

    // Fetch Orders using the exact same logic as /admin/food-orders/all
    try {
      const orders = await getAllOrders({
        role: req.user?.role,
        userId: req.user?.user_id,
        numericId: req.user?.id
      });
      
      orders.forEach(order => {
        totalOrders++;
        if (order.status === 'Cancelled') {
          cancelledOrders++;
        } else if (order.status === 'Delivered') {
          deliveredOrdersCount++;
          deliveredOrdersRevenue += parseFloat(order.total_amount) || 0;
        }
      });
    } catch (e) { 
      console.error('Error processing orders for dashboard:', e);
    }

    // Fetch Franchise Admin specific product orders (from Chef_Order)
    try {
      let query = "SELECT status, total_amount FROM Chef_Order WHERE 1=1";
      const params = [];
      if (!isSuperAdmin) {
        query += " AND created_by = ?";
        params.push(currentUserId);
      }
      const [franchiseOrders] = await pool.execute(query, params);
      
      franchiseOrders.forEach(order => {
        franchiseOrdersCount++;
        if (order.status === 'Cancelled') {
          franchiseCancelledCount++;
        } else if (order.status === 'Delivered') {
          franchiseDeliveredCount++;
          franchiseDeliveredRevenue += parseFloat(order.total_amount) || 0;
        }
      });
    } catch (e) {
      console.error('Error fetching Chef_Order for franchise:', e);
    }

    const stats = [
      {
        label: "Users",
        value: totalUsers,
        trend: "",
        bg: "bg-blue-50",
        color: "text-blue-600",
      },
      {
        label: "Home Chefs",
        value: totalHomeChefs,
        trend: "",
        bg: "bg-emerald-50",
        color: "text-emerald-600",
      },
      {
        label: "Delivery Partners",
        value: totalDeliveryPartners,
        trend: "",
        bg: "bg-indigo-50",
        color: "text-indigo-600",
      },
      {
        label: "Products",
        value: totalProducts,
        trend: "",
        bg: "bg-amber-50",
        color: "text-amber-600",
      }
    ];

    // ── Recent Orders ─────────────────────────────────────────────
    let recentOrders = [];
    try {
      const [rows] = await pool.execute(
        "SELECT order_id AS id, customer_name AS customer, restaurant_or_chef AS product, amount, status, ordered_date AS date FROM orders ORDER BY ordered_date DESC LIMIT 10"
      );
      recentOrders = rows.map(o => ({
        ...o,
        amount: `₹${parseFloat(o.amount).toLocaleString()}`,
        date: o.date ? new Date(o.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'
      }));
    } catch (_) { }

    // ── Top Products ──────────────────────────────────────────────
    let topProducts = [];
    try {
      let query = "SELECT p.name, p.category AS cat, p.mrp AS rev, p.images AS img, COALESCE(p.total_stock, 0) AS sales FROM franchise_products p";
      const params = [];
      if (!isSuperAdmin) {
        query += " WHERE p.franchise_user_id = ? OR p.created_by = ?";
        params.push(currentUserId, currentUserId);
      }
      query += " ORDER BY p.mrp DESC LIMIT 5";
      
      const [rows] = await pool.execute(query, params);
      topProducts = rows.map(p => ({
        name: p.name,
        cat: p.cat || 'Sarees',
        rev: `₹${parseFloat(p.rev || 0).toLocaleString()}`,
        img: p.img || '/placeholder.jpg',
        sales: p.sales || 0
      }));
    } catch (_) { }

    // ── Low Stock Alerts ──────────────────────────────────────────
    let lowStockAlerts = [];
    try {
      let query = "SELECT name, category AS cat, total_stock AS stock, images AS img FROM franchise_products WHERE total_stock < 5";
      const params = [];
      if (!isSuperAdmin) {
        query += " AND (franchise_user_id = ? OR created_by = ?)";
        params.push(currentUserId, currentUserId);
      }
      query += " ORDER BY total_stock ASC LIMIT 8";

      const [rows] = await pool.execute(query, params);
      lowStockAlerts = rows.map(p => ({
        name: p.name,
        cat: p.cat || 'Sarees',
        stock: p.stock,
        img: p.img || '/placeholder.jpg',
        color: p.stock === 0 ? 'text-red-500' : p.stock < 3 ? 'text-amber-500' : 'text-yellow-500'
      }));
    } catch (_) { }

    // ── Category Analytics ────────────────────────────────────────
    let categoryAnalytics = [];
    try {
      let query = "SELECT category AS name, COUNT(*) AS items, COALESCE(SUM(mrp), 0) AS revenue FROM franchise_products";
      const params = [];
      if (!isSuperAdmin) {
        query += " WHERE franchise_user_id = ? OR created_by = ?";
        params.push(currentUserId, currentUserId);
      }
      query += " GROUP BY category ORDER BY revenue DESC LIMIT 5";

      const [rows] = await pool.execute(query, params);
      const totalRev = rows.reduce((acc, r) => acc + parseFloat(r.revenue), 0) || 1;
      const COLORS = ['bg-blue-500', 'bg-indigo-400', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-400'];
      categoryAnalytics = rows.map((r, i) => ({
        name: r.name,
        items: `${r.items} Products`,
        rev: `₹${parseFloat(r.revenue).toLocaleString()}`,
        pct: Math.round((parseFloat(r.revenue) / totalRev) * 100),
        color: COLORS[i % COLORS.length]
      }));
    } catch (_) { }

    // ── Revenue Trends (last 6 months static seed if no data) ─────
    const revenueTrends = [
      { month: 'Dec', revenue: 28000 },
      { month: 'Jan', revenue: 42000 },
      { month: 'Feb', revenue: 55000 },
      { month: 'Mar', revenue: 47000 },
      { month: 'Apr', revenue: 69000 },
      { month: 'May', revenue: 84000 }
    ];

    // ── Regional Sales (static seed) ──────────────────────────────
    const regionalSales = [
      { state: 'Tamil Nadu', orders: 450, rev: '₹1,24,000', pct: 80, color: 'bg-blue-500' },
      { state: 'Karnataka', orders: 210, rev: '₹58,000', pct: 55, color: 'bg-indigo-400' },
      { state: 'Kerala', orders: 160, rev: '₹41,000', pct: 40, color: 'bg-emerald-500' },
      { state: 'Andhra Pradesh', orders: 110, rev: '₹29,000', pct: 28, color: 'bg-amber-500' }
    ];

    // ── Subscription Status ───────────────────────────────────────
    let subscriptionInfo = { isExpired: false, daysRemaining: null, status: 'Active', franchiseId: null };
    try {
      const email = req.user?.email;
      console.log('Checking subscription for email:', email);
      if (email) {
        const [rows] = await pool.execute(
          'SELECT id, status, start_date, expiry_date FROM franchise_owners WHERE email = ? LIMIT 1',
          [email]
        );
        console.log('Franchise query result:', rows);
        if (rows.length > 0) {
          const franchise = rows[0];
          subscriptionInfo.franchiseId = franchise.id;
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          if (franchise.expiry_date) {
            const expiry = new Date(franchise.expiry_date);
            expiry.setHours(0, 0, 0, 0);
            subscriptionInfo.isExpired = expiry < today;
            if (!subscriptionInfo.isExpired) {
              subscriptionInfo.daysRemaining = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
            }
            console.log('Subscription expiry check:', { isExpired: subscriptionInfo.isExpired, daysRemaining: subscriptionInfo.daysRemaining });
          }
          subscriptionInfo.status = franchise.status;
          subscriptionInfo.expiryDate = franchise.expiry_date;
          subscriptionInfo.startDate = franchise.start_date;
        } else {
          console.log('No franchise owner record found for:', email);
          // Default to showing alert if no franchise found
          subscriptionInfo.isExpired = true;
          subscriptionInfo.status = 'Not Found';
        }
      }
    } catch (err) {
      console.error('Subscription status error:', err);
    }

    res.json({
      cards: {
        totalRevenue,
        totalUsers,
        totalRestaurants,
        totalHomeChefs,
        totalDeliveryPartners,
        totalOrders,
        totalProducts,
        cancelledOrders,
        deliveredOrdersCount,
        deliveredOrdersRevenue,
        pendingApprovals,
        activeFranchises,
        totalFranchises,
        franchiseOrdersCount,
        franchiseDeliveredCount,
        franchiseCancelledCount,
        franchiseDeliveredRevenue
      },

      recentOrders,
      topProducts,
      lowStockAlerts,
      categoryAnalytics,

      charts: {
        revenueAnalytics: revenueTrends,
        dailyOrders: [],
        userGrowth: [],
        ordersByStatus: []
      },

      subscriptionInfo
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ message: 'Error loading admin dashboard.', error: error.message });
  }
};

exports.getChefDashboardData = async (req, res) => {
  try {
    const currentUserId = req.user?.user_id || req.user?.id;
    let totalOrders = 0, menuItems = 0, totalEarnings = 0;

    try {
      // Find orders that have this chef's products in their items
      // For simplicity, since the Chef_Order items json might be complex to parse in SQL, 
      // let's fetch orders and count in JS, or if there's a chef_user_id in chef_products
      const [chefProducts] = await pool.execute('SELECT id FROM chef_products WHERE chef_user_id = ?', [currentUserId]);
      menuItems = chefProducts.length;

      const chefProductIds = new Set(chefProducts.map(p => p.id));

      const [orders] = await pool.execute('SELECT items, total_amount FROM Chef_Order WHERE status = "Delivered"');
      
      orders.forEach(order => {
        let items = [];
        try {
          items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
        } catch(e) {}
        
        let hasChefProduct = false;
        if(items && Array.isArray(items)) {
          for(const item of items) {
            const pid = Number(item.product_id) || Number(item.id);
            if(chefProductIds.has(pid)) {
              hasChefProduct = true;
              break;
            }
          }
        }
        
        if (hasChefProduct) {
          totalOrders++;
          totalEarnings += parseFloat(order.total_amount) || 0;
        }
      });
    } catch(err) {
      console.error('Chef stats error:', err);
    }

    res.json({
      totalOrders,
      menuItems,
      totalEarnings
    });

  } catch (error) {
    console.error('Chef dashboard error:', error);
    res.status(500).json({ message: 'Error loading chef dashboard.', error: error.message });
  }
};
