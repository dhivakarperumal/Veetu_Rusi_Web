const pool = require('../config/db');

exports.getAll = async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM home_chef_categorys ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching home_chef_categorys:', err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { CatId, c_name, discripti, image, subcategory, category_type } = req.body;
    const created_by = req.user ? req.user.id : null;
    
    // Convert subcategory array to JSON string
    const subcategoryStr = Array.isArray(subcategory) ? JSON.stringify(subcategory) : subcategory;
    const imageStr = Array.isArray(image) ? JSON.stringify(image) : image;

    const [result] = await pool.execute(
      `INSERT INTO home_chef_categorys (CatId, c_name, discripti, image, subcategory, category_type, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [CatId, c_name, discripti, imageStr, subcategoryStr, category_type || 'Food', created_by]
    );

    res.status(201).json({ message: 'Created successfully', id: result.insertId });
  } catch (err) {
    console.error('Error creating home_chef_category:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'CatId already exists' });
    }
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { CatId, c_name, discripti, image, subcategory, category_type } = req.body;
    const updated_by = req.user ? req.user.id : null;

    const subcategoryStr = Array.isArray(subcategory) ? JSON.stringify(subcategory) : subcategory;
    const imageStr = Array.isArray(image) ? JSON.stringify(image) : image;

    const [result] = await pool.execute(
      `UPDATE home_chef_categorys 
       SET CatId = ?, c_name = ?, discripti = ?, image = ?, subcategory = ?, category_type = ?, updated_by = ?
       WHERE id = ?`,
      [CatId, c_name, discripti, imageStr, subcategoryStr, category_type, updated_by, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Record not found' });
    }

    res.json({ message: 'Updated successfully' });
  } catch (err) {
    console.error('Error updating home_chef_category:', err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.execute('DELETE FROM home_chef_categorys WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Record not found' });
    }

    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    console.error('Error deleting home_chef_category:', err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};
