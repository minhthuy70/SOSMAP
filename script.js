// Khởi tạo bản đồ
var map = L.map('map').setView([10.7769, 106.7009], 13); // HCM center

// Map Layers
var mapLayers = {
  street: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }),
  satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri'
  }),
  terrain: L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data: &copy; OpenStreetMap, SRTM | Map style: &copy; OpenTopoMap'
  })
};

// Add default layer
mapLayers.street.addTo(map);

// Marker colors by incident type
var markerColors = {
  tainan: '#e74c3c',    // Tai nạn - đỏ
  oga: '#f39c12',       // Ổ gà - cam
  ngapnuoc: '#3498db',  // Ngập nước - xanh dương
  vatcan: '#9b59b6',    // Vật cản - tím
  kexe: '#e67e22'       // Kẹt xe - cam đậm
};

// Custom marker icons
function createCustomIcon(color) {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
  });
}

// Sample incident data
var incidentData = [
  { id: 1, type: 'oga', name: 'Ổ gà lớn', lat: 10.7769, lng: 106.7009, severity: 'cao' },
  { id: 2, type: 'tainan', name: 'Tai nạn giao thông', lat: 10.7800, lng: 106.7050, severity: 'cao' },
  { id: 3, type: 'ngapnuoc', name: 'Ngập nước sau mưa', lat: 10.7750, lng: 106.6950, severity: 'trungbinh' },
  { id: 4, type: 'vatcan', name: 'Vật cản trên đường', lat: 10.7780, lng: 106.7100, severity: 'thap' },
  { id: 5, type: 'kexe', name: 'Kẹt xe giờ cao điểm', lat: 10.7720, lng: 106.6980, severity: 'trungbinh' }
];

// Store markers individually for updates
var incidentMarkers = [];

// Add markers to map
function addMarkers(incidents) {
  // Clear existing markers
  incidentMarkers.forEach(function(marker) {
    map.removeLayer(marker);
  });
  incidentMarkers = [];

  incidents.forEach(function(incident) {
    var color = markerColors[incident.type] || '#666';
    var icon = createCustomIcon(color);

    var marker = L.marker([incident.lat, incident.lng], { icon: icon });

    var popupContent = `
      <div class="incident-popup">
        <h3>${incident.name}</h3>
        <p><strong>Loại:</strong> ${getIncidentTypeName(incident.type)}</p>
        <p><strong>Mức độ:</strong> ${getSeverityName(incident.severity)}</p>
        <p><strong>Vị trí:</strong> ${incident.lat.toFixed(4)}, ${incident.lng.toFixed(4)}</p>
      </div>
    `;

    marker.bindPopup(popupContent);
    marker.addTo(map);
    incidentMarkers.push(marker);
  });
}

// Helper functions
function getIncidentTypeName(type) {
  const names = {
    'oga': 'Ổ gà',
    'tainan': 'Tai nạn',
    'ngapnuoc': 'Ngập nước',
    'vatcan': 'Vật cản',
    'kexe': 'Kẹt xe'
  };
  return names[type] || type;
}

function getSeverityName(severity) {
  const names = {
    'thap': 'Thấp',
    'trungbinh': 'Trung bình',
    'cao': 'Cao'
  };
  return names[severity] || severity;
}

// Initialize markers
addMarkers(incidentData);

// Map Controls
document.getElementById('zoomInBtn').addEventListener('click', function() {
  map.zoomIn();
});

document.getElementById('zoomOutBtn').addEventListener('click', function() {
  map.zoomOut();
});

// Location button
document.getElementById('locateBtn').addEventListener('click', function() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      function(position) {
        var lat = position.coords.latitude;
        var lng = position.coords.longitude;
        map.setView([lat, lng], 15);

        // Add location marker
        L.marker([lat, lng], {
          icon: L.divIcon({
            className: 'location-marker',
            html: '<div style="background: #4285f4; width: 20px; height: 20px; border-radius: 50%; border: 4px solid rgba(66, 133, 244, 0.3);"></div>',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          })
        }).addTo(map).bindPopup('Vị trí của bạn');
      },
      function(error) {
        alert('Không thể lấy vị trí: ' + error.message);
      }
    );
  } else {
    alert('Trình duyệt không hỗ trợ định vị');
  }
});

// Distance measurement
var measureMode = false;
var measurePoints = [];
var measureLine = null;

