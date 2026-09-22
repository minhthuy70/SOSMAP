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

// Incident Reporting System
var incidentReports = [];
var currentLocation = null;

// Use current location
document.getElementById('useCurrentLocation').addEventListener('click', function() {
  if (navigator.geolocation) {
    this.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="3"></circle></svg> Đang lấy vị trí...';
    this.disabled = true;

    navigator.geolocation.getCurrentPosition(
      function(position) {
        currentLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };

        document.getElementById('latitude').value = currentLocation.lat.toFixed(6);
        document.getElementById('longitude').value = currentLocation.lng.toFixed(6);

        // Reverse geocoding to get address
        fetch('https://nominatim.openstreetmap.org/reverse?format=json&lat=' + currentLocation.lat + '&lon=' + currentLocation.lng)
          .then(function(response) {
            return response.json();
          })
          .then(function(data) {
            if (data && data.display_name) {
              document.getElementById('address').value = data.display_name;
            }
          })
          .catch(function() {
            // Address lookup failed, but coordinates are set
          });

        // Reset button
        var btn = document.getElementById('useCurrentLocation');
        btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="3"></circle></svg> Đã lấy vị trí';
        btn.disabled = false;
      },
      function(error) {
        alert('Không thể lấy vị trí: ' + error.message);
        var btn = document.getElementById('useCurrentLocation');
        btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="3"></circle></svg> Sử dụng vị trí hiện tại';
        btn.disabled = false;
      }
    );
  } else {
    alert('Trình duyệt không hỗ trợ định vị');
  }
});

// Select location on map
document.getElementById('selectOnMap').addEventListener('click', function() {
  // Switch to map view
  var homeSection = document.getElementById('home-section');
  var reportSection = document.getElementById('report-section');

  if (homeSection && reportSection) {
    reportSection.classList.remove('active');
    homeSection.classList.add('active');

    // Update navigation
    document.querySelectorAll('.nav-link').forEach(function(link) {
      link.classList.remove('active');
      if (link.getAttribute('data-section') === 'map') {
        link.classList.add('active');
      }
    });

    // Enable map click for location selection
    map.once('click', function(e) {
      currentLocation = {
        lat: e.latlng.lat,
        lng: e.latlng.lng
      };

      document.getElementById('latitude').value = currentLocation.lat.toFixed(6);
      document.getElementById('longitude').value = currentLocation.lng.toFixed(6);

      // Reverse geocoding
      fetch('https://nominatim.openstreetmap.org/reverse?format=json&lat=' + currentLocation.lat + '&lon=' + currentLocation.lng)
        .then(function(response) {
          return response.json();
        })
        .then(function(data) {
          if (data && data.display_name) {
            document.getElementById('address').value = data.display_name;
          }
        })
        .catch(function() {
          // Address lookup failed
        });

      // Add temporary marker
      L.marker([currentLocation.lat, currentLocation.lng])
        .addTo(map)
        .bindPopup('Vị trí đã chọn')
        .openPopup();

      // Switch back to report form
      setTimeout(function() {
        homeSection.classList.remove('active');
        reportSection.classList.add('active');

        document.querySelectorAll('.nav-link').forEach(function(link) {
          link.classList.remove('active');
          if (link.getAttribute('data-section') === 'report') {
            link.classList.add('active');
          }
        });
      }, 1000);
    });

    alert('Click trên bản đồ để chọn vị trí sự cố');
  }
});

// Image upload preview
document.getElementById('incidentImage').addEventListener('change', function(e) {
  var preview = document.getElementById('imagePreview');
  preview.innerHTML = '';

  var files = Array.from(e.target.files).slice(0, 5); // Max 5 images

  files.forEach(function(file, index) {
    if (file.type.startsWith('image/')) {
      var reader = new FileReader();
      reader.onload = function(e) {
        var div = document.createElement('div');
        div.className = 'file-preview-item';
        div.innerHTML = '<img src="' + e.target.result + '" alt="Preview">' +
                       '<button type="button" class="remove-file" data-index="' + index + '" data-type="image">×</button>';
        preview.appendChild(div);
      };
      reader.readAsDataURL(file);
    }
  });

  // Add remove functionality
  preview.querySelectorAll('.remove-file').forEach(function(btn) {
    btn.addEventListener('click', function() {
      this.parentElement.remove();
    });
  });
});

