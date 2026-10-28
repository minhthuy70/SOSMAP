const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const pool = require('../config/database');

// Get provinces
router.get('/provinces', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT code, name, name_en, full_name, full_name_en FROM provinces ORDER BY name'
    );
    res.json({ provinces: result.rows });
  } catch (error) {
    console.error('Get provinces error:', error);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

// Get wards by province
router.get('/wards/:provinceCode', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT code, name, name_en, full_name, full_name_en FROM wards WHERE province_code = $1 ORDER BY name',
      [req.params.provinceCode]
    );
    res.json({ wards: result.rows });
  } catch (error) {
    console.error('Get wards error:', error);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

// Reverse geocode (get address from coordinates)
router.get('/reverse-geocode', async (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: { message: 'Latitude and longitude required', status: 400 } });
    }

    // This would typically use a geocoding service
    // For now, return a mock response
    res.json({
      address: 'Mock address from coordinates',
      latitude: parseFloat(lat),
      longitude: parseFloat(lng)
    });
  } catch (error) {
    console.error('Reverse geocode error:', error);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

module.exports = router;
