const {
  generateIncidentReport,
  generateAnalyticsReport,
  generateUserReport
} = require('../services/pdf');

describe('PDF Service', () => {
  describe('generateIncidentReport', () => {
    test('should generate PDF buffer for incidents', async () => {
      const incidents = [
        {
          id: 1,
          type: 'tainan',
          title: 'Test Incident',
          description: 'Test description',
          severity: 'high',
          status: 'pending',
          latitude: 10.7769,
          longitude: 106.7009,
          created_at: new Date().toISOString()
        }
      ];

      const pdfBuffer = await generateIncidentReport(incidents);
      expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
      expect(pdfBuffer.length).toBeGreaterThan(0);
    });
  });

  describe('generateAnalyticsReport', () => {
    test('should generate PDF buffer for analytics', async () => {
      const analytics = {
        total: 100,
        by_type: [{ type: 'tainan', count: 50 }],
        by_severity: [{ severity: 'high', count: 30 }],
        by_status: [{ status: 'pending', count: 20 }]
      };

      const pdfBuffer = await generateAnalyticsReport(analytics);
      expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
      expect(pdfBuffer.length).toBeGreaterThan(0);
    });
  });

  describe('generateUserReport', () => {
    test('should generate PDF buffer for users', async () => {
      const users = [
        {
          id: 1,
          name: 'Test User',
          email: 'test@example.com',
          role: 'user',
          created_at: new Date().toISOString()
        }
      ];

      const pdfBuffer = await generateUserReport(users);
      expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
      expect(pdfBuffer.length).toBeGreaterThan(0);
    });
  });
});
