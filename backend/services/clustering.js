const { calculateDistance } = require('./geocoding');

/**
 * Simple clustering algorithm for incidents based on geographic proximity
 * Uses a density-based approach similar to DBSCAN
 */

/**
 * Cluster incidents based on distance threshold
 * @param {Array} incidents - Array of incidents with latitude and longitude
 * @param {number} distanceThresholdKm - Maximum distance for incidents to be in same cluster (default: 1km)
 * @param {number} minIncidents - Minimum incidents to form a cluster (default: 2)
 * @returns {Array} Array of clusters with incident IDs and centroid
 */
function clusterIncidents(incidents, distanceThresholdKm = 1, minIncidents = 2) {
  if (!incidents || incidents.length < minIncidents) {
    return [];
  }

  const clusters = [];
  const visited = new Set();
  const incidentMap = new Map();

  // Build incident map for quick lookup
  incidents.forEach((incident, index) => {
    incidentMap.set(incident.id || index, incident);
  });

  for (const incident of incidents) {
    const incidentId = incident.id || incidents.indexOf(incident);

    if (visited.has(incidentId)) {
      continue;
    }

    visited.add(incidentId);
    const clusterIncidents = [incident];
    const queue = [incident];

    // Expand cluster
    while (queue.length > 0) {
      const current = queue.shift();
      const currentId = current.id || incidents.indexOf(current);

      // Find neighbors within threshold
      for (const other of incidents) {
        const otherId = other.id || incidents.indexOf(other);

        if (visited.has(otherId)) {
          continue;
        }

        const distance = calculateDistance(
          current.latitude,
          current.longitude,
          other.latitude,
          other.longitude
        );

        if (distance <= distanceThresholdKm) {
          visited.add(otherId);
          clusterIncidents.push(other);
          queue.push(other);
        }
      }
    }

    // Only keep clusters with minimum incidents
    if (clusterIncidents.length >= minIncidents) {
      const centroid = calculateCentroid(clusterIncidents);
      clusters.push({
        id: `cluster_${clusters.length + 1}`,
        incidents: clusterIncidents.map(i => i.id || incidents.indexOf(i)),
        incident_count: clusterIncidents.length,
        centroid: centroid,
        radius: calculateClusterRadius(clusterIncidents, centroid),
        severity: calculateClusterSeverity(clusterIncidents),
        created_at: getEarliestDate(clusterIncidents)
      });
    }
  }

  return clusters.sort((a, b) => b.incident_count - a.incident_count);
}

/**
 * Calculate centroid of a cluster
 */
function calculateCentroid(incidents) {
  if (incidents.length === 0) return null;

  const sumLat = incidents.reduce((sum, i) => sum + i.latitude, 0);
  const sumLon = incidents.reduce((sum, i) => sum + i.longitude, 0);

  return {
    latitude: sumLat / incidents.length,
    longitude: sumLon / incidents.length
  };
}

/**
 * Calculate maximum distance from centroid to any incident in cluster
 */
function calculateClusterRadius(incidents, centroid) {
  if (!centroid || incidents.length === 0) return 0;

  let maxDistance = 0;
  for (const incident of incidents) {
    const distance = calculateDistance(
      centroid.latitude,
      centroid.longitude,
      incident.latitude,
      incident.longitude
    );
    if (distance > maxDistance) {
      maxDistance = distance;
    }
  }

  return maxDistance;
}

/**
 * Calculate overall severity of cluster
 */
function calculateClusterSeverity(incidents) {
  if (incidents.length === 0) return 'low';

  const severityMap = { low: 1, medium: 2, high: 3, critical: 4 };
  const totalSeverity = incidents.reduce((sum, i) => {
    return sum + (severityMap[i.severity] || 1);
  }, 0);

  const avgSeverity = totalSeverity / incidents.length;

  if (avgSeverity >= 3.5) return 'critical';
  if (avgSeverity >= 2.5) return 'high';
  if (avgSeverity >= 1.5) return 'medium';
  return 'low';
}

/**
 * Get earliest creation date in cluster
 */
