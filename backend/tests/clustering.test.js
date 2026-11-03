const {
  clusterIncidents,
  detectEmergingHotspots,
  clusterByTime,
  getClusterStatistics,
  calculateCentroid,
  calculateClusterRadius,
  calculateClusterSeverity
} = require('../services/clustering');

describe('Clustering Service', () => {
  describe('calculateCentroid', () => {
    test('should calculate centroid of incidents', () => {
      const incidents = [
        { latitude: 10.0, longitude: 106.0 },
        { latitude: 10.2, longitude: 106.2 },
        { latitude: 10.4, longitude: 106.4 }
      ];

      const centroid = calculateCentroid(incidents);
      expect(centroid.latitude).toBeCloseTo(10.2);
      expect(centroid.longitude).toBeCloseTo(106.2);
    });

    test('should return null for empty array', () => {
      const centroid = calculateCentroid([]);
      expect(centroid).toBeNull();
    });
  });

  describe('calculateClusterRadius', () => {
    test('should calculate max distance from centroid', () => {
      const incidents = [
        { latitude: 10.0, longitude: 106.0 },
        { latitude: 10.1, longitude: 106.1 }
      ];
      const centroid = { latitude: 10.05, longitude: 106.05 };

      const radius = calculateClusterRadius(incidents, centroid);
      expect(radius).toBeGreaterThan(0);
    });

    test('should return 0 for empty incidents', () => {
      const radius = calculateClusterRadius([], { latitude: 10, longitude: 106 });
      expect(radius).toBe(0);
    });
  });

  describe('calculateClusterSeverity', () => {
    test('should return critical for high severity incidents', () => {
      const incidents = [
        { severity: 'critical' },
        { severity: 'critical' }
      ];

      const severity = calculateClusterSeverity(incidents);
      expect(severity).toBe('critical');
    });

    test('should return low for low severity incidents', () => {
      const incidents = [
        { severity: 'low' },
        { severity: 'low' }
      ];

      const severity = calculateClusterSeverity(incidents);
      expect(severity).toBe('low');
    });

    test('should return medium for mixed severity', () => {
      const incidents = [
        { severity: 'low' },
        { severity: 'high' }
      ];

      const severity = calculateClusterSeverity(incidents);
      expect(severity).toBe('medium');
    });
  });

  describe('clusterIncidents', () => {
    test('should cluster incidents by distance', () => {
      const incidents = [
        { id: 1, latitude: 10.0, longitude: 106.0, severity: 'medium', status: 'pending', created_at: new Date() },
        { id: 2, latitude: 10.01, longitude: 106.01, severity: 'high', status: 'pending', created_at: new Date() },
        { id: 3, latitude: 20.0, longitude: 110.0, severity: 'low', status: 'pending', created_at: new Date() }
      ];

      const clusters = clusterIncidents(incidents, 2, 2);
      expect(clusters.length).toBeGreaterThan(0);
      expect(clusters[0]).toHaveProperty('incidents');
      expect(clusters[0]).toHaveProperty('centroid');
    });

    test('should return empty array for insufficient incidents', () => {
      const incidents = [
        { id: 1, latitude: 10.0, longitude: 106.0 }
      ];

      const clusters = clusterIncidents(incidents, 1, 2);
      expect(clusters.length).toBe(0);
    });

    test('should return empty array for no incidents', () => {
      const clusters = clusterIncidents([], 1, 2);
      expect(clusters.length).toBe(0);
    });
  });

  describe('detectEmergingHotspots', () => {
    test('should detect emerging hotspots', () => {
      const now = new Date();
      const incidents = [
        { id: 1, latitude: 10.0, longitude: 106.0, severity: 'critical', created_at: now },
        { id: 2, latitude: 10.01, longitude: 106.01, severity: 'high', created_at: now },
        { id: 3, latitude: 10.02, longitude: 106.02, severity: 'critical', created_at: now }
      ];

      const hotspots = detectEmergingHotspots(incidents, 24);
      expect(hotspots.length).toBeGreaterThan(0);
      expect(hotspots[0]).toHaveProperty('type', 'emerging_hotspot');
      expect(hotspots[0]).toHaveProperty('confidence');
    });
  });

  describe('clusterByTime', () => {
    test('should cluster incidents by time window', () => {
      const now = new Date();
      const incidents = [
        { id: 1, created_at: new Date(now.getTime() - 10 * 60 * 1000) },
        { id: 2, created_at: new Date(now.getTime() - 5 * 60 * 1000) },
        { id: 3, created_at: new Date(now.getTime() + 30 * 60 * 1000) }
      ];

      const clusters = clusterByTime(incidents, 30);
      expect(clusters.length).toBeGreaterThan(0);
      expect(clusters[0]).toHaveProperty('start_time');
      expect(clusters[0]).toHaveProperty('end_time');
    });

    test('should return empty array for insufficient incidents', () => {
      const clusters = clusterByTime([{ id: 1, created_at: new Date() }], 60);
      expect(clusters.length).toBe(0);
    });
  });

  describe('getClusterStatistics', () => {
    test('should return cluster statistics', () => {
      const incidents = [
        { id: 1, latitude: 10.0, longitude: 106.0, severity: 'medium', created_at: new Date() },
        { id: 2, latitude: 10.01, longitude: 106.01, severity: 'high', created_at: new Date() }
      ];

      const stats = getClusterStatistics(incidents);
      expect(stats).toHaveProperty('total_incidents');
      expect(stats).toHaveProperty('spatial_clusters');
      expect(stats).toHaveProperty('temporal_clusters');
      expect(stats).toHaveProperty('largest_cluster');
      expect(stats).toHaveProperty('average_cluster_size');
      expect(stats).toHaveProperty('hotspot_count');
    });
  });
});