// Video upload preview
document.getElementById('incidentVideo').addEventListener('change', function(e) {
  var preview = document.getElementById('videoPreview');
  preview.innerHTML = '';

  var file = e.target.files[0];
  if (file && file.type.startsWith('video/')) {
    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      alert('Video quá lớn. Vui lòng chọn video dưới 50MB');
      this.value = '';
      return;
    }

    var reader = new FileReader();
    reader.onload = function(e) {
      var div = document.createElement('div');
      div.className = 'file-preview-item';
      div.innerHTML = '<video src="' + e.target.result + '" controls></video>' +
                     '<button type="button" class="remove-file" data-type="video">×</button>';
      preview.appendChild(div);

      // Add remove functionality
      div.querySelector('.remove-file').addEventListener('click', function() {
        div.remove();
        document.getElementById('incidentVideo').value = '';
      });
    };
    reader.readAsDataURL(file);
  }
});

// Form submission
document.getElementById('incidentForm').addEventListener('submit', function(e) {
  e.preventDefault();

  // Validate required fields
  var requiredFields = ['incidentType', 'incidentTitle', 'incidentDescription', 'severity'];
  var isValid = true;

  requiredFields.forEach(function(fieldId) {
    var field = document.getElementById(fieldId);
    if (!field.value.trim()) {
      field.style.borderColor = '#e74c3c';
      isValid = false;
    } else {
      field.style.borderColor = '#ddd';
    }
  });

  // Validate location
  var lat = document.getElementById('latitude').value;
  var lng = document.getElementById('longitude').value;
  if (!lat || !lng) {
    alert('Vui lòng chọn vị trí sự cố');
    isValid = false;
  }

  if (!isValid) {
    alert('Vui lòng điền đầy đủ các trường bắt buộc');
    return;
  }

  // Create incident report object
  var report = {
    id: 'INC-' + Date.now(),
    type: document.getElementById('incidentType').value,
    title: document.getElementById('incidentTitle').value,
    description: document.getElementById('incidentDescription').value,
    location: {
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      address: document.getElementById('address').value
    },
    severity: document.getElementById('severity').value,
    contact: {
      name: document.getElementById('contactName').value,
      phone: document.getElementById('contactPhone').value,
      email: document.getElementById('contactEmail').value
    },
    anonymous: document.getElementById('anonymous').checked,
    status: 'pending',
    createdAt: new Date().toISOString(),
    hasImages: document.getElementById('incidentImage').files.length > 0,
    hasVideo: document.getElementById('incidentVideo').files.length > 0
  };

  // Add to reports list
  incidentReports.push(report);

  // Add to incident data for map display
  incidentData.push({
    id: report.id,
    type: report.type,
    name: report.title,
    lat: report.location.lat,
    lng: report.location.lng,
    severity: report.severity
  });

  // Update map markers
  addMarkers(incidentData);

  // Show success message
  alert('Phản ánh đã được gửi thành công!\nMã số: ' + report.id + '\nChúng tôi sẽ xem xét và xử lý sớm nhất.');

  // Clear form
  clearIncidentForm();

  // Update reports list
  updateReportsList();
});

// Clear form
document.getElementById('clearForm').addEventListener('click', clearIncidentForm);

function clearIncidentForm() {
  document.getElementById('incidentForm').reset();
  document.getElementById('imagePreview').innerHTML = '';
  document.getElementById('videoPreview').innerHTML = '';
  currentLocation = null;

  // Reset field styles
  document.querySelectorAll('.form-group input, .form-group select, .form-group textarea').forEach(function(field) {
    field.style.borderColor = '#ddd';
  });
}

