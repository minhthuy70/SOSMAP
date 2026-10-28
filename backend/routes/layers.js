const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const pool = require('../config/database');

// Get all map layers
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM map_layers ORDER BY display_order ASC'
    );
    res.json({ layers: result.rows });
  } catch (error) {
    console.error('Get layers error:', error);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

// Get active layers
router.get('/active', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM map_layers WHERE is_active = true ORDER BY display_order ASC'
    );
    res.json({ layers: result.rows });
  } catch (error) {
    console.error('Get active layers error:', error);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

// Get single layer
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM map_layers WHERE id = $1',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Layer not found', status: 404 } });
    }

    res.json({ layer: result.rows[0] });
  } catch (error) {
    console.error('Get layer error:', error);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

// Create layer (admin only)
router.post('/', [auth, require('../middleware/auth').adminAuth], async (req, res) => {
  try {
    const { name, url, type, attribution, is_active, display_order, options } = req.body;

    const result = await pool.query(
      `INSERT INTO map_layers (name, url, type, attribution, is_active, display_order, options)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [name, url, type, attribution, is_active !== false, display_order || 0, options || {}]
    );

    res.status(201).json({ message: 'Layer created successfully', layer: result.rows[0] });
  } catch (error) {
    console.error('Create layer error:', error);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

// Update layer (admin only)
router.put('/:id', [auth, require('../middleware/auth').adminAuth], async (req, res) => {
  try {
    const { name, url, type, attribution, is_active, display_order, options } = req.body;

    const result = await pool.query(
      `UPDATE map_layers
       SET name = COALESCE($1, name),
           url = COALESCE($2, url),
           type = COALESCE($3, type),
           attribution = COALESCE($4, attribution),
           is_active = COALESCE($5, is_active),
           display_order = COALESCE($6, display_order),
           options = COALESCE($7, options),
           updated_at = NOW()
       WHERE id = $8
       RETURNING *`,
      [name, url, type, attribution, is_active, display_order, options, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Layer not found', status: 404 } });
    }

    res.json({ message: 'Layer updated successfully', layer: result.rows[0] });
  } catch (error) {
    console.error('Update layer error:', error);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

// Delete layer (admin only)
router.delete('/:id', [auth, require('../middleware/auth').adminAuth], async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM map_layers WHERE id = $1 RETURNING *',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Layer not found', status: 404 } });
    }

    res.json({ message: 'Layer deleted successfully' });
  } catch (error) {
    console.error('Delete layer error:', error);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

// Toggle layer active status (admin only)
router.patch('/:id/toggle', [auth, require('../middleware/auth').adminAuth], async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE map_layers
       SET is_active = NOT is_active,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Layer not found', status: 404 } });
    }

    res.json({ message: 'Layer status toggled successfully', layer: result.rows[0] });
  } catch (error) {
    console.error('Toggle layer error:', error);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

module.exports = router;
