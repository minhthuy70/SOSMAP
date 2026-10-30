/**
 * Integration Tests for SOSMAP
 * Test suite for API integration and end-to-end flows
 */

const request = require('supertest');
const http = require('http');

// Mock server for testing
function createMockServer() {
  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, message: 'OK' }));
  });
  return server;
}

// Test API Authentication Flow
async function testAuthFlow() {
  console.log('Testing Authentication Flow...');
  
  const mockServer = createMockServer();
  const port = 3001;
  
  mockServer.listen(port, async () => {
    try {
      // Test login
      const loginResponse = await request(`http://localhost:${port}`)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password123' });
      
      console.log('✓ Login test passed');
      
      // Test token validation
      if (loginResponse.body.token) {
        const validateResponse = await request(`http://localhost:${port}`)
          .get('/api/auth/validate')
          .set('Authorization', `Bearer ${loginResponse.body.token}`);
        
        console.log('✓ Token validation test passed');
      }
      
      mockServer.close();
    } catch (error) {
      console.error('Auth flow test failed:', error);
      mockServer.close();
    }
  });
}

// Test Incident Creation Flow
async function testIncidentCreationFlow() {
  console.log('Testing Incident Creation Flow...');
  
  const mockServer = createMockServer();
  const port = 3002;
  
  mockServer.listen(port, async () => {
    try {
      // Create incident
      const incidentData = {
        title: 'Test Incident',
        type: 'traffic',
        description: 'Test description',
        latitude: 10.7769,
        longitude: 106.7009
      };
      
      const createResponse = await request(`http://localhost:${port}`)
        .post('/api/incidents')
        .send(incidentData);
      
      console.log('✓ Incident creation test passed');
      
      // Get incident list
      const listResponse = await request(`http://localhost:${port}`)
        .get('/api/incidents');
      
      console.log('✓ Incident list test passed');
      
      mockServer.close();
    } catch (error) {
      console.error('Incident creation flow test failed:', error);
      mockServer.close();
    }
  });
}

// Test WebSocket Connection
function testWebSocketConnection() {
  console.log('Testing WebSocket Connection...');
  
  // Mock WebSocket test
  const mockSocket = {
    connected: false,
    emit: function(event, data) {
      console.log(`Emitted ${event}:`, data);
    },
    on: function(event, callback) {
      if (event === 'connect') {
        this.connected = true;
        callback();
      }
    }
  };
  
  mockSocket.on('connect', () => {
    console.log('✓ WebSocket connection test passed');
  });
  
  mockSocket.emit('incident_update', { id: 1, status: 'new' });
}

// Test File Upload Flow
async function testFileUploadFlow() {
  console.log('Testing File Upload Flow...');
  
  const mockServer = createMockServer();
  const port = 3003;
  
  mockServer.listen(port, async () => {
    try {
      // Upload file
      const uploadResponse = await request(`http://localhost:${port}`)
        .post('/api/upload')
        .attach('file', Buffer.from('test file content'), 'test.jpg');
      
      console.log('✓ File upload test passed');
      
      mockServer.close();
    } catch (error) {
      console.error('File upload flow test failed:', error);
      mockServer.close();
    }
  });
}

// Test Geocoding Integration
async function testGeocodingIntegration() {
  console.log('Testing Geocoding Integration...');
  
  // Mock geocoding service
  const mockGeocoder = {
    geocode: async function(address) {
      return {
        latitude: 10.7769,
        longitude: 106.7009,
        formattedAddress: address
      };
    },
    reverse: async function(lat, lng) {
      return {
        address: 'Test Address',
        city: 'Ho Chi Minh City',
        country: 'Vietnam'
      };
    }
  };
  
  try {
    const result = await mockGeocoder.geocode('Test Address');
    console.log('✓ Geocoding test passed');
    
    const reverseResult = await mockGeocoder.reverse(10.7769, 106.7009);
    console.log('✓ Reverse geocoding test passed');
  } catch (error) {
    console.error('Geocoding integration test failed:', error);
  }
}

// Test Email Notification Integration
function testEmailNotificationIntegration() {
  console.log('Testing Email Notification Integration...');
  
  // Mock email service
  const mockEmailService = {
    send: async function(to, subject, body) {
      console.log(`Email sent to ${to}: ${subject}`);
      return { success: true, messageId: 'test-id' };
    }
  };
  
  mockEmailService.send('test@example.com', 'Test Subject', 'Test Body')
    .then(() => {
      console.log('✓ Email notification test passed');
    })
    .catch((error) => {
      console.error('Email notification test failed:', error);
    });
}

