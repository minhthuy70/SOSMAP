// SOSMAP Configuration

// API Configuration
var API_CONFIG = {
  BASE_URL: 'http://localhost:3000/api',
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000 // 1 second
};

// Map Configuration
var MAP_CONFIG = {
  DEFAULT_CENTER: [10.7769, 106.7009], // Ho Chi Minh City
  DEFAULT_ZOOM: 13,
  MIN_ZOOM: 5,
  MAX_ZOOM: 18
};

// Feature Flags
var FEATURE_FLAGS = {
  ENABLE_BACKEND_API: true,
  ENABLE_OFFLINE_MODE: true,
  ENABLE_PWA: true,
  ENABLE_ANALYTICS: true,
  ENABLE_NOTIFICATIONS: true
};

// Incident Types
var INCIDENT_TYPES = {
  tainan: { name: 'Tai nạn', color: '#e74c3c', icon: '🚗' },
  oga: { name: 'Ổ gà', color: '#f39c12', icon: '🕳️' },
  ngapnuoc: { name: 'Ngập nước', color: '#3498db', icon: '💧' },
  vatcan: { name: 'Vật cản', color: '#9b59b6', icon: '🚧' },
  kexe: { name: 'Kẹt xe', color: '#e67e22', icon: '🚦' },
  bao: { name: 'Bão', color: '#8e44ad', icon: '🌀' },
  lut: { name: 'Lũ lụt', color: '#2980b9', icon: '🌊' },
  satlo: { name: 'Sạt lở', color: '#d35400', icon: '⛰️' },
  dongdat: { name: 'Động đất', color: '#c0392b', icon: '🌍' },
  hanhan: { name: 'Hạn hán', color: '#f39c12', icon: '☀️' },
  chay: { name: 'Cháy', color: '#e74c3c', icon: '🔥' },
  no: { name: 'Nổ', color: '#e67e22', icon: '💥' },
  dich: { name: 'Dịch bệnh', color: '#7f8c8d', icon: '🦠' },
  onhiem: { name: 'Ô nhiễm', color: '#27ae60', icon: '🏭' },
  matdien: { name: 'Mất điện', color: '#f1c40f', icon: '💡' },
  matnuoc: { name: 'Mất nước', color: '#3498db', icon: '🚰' },
  hata: { name: 'Sự cố công trình', color: '#9b59b6', icon: '🏗️' },
  tauthuyen: { name: 'Tàu thuyền', color: '#1abc9c', icon: '⛵' },
  anam: { name: 'Mất tích', color: '#e74c3c', icon: '👤' },
  nguyhiem: { name: 'Nguy hiểm', color: '#e67e22', icon: '⚠️' },
  khac: { name: 'Khác', color: '#95a5a6', icon: '❓' }
};

// Severity Levels
var SEVERITY_LEVELS = {
  low: { name: 'Thấp', value: 1, color: '#27ae60' },
  medium: { name: 'Trung bình', value: 2, color: '#f39c12' },
  high: { name: 'Cao', value: 3, color: '#e67e22' },
  critical: { name: 'Nghiêm trọng', value: 4, color: '#e74c3c' }
};

// Incident Status
var INCIDENT_STATUS = {
  pending: { name: 'Chờ xử lý', color: '#95a5a6' },
  verified: { name: 'Đã xác minh', color: '#3498db' },
  in_progress: { name: 'Đang xử lý', color: '#f39c12' },
  resolved: { name: 'Đã giải quyết', color: '#27ae60' },
  rejected: { name: 'Đã từ chối', color: '#e74c3c' }
};

// User Roles
var USER_ROLES = {
  user: { name: 'Người dùng', permissions: ['view', 'report'] },
  moderator: { name: 'Kiểm duyệt viên', permissions: ['view', 'report', 'verify', 'moderate'] },
  admin: { name: 'Quản trị viên', permissions: ['view', 'report', 'verify', 'moderate', 'admin'] }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    API_CONFIG,
    MAP_CONFIG,
    FEATURE_FLAGS,
    INCIDENT_TYPES,
    SEVERITY_LEVELS,
    INCIDENT_STATUS,
    USER_ROLES
  };
}
