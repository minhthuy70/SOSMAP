/**
 * Telemetry and Analytics Tracking
 * Tracks user interactions and application metrics
 */

const logger = require('./logger');

// Telemetry storage (in-memory, could be replaced with database)
const telemetryData = {
  pageViews: [],
  userActions: [],
  performanceMetrics: [],
  errors: []
};

/**
 * Track page view
 */
function trackPageView(page, userId, metadata = {}) {
  const pageView = {
    timestamp: new Date().toISOString(),
    page,
    userId: userId || 'anonymous',
    url: metadata.url || window?.location?.href,
    referrer: metadata.referrer || document?.referrer,
    userAgent: metadata.userAgent || navigator?.userAgent,
    screen: {
      width: window?.screen?.width,
      height: window?.screen?.height
    },
    viewport: {
      width: window?.innerWidth,
      height: window?.innerHeight
    }
  };
  
  telemetryData.pageViews.push(pageView);
  logger.debug('Page view tracked', { page, userId });
  
  // Send to backend if available
  if (typeof API_BASE_URL !== 'undefined') {
    sendTelemetry('page_view', pageView);
  }
}

/**
 * Track user action
 */
function trackAction(action, category, userId, metadata = {}) {
  const userAction = {
    timestamp: new Date().toISOString(),
    action,
    category,
    userId: userId || 'anonymous',
    metadata
  };
  
  telemetryData.userActions.push(userAction);
  logger.debug('User action tracked', { action, category, userId });
  
  if (typeof API_BASE_URL !== 'undefined') {
    sendTelemetry('user_action', userAction);
  }
}

/**
 * Track performance metric
 */
function trackPerformance(metricName, value, metadata = {}) {
  const metric = {
    timestamp: new Date().toISOString(),
    metric: metricName,
    value,
    unit: metadata.unit || 'ms',
    metadata
  };
  
  telemetryData.performanceMetrics.push(metric);
  logger.debug('Performance metric tracked', { metric: metricName, value });
  
  if (typeof API_BASE_URL !== 'undefined') {
    sendTelemetry('performance', metric);
  }
}

/**
 * Track error
 */
function trackError(error, context = {}) {
  const errorData = {
    timestamp: new Date().toISOString(),
    message: error.message,
    stack: error.stack,
    name: error.name,
    context
  };
  
  telemetryData.errors.push(errorData);
  logger.error('Error tracked', errorData);
  
  if (typeof API_BASE_URL !== 'undefined') {
    sendTelemetry('error', errorData);
  }
}

/**
 * Track API call
 */
function trackApiCall(endpoint, method, duration, status) {
  const apiCall = {
    timestamp: new Date().toISOString(),
    endpoint,
    method,
    duration,
    status
  };
  
  telemetryData.performanceMetrics.push(apiCall);
  logger.debug('API call tracked', { endpoint, method, duration, status });
  
  if (typeof API_BASE_URL !== 'undefined') {
    sendTelemetry('api_call', apiCall);
  }
}

/**
 * Track feature usage
 */
function trackFeature(feature, userId, metadata = {}) {
  trackAction('feature_used', 'feature', userId, {
    feature,
    ...metadata
  });
}

/**
 * Track search
 */
function trackSearch(query, resultsCount, userId) {
  trackAction('search', 'search', userId, {
    query,
    resultsCount
  });
}

/**
 * Track map interaction
 */
function trackMapInteraction(action, coordinates, userId) {
  trackAction('map_interaction', 'map', userId, {
    action,
    coordinates
  });
}

/**
 * Track incident creation
 */
function trackIncidentCreation(incidentType, userId) {
  trackAction('incident_created', 'incident', userId, {
    type: incidentType
  });
}

/**
 * Track incident view
 */
function trackIncidentView(incidentId, userId) {
  trackAction('incident_viewed', 'incident', userId, {
    incidentId
  });
}

/**
 * Send telemetry to backend
 */
async function sendTelemetry(type, data) {
  try {
    const token = localStorage.getItem('sosmap_token');
    
    const response = await fetch(API_BASE_URL + '/telemetry', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      body: JSON.stringify({
        type,
        data,
        timestamp: new Date().toISOString()
      })
    });
    
    if (!response.ok) {
      logger.warn('Failed to send telemetry', { type, status: response.status });
    }
  } catch (error) {
    logger.debug('Telemetry send failed (offline)', { type, error: error.message });
  }
}

/**
 * Get telemetry summary
 */
function getTelemetrySummary() {
  return {
    pageViews: telemetryData.pageViews.length,
    userActions: telemetryData.userActions.length,
    performanceMetrics: telemetryData.performanceMetrics.length,
    errors: telemetryData.errors.length
  };
}

/**
 * Get telemetry by type
 */
function getTelemetryByType(type) {
  switch (type) {
    case 'pageViews':
      return telemetryData.pageViews;
    case 'userActions':
      return telemetryData.userActions;
    case 'performanceMetrics':
      return telemetryData.performanceMetrics;
    case 'errors':
      return telemetryData.errors;
    default:
      return [];
  }
}

/**
 * Clear telemetry data
 */
function clearTelemetry() {
  telemetryData.pageViews = [];
  telemetryData.userActions = [];
  telemetryData.performanceMetrics = [];
  telemetryData.errors = [];
  logger.info('Telemetry data cleared');
}

/**
 * Export telemetry data
 */
function exportTelemetry() {
  return JSON.stringify(telemetryData, null, 2);
}

/**
 * Initialize telemetry on page load
 */
function initializeTelemetry() {
  // Track initial page view
  const userId = localStorage.getItem('sosmap_user_id');
  trackPageView('home', userId);
  
  // Track performance metrics
  window.addEventListener('load', function() {
    const perfData = performance.timing;
    const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
    trackPerformance('page_load_time', pageLoadTime);
  });
  
  // Track errors
  window.addEventListener('error', function(event) {
    trackError(event.error, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    });
  });
  
  // Track unhandled promise rejections
  window.addEventListener('unhandledrejection', function(event) {
    trackError(new Error(event.reason), {
      type: 'unhandled_rejection'
    });
  });
}

// Export for frontend
if (typeof module === 'undefined') {
  window.Telemetry = {
    trackPageView,
    trackAction,
    trackPerformance,
    trackError,
    trackApiCall,
    trackFeature,
    trackSearch,
    trackMapInteraction,
    trackIncidentCreation,
    trackIncidentView,
    getTelemetrySummary,
    getTelemetryByType,
    clearTelemetry,
    exportTelemetry,
    initializeTelemetry
  };
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    trackPageView,
    trackAction,
    trackPerformance,
    trackError,
    trackApiCall,
    trackFeature,
    trackSearch,
    trackMapInteraction,
    trackIncidentCreation,
    trackIncidentView,
    getTelemetrySummary,
    getTelemetryByType,
    clearTelemetry,
    exportTelemetry,
    initializeTelemetry,
    telemetryData
  };
}
