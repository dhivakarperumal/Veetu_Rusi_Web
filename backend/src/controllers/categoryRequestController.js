const pool = require('../config/db');

const parseArray = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string') return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

exports.create = async (req, res) => {
  const { category_type, c_name, discripti, image, subcategory } = req.body;
  const userId = req.user?.user_id || req.user?.id;
  const categoryName = String(c_name || '').trim();
  const description = String(discripti || '').trim();
  const images = parseArray(image);
  const subcategories = parseArray(subcategory);

  if (!userId) return res.status(401).json({ message: 'Chef account could not be identified.' });
  if (!categoryName || !description || images.length === 0) {
    return res.status(400).json({ message: 'Name, description, and at least one image are required.' });
  }
  if (!['Food', 'food products'].includes(category_type)) {
    return res.status(400).json({ message: 'Invalid category type.' });
  }

  try {
    const [result] = await pool.execute(
      `INSERT INTO home_chef_category_requests
       (category_type, c_name, discripti, image, subcategory, chef_user_id, chef_name)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [category_type, categoryName, description, JSON.stringify(images), JSON.stringify(subcategories), String(userId), req.body.chef_name || req.user?.name || null]
    );
    res.status(201).json({ message: 'Category request submitted for review.', id: result.insertId });
  } catch (err) {
    console.error('Failed to submit category request:', err);
    res.status(500).json({ message: 'Failed to submit category request.' });
  }
};

exports.list = async (_req, res) => {
  try {
    const [requests] = await pool.execute(
      `SELECT id, category_type, c_name, discripti, image, subcategory,
              chef_user_id, chef_name, status, review_note, created_at
       FROM home_chef_category_requests ORDER BY created_at DESC`
    );
    res.json(requests.map((request) => ({
      ...request,
      image: parseArray(request.image),
      subcategory: parseArray(request.subcategory)
    })));
  } catch (err) {
    console.error('Failed to load category requests:', err);
    res.status(500).json({ message: 'Failed to load category requests.' });
  }
};

exports.listMine = async (req, res) => {
  const userId = req.user?.user_id || req.user?.id;
  if (!userId) return res.status(401).json({ message: 'Chef account could not be identified.' });

  try {
    const [requests] = await pool.execute(
      `SELECT r.id, r.category_type, r.c_name, r.discripti, r.image, r.subcategory,
              r.status, r.review_note, r.created_at, r.reviewed_at
       FROM home_chef_category_requests r
       WHERE r.chef_user_id = ?
         AND (r.status <> 'Approved' OR EXISTS (
           SELECT 1 FROM home_chef_categorys c
           WHERE c.id = r.approved_category_id
              OR (r.approved_category_id IS NULL
                  AND BINARY c.c_name = BINARY r.c_name
                  AND BINARY c.discripti = BINARY r.discripti
                  AND BINARY c.category_type = BINARY r.category_type
                  AND BINARY c.image = BINARY r.image
                  AND BINARY c.subcategory = BINARY r.subcategory)
         ))
      ORDER BY r.created_at DESC`,
      [String(userId)]
    );
    res.json(requests.map((request) => ({
      ...request,
      image: parseArray(request.image),
      subcategory: parseArray(request.subcategory)
    })));
  } catch (err) {
    console.error('Failed to load chef category requests:', err);
    res.status(500).json({ message: 'Failed to load your category requests.' });
  }
};

exports.updateMine = async (req, res) => {
  const userId = req.user?.user_id || req.user?.id;
  const { category_type, c_name, discripti, image, subcategory } = req.body;
  const categoryName = String(c_name || '').trim();
  const description = String(discripti || '').trim();
  const images = parseArray(image);
  const subcategories = parseArray(subcategory);

  if (!userId) return res.status(401).json({ message: 'Chef account could not be identified.' });
  if (!categoryName || !description || images.length === 0) {
    return res.status(400).json({ message: 'Name, description, and at least one image are required.' });
  }
  if (!['Food', 'food products'].includes(category_type)) {
    return res.status(400).json({ message: 'Invalid category type.' });
  }

  try {
    const [result] = await pool.execute(
      `UPDATE home_chef_category_requests
       SET category_type = ?, c_name = ?, discripti = ?, image = ?, subcategory = ?
       WHERE id = ? AND chef_user_id = ? AND status = 'Pending'`,
      [category_type, categoryName, description, JSON.stringify(images), JSON.stringify(subcategories), req.params.id, String(userId)]
    );
    if (!result.affectedRows) {
      const [rows] = await pool.execute(
        'SELECT status FROM home_chef_category_requests WHERE id = ? AND chef_user_id = ?',
        [req.params.id, String(userId)]
      );
      if (!rows.length) return res.status(404).json({ message: 'Category request not found.' });
      return res.status(409).json({ message: 'Only pending requests can be edited.' });
    }
    res.json({ message: 'Category request updated.' });
  } catch (err) {
    console.error('Failed to update category request:', err);
    res.status(500).json({ message: 'Failed to update category request.' });
  }
};

exports.deleteMine = async (req, res) => {
  const userId = req.user?.user_id || req.user?.id;
  if (!userId) return res.status(401).json({ message: 'Chef account could not be identified.' });

  try {
    const [result] = await pool.execute(
      `DELETE FROM home_chef_category_requests
       WHERE id = ? AND chef_user_id = ? AND status = 'Pending'`,
      [req.params.id, String(userId)]
    );
    if (!result.affectedRows) {
      const [rows] = await pool.execute(
        'SELECT status FROM home_chef_category_requests WHERE id = ? AND chef_user_id = ?',
        [req.params.id, String(userId)]
      );
      if (!rows.length) return res.status(404).json({ message: 'Category request not found.' });
      return res.status(409).json({ message: 'Only pending requests can be deleted.' });
    }
    res.json({ message: 'Category request deleted.' });
  } catch (err) {
    console.error('Failed to delete category request:', err);
    res.status(500).json({ message: 'Failed to delete category request.' });
  }
};

exports.review = async (req, res) => {
  const { status, review_note } = req.body;
  if (!['Approved', 'Rejected'].includes(status)) {
    return res.status(400).json({ message: 'Review status must be Approved or Rejected.' });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    const [rows] = await connection.execute(
      'SELECT * FROM home_chef_category_requests WHERE id = ? FOR UPDATE',
      [req.params.id]
    );
    const request = rows[0];
    if (!request) {
      await connection.rollback();
      return res.status(404).json({ message: 'Category request not found.' });
    }
    if (request.status !== 'Pending') {
      await connection.rollback();
      return res.status(409).json({ message: 'This category request has already been reviewed.' });
    }

    if (status === 'Approved') {
      const [categories] = await connection.execute('SELECT CatId FROM home_chef_categorys FOR UPDATE');
      const maxNumber = categories.reduce((max, category) => {
        const match = String(category.CatId || '').match(/\d+/);
        return match ? Math.max(max, Number(match[0])) : max;
      }, 0);
      const categoryId = `HC_CAT${String(maxNumber + 1).padStart(3, '0')}`;
      const [insertResult] = await connection.execute(
        `INSERT INTO home_chef_categorys
         (CatId, c_name, discripti, image, subcategory, category_type, created_by, updated_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [categoryId, request.c_name, request.discripti, request.image, request.subcategory, request.category_type, req.user?.user_id || req.user?.id || null, req.user?.user_id || req.user?.id || null]
      );
      await connection.execute(
        'UPDATE home_chef_category_requests SET approved_category_id = ? WHERE id = ?',
        [insertResult.insertId, request.id]
      );
    }

    await connection.execute(
      `UPDATE home_chef_category_requests
       SET status = ?, review_note = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [status, review_note || null, String(req.user?.user_id || req.user?.id || ''), request.id]
    );
    await connection.commit();
    res.json({ message: `Category request ${status.toLowerCase()}.` });
  } catch (err) {
    if (connection) await connection.rollback();
    console.error('Failed to review category request:', err);
    res.status(500).json({ message: 'Failed to review category request.' });
  } finally {
    connection?.release();
  }
};