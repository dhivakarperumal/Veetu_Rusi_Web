const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Ensure videos table exists
async function ensureVideosTable() {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS videos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        videoId LONGTEXT NOT NULL,
        thumbnail LONGTEXT,
        type VARCHAR(50) DEFAULT 'youtube',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
  } catch (err) {
    console.error("Error creating videos table:", err);
  }
}
ensureVideosTable();

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute("SELECT * FROM videos ORDER BY created_at DESC");
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving videos', error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, videoId, thumbnail, type } = req.body;
    const [result] = await pool.execute(
      "INSERT INTO videos (title, videoId, thumbnail, type) VALUES (?, ?, ?, ?)",
      [title, videoId, thumbnail || null, type || 'youtube']
    );
    res.status(201).json({ message: 'Video added', id: result.insertId });
  } catch (error) {
    res.status(500).json({ message: 'Error adding video', error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, videoId, thumbnail, type } = req.body;
    await pool.execute(
      "UPDATE videos SET title = ?, videoId = ?, thumbnail = ?, type = ? WHERE id = ?",
      [title, videoId, thumbnail || null, type || 'youtube', id]
    );
    res.json({ message: 'Video updated' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating video', error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.execute("DELETE FROM videos WHERE id = ?", [id]);
    res.json({ message: 'Video deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting video', error: error.message });
  }
});

module.exports = router;