// Update reports list
function updateReportsList() {
  var reportsList = document.getElementById('reportsList');

  if (incidentReports.length === 0) {
    reportsList.innerHTML = '<div class="empty-state">' +
                           '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>' +
                           '<p>Chưa có phản ánh nào</p>' +
                           '</div>';
    return;
  }

  reportsList.innerHTML = incidentReports.map(function(report) {
    var statusClass = report.status;
    var statusText = report.status === 'pending' ? 'Chờ xử lý' :
                    report.status === 'processing' ? 'Đang xử lý' : 'Đã giải quyết';

    var createdDate = new Date(report.createdAt);
    var formattedDate = createdDate.toLocaleDateString('vi-VN') + ' ' + createdDate.toLocaleTimeString('vi-VN');

    var verificationBadge = '';
    if (report.verification) {
      var verificationColors = {
        'verified': '#2ecc71',
        'unverified': '#f39c12',
        'duplicate': '#e74c3c',
        'invalid': '#95a5a6'
      };
      var verificationText = {
        'verified': 'Đã xác minh',
        'unverified': 'Chưa xác minh',
        'duplicate': 'Trùng lặp',
        'invalid': 'Không hợp lệ'
      };
      verificationBadge = '<span style="color: ' + verificationColors[report.verification.status] + '; font-size: 11px; margin-left: 8px;">• ' + verificationText[report.verification.status] + '</span>';
    }

    var supplementInfo = '';
    if (report.supplements && report.supplements.length > 0) {
      supplementInfo = '<span style="color: #3498db; font-size: 11px; margin-left: 8px;">• Đã bổ sung ' + report.supplements.length + ' lần</span>';
    }

    return '<div class="report-item ' + report.type + '">' +
           '<div class="report-item-content">' +
           '<div class="report-item-title">' + report.title + '</div>' +
           '<div class="report-item-meta">' +
           '<span>Mã: ' + report.id + '</span> • ' +
           '<span>' + formattedDate + '</span> • ' +
           '<span class="report-item-status ' + statusClass + '">' + statusText + '</span>' +
           verificationBadge +
           supplementInfo +
           '</div>' +
           '<div class="report-item-actions">' +
           '<button onclick="viewReportDetail(\'' + report.id + '\')">Xem chi tiết</button>' +
           (report.status === 'pending' ? '<button onclick="editReport(\'' + report.id + '\')">Chỉnh sửa</button>' : '') +
           (report.status === 'pending' ? '<button onclick="cancelReport(\'' + report.id + '\')">Hủy bỏ</button>' : '') +
           '<button onclick="showVerificationDialog(\'' + report.id + '\')">Xác minh</button>' +
           (report.status === 'pending' ? '<button onclick="supplementReport(\'' + report.id + '\')">Bổ sung</button>' : '') +
           '</div>' +
           '</div>' +
           '</div>';
  }).join('');
}