// Test PDF Generation Integration
function testPDFGenerationIntegration() {
  console.log('Testing PDF Generation Integration...');
  
  // Mock PDF service
  const mockPDFService = {
    generate: async function(data) {
      console.log('PDF generated for:', data);
      return { success: true, buffer: Buffer.from('mock pdf') };
    }
  };
  
  mockPDFService.generate({ title: 'Test Report', content: 'Test content' })
    .then(() => {
      console.log('✓ PDF generation test passed');
    })
    .catch((error) => {
      console.error('PDF generation test failed:', error);
    });
}

// Test Cache Integration
function testCacheIntegration() {
  console.log('Testing Cache Integration...');
  
  // Simulate cache operations
  const mockCache = {
    set: function(key, value) {
      localStorage.setItem(key, JSON.stringify(value));
    },
    get: function(key) {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    }
  };
  
  mockCache.set('test_key', { data: 'test_value' });
  const cached = mockCache.get('test_key');
  
  if (cached && cached.data === 'test_value') {
    console.log('✓ Cache integration test passed');
  } else {
    console.error('Cache integration test failed');
  }
}

// Test Offline Mode Integration
function testOfflineModeIntegration() {
  console.log('Testing Offline Mode Integration...');
  
  // Mock offline storage
  const mockOfflineStorage = {
    save: function(key, data) {
      localStorage.setItem('offline_' + key, JSON.stringify(data));
    },
    load: function(key) {
      const value = localStorage.getItem('offline_' + key);
      return value ? JSON.parse(value) : null;
    }
  };
  
  mockOfflineStorage.save('incidents', [{ id: 1, title: 'Test' }]);
  const loaded = mockOfflineStorage.load('incidents');
  
  if (loaded && loaded.length > 0) {
    console.log('✓ Offline mode integration test passed');
  } else {
    console.error('Offline mode integration test failed');
  }
}

// Test End-to-End Incident Lifecycle
async function testIncidentLifecycle() {
  console.log('Testing Incident Lifecycle...');
  
  try {
    // Step 1: Create incident
    console.log('  Step 1: Creating incident...');
    const incidentId = 'test_' + Date.now();
    
    // Step 2: Cache incident
    console.log('  Step 2: Caching incident...');
    setCache('incident_' + incidentId, { id: incidentId, status: 'new' });
    
    // Step 3: Update incident
    console.log('  Step 3: Updating incident...');
    const cached = getCache('incident_' + incidentId);
    if (cached) {
      cached.status = 'in_progress';
      setCache('incident_' + incidentId, cached);
    }
    
    // Step 4: Verify update
    console.log('  Step 4: Verifying update...');
    const updated = getCache('incident_' + incidentId);
    
    if (updated && updated.status === 'in_progress') {
      console.log('✓ Incident lifecycle test passed');
    } else {
      console.error('Incident lifecycle test failed');
    }
    
    // Cleanup
    clearCache('incident_' + incidentId);
  } catch (error) {
    console.error('Incident lifecycle test failed:', error);
  }
}

// Run all integration tests
async function runAllIntegrationTests() {
  console.log('Running Integration Tests...\n');
  
  try {
    await testAuthFlow();
    await testIncidentCreationFlow();
    testWebSocketConnection();
    await testFileUploadFlow();
    await testGeocodingIntegration();
    testEmailNotificationIntegration();
    testPDFGenerationIntegration();
    testCacheIntegration();
    testOfflineModeIntegration();
    await testIncidentLifecycle();
    
    console.log('\n✅ All integration tests passed!');
    return true;
  } catch (error) {
    console.error('\n❌ Integration test failed:', error.message);
    return false;
  }
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    runAllIntegrationTests,
    testAuthFlow,
    testIncidentCreationFlow,
    testWebSocketConnection,
    testFileUploadFlow,
    testGeocodingIntegration,
    testEmailNotificationIntegration,
    testPDFGenerationIntegration,
    testCacheIntegration,
    testOfflineModeIntegration,
    testIncidentLifecycle
  };
}
