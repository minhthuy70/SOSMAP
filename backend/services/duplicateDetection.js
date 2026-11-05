const { calculateDistance } = require('./geocoding');

/**
 * Duplicate Incident Detection Service
 * Detects potential duplicate incidents based on various similarity criteria
 */

const DUPLICATE_THRESHOLDS = {
  // Distance threshold in km for considering incidents as potential duplicates
  distance_km: 0.5,
  // Time threshold in minutes for considering incidents as potential duplicates
  time_minutes: 30,
  // Similarity threshold for text comparison (0-1)
  text_similarity: 0.7
};

/**
 * Check if two incidents are potential duplicates
 */
function arePotentialDuplicates(incident1, incident2) {
  // Check time proximity
  const timeDiff = getTimeDifference(incident1.created_at, incident2.created_at);
  if (timeDiff > DUPLICATE_THRESHOLDS.time_minutes) {
    return false;
  }

  // Check location proximity if both have coordinates
  if (incident1.latitude && incident1.longitude && incident2.latitude && incident2.longitude) {
    const distance = calculateDistance(
      incident1.latitude,
      incident1.longitude,
      incident2.latitude,
      incident2.longitude
    );
    if (distance > DUPLICATE_THRESHOLDS.distance_km) {
      return false;
    }
  }

  // Check type similarity
  if (incident1.type !== incident2.type) {
    return false;
  }

  // Check content similarity
  const titleSimilarity = calculateTextSimilarity(incident1.title, incident2.title);
  const descSimilarity = calculateTextSimilarity(
    incident1.description || '',
    incident2.description || ''
  );

  const overallSimilarity = (titleSimilarity * 0.6) + (descSimilarity * 0.4);

  return overallSimilarity >= DUPLICATE_THRESHOLDS.text_similarity;
}

/**
 * Calculate time difference in minutes between two timestamps
 */
function getTimeDifference(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffMs = Math.abs(d1 - d2);
  return diffMs / (1000 * 60);
}

/**
 * Calculate text similarity using simple algorithm
 */
function calculateTextSimilarity(text1, text2) {
  if (!text1 || !text2) return 0;

  const words1 = text1.toLowerCase().split(/\s+/);
  const words2 = text2.toLowerCase().split(/\s+/);

  if (words1.length === 0 || words2.length === 0) return 0;

  const intersection = words1.filter(word => words2.includes(word));
  const union = [...new Set([...words1, ...words2])];

  return intersection.length / union.length;
}

/**
 * Find potential duplicates for a given incident
 */
async function findPotentialDuplicates(pool, incident, limit = 10) {
  try {
    const timeThreshold = DUPLICATE_THRESHOLDS.time_minutes;
    
    // Query incidents within time threshold
    const query = `
      SELECT id, type, title, description, latitude, longitude, created_at, status
      FROM incidents
      WHERE type = $1
        AND created_at >= NOW() - INTERVAL '${timeThreshold} minutes'
        AND id != $2
      ORDER BY created_at DESC
      LIMIT $3
    `;

    const result = await pool.query(query, [incident.type, incident.id, limit]);
    const candidates = result.rows;

    const duplicates = candidates.filter(candidate => 
      arePotentialDuplicates(incident, candidate)
    );

    return duplicates.map(dup => ({
      ...dup,
      similarity_score: calculateTextSimilarity(incident.title, dup.title)
    }));
  } catch (error) {
    console.error('Error finding duplicates:', error);
    throw error;
  }
}

/**
 * Mark incident as duplicate of another
 */
async function markAsDuplicate(pool, incidentId, originalIncidentId, markedBy) {
  try {
    await pool.query(
      `UPDATE incidents 
       SET status = 'duplicate',
           duplicate_of = $1,
           duplicate_marked_by = $2,
           duplicate_marked_at = NOW(),
           updated_at = NOW()
       WHERE id = $3`,
      [originalIncidentId, markedBy, incidentId]
    );

    return {
      incidentId,
      originalIncidentId,
      markedBy,
      status: 'duplicate'
    };
  } catch (error) {
    console.error('Error marking as duplicate:', error);
    throw error;
  }
}

/**
 * Get all incidents marked as duplicates
 */
async function getDuplicateIncidents(pool) {
  try {
    const result = await pool.query(`
      SELECT i.*, 
             u.name as reporter_name,
             u.email as reporter_email,
             orig.title as original_title,
             orig.id as original_incident_id
      FROM incidents i
      LEFT JOIN users u ON i.user_id = u.id
      LEFT JOIN incidents orig ON i.duplicate_of = orig.id
      WHERE i.status = 'duplicate'
      ORDER BY i.created_at DESC
    `);

    return result.rows;
  } catch (error) {
    console.error('Error getting duplicate incidents:', error);
    throw error;
  }
}

/**
 * Unmark incident as duplicate
 */
async function unmarkDuplicate(pool, incidentId) {
  try {
    await pool.query(
      `UPDATE incidents 
       SET status = 'pending',
           duplicate_of = NULL,
           duplicate_marked_by = NULL,
           duplicate_marked_at = NULL,
           updated_at = NOW()
       WHERE id = $1`,
      [incidentId]
    );

    return {
      incidentId,
      status: 'pending'
    };
  } catch (error) {
    console.error('Error unmarking duplicate:', error);
    throw error;
  }
}

/**
 * Scan all recent incidents for potential duplicates
 */
async function scanForDuplicates(pool, timeWindowHours = 24) {
  try {
    const query = `
      SELECT id, type, title, description, latitude, longitude, created_at, status
      FROM incidents
      WHERE created_at >= NOW() - INTERVAL '${timeWindowHours} hours'
        AND status != 'duplicate'
      ORDER BY created_at DESC
    `;

    const result = await pool.query(query);
    const incidents = result.rows;

    const duplicateGroups = [];
    const processedIds = new Set();

    for (const incident of incidents) {
      if (processedIds.has(incident.id)) continue;

      const duplicates = await findPotentialDuplicates(pool, incident, 5);
      
      if (duplicates.length > 0) {
        duplicateGroups.push({
          original: incident,
          duplicates: duplicates
        });

        duplicates.forEach(dup => processedIds.add(dup.id));
      }

      processedIds.add(incident.id);
    }

    return {
      total_incidents_scanned: incidents.length,
      duplicate_groups_found: duplicateGroups.length,
      groups: duplicateGroups
    };
  } catch (error) {
    console.error('Error scanning for duplicates:', error);
    throw error;
  }
}

module.exports = {
  arePotentialDuplicates,
  findPotentialDuplicates,
  markAsDuplicate,
  getDuplicateIncidents,
  unmarkDuplicate,
  scanForDuplicates,
  DUPLICATE_THRESHOLDS
};
