const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const pool = require('../config/database');
const { geocodeAddress, reverseGeocode, calculateDistance } = require('../services/geocoding');

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

    const result = await reverseGeocode(parseFloat(lat), parseFloat(lng));

    if (!result) {
      return res.status(404).json({ error: { message: 'Address not found', status: 404 } });
    }

    res.json({
      address: result.formattedAddress,
      latitude: parseFloat(lat),
      longitude: parseFloat(lng),
      details: result
    });
  } catch (error) {
    console.error('Reverse geocode error:', error);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

// Geocode address (get coordinates from address)
router.get('/geocode', async (req, res) => {
  try {
    const { address } = req.query;

    if (!address) {
      return res.status(400).json({ error: { message: 'Address required', status: 400 } });
    }

    const result = await geocodeAddress(address);

    if (!result) {
      return res.status(404).json({ error: { message: 'Location not found', status: 404 } });
    }

    res.json({
      address: result.formattedAddress,
      latitude: result.latitude,
      longitude: result.longitude,
      details: result
    });
  } catch (error) {
    console.error('Geocode error:', error);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

// Calculate distance between two points
router.get('/distance', async (req, res) => {
  try {
    const { lat1, lon1, lat2, lon2 } = req.query;

    if (!lat1 || !lon1 || !lat2 || !lon2) {
      return res.status(400).json({ error: { message: 'All coordinates required', status: 400 } });
    }

    const distance = calculateDistance(
      parseFloat(lat1),
      parseFloat(lon1),
      parseFloat(lat2),
      parseFloat(lon2)
    );

    res.json({
      distance: distance,
      unit: 'km'
    });
  } catch (error) {
    console.error('Distance calculation error:', error);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

module.exports = router;