document.getElementById('measureBtn').addEventListener('click', function() {
  measureMode = !measureMode;
  this.style.background = measureMode ? '#005BAC' : 'white';
  this.style.color = measureMode ? 'white' : '#333';

  if (!measureMode) {
    // Clear measurement
    if (measureLine) {
      map.removeLayer(measureLine);
      measureLine = null;
    }
    measurePoints = [];
  } else {
    alert('Chế độ đo khoảng cách: Click trên bản đồ để chọn điểm');
  }
});

map.on('click', function(e) {
  if (measureMode) {
    measurePoints.push(e.latlng);

    if (measurePoints.length > 1) {
      if (measureLine) {
        map.removeLayer(measureLine);
      }

      measureLine = L.polyline(measurePoints, {
        color: '#005BAC',
        weight: 3,
        dashArray: '10, 10'
      }).addTo(map);

      // Calculate total distance
      var totalDistance = 0;
      for (var i = 1; i < measurePoints.length; i++) {
        totalDistance += measurePoints[i-1].distanceTo(measurePoints[i]);
      }

      // Show distance in popup
      var lastPoint = measurePoints[measurePoints.length - 1];
      L.popup()
        .setLatLng(lastPoint)
        .setContent('Tổng khoảng cách: ' + (totalDistance / 1000).toFixed(2) + ' km')
        .openOn(map);
    }
  }
});

// Layer switcher
document.getElementById('layerBtn').addEventListener('click', function() {
  var layerSwitcher = document.getElementById('layerSwitcher');
  layerSwitcher.classList.toggle('active');
});

document.getElementById('layerClose').addEventListener('click', function() {
  document.getElementById('layerSwitcher').classList.remove('active');
});

document.querySelectorAll('.layer-option').forEach(function(option) {
  option.addEventListener('click', function() {
    var layerType = this.getAttribute('data-layer');

    // Remove all layers
    Object.values(mapLayers).forEach(function(layer) {
      map.removeLayer(layer);
    });

    // Add selected layer
    mapLayers[layerType].addTo(map);

    // Update active state
    document.querySelectorAll('.layer-option').forEach(function(opt) {
      opt.classList.remove('active');
    });
    this.classList.add('active');

    // Close switcher
    document.getElementById('layerSwitcher').classList.remove('active');
  });
});

// Search functionality
document.getElementById('searchBtn').addEventListener('click', performSearch);
document.getElementById('searchInput').addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    performSearch();
  }
});

function performSearch() {
  var query = document.getElementById('searchInput').value.trim();
  if (!query) return;

  // Using Nominatim for geocoding
  fetch('https://nominatim.openstreetmap.org/search?format=json&q=' + encodeURIComponent(query) + '&limit=1')
    .then(function(response) {
      return response.json();
    })
    .then(function(data) {
      if (data && data.length > 0) {
        var result = data[0];
        var lat = parseFloat(result.lat);
        var lng = parseFloat(result.lon);

        map.setView([lat, lng], 15);

        L.marker([lat, lng])
          .addTo(map)
          .bindPopup(result.display_name)
          .openPopup();
      } else {
        alert('Không tìm thấy địa điểm: ' + query);
      }
    })
    .catch(function(error) {
      console.error('Search error:', error);
      alert('Lỗi khi tìm kiếm. Vui lòng thử lại.');
    });
}

// Filter functionality
document.getElementById('filterToggle').addEventListener('click', function() {
  var filterContent = document.getElementById('filterContent');
  filterContent.classList.toggle('active');
});

document.getElementById('applyFilterBtn').addEventListener('click', function() {
  // Get selected filters
  var typeFilters = [];
  var severityFilters = [];

  document.querySelectorAll('.filter-options input[type="checkbox"]:checked').forEach(function(checkbox) {
    var value = checkbox.value;
    if (['oga', 'tainan', 'ngapnuoc', 'vatcan', 'kexe'].includes(value)) {
      typeFilters.push(value);
    } else if (['thap', 'trungbinh', 'cao'].includes(value)) {
      severityFilters.push(value);
    }
  });

  // Filter incidents
  var filteredIncidents = incidentData.filter(function(incident) {
    var typeMatch = typeFilters.length === 0 || typeFilters.includes(incident.type);
    var severityMatch = severityFilters.length === 0 || severityFilters.includes(incident.severity);
    return typeMatch && severityMatch;
  });

  // Update markers
  addMarkers(filteredIncidents);

  // Close filter panel
  document.getElementById('filterContent').classList.remove('active');

  // Show result count
  alert('Đã lọc: ' + filteredIncidents.length + ' sự cố');
});