// View report detail
function viewReportDetail(reportId) {
  var report = incidentReports.find(function(r) {
    return r.id === reportId;
  });

  if (report) {
    var modal = document.getElementById('reportDetailModal');
    var modalBody = document.getElementById('modalBody');

    var createdDate = new Date(report.createdAt);
    var formattedDate = createdDate.toLocaleDateString('vi-VN') + ' ' + createdDate.toLocaleTimeString('vi-VN');

    var statusText = report.status === 'pending' ? 'Chờ xử lý' :
                    report.status === 'processing' ? 'Đang xử lý' : 'Đã giải quyết';

    var severityText = getSeverityName(report.severity);

    var modalContent = '<div class="detail-section">' +
                       '<h4>Thông tin chung</h4>' +
                       '<div class="detail-row">' +
                       '<div class="detail-label">Mã số:</div>' +
                       '<div class="detail-value">' + report.id + '</div>' +
                       '</div>' +
                       '<div class="detail-row">' +
                       '<div class="detail-label">Tiêu đề:</div>' +
                       '<div class="detail-value">' + report.title + '</div>' +
                       '</div>' +
                       '<div class="detail-row">' +
                       '<div class="detail-label">Loại sự cố:</div>' +
                       '<div class="detail-value">' + getIncidentTypeName(report.type) + '</div>' +
                       '</div>' +
                       '<div class="detail-row">' +
                       '<div class="detail-label">Mức độ:</div>' +
                       '<div class="detail-value"><span class="severity-badge ' + report.severity + '">' + severityText + '</span></div>' +
                       '</div>' +
                       '<div class="detail-row">' +
                       '<div class="detail-label">Trạng thái:</div>' +
                       '<div class="detail-value"><span class="status-badge ' + report.status + '">' + statusText + '</span></div>' +
                       '</div>' +
                       '<div class="detail-row">' +
                       '<div class="detail-label">Ngày tạo:</div>' +
                       '<div class="detail-value">' + formattedDate + '</div>' +
                       '</div>' +
                       '</div>' +

                       '<div class="detail-section">' +
                       '<h4>Mô tả chi tiết</h4>' +
                       '<div class="detail-row">' +
                       '<div class="detail-value">' + report.description + '</div>' +
                       '</div>' +
                       '</div>' +

                       '<div class="detail-section">' +
                       '<h4>Vị trí</h4>' +
                       '<div class="detail-row">' +
                       '<div class="detail-label">Địa chỉ:</div>' +
                       '<div class="detail-value">' + (report.location.address || 'Chưa có địa chỉ') + '</div>' +
                       '</div>' +
                       '<div class="detail-row">' +
                       '<div class="detail-label">Tọa độ:</div>' +
                       '<div class="detail-value">' + report.location.lat.toFixed(6) + ', ' + report.location.lng.toFixed(6) + '</div>' +
                       '</div>' +
                       '</div>' +

                       '<div class="detail-section">' +
                       '<h4>Thông tin liên hệ</h4>' +
                       '<div class="detail-row">' +
                       '<div class="detail-label">Họ tên:</div>' +
                       '<div class="detail-value">' + (report.contact.name || (report.anonymous ? 'Ẩn danh' : 'Chưa cung cấp')) + '</div>' +
                       '</div>' +
                       '<div class="detail-row">' +
                       '<div class="detail-label">SĐT:</div>' +
                       '<div class="detail-value">' + (report.contact.phone || 'Chưa cung cấp') + '</div>' +
                       '</div>' +
                       '<div class="detail-row">' +
                       '<div class="detail-label">Email:</div>' +
                       '<div class="detail-value">' + (report.contact.email || 'Chưa cung cấp') + '</div>' +
                       '</div>' +
                       '</div>' +

                       '<div class="detail-section">' +
                       '<h4>Tệp đính kèm</h4>' +
                       '<div class="detail-row">' +
                       '<div class="detail-label">Hình ảnh:</div>' +
                       '<div class="detail-value">' + (report.hasImages ? 'Có (' + (report.hasImages ? '1+' : '0') + ' ảnh)' : 'Không có') + '</div>' +
                       '</div>' +
                       '<div class="detail-row">' +
                       '<div class="detail-label">Video:</div>' +
                       '<div class="detail-value">' + (report.hasVideo ? 'Có' : 'Không có') + '</div>' +
                       '</div>' +
                       '</div>';

    // Add verification information if available
    if (report.verification) {
      var verificationText = {
        'verified': 'Đã xác minh',
        'unverified': 'Chưa xác minh',
        'duplicate': 'Trùng lặp',
        'invalid': 'Không hợp lệ'
      };

      modalContent += '<div class="detail-section">' +
                      '<h4>Xác minh</h4>' +
                      '<div class="detail-row">' +
                      '<div class="detail-label">Trạng thái:</div>' +
                      '<div class="detail-value">' + verificationText[report.verification.status] + '</div>' +
                      '</div>' +
                      '<div class="detail-row">' +
                      '<div class="detail-label">Mức độ tin cậy:</div>' +
                      '<div class="detail-value">' + (report.verification.reliabilityLevel === 'high' ? 'Cao' : report.verification.reliabilityLevel === 'medium' ? 'Trung bình' : 'Thấp') + '</div>' +
                      '</div>' +
                      '<div class="detail-row">' +
                      '<div class="detail-label">Thời gian xác minh:</div>' +
                      '<div class="detail-value">' + new Date(report.verification.verifiedAt).toLocaleString('vi-VN') + '</div>' +
                      '</div>' +
                      '</div>';
    }

    // Add supplement information if available
    if (report.supplements && report.supplements.length > 0) {
      modalContent += '<div class="detail-section">' +
                      '<h4>Thông tin bổ sung</h4>' +
                      report.supplements.map(function(supplement) {
                        return '<div class="detail-row">' +
                               '<div class="detail-label">' + new Date(supplement.timestamp).toLocaleString('vi-VN') + ':</div>' +
                               '<div class="detail-value">' + supplement.content + '</div>' +
                               '</div>';
                      }).join('') +
                      '</div>';
    }

    // Add status history if available
    if (report.statusHistory && report.statusHistory.length > 0) {
      modalContent += '<div class="detail-section">' +
                      '<h4>Lịch sử trạng thái</h4>' +
                      report.statusHistory.map(function(history) {
                        var statusText = history.status === 'pending' ? 'Chờ xử lý' :
                                       history.status === 'processing' ? 'Đang xử lý' :
                                       history.status === 'resolved' ? 'Đã giải quyết' :
                                       history.status === 'edited' ? 'Đã chỉnh sửa' :
                                       history.status === 'supplemented' ? 'Đã bổ sung' : history.status;
                        return '<div class="detail-row">' +
                               '<div class="detail-label">' + new Date(history.timestamp).toLocaleString('vi-VN') + ':</div>' +
                               '<div class="detail-value">' + statusText + (history.note ? ' - ' + history.note : '') + '</div>' +
                               '</div>';
                      }).join('') +
                      '</div>';
    }

    modalBody.innerHTML = modalContent;
    modal.style.display = 'flex';

    modal.style.display = 'flex';
  }
}

// Close modal
document.getElementById('closeModal').addEventListener('click', function() {
  document.getElementById('reportDetailModal').style.display = 'none';
});

document.getElementById('closeModalBtn').addEventListener('click', function() {
  document.getElementById('reportDetailModal').style.display = 'none';
});

// Close modal when clicking outside
window.addEventListener('click', function(e) {
  var modal = document.getElementById('reportDetailModal');
  if (e.target === modal) {
    modal.style.display = 'none';
  }
});

