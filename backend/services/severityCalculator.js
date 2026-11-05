/**
 * Incident Severity Calculator
 * Automatically calculates incident severity based on various factors
 */

const SEVERITY_WEIGHTS = {
  // Type-based weights
  type: {
    fire: 0.9,
    flood: 0.85,
    accident: 0.8,
    traffic: 0.5,
    construction: 0.3,
    weather: 0.4,
    other: 0.2
  },
  // Time-based weights
  time: {
    rush_hour: 0.1,
    night: 0.05,
    weekend: -0.05
  },
  // Location-based weights
  location: {
    highway: 0.15,
    residential: 0.1,
    commercial: 0.15,
    industrial: 0.2,
    school: 0.25
  },
  // Content-based weights
  keywords: {
    high: ['cứu hỏa', 'nạn nhân', 'nguy hiểm', 'khẩn cấp', 'chết', 'thương tích', 'sập', 'nổ', 'cháy lớn', 'ngập lụt'],
    medium: ['tắc đường', 'kẹt xe', 'đứt cáp', 'hư hỏng', 'đơn độc', 'rác rưởi'],
    low: ['nhẹ', 'bình thường', 'thông thường', 'không nghiêm trọng']
  }
};

/**
 * Calculate incident severity score (0-1)
 */
function calculateSeverityScore(incident) {
  let score = 0;

  // Type score
  const typeScore = SEVERITY_WEIGHTS.type[incident.type] || SEVERITY_WEIGHTS.type.other;
  score += typeScore;

  // Time score
  const hour = new Date(incident.created_at || new Date()).getHours();
  const day = new Date(incident.created_at || new Date()).getDay();
  
  // Rush hour (7-9 AM, 5-7 PM)
  if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
    score += SEVERITY_WEIGHTS.time.rush_hour;
  }
  // Night (10 PM - 6 AM)
  else if (hour >= 22 || hour <= 6) {
    score += SEVERITY_WEIGHTS.time.night;
  }
  // Weekend
  else if (day === 0 || day === 6) {
    score += SEVERITY_WEIGHTS.time.weekend;
  }

  // Location score (from address if available)
  if (incident.address) {
    const address = incident.address.toLowerCase();
    if (address.includes('đường cao tốc') || address.includes('highway')) {
      score += SEVERITY_WEIGHTS.location.highway;
    } else if (address.includes('khu dân cư') || address.includes('residential')) {
      score += SEVERITY_WEIGHTS.location.residential;
    } else if (address.includes('trung tâm thương mại') || address.includes('commercial')) {
      score += SEVERITY_WEIGHTS.location.commercial;
    } else if (address.includes('khu công nghiệp') || address.includes('industrial')) {
      score += SEVERITY_WEIGHTS.location.industrial;
    } else if (address.includes('trường') || address.includes('school')) {
      score += SEVERITY_WEIGHTS.location.school;
    }
  }

  // Keyword score from description
  if (incident.description) {
    const description = incident.description.toLowerCase();
    
    for (const keyword of SEVERITY_WEIGHTS.keywords.high) {
      if (description.includes(keyword)) {
        score += 0.2;
      }
    }
    
    for (const keyword of SEVERITY_WEIGHTS.keywords.medium) {
      if (description.includes(keyword)) {
        score += 0.1;
      }
    }
    
    for (const keyword of SEVERITY_WEIGHTS.keywords.low) {
      if (description.includes(keyword)) {
        score -= 0.1;
      }
    }
  }

  // Cap score at 1
  return Math.min(1, Math.max(0, score));
}

/**
 * Convert score to severity level
 */
function scoreToSeverity(score) {
  if (score >= 0.8) return 'critical';
  if (score >= 0.6) return 'high';
  if (score >= 0.4) return 'medium';
  return 'low';
}

/**
 * Auto-calculate incident severity
 */
function autoCalculateSeverity(incident) {
  const score = calculateSeverityScore(incident);
  const severity = scoreToSeverity(score);
  
  return {
    severity,
    score,
    confidence: calculateConfidence(incident)
  };
}

/**
 * Calculate confidence in auto-calculation (0-1)
 */
function calculateConfidence(incident) {
  let confidence = 0.5; // Base confidence

  // Higher confidence if we have more data
  if (incident.type) confidence += 0.2;
  if (incident.description && incident.description.length > 50) confidence += 0.15;
  if (incident.address) confidence += 0.1;
  if (incident.latitude && incident.longitude) confidence += 0.05;

  return Math.min(1, confidence);
}

/**
 * Recalculate severity for an incident
 */
async function recalculateIncidentSeverity(pool, incidentId) {
  try {
    const result = await pool.query(
      'SELECT * FROM incidents WHERE id = $1',
      [incidentId]
    );

    if (result.rows.length === 0) {
      throw new Error('Incident not found');
    }

    const incident = result.rows[0];
    const { severity, score, confidence } = autoCalculateSeverity(incident);

    // Update if calculated severity differs from current
    if (incident.severity !== severity) {
      await pool.query(
        'UPDATE incidents SET severity = $1, updated_at = NOW() WHERE id = $2',
        [severity, incidentId]
      );
    }

    return {
      incidentId,
      oldSeverity: incident.severity,
      newSeverity: severity,
      score,
      confidence,
      updated: incident.severity !== severity
    };
  } catch (error) {
    console.error('Error recalculating severity:', error);
    throw error;
  }
}

/**
 * Batch recalculate severity for multiple incidents
 */
async function batchRecalculateSeverity(pool, incidentIds) {
  const results = [];
  
  for (const id of incidentIds) {
    try {
      const result = await recalculateIncidentSeverity(pool, id);
      results.push(result);
    } catch (error) {
      results.push({
        incidentId: id,
        error: error.message
      });
    }
  }

  return results;
}

module.exports = {
  calculateSeverityScore,
  scoreToSeverity,
  autoCalculateSeverity,
  recalculateIncidentSeverity,
  batchRecalculateSeverity,
  SEVERITY_WEIGHTS
};