// Legend toggle
map.on('load', function() {
  document.getElementById('mapLegend').classList.add('active');
});

document.getElementById('legendClose').addEventListener('click', function() {
  document.getElementById('mapLegend').classList.remove('active');
});

// Show legend button (add to controls)
var legendBtn = document.createElement('button');
legendBtn.className = 'map-control-btn';
legendBtn.title = 'Hiển thị chú giải';
legendBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
legendBtn.addEventListener('click', function() {
  document.getElementById('mapLegend').classList.toggle('active');
});

// Add legend button to controls
var controlGroup = document.querySelector('.map-control-group');
if (controlGroup) {
  controlGroup.appendChild(legendBtn);
}

// Hàm cập nhật giờ
function updateTime() {
  let now = new Date();
  document.getElementById("time").innerText = now.toLocaleString("vi-VN");
}
setInterval(updateTime, 1000);
updateTime();

// Navigation Logic
const navLinks = document.querySelectorAll('.nav-link');
const contentSections = document.querySelectorAll('.content-section');

// Handle navigation clicks
navLinks.forEach(link => {
  link.addEventListener('click', function(e) {
    e.preventDefault();

    // Remove active class from all links
    navLinks.forEach(l => l.classList.remove('active'));
    // Add active class to clicked link
    this.classList.add('active');

    // Get section name
    const sectionName = this.getAttribute('data-section');

    // Hide all content sections
    contentSections.forEach(section => {
      section.classList.remove('active');
    });

    // Show the appropriate section
    if (sectionName === 'home' || sectionName === 'map') {
      const homeSection = document.getElementById('home-section');
      if (homeSection) {
        homeSection.classList.add('active');
        // Invalidate map size after showing
        if (map) {
          setTimeout(() => map.invalidateSize(), 100);
        }
      }
    } else if (sectionName === 'report') {
      const reportSection = document.getElementById('report-section');
      if (reportSection) {
        reportSection.classList.add('active');
      }
    } else if (sectionName === 'about') {
      const aboutSection = document.getElementById('about-section');
      if (aboutSection) {
        aboutSection.classList.add('active');
      }
    }

    // Close mobile menu after navigation
    if (window.innerWidth <= 768) {
      navbarNav.classList.remove('active');
    }
  });
});

// Mobile Menu Toggle
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const navbarNav = document.getElementById('navbarNav');

if (mobileMenuBtn) {
  mobileMenuBtn.addEventListener('click', function() {
    navbarNav.classList.toggle('active');
  });
}

// Resize Handle Functionality
const resizeHandle = document.getElementById('resizeHandle');
const sidebar = document.getElementById('sidebar');
const container = document.querySelector('.container');
let isResizing = false;

if (resizeHandle && sidebar && container) {
  resizeHandle.addEventListener('mousedown', function(e) {
    isResizing = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  });

  document.addEventListener('mousemove', function(e) {
    if (!isResizing) return;

    const containerRect = container.getBoundingClientRect();
    const sidebarWidth = containerRect.right - e.clientX;

    // Set minimum and maximum widths
    const minWidth = 250;
    const maxWidth = 500;

    if (sidebarWidth >= minWidth && sidebarWidth <= maxWidth) {
      sidebar.style.width = sidebarWidth + 'px';
      sidebar.style.flex = 'none';
    }
  });

  document.addEventListener('mouseup', function() {
    if (isResizing) {
      isResizing = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      // Invalidate map size after resize
      if (map) {
        setTimeout(() => map.invalidateSize(), 100);
      }
    }
  });
}

// Fullscreen Toggle
const fullscreenBtn = document.getElementById('fullscreenBtn');

if (fullscreenBtn && container) {
  fullscreenBtn.addEventListener('click', function() {
    container.classList.toggle('fullscreen-mode');

    // Update button icon
    const isFullscreen = container.classList.contains('fullscreen-mode');
    if (isFullscreen) {
      fullscreenBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
        </svg>
      `;
      fullscreenBtn.title = 'Thoát chế độ toàn màn hình';
    } else {
      fullscreenBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
        </svg>
      `;
      fullscreenBtn.title = 'Chế độ toàn màn hình';
    }

    // Invalidate map size after mode change
    if (map) {
      setTimeout(() => map.invalidateSize(), 100);
    }
  });
}

// Handle window resize
window.addEventListener('resize', function() {
  // Close mobile menu on window resize
  if (window.innerWidth > 768) {
    navbarNav.classList.remove('active');
  }

  // Invalidate map size
  if (map) {
    map.invalidateSize();
  }
});