// Cancel report
function cancelReport(reportId) {
  if (confirm('Bạn có chắc muốn hủy phản ánh này?')) {
    var index = incidentReports.findIndex(function(r) {
      return r.id === reportId;
    });

    if (index !== -1) {
      incidentReports.splice(index, 1);

      // Remove from incident data
      var incidentIndex = incidentData.findIndex(function(i) {
        return i.id === reportId;
      });

      if (incidentIndex !== -1) {
        incidentData.splice(incidentIndex, 1);
        addMarkers(incidentData);
      }

      updateReportsList();
      alert('Đã hủy phản ánh thành công');
    }
  }
}

// Initialize reports list
updateReportsList();

// Report Status Updates (simulation)
function simulateReportStatusUpdates() {
  setInterval(function() {
    if (incidentReports.length > 0) {
      var pendingReports = incidentReports.filter(function(r) {
        return r.status === 'pending';
      });

      if (pendingReports.length > 0) {
        var randomReport = pendingReports[Math.floor(Math.random() * pendingReports.length)];

        // Move to processing status
        randomReport.status = 'processing';
        randomReport.statusHistory = randomReport.statusHistory || [];
        randomReport.statusHistory.push({
          status: 'processing',
          timestamp: new Date().toISOString(),
          note: 'Bắt đầu xử lý'
        });

        updateReportsList();

        // After some time, move to resolved
        setTimeout(function() {
          if (randomReport.status === 'processing') {
            randomReport.status = 'resolved';
            randomReport.statusHistory.push({
              status: 'resolved',
              timestamp: new Date().toISOString(),
              note: 'Đã giải quyết'
            });

            updateReportsList();

            // Show notification
            if (Notification.permission === 'granted') {
              new Notification('SOSMAP', {
                body: 'Phản ánh ' + randomReport.id + ' đã được giải quyết'
              });
            }
          }
        }, 30000); // 30 seconds to resolve
      }
    }
  }, 45000); // Check every 45 seconds
}

// Request notification permission
if ('Notification' in window && Notification.permission === 'default') {
  Notification.requestPermission();
}

// Start status update simulation
simulateReportStatusUpdates();

// Alerts and Notifications System
var alerts = [];
var notifications = [];
var notificationSettings = {
  inApp: true,
  push: true,
  email: false,
  radius: 10, // km
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
  alertTypes: {
    tainan: true,
    ngapnuoc: true,
    chayno: true,
    khac: true
  }
};

// Create alert
function createAlert(type, title, message, location, severity = 'normal') {
  var alert = {
    id: 'ALERT-' + Date.now(),
    type: type,
    title: title,
    message: message,
    location: location,
    severity: severity,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour
    dismissed: false,
    viewed: false
  };

  alerts.push(alert);
  updateAlertsList();

  // Show popup for critical alerts
  if (severity === 'critical') {
    showAlertPopup(alert);
  }

  // Create notification
  createNotification(title, message, type);

  return alert;
}

// Update alerts list
function updateAlertsList() {
  var alertsList = document.getElementById('alertsList');

  // Filter out expired and dismissed alerts
  var activeAlerts = alerts.filter(function(alert) {
    return new Date(alert.expiresAt) > new Date() && !alert.dismissed;
  });

  if (activeAlerts.length === 0) {
    alertsList.innerHTML = '<div class="empty-state">' +
                          '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>' +
                          '<p>Không có cảnh báo nào</p>' +
                          '</div>';
    showAlertAreas();
    return;
  }

  alertsList.innerHTML = activeAlerts.map(function(alert) {
    var severityClass = alert.severity === 'critical' ? 'critical' : '';
    var createdTime = new Date(alert.createdAt);
    var formattedTime = createdTime.toLocaleTimeString('vi-VN');

    return '<div class="alert-item ' + severityClass + '" data-id="' + alert.id + '">' +
           '<div class="alert-item-content">' +
           '<div class="alert-item-title">' + alert.title + '</div>' +
           '<div class="alert-item-meta">' +
           '<span>' + formattedTime + '</span> • ' +
           '<span>' + alert.location + '</span>' +
           '</div>' +
           '<div class="alert-item-description">' + alert.message + '</div>' +
           '</div>' +
           '<div class="alert-item-actions">' +
           '<button onclick="viewAlertDetails(\'' + alert.id + '\')">Chi tiết</button>' +
           '<button onclick="dismissAlert(\'' + alert.id + '\')">Đóng</button>' +
           '</div>' +
           '</div>';
  }).join('');

  showAlertAreas();
}

