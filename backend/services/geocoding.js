const NodeGeocoder = require('node-geocoder');

const geocoder = NodeGeocoder({
  provider: 'openstreetmap',
  // For production, consider using Google Maps or other paid providers
  // provider: 'google',
  // apiKey: process.env.GOOGLE_MAPS_API_KEY
});

// Forward geocoding: address to coordinates
async function geocodeAddress(address) {
  try {
    const result = await geocoder.geocode(address);
    if (result && result.length > 0) {
      return {
        latitude: result[0].latitude,
        longitude: result[0].longitude,
        formattedAddress: result[0].formattedAddress,
        country: result[0].country,
        city: result[0].city,
        state: result[0].state,
        zipcode: result[0].zipcode
      };
    }
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    throw new Error('Failed to geocode address');
  }
}

// Reverse geocoding: coordinates to address
async function reverseGeocode(latitude, longitude) {
  try {
    const result = await geocoder.reverse({ lat: latitude, lon: longitude });
    if (result && result.length > 0) {
      return {
        formattedAddress: result[0].formattedAddress,
        country: result[0].country,
        city: result[0].city,
        state: result[0].state,
        street: result[0].streetName,
        streetNumber: result[0].streetNumber,
        zipcode: result[0].zipcode
      };
    }
    return null;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    throw new Error('Failed to reverse geocode coordinates');
  }
}

// Batch geocoding for multiple addresses
async function batchGeocode(addresses) {
  const results = [];
  for (const address of addresses) {
    try {
      const result = await geocodeAddress(address);
      results.push({ address, result, error: null });
    } catch (error) {
      results.push({ address, result: null, error: error.message });
    }
  }
  return results;
}

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

// Find nearby locations within radius
function findNearbyLocations(centerLat, centerLon, locations, radiusKm) {
  return locations.filter(location => {
    const distance = calculateDistance(
      centerLat,
      centerLon,
      location.latitude,
      location.longitude
    );
    return distance <= radiusKm;
  }).map(location => ({
    ...location,
    distance: calculateDistance(
      centerLat,
      centerLon,
      location.latitude,
      location.longitude
    )
  })).sort((a, b) => a.distance - b.distance);
}

module.exports = {
  geocodeAddress,
  reverseGeocode,
  batchGeocode,
  calculateDistance,
  findNearbyLocations
};
