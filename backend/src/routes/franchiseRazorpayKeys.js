const express = require('express');
const pool = require('../config/db');
const controller = require('../controllers/franchiseRazorpayKeysController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(verifyToken);
router.use(requireRole(['admin']));
router.use(async (req, res, next) => {
  try {
    const email = req.user?.email || '';
    const userId = req.user?.user_id || '';
    if (!email && !userId) return res.status(403).json({ message: 'Franchise admin authentication required.' });

    const [owners] = await pool.execute(
      `SELECT id, franch_user_id
       FROM franchise_owners
       WHERE (email = ? AND ? <> '') OR (franch_user_id = ? AND ? <> '')
       LIMIT 1`,
      [email, email, userId, userId]
    );
    if (!owners.length) return res.status(403).json({ message: 'Franchise admin authentication required.' });
    req.franchiseOwner = owners[0];
    next();
  } catch (error) {
    res.status(500).json({ message: 'Unable to verify franchise admin access.' });
  }
});

router.get('/', controller.list);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.patch('/:id/status', controller.setStatus);
router.delete('/:id', controller.remove);

module.exports = router;