// Show alert popup
function showAlertPopup(alert) {
  var popup = document.getElementById('alertPopup');
  var alertIcon = document.getElementById('alertIcon');
  var alertTitle = document.getElementById('alertTitle');
  var alertMessage = document.getElementById('alertMessage');
  var alertLocation = document.getElementById('alertLocation');
  var alertTime = document.getElementById('alertTime');

  var iconMap = {
    'tainan': '🚗',
    'ngapnuoc': '🌊',
    'chayno': '🔥',
    'khac': '⚠️'
  };

  alertIcon.textContent = iconMap[alert.type] || '⚠️';
  alertTitle.textContent = alert.title;
  alertMessage.textContent = alert.message;
  alertLocation.textContent = alert.location;
  alertTime.textContent = new Date(alert.createdAt).toLocaleTimeString('vi-VN');

  popup.style.display = 'block';

  // Auto-hide after 10 seconds
  setTimeout(function() {
    if (popup.style.display === 'block') {
      popup.style.display = 'none';
    }
  }, 10000);
}

// Dismiss alert
function dismissAlert(alertId) {
  var alert = alerts.find(function(a) {
    return a.id === alertId;
  });

  if (alert) {
    alert.dismissed = true;
    updateAlertsList();
  }
}

// View alert details
function viewAlertDetails(alertId) {
  var alert = alerts.find(function(a) {
    return a.id === alertId;
  });

  if (alert) {
    var details = 'Cảnh báo: ' + alert.title + '\n' +
                 'Loại: ' + alert.type + '\n' +
                 'Mô tả: ' + alert.message + '\n' +
                 'Vị trí: ' + alert.location + '\n' +
                 'Mức độ: ' + (alert.severity === 'critical' ? 'Nghiêm trọng' : 'Bình thường') + '\n' +
                 'Thời gian: ' + new Date(alert.createdAt).toLocaleString('vi-VN') + '\n' +
                 'Hết hạn: ' + new Date(alert.expiresAt).toLocaleString('vi-VN');

    alert(details);
  }
}

// Create notification
function createNotification(title, message, type = 'info') {
  if (!notificationSettings.inApp) return;

  var notification = {
    id: 'NOTIF-' + Date.now(),
    title: title,
    message: message,
    type: type,
    createdAt: new Date().toISOString(),
    read: false
  };

  notifications.unshift(notification);
  updateNotificationsList();

  // Browser notification
  if (notificationSettings.push && 'Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body: message,
      icon: '/favicon.ico'
    });
  }

  return notification;
}

// Update notifications list
function updateNotificationsList() {
  var notificationsList = document.getElementById('notificationsList');

  if (notifications.length === 0) {
    notificationsList.innerHTML = '<div class="empty-state">' +
                                  '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>' +
                                  '<p>Không có thông báo nào</p>' +
                                  '</div>';
    return;
  }

  notificationsList.innerHTML = notifications.map(function(notification) {
    var readClass = notification.read ? '' : 'unread';
    var createdTime = new Date(notification.createdAt);
    var formattedTime = createdTime.toLocaleTimeString('vi-VN');

    return '<div class="notification-item ' + readClass + '" data-id="' + notification.id + '">' +
           '<div class="notification-item-content">' +
           '<div class="notification-item-title">' + notification.title + '</div>' +
           '<div class="notification-item-time">' + formattedTime + '</div>' +
           '<div class="notification-item-message">' + notification.message + '</div>' +
           '</div>' +
           '<div class="notification-item-actions">' +
           '<button onclick="markAsRead(\'' + notification.id + '\')">Đọc</button>' +
           '<button onclick="deleteNotification(\'' + notification.id + '\')">Xóa</button>' +
           '</div>' +
           '</div>';
  }).join('');
}

// Mark notification as read
function markAsRead(notificationId) {
  var notification = notifications.find(function(n) {
    return n.id === notificationId;
  });

  if (notification) {
    notification.read = true;
    updateNotificationsList();
  }
}

// Delete notification
function deleteNotification(notificationId) {
  var index = notifications.findIndex(function(n) {
    return n.id === notificationId;
  });

  if (index !== -1) {
    notifications.splice(index, 1);
    updateNotificationsList();
  }
}

// Alert popup controls
document.getElementById('alertPopupClose').addEventListener('click', function() {
  document.getElementById('alertPopup').style.display = 'none';
});

document.getElementById('alertDismiss').addEventListener('click', function() {
  document.getElementById('alertPopup').style.display = 'none';
});

document.getElementById('alertViewDetails').addEventListener('click', function() {
  // Get current alert details (simplified)
  alert('Chi tiết cảnh báo sẽ được hiển thị trong phiên bản đầy đủ');
  document.getElementById('alertPopup').style.display = 'none';
});

// Notification settings modal
document.getElementById('notificationSettings').addEventListener('click', function() {
  document.getElementById('notificationSettingsModal').style.display = 'flex';
});

