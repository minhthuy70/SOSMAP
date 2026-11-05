/**
 * Performance Monitoring / APM Service
 * Tracks application performance metrics
 */

const metrics = {
  requests: {
    total: 0,
    by_endpoint: {},
    by_method: {}
  },
  response_times: {
    total: 0,
    by_endpoint: {},
    p50: 0,
    p95: 0,
    p99: 0
  },
  errors: {
    total: 0,
    by_endpoint: {},
    by_status: {}
  },
  memory: {
    samples: []
  },
  uptime: process.uptime()
};

const MAX_SAMPLES = 100;

/**
 * Record a request
 */
function recordRequest(method, endpoint, responseTime, statusCode) {
  metrics.requests.total++;
  
  // By endpoint
  if (!metrics.requests.by_endpoint[endpoint]) {
    metrics.requests.by_endpoint[endpoint] = 0;
  }
  metrics.requests.by_endpoint[endpoint]++;
  
  // By method
  if (!metrics.requests.by_method[method]) {
    metrics.requests.by_method[method] = 0;
  }
  metrics.requests.by_method[method]++;
  
  // Response time
  metrics.response_times.total += responseTime;
  
  if (!metrics.response_times.by_endpoint[endpoint]) {
    metrics.response_times.by_endpoint[endpoint] = {
      total: 0,
      count: 0,
      samples: []
    };
  }
  metrics.response_times.by_endpoint[endpoint].total += responseTime;
  metrics.response_times.by_endpoint[endpoint].count++;
  metrics.response_times.by_endpoint[endpoint].samples.push(responseTime);
  
  // Keep only last 100 samples per endpoint
  if (metrics.response_times.by_endpoint[endpoint].samples.length > MAX_SAMPLES) {
    metrics.response_times.by_endpoint[endpoint].samples.shift();
  }
  
  // Track errors
  if (statusCode >= 400) {
    metrics.errors.total++;
    
    if (!metrics.errors.by_endpoint[endpoint]) {
      metrics.errors.by_endpoint[endpoint] = 0;
    }
    metrics.errors.by_endpoint[endpoint]++;
    
    if (!metrics.errors.by_status[statusCode]) {
      metrics.errors.by_status[statusCode] = 0;
    }
    metrics.errors.by_status[statusCode]++;
  }
  
  // Calculate percentiles
  calculatePercentiles();
}

/**
 * Calculate response time percentiles
 */
function calculatePercentiles() {
  const allSamples = [];
  
  Object.values(metrics.response_times.by_endpoint).forEach(endpoint => {
    allSamples.push(...endpoint.samples);
  });
  
  if (allSamples.length === 0) return;
  
  allSamples.sort((a, b) => a - b);
  
  const p50Index = Math.floor(allSamples.length * 0.5);
  const p95Index = Math.floor(allSamples.length * 0.95);
  const p99Index = Math.floor(allSamples.length * 0.99);
  
  metrics.response_times.p50 = allSamples[p50Index] || 0;
  metrics.response_times.p95 = allSamples[p95Index] || 0;
  metrics.response_times.p99 = allSamples[p99Index] || 0;
}

/**
 * Record memory usage
 */
function recordMemoryUsage() {
  const memoryUsage = process.memoryUsage();
  
  metrics.memory.samples.push({
    timestamp: Date.now(),
    rss: memoryUsage.rss,
    heapTotal: memoryUsage.heapTotal,
    heapUsed: memoryUsage.heapUsed,
    external: memoryUsage.external
  });
  
  // Keep only last 100 samples
  if (metrics.memory.samples.length > MAX_SAMPLES) {
    metrics.memory.samples.shift();
  }
}

/**
 * Get current metrics
 */
function getMetrics() {
  const avgResponseTime = metrics.requests.total > 0
    ? metrics.response_times.total / metrics.requests.total
    : 0;
  
  const errorRate = metrics.requests.total > 0
    ? (metrics.errors.total / metrics.requests.total * 100)
    : 0;
  
  const throughput = metrics.uptime > 0
    ? metrics.requests.total / metrics.uptime
    : 0;
  
  const memoryUsage = process.memoryUsage();
  
  return {
    uptime: process.uptime(),
    requests: {
      total: metrics.requests.total,
      by_endpoint: metrics.requests.by_endpoint,
      by_method: metrics.requests.by_method,
      throughput: throughput.toFixed(2) // requests per second
    },
    response_times: {
      average: avgResponseTime.toFixed(2),
      p50: metrics.response_times.p50.toFixed(2),
      p95: metrics.response_times.p95.toFixed(2),
      p99: metrics.response_times.p99.toFixed(2),
      by_endpoint: Object.keys(metrics.response_times.by_endpoint).reduce((acc, endpoint) => {
        const data = metrics.response_times.by_endpoint[endpoint];
        acc[endpoint] = {
          average: (data.total / data.count).toFixed(2),
          count: data.count
        };
        return acc;
      }, {})
    },
    errors: {
      total: metrics.errors.total,
      rate: errorRate.toFixed(2),
      by_endpoint: metrics.errors.by_endpoint,
      by_status: metrics.errors.by_status
    },
    memory: {
      current: {
        rss: formatBytes(memoryUsage.rss),
        heapTotal: formatBytes(memoryUsage.heapTotal),
        heapUsed: formatBytes(memoryUsage.heapUsed),
        external: formatBytes(memoryUsage.external)
      },
      samples: metrics.memory.samples.slice(-10) // Last 10 samples
    },
    cpu: {
      current: process.cpuUsage()
    }
  };
}

/**
 * Reset metrics
 */
function resetMetrics() {
  metrics.requests = {
    total: 0,
    by_endpoint: {},
    by_method: {}
  };
  metrics.response_times = {
    total: 0,
    by_endpoint: {},
    p50: 0,
    p95: 0,
    p99: 0
  };
  metrics.errors = {
    total: 0,
    by_endpoint: {},
    by_status: {}
  };
  metrics.memory = {
    samples: []
  };
  metrics.uptime = process.uptime();
}

/**
 * Format bytes to human readable
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Start periodic memory recording
 */
function startPeriodicRecording(intervalMs = 5000) {
  setInterval(() => {
    recordMemoryUsage();
  }, intervalMs);
}

// Express middleware for APM
function apmMiddleware(req, res, next) {
  const startTime = Date.now();
  const method = req.method;
  const endpoint = req.path;
  
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    const statusCode = res.statusCode;
    
    recordRequest(method, endpoint, responseTime, statusCode);
  });
  
  next();
}

module.exports = {
  recordRequest,
  recordMemoryUsage,
  getMetrics,
  resetMetrics,
  startPeriodicRecording,
  apmMiddleware
};