// Traffic Status Management
var trafficStatus = {
  connectionStatus: 'connecting', // connecting, connected, disconnected
  lastUpdateTime: null,
  trafficLevels: {
    normal: 0,
    congested: 0,
    jammed: 0,
    dangerous: 0
  },
  statistics: {
    avgSpeed: 0,
    travelTime: 0,
    restrictedRoutes: 0
  },
  warnings: []
};

// Update connection status
function updateConnectionStatus(status) {
  trafficStatus.connectionStatus = status;

  var statusDot = document.getElementById('statusDot');
  var statusText = document.getElementById('statusText');

  if (statusDot && statusText) {
    statusDot.className = 'status-dot ' + status;

    switch(status) {
      case 'connected':
        statusText.textContent = 'Đã kết nối';
        break;
      case 'disconnected':
        statusText.textContent = 'Mất kết nối';
        break;
      case 'connecting':
        statusText.textContent = 'Đang kết nối...';
        break;
    }
  }
}

// Update last update time
function updateLastUpdateTime() {
  var lastUpdateTimeSpan = document.getElementById('lastUpdateTime');
  if (lastUpdateTimeSpan) {
    trafficStatus.lastUpdateTime = new Date();
    lastUpdateTimeSpan.textContent = trafficStatus.lastUpdateTime.toLocaleTimeString('vi-VN');
  }
}

// Update traffic levels
function updateTrafficLevels() {
  // Simulate traffic level data based on incidents
  var totalIncidents = incidentData.length;

  // Random distribution for simulation
  trafficStatus.trafficLevels.normal = Math.floor(Math.random() * 5) + 3;
  trafficStatus.trafficLevels.congested = Math.floor(Math.random() * 4) + 2;
  trafficStatus.trafficLevels.jammed = Math.floor(Math.random() * 3) + 1;
  trafficStatus.trafficLevels.dangerous = Math.floor(Math.random() * 2);

  var total = trafficStatus.trafficLevels.normal +
              trafficStatus.trafficLevels.congested +
              trafficStatus.trafficLevels.jammed +
              trafficStatus.trafficLevels.dangerous;

  // Update UI
  document.getElementById('normalCount').textContent = trafficStatus.trafficLevels.normal;
  document.getElementById('congestedCount').textContent = trafficStatus.trafficLevels.congested;
  document.getElementById('jammedCount').textContent = trafficStatus.trafficLevels.jammed;
  document.getElementById('dangerousCount').textContent = trafficStatus.trafficLevels.dangerous;

  // Update progress bars
  if (total > 0) {
    document.getElementById('normalFill').style.width = (trafficStatus.trafficLevels.normal / total * 100) + '%';
    document.getElementById('congestedFill').style.width = (trafficStatus.trafficLevels.congested / total * 100) + '%';
    document.getElementById('jammedFill').style.width = (trafficStatus.trafficLevels.jammed / total * 100) + '%';
    document.getElementById('dangerousFill').style.width = (trafficStatus.trafficLevels.dangerous / total * 100) + '%';
  }
}

// Update traffic statistics
function updateTrafficStatistics() {
  // Simulate statistics
  trafficStatus.statistics.avgSpeed = Math.floor(Math.random() * 30) + 20; // 20-50 km/h
  trafficStatus.statistics.travelTime = Math.floor(Math.random() * 20) + 10; // 10-30 minutes
  trafficStatus.statistics.restrictedRoutes = Math.floor(Math.random() * 3); // 0-2 routes

  // Update UI
  document.getElementById('avgSpeed').textContent = trafficStatus.statistics.avgSpeed + ' km/h';
  document.getElementById('travelTime').textContent = trafficStatus.statistics.travelTime + ' phút';
  document.getElementById('restrictedRoutes').textContent = trafficStatus.statistics.restrictedRoutes + ' tuyến';
}