document.getElementById('closeSettingsModal').addEventListener('click', function() {
  document.getElementById('notificationSettingsModal').style.display = 'none';
});

document.getElementById('cancelSettings').addEventListener('click', function() {
  document.getElementById('notificationSettingsModal').style.display = 'none';
});

document.getElementById('saveSettings').addEventListener('click', function() {
  notificationSettings.inApp = document.getElementById('enableInApp').checked;
  notificationSettings.push = document.getElementById('enablePush').checked;
  notificationSettings.email = document.getElementById('enableEmail').checked;
  notificationSettings.radius = parseInt(document.getElementById('notificationRadius').value);
  notificationSettings.quietHoursStart = document.getElementById('quietHoursStart').value;
  notificationSettings.quietHoursEnd = document.getElementById('quietHoursEnd').value;
  notificationSettings.alertTypes.tainan = document.getElementById('alertTaiNan').checked;
  notificationSettings.alertTypes.ngapnuoc = document.getElementById('alertNgapNuoc').checked;
  notificationSettings.alertTypes.chayno = document.getElementById('alertChayNo').checked;
  notificationSettings.alertTypes.khac = document.getElementById('alertKhac').checked;

  document.getElementById('notificationSettingsModal').style.display = 'none';
  alert('Đã lưu cài đặt thông báo!');
});

// Radius slider update
document.getElementById('notificationRadius').addEventListener('input', function() {
  document.getElementById('radiusValue').textContent = this.value + ' km';
});

// Simulate alerts based on incidents
function simulateAlerts() {
  setInterval(function() {
    if (incidentData.length > 0 && Math.random() < 0.3) { // 30% chance
      var randomIncident = incidentData[Math.floor(Math.random() * incidentData.length)];

      var alertTypes = {
        'tainan': { title: 'Tai nạn giao thông', severity: 'critical' },
        'ngapnuoc': { title: 'Ngập nước', severity: 'normal' },
        'oga': { title: 'Ổ gà nguy hiểm', severity: 'normal' },
        'vatcan': { title: 'Vật cản đường', severity: 'normal' },
        'kexe': { title: 'Kẹt xe nghiêm trọng', severity: 'normal' }
      };

      var alertInfo = alertTypes[randomIncident.type] || alertTypes['khac'];

      // Check if this alert type is enabled
      if (notificationSettings.alertTypes[randomIncident.type] || notificationSettings.alertTypes.khac) {
        createAlert(
          randomIncident.type,
          alertInfo.title,
          'Phát hiện ' + alertInfo.title.toLowerCase() + ' tại khu vực ' + randomIncident.name,
          randomIncident.name,
          alertInfo.severity
        );
      }
    }
  }, 60000); // Check every minute
}

// Simulate general notifications
function simulateNotifications() {
  setInterval(function() {
    if (Math.random() < 0.2) { // 20% chance
      var notificationTypes = [
        { title: 'Cập nhật hệ thống', message: 'Hệ thống đã được cập nhật phiên bản mới' },
        { title: 'Cảnh báo thời tiết', message: 'Dự báo mưa lớn trong vài giờ tới' },
        { title: 'Thông báo bảo trì', message: 'Hệ thống sẽ bảo trì vào 23:00' },
        { title: 'Sự cố mới', message: 'Có ' + Math.floor(Math.random() * 5) + ' sự cố mới được báo cáo' }
      ];

      var randomNotif = notificationTypes[Math.floor(Math.random() * notificationTypes.length)];
      createNotificationWithQuietCheck(randomNotif.title, randomNotif.message);
    }
  }, 90000); // Check every 90 seconds
}

// Proximity-based alerts
function checkProximityAlerts() {
  if (!currentLocation) return;

  incidentData.forEach(function(incident) {
    var incidentLatLng = L.latLng(incident.lat, incident.lng);
    var userLatLng = L.latLng(currentLocation.lat, currentLocation.lng);
    var distance = userLatLng.distanceTo(incidentLatLng) / 1000; // Convert to km

    if (distance <= notificationSettings.radius) {
      // Check if alert type is enabled
      if (notificationSettings.alertTypes[incident.type] || notificationSettings.alertTypes.khac) {
        var alertTypes = {
          'tainan': { title: 'Tai nạn gần bạn', severity: 'critical' },
          'ngapnuoc': { title: 'Ngập nước gần bạn', severity: 'normal' },
          'oga': { title: 'Ổ gà gần bạn', severity: 'normal' },
          'vatcan': { title: 'Vật cản gần bạn', severity: 'normal' },
          'kexe': { title: 'Kẹt xe gần bạn', severity: 'normal' }
        };

        var alertInfo = alertTypes[incident.type] || alertTypes['khac'];

        // Check if alert already exists for this incident
        var existingAlert = alerts.find(function(a) {
          return a.location === incident.name && a.type === incident.type;
        });

        if (!existingAlert) {
          createAlert(
            incident.type,
            alertInfo.title,
            'Cách ' + distance.toFixed(1) + ' km - ' + incident.name,
            incident.name,
            alertInfo.severity
          );
        }
      }
    }
  });
}

