const { calculateDistance, findNearbyLocations } = require('../services/geocoding');

describe('Geocoding Utils', () => {
  describe('calculateDistance', () => {
    test('should calculate distance between two points', () => {
      const distance = calculateDistance(10.7769, 106.7009, 10.7869, 106.6909);
      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeLessThan(100); // Distance should be reasonable
    });

    test('should return 0 for same point', () => {
      const distance = calculateDistance(10.7769, 106.7009, 10.7769, 106.7009);
      expect(distance).toBe(0);
    });
  });

  describe('findNearbyLocations', () => {
    test('should find locations within radius', () => {
      const locations = [
        { latitude: 10.7769, longitude: 106.7009, name: 'Location 1' },
        { latitude: 10.7869, longitude: 106.6909, name: 'Location 2' },
        { latitude: 10.7969, longitude: 106.6809, name: 'Location 3' }
      ];

      const nearby = findNearbyLocations(10.7769, 106.7009, locations, 5);
      expect(nearby.length).toBeGreaterThan(0);
      expect(nearby[0]).toHaveProperty('distance');
    });

    test('should return empty array when no locations nearby', () => {
      const locations = [
        { latitude: 20.0, longitude: 105.0, name: 'Far Location' }
      ];

      const nearby = findNearbyLocations(10.7769, 106.7009, locations, 1);
      expect(nearby.length).toBe(0);
    });
  });
});
