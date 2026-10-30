/**
 * Frontend Unit Tests for SOSMAP
 * Test suite for core frontend functionality
 */

// Test utilities
function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected}, got ${actual}`);
  }
}

function assertTrue(condition, message) {
  if (!condition) {
    throw new Error(message || 'Expected true, got false');
  }
}

function assertFalse(condition, message) {
  if (condition) {
    throw new Error(message || 'Expected false, got true');
  }
}

// Test Cache Management
function testCacheManagement() {
  console.log('Testing Cache Management...');
  
  // Test setCache
  setCache('test_key', { data: 'test_value' }, 60000);
  const cached = getCache('test_key');
  assertTrue(cached !== null, 'Cache should be set');
  assertEqual(cached.data, 'test_value', 'Cached data should match');
  
  // Test clearCache
  clearCache('test_key');
  const cleared = getCache('test_key');
  assertTrue(cleared === null, 'Cache should be cleared');
  
  console.log('✓ Cache Management tests passed');
}

// Test Validators
function testValidators() {
  console.log('Testing Validators...');
  
  // Test required validator
  assertTrue(validators.required('test'), 'Required should pass for non-empty');
  assertFalse(validators.required(''), 'Required should fail for empty');
  assertFalse(validators.required(null), 'Required should fail for null');
  
  // Test email validator
  assertTrue(validators.email('test@example.com'), 'Email should pass for valid email');
  assertFalse(validators.email('invalid'), 'Email should fail for invalid email');
  
  // Test phone validator
  assertTrue(validators.phone('0123456789'), 'Phone should pass for valid phone');
  assertFalse(validators.phone('123'), 'Phone should fail for short number');
  
  // Test minLength validator
  assertTrue(validators.minLength('test', 3), 'minLength should pass for valid length');
  assertFalse(validators.minLength('te', 3), 'minLength should fail for short string');
  
  // Test maxLength validator
  assertTrue(validators.maxLength('test', 5), 'maxLength should pass for valid length');
  assertFalse(validators.maxLength('testtest', 5), 'maxLength should fail for long string');
  
  // Test number validator
  assertTrue(validators.number('123'), 'Number should pass for valid number');
  assertFalse(validators.number('abc'), 'Number should fail for non-number');
  
  // Test positiveNumber validator
  assertTrue(validators.positiveNumber('10'), 'positiveNumber should pass for positive');
  assertFalse(validators.positiveNumber('-5'), 'positiveNumber should fail for negative');
  
  // Test coordinates validator
  assertTrue(validators.coordinates('10.5'), 'Coordinates should pass for valid lat');
  assertFalse(validators.coordinates('100'), 'Coordinates should fail for invalid lat');
  
  console.log('✓ Validator tests passed');
}

// Test Form Validation
function testFormValidation() {
  console.log('Testing Form Validation...');
  
  // Create mock field
  const mockField = {
    value: 'test@example.com',
    classList: {
      add: function() {},
      remove: function() {}
    },
    parentNode: {
      querySelector: function() { return null; }
    }
  };
  
  // Test validateField with email
  const errors = validateField(mockField, [
    { type: 'email', message: 'Invalid email' }
  ]);
  assertEqual(errors.length, 0, 'Valid email should have no errors');
  
  console.log('✓ Form Validation tests passed');
}

// Test Debounce
function testDebounce() {
  console.log('Testing Debounce...');
  
  let callCount = 0;
  const debouncedFn = debounce(function() {
    callCount++;
  }, 100);
  
  debouncedFn();
  debouncedFn();
  debouncedFn();
  
  // Should not have been called yet
  assertEqual(callCount, 0, 'Debounced function should not be called immediately');
  
  console.log('✓ Debounce tests passed');
}

// Test Throttle
function testThrottle() {
  console.log('Testing Throttle...');
  
  let callCount = 0;
  const throttledFn = throttle(function() {
    callCount++;
  }, 100);
  
  throttledFn();
  throttledFn();
  throttledFn();
  
  // Should have been called once
  assertEqual(callCount, 1, 'Throttled function should be called once');
  
  console.log('✓ Throttle tests passed');
}

// Test Security Functions
function testSecurityFunctions() {
  console.log('Testing Security Functions...');
  
  // Test sanitizeHTML
  const sanitized = sanitizeHTML('<script>alert("xss")</script>');
  assertEqual(sanitized, '&lt;script&gt;alert("xss")&lt;/script&gt;', 'HTML should be sanitized');
  
  // Test escapeHTML
  const escaped = escapeHTML('<div>test</div>');
  assertEqual(escaped, '&lt;div&gt;test&lt;/div&gt;', 'HTML should be escaped');
  
  // Test validateURL
  assertTrue(validateURL('https://example.com'), 'Valid HTTPS URL should pass');
  assertTrue(validateURL('http://example.com'), 'Valid HTTP URL should pass');
  assertFalse(validateURL('javascript:alert(1)'), 'JavaScript URL should fail');
  
  console.log('✓ Security functions tests passed');
}

// Test Rate Limiting
function testRateLimiting() {
  console.log('Testing Rate Limiting...');
  
  const action = 'test_action';
  const limit = 3;
  const period = 1000;
  
  // Should allow first 3 requests
  assertTrue(rateLimit(action, limit, period), 'First request should be allowed');
  assertTrue(rateLimit(action, limit, period), 'Second request should be allowed');
  assertTrue(rateLimit(action, limit, period), 'Third request should be allowed');
  
  // Fourth request should be rate limited
  assertFalse(rateLimit(action, limit, period), 'Fourth request should be rate limited');
  
  // Clear for cleanup
  localStorage.removeItem('rate_limit_' + action);
  
  console.log('✓ Rate limiting tests passed');
}

// Test Favorites
function testFavorites() {
  console.log('Testing Favorites...');
  
  loadFavorites();
  
  // Test toggle favorite
  toggleFavorite('incident_1');
  assertTrue(isFavorite('incident_1'), 'Incident should be favorited');
  
  toggleFavorite('incident_1');
  assertFalse(isFavorite('incident_1'), 'Incident should be unfavorited');
  
  console.log('✓ Favorites tests passed');
}

// Test Translation
function testTranslation() {
  console.log('Testing Translation...');
  
  // Test Vietnamese
  const lang = getUserPreferences().language || 'vi';
  assertEqual(lang, 'vi', 'Default language should be Vietnamese');
  
  const appName = getTranslation('appName');
  assertTrue(appName !== null, 'Translation should exist');
  
  console.log('✓ Translation tests passed');
}

// Run all tests
function runAllTests() {
  console.log('Running Frontend Unit Tests...\n');
  
  try {
    testCacheManagement();
    testValidators();
    testFormValidation();
    testDebounce();
    testThrottle();
    testSecurityFunctions();
    testRateLimiting();
    testFavorites();
    testTranslation();
    
    console.log('\n✅ All frontend unit tests passed!');
    return true;
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    return false;
  }
}

// Export for Node.js if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    runAllTests,
    testCacheManagement,
    testValidators,
    testFormValidation,
    testDebounce,
    testThrottle,
    testSecurityFunctions,
    testRateLimiting,
    testFavorites,
    testTranslation
  };
}