// Run proximity check periodically
setInterval(function() {
  if (currentLocation) {
    checkProximityAlerts();
  }
}, 30000); // Check every 30 seconds

// Add alert area circles to map for visualization
function showAlertAreas() {
  // Remove existing alert circles
  map.eachLayer(function(layer) {
    if (layer instanceof L.Circle && layer.options.isAlertArea) {
      map.removeLayer(layer);
    }
  });

  // Add circles for active alerts
  alerts.forEach(function(alert) {
    if (!alert.dismissed && new Date(alert.expiresAt) > new Date()) {
      // Find corresponding incident
      var incident = incidentData.find(function(i) {
        return i.name === alert.location;
      });

      if (incident) {
        var color = alert.severity === 'critical' ? '#e74c3c' : '#f39c12';
        L.circle([incident.lat, incident.lng], {
          radius: notificationSettings.radius * 1000, // Convert km to meters
          color: color,
          fillColor: color,
          fillOpacity: 0.1,
          weight: 2,
          isAlertArea: true
        }).addTo(map).bindPopup(alert.title);
      }
    }
  });
}

// Check quiet hours
function isInQuietHours() {
  var now = new Date();
  var currentTime = now.getHours() * 60 + now.getMinutes();

  var startParts = notificationSettings.quietHoursStart.split(':');
  var endParts = notificationSettings.quietHoursEnd.split(':');

  var startMinutes = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
  var endMinutes = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);

  if (startMinutes < endMinutes) {
    return currentTime >= startMinutes && currentTime < endMinutes;
  } else {
    // Handle overnight quiet hours (e.g., 22:00 to 07:00)
    return currentTime >= startMinutes || currentTime < endMinutes;
  }
}

// Create notification with quiet hours check
function createNotificationWithQuietCheck(title, message, type) {
  if (!isInQuietHours()) {
    createNotification(title, message, type);
  }
}

// Override createAlert to use quiet hours check for notifications
var originalCreateAlert = createAlert;
createAlert = function(type, title, message, location, severity) {
  originalCreateAlert(type, title, message, location, severity);
};

// Start alert and notification simulations
simulateAlerts();
simulateNotifications();

// Initialize alerts and notifications lists
updateAlertsList();
updateNotificationsList();

// Supplement Information
function supplementReport(reportId) {
  var report = incidentReports.find(function(r) {
    return r.id === reportId;
  });

  if (report && report.status === 'pending') {
    var additionalInfo = prompt('Nhập thông tin bổ sung:');

    if (additionalInfo && additionalInfo.trim()) {
      report.supplements = report.supplements || [];
      report.supplements.push({
        content: additionalInfo,
        timestamp: new Date().toISOString(),
        addedBy: 'user'
      });

      // Add to status history
      report.statusHistory = report.statusHistory || [];
      report.statusHistory.push({
        status: 'supplemented',
        timestamp: new Date().toISOString(),
        note: 'Đã bổ sung thông tin'
      });

      updateReportsList();
      alert('Đã thêm thông tin bổ sung!');
    }
  } else if (report && report.status !== 'pending') {
    alert('Chỉ có thể bổ sung thông tin cho phản ánh đang chờ xử lý');
  }
}

// Edit report (only for pending reports)
function editReport(reportId) {
  var report = incidentReports.find(function(r) {
    return r.id === reportId;
  });

  if (report && report.status === 'pending') {
    var newTitle = prompt('Tiêu đề mới:', report.title);
    if (newTitle && newTitle.trim()) {
      report.title = newTitle;

      var newDescription = prompt('Mô tả mới:', report.description);
      if (newDescription && newDescription.trim()) {
        report.description = newDescription;

        // Add to status history
        report.statusHistory = report.statusHistory || [];
        report.statusHistory.push({
          status: 'edited',
          timestamp: new Date().toISOString(),
          note: 'Đã chỉnh sửa thông tin'
        });

        updateReportsList();
        alert('Đã cập nhật phản ánh!');
      }
    }
  } else if (report && report.status !== 'pending') {
    alert('Chỉ có thể chỉnh sửa phản ánh đang chờ xử lý');
  }
}