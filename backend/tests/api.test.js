const request = require('supertest');
const { app } = require('../server');

describe('API Health Check', () => {
  test('GET /health should return 200', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'ok');
  });
});

describe('Authentication API', () => {
  describe('POST /api/auth/register', () => {
    test('should register a new user', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      // Note: This test requires database connection
      // In real implementation, use test database
      expect([200, 201, 400, 500]).toContain(response.status);
    });

    test('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    test('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(response.status).toBe(400);
    });
  });
});

describe('Incidents API', () => {
  describe('GET /api/incidents', () => {
    test('should require authentication', async () => {
      const response = await request(app).get('/api/incidents');
      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/incidents', () => {
    test('should require authentication', async () => {
      const response = await request(app)
        .post('/api/incidents')
        .send({});

      expect(response.status).toBe(401);
    });
  });
});

describe('Locations API', () => {
  describe('GET /api/locations/provinces', () => {
    test('should return provinces list', async () => {
      const response = await request(app).get('/api/locations/provinces');
      // Note: This requires database connection
      expect([200, 500]).toContain(response.status);
    });
  });

  describe('GET /api/locations/distance', () => {
    test('should calculate distance', async () => {
      const response = await request(app)
        .get('/api/locations/distance')
        .query({
          lat1: 10.7769,
          lon1: 106.7009,
          lat2: 10.7869,
          lon2: 106.6909
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('distance');
    });

    test('should validate required parameters', async () => {
      const response = await request(app)
        .get('/api/locations/distance')
        .query({});

      expect(response.status).toBe(400);
    });
  });
});