// Update traffic warnings
function updateTrafficWarnings() {
  trafficStatus.warnings = [];

  // Generate warnings based on conditions
  if (trafficStatus.trafficLevels.dangerous > 0) {
    trafficStatus.warnings.push({
      icon: '🚨',
      text: 'Có ' + trafficStatus.trafficLevels.dangerous + ' điểm nguy hiểm cần chú ý'
    });
  }

  if (trafficStatus.trafficLevels.jammed > 2) {
    trafficStatus.warnings.push({
      icon: '⚠️',
      text: 'Ùn tắc nghiêm trọng tại ' + trafficStatus.trafficLevels.jammed + ' điểm'
    });
  }

  if (trafficStatus.statistics.avgSpeed < 25) {
    trafficStatus.warnings.push({
      icon: '🐢',
      text: 'Tốc độ trung bình thấp, lưu thông chậm'
    });
  }

  // Update UI
  var warningList = document.getElementById('warningList');
  if (warningList) {
    if (trafficStatus.warnings.length > 0) {
      warningList.innerHTML = trafficStatus.warnings.map(function(warning) {
        return '<div class="warning-item">' +
               '<span class="warning-icon">' + warning.icon + '</span>' +
               '<span class="warning-text">' + warning.text + '</span>' +
               '</div>';
      }).join('');
    } else {
      warningList.innerHTML = '<div class="warning-item">' +
                             '<span class="warning-icon">✅</span>' +
                             '<span class="warning-text">Không có cảnh báo nào</span>' +
                             '</div>';
    }
  }
}

// Update overall status message
function updateOverallStatus() {
  var statusMessage = document.getElementById('statusMessage');
  if (statusMessage) {
    var totalIncidents = incidentData.length;
    var totalTrafficIssues = trafficStatus.trafficLevels.normal +
                            trafficStatus.trafficLevels.congested +
                            trafficStatus.trafficLevels.jammed +
                            trafficStatus.trafficLevels.dangerous;

    if (trafficStatus.connectionStatus === 'disconnected') {
      statusMessage.innerHTML = '<span style="color: #e74c3c;">❌ Mất kết nối đến máy chủ dữ liệu</span>';
    } else if (trafficStatus.connectionStatus === 'connecting') {
      statusMessage.innerHTML = '<span style="color: #f39c12;">⏳ Đang kết nối đến nguồn dữ liệu...</span>';
    } else {
      statusMessage.innerHTML = '✅ Đã cập nhật ' + totalIncidents + ' sự cố, ' +
                               totalTrafficIssues + ' vấn đề giao thông - ' +
                               'Tốc độ trung bình: ' + trafficStatus.statistics.avgSpeed + ' km/h';
    }
  }
}

// Show error notification
function showErrorNotification(message) {
  var errorNotification = document.getElementById('errorNotification');
  var errorMessage = document.getElementById('errorMessage');

  if (errorNotification && errorMessage) {
    errorMessage.textContent = message;
    errorNotification.style.display = 'block';

    // Auto-hide after 5 seconds
    setTimeout(function() {
      errorNotification.style.display = 'none';
    }, 5000);
  }
}

// Close error notification
document.getElementById('errorClose').addEventListener('click', function() {
  var errorNotification = document.getElementById('errorNotification');
  if (errorNotification) {
    errorNotification.style.display = 'none';
  }
});

// Simulate connection status changes
function simulateConnectionStatus() {
  // Start with connecting
  updateConnectionStatus('connecting');

  // Simulate successful connection after 2 seconds
  setTimeout(function() {
    updateConnectionStatus('connected');
    updateLastUpdateTime();
  }, 2000);

  // Simulate occasional disconnection
  setInterval(function() {
    if (Math.random() < 0.1) { // 10% chance of disconnection
      updateConnectionStatus('disconnected');
      showErrorNotification('Mất kết nối đến máy chủ. Đang thử kết nối lại...');

      // Reconnect after 3 seconds
      setTimeout(function() {
        updateConnectionStatus('connected');
        updateLastUpdateTime();
      }, 3000);
    }
  }, 30000); // Check every 30 seconds
}

// Update all traffic status information
function updateAllTrafficStatus() {
  updateTrafficLevels();
  updateTrafficStatistics();
  updateTrafficWarnings();
  updateOverallStatus();
  updateLastUpdateTime();
}

// Simulate real-time updates
function simulateRealTimeUpdates() {
  setInterval(function() {
    // Randomly update incident data
    var randomIndex = Math.floor(Math.random() * incidentData.length);
    var incident = incidentData[randomIndex];

    // Slightly change position to simulate movement/update
    incident.lat += (Math.random() - 0.5) * 0.001;
    incident.lng += (Math.random() - 0.5) * 0.001;

    // Update markers without full reload
    addMarkers(incidentData);

    // Update all traffic status
    updateAllTrafficStatus();
  }, 30000); // Update every 30 seconds
}

// Initialize traffic status
function initializeTrafficStatus() {
  simulateConnectionStatus();
  updateAllTrafficStatus();
  simulateRealTimeUpdates();
}

// Start traffic status initialization
setTimeout(function() {
  initializeTrafficStatus();
}, 100);