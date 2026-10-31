const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');

// Get weather for a location (mock implementation - would integrate with weather API)
router.get('/', async (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: { message: 'Latitude and longitude required', status: 400 } });
    }

    // Mock weather data (in production, integrate with OpenWeatherMap or similar API)
    const mockWeatherData = {
      location: {
        lat: parseFloat(lat),
        lng: parseFloat(lng)
      },
      current: {
        temperature: 28,
        feels_like: 30,
        humidity: 75,
        wind_speed: 12,
        wind_direction: 'NE',
        description: 'Nhiều mây',
        icon: 'cloudy',
        visibility: 10,
        pressure: 1013
      },
      forecast: [
        {
          date: new Date().toISOString().split('T')[0],
          temperature_min: 24,
          temperature_max: 32,
          description: 'Nhiều mây',
          icon: 'cloudy',
          humidity: 70,
          wind_speed: 10
        },
        {
          date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          temperature_min: 25,
          temperature_max: 33,
          description: 'Nắng',
          icon: 'sunny',
          humidity: 65,
          wind_speed: 8
        },
        {
          date: new Date(Date.now() + 172800000).toISOString().split('T')[0],
          temperature_min: 26,
          temperature_max: 34,
          description: 'Nắng nóng',
          icon: 'sunny',
          humidity: 60,
          wind_speed: 6
        }
      ],
      alerts: []
    };

    // Check for weather alerts based on conditions
    if (mockWeatherData.current.temperature > 35) {
      mockWeatherData.alerts.push({
        type: 'heat',
        severity: 'high',
        message: 'Cảnh báo nắng nóng: Nhiệt độ cao',
        advice: 'Uống nhiều nước, tránh ra ngoài vào giờ nắng gắt'
      });
    }

    if (mockWeatherData.current.humidity > 85) {
      mockWeatherData.alerts.push({
        type: 'humidity',
        severity: 'medium',
        message: 'Độ ẩm cao',
        advice: 'Cẩn thận với nấm mốc và các vấn đề về hô hấp'
      });
    }

    res.json({ weather: mockWeatherData });
  } catch (error) {
    console.error('Get weather error:', error);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

// Get weather alerts for a region
router.get('/alerts', async (req, res) => {
  try {
    // Mock weather alerts
    const mockAlerts = [
      {
        id: 1,
        type: 'storm',
        severity: 'high',
        region: 'TP. Hồ Chí Minh',
        message: 'Cảnh báo dông',
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 3600000).toISOString(),
        advice: 'Tránh ra ngoài, tìm nơi trú ẩn an toàn'
      }
    ];

    res.json({ alerts: mockAlerts });
  } catch (error) {
    console.error('Get weather alerts error:', error);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

module.exports = router;