function getEarliestDate(incidents) {
  if (incidents.length === 0) return null;

  return incidents.reduce((earliest, i) => {
    if (!earliest || new Date(i.created_at) < new Date(earliest.created_at)) {
      return i;
    }
    return earliest;
  }).created_at;
}

/**
 * Detect emerging hotspots - clusters with increasing incident rate
 * @param {Array} incidents - All incidents
 * @param {number} timeWindowHours - Time window to check for increase (default: 24 hours)
 * @returns {Array} Emerging hotspots
 */
function detectEmergingHotspots(incidents, timeWindowHours = 24) {
  const now = new Date();
  const windowStart = new Date(now.getTime() - timeWindowHours * 60 * 60 * 1000);

  const recentIncidents = incidents.filter(i => 
    new Date(i.created_at) >= windowStart
  );

  const recentClusters = clusterIncidents(recentIncidents, 0.5, 3);

  return recentClusters.map(cluster => ({
    ...cluster,
    type: 'emerging_hotspot',
    confidence: calculateHotspotConfidence(cluster, recentIncidents.length)
  }));
}

/**
 * Calculate confidence score for hotspot (0-1)
 */
function calculateHotspotConfidence(cluster, totalRecentIncidents) {
  const incidentRatio = cluster.incident_count / totalRecentIncidents;
  const severityWeight = cluster.severity === 'critical' ? 0.3 : 
                         cluster.severity === 'high' ? 0.2 : 0.1;
  
  return Math.min(1, incidentRatio + severityWeight);
}

/**
 * Temporal clustering - group incidents by time patterns
 * @param {Array} incidents - Array of incidents
 * @param {number} timeWindowMinutes - Time window for temporal clustering (default: 60 minutes)
 * @returns {Array} Temporal clusters
 */
function clusterByTime(incidents, timeWindowMinutes = 60) {
  if (!incidents || incidents.length < 2) {
    return [];
  }

  const sorted = [...incidents].sort((a, b) => 
    new Date(a.created_at) - new Date(b.created_at)
  );

  const clusters = [];
  let currentCluster = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const prevTime = new Date(sorted[i - 1].created_at);
    const currTime = new Date(sorted[i].created_at);
    const diffMinutes = (currTime - prevTime) / (1000 * 60);

    if (diffMinutes <= timeWindowMinutes) {
      currentCluster.push(sorted[i]);
    } else {
      if (currentCluster.length >= 2) {
        clusters.push({
          id: `temporal_cluster_${clusters.length + 1}`,
          incidents: currentCluster.map(i => i.id),
          incident_count: currentCluster.length,
          start_time: currentCluster[0].created_at,
          end_time: currentCluster[currentCluster.length - 1].created_at,
          duration_minutes: diffMinutes
        });
      }
      currentCluster = [sorted[i]];
    }
  }

  if (currentCluster.length >= 2) {
    clusters.push({
      id: `temporal_cluster_${clusters.length + 1}`,
      incidents: currentCluster.map(i => i.id),
      incident_count: currentCluster.length,
      start_time: currentCluster[0].created_at,
      end_time: currentCluster[currentCluster.length - 1].created_at
    });
  }

  return clusters;
}

/**
 * Get cluster statistics for a region
 * @param {Array} incidents - Incidents in the region
 * @returns {Object} Cluster statistics
 */
function getClusterStatistics(incidents) {
  const clusters = clusterIncidents(incidents);
  const temporalClusters = clusterByTime(incidents);

  return {
    total_incidents: incidents.length,
    spatial_clusters: clusters.length,
    temporal_clusters: temporalClusters.length,
    largest_cluster: clusters.length > 0 ? clusters[0] : null,
    average_cluster_size: clusters.length > 0 
      ? clusters.reduce((sum, c) => sum + c.incident_count, 0) / clusters.length 
      : 0,
    hotspot_count: clusters.filter(c => c.severity === 'critical' || c.severity === 'high').length
  };
}

module.exports = {
  clusterIncidents,
  detectEmergingHotspots,
  clusterByTime,
  getClusterStatistics,
  calculateCentroid,
  calculateClusterRadius,
  calculateClusterSeverity
};
