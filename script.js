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
  if (e.key === 'enter') {
    performSearch();
  }
});

function performSearch() {
  var query = document.getElementById('searchInput').value.trim();
  if (!query) return;

  // Using Nominatim for geocoding
  fetch('https://nominatim.openstreetmap.org/search?format=json&q=' + encodeURIComponent(query) + '&limit=1&addressdetails=1')
    .then(function(response) {
      return response.json();
    })
    .then(function(data) {
      if (data && data.length > 0) {
        var result = data[0];
        var lat = parseFloat(result.lat);
        var lng = parseFloat(result.lon);

        // Check if location is in Vietnam
        checkVietnamBoundary(lat, lng)
          .then(function(isInVietnam) {
            if (!isInVietnam) {
              alert('Cảnh báo: Kết quả tìm kiếm có thể nằm ngoài Việt Nam');
            }

            map.setView([lat, lng], 15);

            L.marker([lat, lng])
              .addTo(map)
              .bindPopup(result.display_name)
              .openPopup();
          });
      } else {
        alert('Không tìm thấy địa điểm: ' + query);
      }
    })
    .catch(function(error) {
      console.error('Search error:', error);
      alert('Lỗi khi tìm kiếm. Vui lòng thử lại.');
    });
}

// Vietnam boundary check
function checkVietnamBoundary(lat, lng) {
  return new Promise(function(resolve) {
    // Simplified Vietnam boundary check (approximate coordinates)
    // Vietnam roughly spans from 8.18°N to 23.39°N and 102.14°E to 109.46°E
    var minLat = 8.18;
    var maxLat = 23.39;
    var minLng = 102.14;
    var maxLng = 109.46;

    var isInVietnam = lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
    resolve(isInVietnam);
  });
}

// Coordinate to address conversion (geocoding)
function coordinatesToAddress(lat, lng) {
  return fetch('https://nominatim.openstreetmap.org/reverse?format=json&lat=' + lat + '&lon=' + lng + '&addressdetails=1')
    .then(function(response) {
      return response.json();
    })
    .then(function(data) {
      if (data && data.address) {
        var address = data.address;
        var formattedAddress = '';

        if (address.road) {
          formattedAddress += address.road;
        }
        if (address.suburb) {
          formattedAddress += (formattedAddress ? ', ' : '') + address.suburb;
        }
        if (address.city) {
          formattedAddress += (formattedAddress ? ', ' : '') + address.city;
        }
        if (address.state) {
          formattedAddress += (formattedAddress ? ', ' : '') + address.state;
        }
        if (address.country) {
          formattedAddress += (formattedAddress ? ', ' : '') + address.country;
        }

        return formattedAddress || data.display_name;
      }
      return null;
    });
}

// Address to coordinates conversion (forward geocoding)
function addressToCoordinates(address) {
  return fetch('https://nominatim.openstreetmap.org/search?format=json&q=' + encodeURIComponent(address) + '&limit=1')
    .then(function(response) {
      return response.json();
    })
    .then(function(data) {
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          displayName: data[0].display_name
        };
      }
      return null;
    });
}

// Store coordinates in WGS84 coordinate system (standard for GPS)
function storeCoordinatesWGS84(lat, lng) {
  // Vietnam typically uses WGS84 for GPS data
  return {
    lat: lat,
    lng: lng,
    coordinateSystem: 'WGS84',
    timestamp: new Date().toISOString()
  };
}

// Display detailed address information (road, ward, district, city)
function displayDetailedAddress(lat, lng) {
  return fetch('https://nominatim.openstreetmap.org/reverse?format=json&lat=' + lat + '&lon=' + lng + '&addressdetails=1')
    .then(function(response) {
      return response.json();
    })
    .then(function(data) {
      if (data && data.address) {
        var address = data.address;
        var detailedInfo = {
          road: address.road || null,
          suburb: address.suburb || null,
          city: address.city || null,
          state: address.state || null,
          country: address.country || null,
          postcode: address.postcode || null
        };

        return detailedInfo;
      }
      return null;
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
    } else if (sectionName === 'admin') {
      // Check permission
      if (!hasPermission('process_incident') && !hasPermission('manage_system')) {
        alert('Bạn không có quyền truy cập trang quản trị');
        return;
      }

      const adminSection = document.getElementById('admin-section');
      if (adminSection) {
        adminSection.classList.add('active');
        initializeAdminPanel();
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

        // Enhanced reverse geocoding with VN boundary check
        checkVietnamBoundary(currentLocation.lat, currentLocation.lng)
          .then(function(isInVietnam) {
            if (!isInVietnam) {
              alert('Cảnh báo: Vị trí hiện tại có thể nằm ngoài Việt Nam');
            }

            // Reverse geocoding to get detailed address
            return fetch('https://nominatim.openstreetmap.org/reverse?format=json&lat=' + currentLocation.lat + '&lon=' + currentLocation.lng + '&addressdetails=1');
          })
          .then(function(response) {
            return response.json();
          })
          .then(function(data) {
            if (data && data.address) {
              var address = data.address;
              var formattedAddress = '';

              // Format Vietnamese address
              if (address.road) {
                formattedAddress += address.road;
              }
              if (address.suburb) {
                formattedAddress += (formattedAddress ? ', ' : '') + address.suburb;
              }
              if (address.city) {
                formattedAddress += (formattedAddress ? ', ' : '') + address.city;
              }
              if (address.state) {
                formattedAddress += (formattedAddress ? ', ' : '') + address.state;
              }
              if (address.country) {
                formattedAddress += (formattedAddress ? ', ' : '') + address.country;
              }

              document.getElementById('address').value = formattedAddress || data.display_name;
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

      // Enhanced reverse geocoding with detailed address parsing
      fetch('https://nominatim.openstreetmap.org/reverse?format=json&lat=' + currentLocation.lat + '&lon=' + currentLocation.lng + '&addressdetails=1')
        .then(function(response) {
          return response.json();
        })
        .then(function(data) {
          if (data && data.address) {
            var address = data.address;
            var formattedAddress = '';

            // Format Vietnamese address
            if (address.road) {
              formattedAddress += address.road;
            }
            if (address.suburb) {
              formattedAddress += (formattedAddress ? ', ' : '') + address.suburb;
            }
            if (address.city) {
              formattedAddress += (formattedAddress ? ', ' : '') + address.city;
            }
            if (address.state) {
              formattedAddress += (formattedAddress ? ', ' : '') + address.state;
            }
            if (address.country) {
              formattedAddress += (formattedAddress ? ', ' : '') + address.country;
            }

            document.getElementById('address').value = formattedAddress || data.display_name;
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

  // Check permission
  if (!hasPermission('create_incident')) {
    alert('Bạn không có quyền tạo phản ánh sự cố');
    return;
  }

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
    userId: currentUser ? currentUser.id : null,
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

  // Log activity
  logActivity('incident_create', 'Tạo phản ánh: ' + report.id);

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
           (report.status === 'pending' && hasPermission('edit_own_incident') ? '<button onclick="editReport(\'' + report.id + '\')">Chỉnh sửa</button>' : '') +
           (report.status === 'pending' ? '<button onclick="cancelReport(\'' + report.id + '\')">Hủy bỏ</button>' : '') +
           (hasPermission('verify_incident') ? '<button onclick="showVerificationDialog(\'' + report.id + '\')">Xác minh</button>' : '') +
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

// Authentication System
var currentUser = null;
var users = [];
var activityLog = [];

// User roles and permissions
var roles = {
  viewer: {
    name: 'Người xem',
    permissions: ['view_map', 'view_incidents']
  },
  reporter: {
    name: 'Người báo cáo',
    permissions: ['view_map', 'view_incidents', 'create_incident', 'edit_own_incident']
  },
  staff: {
    name: 'Nhân viên xử lý',
    permissions: ['view_map', 'view_incidents', 'create_incident', 'edit_own_incident', 'process_incident', 'verify_incident']
  },
  admin: {
    name: 'Quản trị viên',
    permissions: ['view_map', 'view_incidents', 'create_incident', 'edit_own_incident', 'process_incident', 'verify_incident', 'manage_users', 'manage_system', 'view_analytics']
  }
};

// Initialize with some demo users
function initializeUsers() {
  users = [
    {
      id: 'user-1',
      name: 'Nguyễn Văn A',
      email: 'user@example.com',
      phone: '0901234567',
      password: 'password123', // In real app, this would be hashed
      role: 'reporter',
      createdAt: new Date().toISOString(),
      isActive: true
    },
    {
      id: 'user-2',
      name: 'Admin User',
      email: 'admin@example.com',
      phone: '0912345678',
      password: 'admin123',
      role: 'admin',
      createdAt: new Date().toISOString(),
      isActive: true
    }
  ];
}

// Check if user is logged in
function checkAuthStatus() {
  var savedUser = localStorage.getItem('currentUser');
  if (savedUser) {
    currentUser = JSON.parse(savedUser);
    updateUserInterface();
  }
}

// Update user interface based on auth status
function updateUserInterface() {
  var authSection = document.getElementById('authSection');
  var userSection = document.getElementById('userSection');

  if (currentUser) {
    authSection.style.display = 'none';
    userSection.style.display = 'block';

    // Update user info
    var userAvatar = document.getElementById('userAvatar');
    var userName = document.getElementById('userName');

    userAvatar.textContent = currentUser.name.charAt(0).toUpperCase();
    userName.textContent = currentUser.name;
  } else {
    authSection.style.display = 'flex';
    userSection.style.display = 'none';
  }
}

// Login functionality
document.getElementById('loginBtn').addEventListener('click', function() {
  document.getElementById('loginModal').style.display = 'flex';
});

document.getElementById('closeLoginModal').addEventListener('click', function() {
  document.getElementById('loginModal').style.display = 'none';
});

document.getElementById('loginForm').addEventListener('submit', function(e) {
  e.preventDefault();

  var email = document.getElementById('loginEmail').value;
  var password = document.getElementById('loginPassword').value;
  var rememberMe = document.getElementById('rememberMe').checked;

  // Find user
  var user = users.find(function(u) {
    return u.email === email && u.password === password && u.isActive;
  });

  if (user) {
    currentUser = user;

    // Save to localStorage if remember me is checked
    if (rememberMe) {
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
    }

    // Log activity
    logActivity('login', 'Đăng nhập thành công');

    updateUserInterface();
    document.getElementById('loginModal').style.display = 'none';
    document.getElementById('loginForm').reset();

    alert('Đăng nhập thành công! Xin chào ' + user.name);
  } else {
    alert('Email hoặc mật khẩu không đúng');
  }
});

// Register functionality
document.getElementById('registerBtn').addEventListener('click', function() {
  document.getElementById('registerModal').style.display = 'flex';
});

document.getElementById('closeRegisterModal').addEventListener('click', function() {
  document.getElementById('registerModal').style.display = 'none';
});

document.getElementById('registerForm').addEventListener('submit', function(e) {
  e.preventDefault();

  var name = document.getElementById('registerName').value;
  var email = document.getElementById('registerEmail').value;
  var phone = document.getElementById('registerPhone').value;
  var password = document.getElementById('registerPassword').value;
  var confirmPassword = document.getElementById('registerConfirmPassword').value;
  var agreeTerms = document.getElementById('agreeTerms').checked;

  // Validation
  if (password !== confirmPassword) {
    alert('Mật khẩu xác nhận không khớp');
    return;
  }

  if (password.length < 6) {
    alert('Mật khẩu phải có ít nhất 6 ký tự');
    return;
  }

  if (!agreeTerms) {
    alert('Bạn phải đồng ý với điều khoản sử dụng');
    return;
  }

  // Check if email already exists
  var existingUser = users.find(function(u) {
    return u.email === email;
  });

  if (existingUser) {
    alert('Email này đã được sử dụng');
    return;
  }

  // Create new user
  var newUser = {
    id: 'user-' + Date.now(),
    name: name,
    email: email,
    phone: phone,
    password: password, // In real app, this would be hashed
    role: 'reporter', // Default role
    createdAt: new Date().toISOString(),
    isActive: true
  };

  users.push(newUser);

  // Log activity
  logActivity('register', 'Đăng ký tài khoản mới: ' + email);

  document.getElementById('registerModal').style.display = 'none';
  document.getElementById('registerForm').reset();

  alert('Đăng ký thành công! Vui lòng đăng nhập để tiếp tục.');
});

// Forgot password functionality
document.getElementById('forgotPasswordBtn').addEventListener('click', function(e) {
  e.preventDefault();
  document.getElementById('loginModal').style.display = 'none';
  document.getElementById('forgotPasswordModal').style.display = 'flex';
});

document.getElementById('closeForgotPasswordModal').addEventListener('click', function() {
  document.getElementById('forgotPasswordModal').style.display = 'none';
});

document.getElementById('forgotPasswordForm').addEventListener('submit', function(e) {
  e.preventDefault();

  var email = document.getElementById('forgotEmail').value;

  var user = users.find(function(u) {
    return u.email === email;
  });

  if (user) {
    // In real app, send email with reset link
    alert('Đã gửi liên kết khôi phục mật khẩu đến email ' + email);
    document.getElementById('forgotPasswordModal').style.display = 'none';
    document.getElementById('forgotPasswordForm').reset();
  } else {
    alert('Email không tồn tại trong hệ thống');
  }
});

// Logout functionality
document.getElementById('logoutBtn').addEventListener('click', function(e) {
  e.preventDefault();

  if (confirm('Bạn có chắc muốn đăng xuất?')) {
    logActivity('logout', 'Đăng xuất');

    currentUser = null;
    localStorage.removeItem('currentUser');
    updateUserInterface();

    alert('Đã đăng xuất thành công');
  }
});

// User menu toggle
document.getElementById('userMenuBtn').addEventListener('click', function() {
  document.getElementById('userDropdown').classList.toggle('active');
});

// Close dropdown when clicking outside
document.addEventListener('click', function(e) {
  var userMenu = document.getElementById('userMenu');
  var userDropdown = document.getElementById('userDropdown');

  if (!userMenu.contains(e.target)) {
    userDropdown.classList.remove('active');
  }
});

// Profile modal
document.getElementById('profileBtn').addEventListener('click', function(e) {
  e.preventDefault();
  document.getElementById('userDropdown').classList.remove('active');
  openProfileModal();
});

function openProfileModal() {
  if (!currentUser) return;

  // Populate profile data
  document.getElementById('profileAvatarLarge').textContent = currentUser.name.charAt(0).toUpperCase();
  document.getElementById('profileName').textContent = currentUser.name;
  document.getElementById('profileEmail').textContent = currentUser.email;
  document.getElementById('profileRole').textContent = roles[currentUser.role].name;

  document.getElementById('profileNameInput').value = currentUser.name;
  document.getElementById('profileEmailInput').value = currentUser.email;
  document.getElementById('profilePhoneInput').value = currentUser.phone || '';
  document.getElementById('currentRole').textContent = roles[currentUser.role].name;

  // Update permissions display
  var permissionsDiv = document.getElementById('userPermissions');
  permissionsDiv.innerHTML = roles[currentUser.role].permissions.map(function(perm) {
    var permNames = {
      'view_map': 'Xem bản đồ',
      'view_incidents': 'Xem sự cố',
      'create_incident': 'Tạo sự cố',
      'edit_own_incident': 'Sửa sự cố của mình',
      'process_incident': 'Xử lý sự cố',
      'verify_incident': 'Xác minh sự cố',
      'manage_users': 'Quản lý người dùng',
      'manage_system': 'Quản lý hệ thống',
      'view_analytics': 'Xem thống kê'
    };
    return '<span class="permission-tag">' + (permNames[perm] || perm) + '</span>';
  }).join('');

  document.getElementById('profileModal').style.display = 'flex';
}

document.getElementById('closeProfileModal').addEventListener('click', function() {
  document.getElementById('profileModal').style.display = 'none';
});

document.getElementById('saveProfile').addEventListener('click', function() {
  if (!currentUser) return;

  var name = document.getElementById('profileNameInput').value;
  var phone = document.getElementById('profilePhoneInput').value;
  var currentPassword = document.getElementById('currentPassword').value;
  var newPassword = document.getElementById('newPassword').value;
  var confirmNewPassword = document.getElementById('confirmNewPassword').value;

  // Update basic info
  if (name && name !== currentUser.name) {
    currentUser.name = name;
    logActivity('profile_update', 'Cập nhật tên: ' + name);
  }

  if (phone && phone !== currentUser.phone) {
    currentUser.phone = phone;
    logActivity('profile_update', 'Cập nhật số điện thoại: ' + phone);
  }

  // Update password if provided
  if (currentPassword && newPassword) {
    if (currentPassword !== currentUser.password) {
      alert('Mật khẩu hiện tại không đúng');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      alert('Mật khẩu mới không khớp');
      return;
    }

    if (newPassword.length < 6) {
      alert('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }

    currentUser.password = newPassword;
    logActivity('password_change', 'Thay đổi mật khẩu');
  }

  // Save to localStorage
  localStorage.setItem('currentUser', JSON.stringify(currentUser));

  // Update user in users array
  var userIndex = users.findIndex(function(u) {
    return u.id === currentUser.id;
  });
  if (userIndex !== -1) {
    users[userIndex] = currentUser;
  }

  updateUserInterface();
  document.getElementById('profileModal').style.display = 'none';

  alert('Đã lưu thay đổi thành công!');
});

// Delete account
document.getElementById('deleteAccountBtn').addEventListener('click', function() {
  if (!currentUser) return;

  if (confirm('Bạn có chắc muốn xóa tài khoản? Hành động này không thể hoàn tác.')) {
    // Remove user from users array
    var userIndex = users.findIndex(function(u) {
      return u.id === currentUser.id;
    });

    if (userIndex !== -1) {
      users.splice(userIndex, 1);
    }

    logActivity('account_delete', 'Xóa tài khoản: ' + currentUser.email);

    currentUser = null;
    localStorage.removeItem('currentUser');
    updateUserInterface();

    document.getElementById('profileModal').style.display = 'none';

    alert('Tài khoản đã được xóa thành công');
  }
});

// Settings modal
document.getElementById('settingsBtn').addEventListener('click', function(e) {
  e.preventDefault();
  document.getElementById('userDropdown').classList.remove('active');
  openSettingsModal();
});

function openSettingsModal() {
  if (!currentUser) return;

  // Populate activity log
  var activityLogDiv = document.getElementById('activityLog');
  var userActivities = activityLog.filter(function(log) {
    return log.userId === currentUser.id;
  }).slice(-10); // Last 10 activities

  if (userActivities.length === 0) {
    activityLogDiv.innerHTML = '<p style="color: #999; font-size: 13px;">Chưa có hoạt động nào</p>';
  } else {
    activityLogDiv.innerHTML = userActivities.map(function(log) {
      var actionNames = {
        'login': 'Đăng nhập',
        'logout': 'Đăng xuất',
        'register': 'Đăng ký',
        'profile_update': 'Cập nhật hồ sơ',
        'password_change': 'Thay đổi mật khẩu',
        'account_delete': 'Xóa tài khoản'
      };

      return '<div class="activity-item">' +
             '<span class="activity-time">' + new Date(log.timestamp).toLocaleString('vi-VN') + '</span>' +
             '<span class="activity-action">' + (actionNames[log.action] || log.action) + ' - ' + log.details + '</span>' +
             '</div>';
    }).join('');
  }

  document.getElementById('settingsModal').style.display = 'flex';
}

document.getElementById('closeSettingsModalMain').addEventListener('click', function() {
  document.getElementById('settingsModal').style.display = 'none';
});

document.getElementById('saveAccountSettings').addEventListener('click', function() {
  var twoFactorAuth = document.getElementById('twoFactorAuth').checked;
  var loginNotifications = document.getElementById('loginNotifications').checked;

  // In real app, save these settings to user profile
  logActivity('settings_update', 'Cập nhật cài đặt tài khoản');

  document.getElementById('settingsModal').style.display = 'none';
  alert('Đã lưu cài đặt thành công!');
});

// Activity logging
function logActivity(action, details) {
  var logEntry = {
    userId: currentUser ? currentUser.id : null,
    action: action,
    details: details,
    timestamp: new Date().toISOString(),
    ipAddress: '192.168.1.' + Math.floor(Math.random() * 255) // Simulated IP
  };

  activityLog.push(logEntry);

  // Keep only last 100 entries
  if (activityLog.length > 100) {
    activityLog = activityLog.slice(-100);
  }
}

// Check permissions
function hasPermission(permission) {
  if (!currentUser) return false;
  return roles[currentUser.role].permissions.includes(permission);
}

// Initialize authentication
initializeUsers();
checkAuthStatus();

// Data Source Integration System
var dataSources = {
  trafficAPI: {
    name: 'API Giao thông',
    url: 'https://api.traffic.example.com',
    status: 'disconnected',
    lastUpdate: null,
    data: []
  },
  externalSystem: {
    name: 'Hệ thống bên ngoài',
    url: 'https://external.example.com/api',
    status: 'disconnected',
    lastUpdate: null,
    data: []
  },
  cameraFeeds: {
    name: 'Camera giao thông',
    urls: [
      'https://camera1.example.com/stream',
      'https://camera2.example.com/stream'
    ],
    status: 'disconnected',
    lastUpdate: null,
    data: []
  },
  monitoringStations: {
    name: 'Trạm quan trắc',
    urls: [
      'https://station1.example.com/api',
      'https://station2.example.com/api'
    ],
    status: 'disconnected',
    lastUpdate: null,
    data: []
  }
};

// Connect to traffic API
function connectToTrafficAPI() {
  return new Promise(function(resolve, reject) {
    // Simulated connection
    setTimeout(function() {
      dataSources.trafficAPI.status = 'connected';
      dataSources.trafficAPI.lastUpdate = new Date().toISOString();

      // Simulate receiving traffic data
      dataSources.trafficAPI.data = [
        { id: 'traffic-1', location: 'Quận 1', speed: 25, status: 'congested', timestamp: new Date().toISOString() },
        { id: 'traffic-2', location: 'Quận 2', speed: 35, status: 'normal', timestamp: new Date().toISOString() },
        { id: 'traffic-3', location: 'Quận 3', speed: 15, status: 'jammed', timestamp: new Date().toISOString() }
      ];

      logActivity('data_source_connect', 'Kết nối API giao thông thành');
      resolve(dataSources.data);
    }, 2000);
  });
}

// Sync incidents from external system
function syncFromExternalSystem() {
  return new Promise(function(resolve, reject) {
    setTimeout(function() {
      dataSources.externalSystem.status = 'connected';
      dataSources.externalSystem.lastUpdate = new Date().toISOString();

      // Simulate receiving external incident data
      dataSources.externalSystem.data = [
        { id: 'ext-1', type: 'tainan', location: 'Đường Nguyễn Văn Linh', status: 'processing', timestamp: new Date().toISOString() },
        { id: 'ext-2', type: 'ngapnuoc', location: 'Đường Hà Nội', status: 'pending', timestamp: new Date().toISOString() }
      ];

      // Merge with local incidents
      dataSources.externalSystem.data.forEach(function(externalIncident) {
        var exists = incidentData.find(function(local) {
          return local.id === externalIncident.id;
        });

        if (!exists) {
          incidentData.push({
            id: externalIncident.id,
            type: externalIncident.type,
            name: externalIncident.location,
            lat: 10.7769 + (Math.random() - 0.5) * 0.01,
            lng: 106.7009 + (Math.random() - 0.5) * 0.01,
            severity: 'trungbinh'
          });
        }
      });

      addMarkers(incidentData);
      logActivity('data_sync', 'Đồng bộ sự cố từ hệ thống bên ngoài');
      resolve(dataSources.externalSystem.data);
    }, 3000);
  });
}

// Receive data from traffic cameras
function receiveCameraData() {
  return new Promise(function(resolve, reject) {
    setTimeout(function() {
      dataSources.cameraFeeds.status = 'connected';
      dataSources.cameraFeeds.lastUpdate = new Date().toISOString();

      // Simulate camera data
      dataSources.cameraFeeds.data = [
        { cameraId: 'cam-1', location: 'Ngã tư tưồng', status: 'active', vehicleCount: 15, timestamp: new Date().toISOString() },
        { cameraId: 'cam-2', location: 'Hàng Xanh', status: 'active', vehicleCount: 8, timestamp: new Date().toISOString() }
      ];

      logActivity('camera_connect', 'Kết nối camera giao thông thành');
      resolve(dataSources.cameraFeeds.data);
    }, 2500);
  });
}

// Receive data from monitoring stations
function receiveStationData() {
  return new Promise(function(resolve, reject) {
    setTimeout(function() {
      dataSources.monitoringStations.status = 'connected';
      dataSources.monitoringStations.lastUpdate = new Date().toISOString();

      // Simulate station data
      dataSources.monitoringStations.data = [
        { stationId: 'station-1', location: 'Bến xe Miền Đông', waterLevel: 1.2, rainfall: 5.5, timestamp: new Date().toISOString() },
        { stationId: 'station-2', location: 'Bến xe Tân Bình', waterLevel: 0.8, rainfall: 3.2, timestamp: new Date().toISOString() }
      ];

      logActivity('station_connect', 'Kết nối trạm quan trắc thành');
      resolve(dataSources.monitoringStations.data);
    }, 2800);
  });
}

// Validate data integrity
function validateDataIntegrity(data, source) {
  var validationResults = {
    isValid: true,
    errors: [],
    warnings: []
  };

  // Check required fields
  if (!data || !Array.isArray(data)) {
    validationResults.isValid = false;
    validationResults.errors.push('Dữ liệu không hợp lệ');
    return validationResults;
  }

  // Check data freshness
  var now = new Date();
  data.forEach(function(item) {
    if (item.timestamp) {
      var dataAge = now - new Date(item.timestamp);
      if (dataAge > 3600000) { // 1 hour old
        validationResults.warnings.push('Dữ liệu cũ: ' + item.id);
      }
    }
  });

  // Check for duplicates
  var ids = data.map(function(item) { return item.id; });
  var uniqueIds = new Set(ids);
  if (ids.length !== uniqueIds.size) {
    validationResults.warnings.push('Phát hiện dữ liệu trùng lặp');
  }

  // Source-specific validation
  if (source === 'trafficAPI') {
    data.forEach(function(item) {
      if (!item.location || !item.speed || !item.status) {
        validationResults.isValid = false;
        validationResults.errors.push('Thiếu thông tin bắt buộc: ' + item.id);
      }
    });
  }

  if (source === 'cameraFeeds') {
    data.forEach(function(item) {
      if (!item.cameraId || !item.location || !item.status) {
        validationResults.isValid = false;
        validationResults.errors.push('Thiếu thông tin camera: ' + item.cameraId);
      }
    });
  }

  if (source === 'monitoringStations') {
    data.forEach(function(item) {
      if (!item.stationId || !item.location) {
        validationResults.isValid = false;
        validationResults.errors.push('Thiếu thông tin trạm: ' + item.stationId);
      }
    });
  }

  return validationResults;
}

// Log data errors
function logDataError(source, error) {
  var errorLog = {
    source: source,
    error: error,
    timestamp: new Date().toISOString(),
    ipAddress: '192.168.1.' + Math.floor(Math.random() * 255)
  };

  // In real app, this would be sent to server
  console.error('Data source error:', errorLog);
  logActivity('data_error', 'Lỗi nguồn dữ liệu ' + source + ': ' + error);
}

// Initialize data source connections
function initializeDataSources() {
  if (hasPermission('manage_system')) {
    // Connect to all data sources
    connectToTrafficAPI()
      .then(function() {
        console.log('Traffic API connected');
      })
      .catch(function(error) {
        logDataError('trafficAPI', error);
      });

    syncFromExternalSystem()
      .then(function() {
        console.log('External system synced');
      })
      .catch(function(error) {
        logDataError('externalSystem', error);
      });

    receiveCameraData()
      .then(function() {
        console.log('Camera feeds connected');
      })
      .catch(function(error) {
        logDataError('cameraFeeds', error);
      });

    receiveStationData()
      .then(function() {
        console.log('Monitoring stations connected');
      })
      .catch(function(error) {
        logDataError('monitoringStations', error);
      });
  }
}

// Periodic data refresh
function startDataRefresh() {
  setInterval(function() {
    if (dataSources.trafficAPI.status === 'connected') {
      // Refresh traffic data
      dataSources.trafficAPI.lastUpdate = new Date().toISOString();
      logActivity('data_refresh', 'Làm mới dữ liệu giao thông');
    }

    if (dataSources.externalSystem.status === 'connected') {
      // Sync external data
      syncFromExternalSystem()
        .then(function() {
          console.log('External data refreshed');
        })
        .catch(function(error) {
          logDataError('externalSystem', error);
        });
    }
  }, 60000); // Refresh every minute
}

// Show data source status in sidebar
function updateDataSourceStatus() {
  var statusDiv = document.getElementById('status');
  if (statusDiv) {
    var connectedSources = Object.values(dataSources).filter(function(source) {
      return source.status === 'connected';
    }).length;

    var totalSources = Object.keys(dataSources).length;

    if (connectedSources === totalSources) {
      statusDiv.innerHTML = '✅ Tất cả nguồn dữ liệu đã kết nối';
    } else if (connectedSources > 0) {
      statusDiv.innerHTML = '⚠️ ' + connectedSources + '/' + totalSources + ' nguồn dữ liệu đã kết nối';
    } else {
      statusDiv.innerHTML = '❌ Không có nguồn dữ liệu nào kết nối';
    }
  }

  // Update data sources panel
  var dataSourcesList = document.getElementById('dataSourcesList');
  if (dataSourcesList) {
    dataSourcesList.innerHTML = Object.keys(dataSources).map(function(key) {
      var source = dataSources[key];
      var statusClass = source.status;
      var statusText = source.status === 'connected' ? 'Đã kết nối' :
                       source.status === 'connecting' ? 'Đang kết nối' : 'Ngắt kết nối';

      return '<div class="data-source-item">' +
             '<div class="data-source-name">' + source.name + '</div>' +
             '<div class="data-source-status ' + statusClass + '">' + statusText + '</div>' +
             '</div>';
    }).join('');
  }
}

// Initialize data sources when user logs in as admin
var originalInitializeAdminPanel = initializeAdminPanel;
initializeAdminPanel = function() {
  originalInitializeAdminPanel();
  initializeDataSources();
  startDataRefresh();
  updateDataSourceStatus();
};

// Role-based UI updates
function updateUIByRole() {
  if (!currentUser) return;

  var role = currentUser.role;

  // Example: Hide certain features based on role
  if (role === 'viewer') {
    // Disable incident reporting
    var reportLink = document.querySelector('[data-section="report"]');
    if (reportLink) {
      reportLink.style.display = 'none';
    }
  }

  if (role === 'admin') {
    // Show admin features
    var adminFeatures = document.querySelectorAll('.admin-only');
    adminFeatures.forEach(function(feature) {
      feature.style.display = 'block';
    });
  }
}

// Update UI when user logs in
var originalUpdateUserInterface = updateUserInterface;
updateUserInterface = function() {
  originalUpdateUserInterface();
  updateUIByRole();
};

// Session management
function checkSessionExpiry() {
  if (currentUser) {
    var loginTime = new Date(currentUser.lastLogin || currentUser.createdAt);
    var now = new Date();
    var sessionDuration = 24 * 60 * 60 * 1000; // 24 hours

    if (now - loginTime > sessionDuration) {
      // Session expired
      currentUser = null;
      localStorage.removeItem('currentUser');
      updateUserInterface();
      alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    }
  }
}

// Check session expiry every minute
setInterval(checkSessionExpiry, 60000);

// Simulate login time for demo
if (currentUser) {
  currentUser.lastLogin = new Date().toISOString();
}

// Admin System for Incident Management
var adminPagination = {
  currentPage: 1,
  pageSize: 10,
  totalItems: 0,
  totalPages: 1
};

var adminFilters = {
  search: '',
  type: '',
  severity: '',
  status: '',
  dateRange: ''
};

var adminStaff = [
  { id: 'staff-1', name: 'Nguyễn Văn B', role: 'Nhân viên xử lý', avatar: 'N' },
  { id: 'staff-2', name: 'Trần Thị C', role: 'Nhân viên xử lý', avatar: 'T' },
  { id: 'staff-3', name: 'Lê Văn D', role: 'Nhân viên xử lý', avatar: 'L' }
];

// Update admin UI based on role
function updateAdminUI() {
  var adminLink = document.querySelector('[data-section="admin"]');
  if (adminLink) {
    if (hasPermission('process_incident') || hasPermission('manage_system')) {
      adminLink.style.display = 'block';
    } else {
      adminLink.style.display = 'none';
    }
  }
}

// Update statistics
function updateAdminStatistics() {
  var totalIncidents = incidentReports.length;
  var pendingIncidents = incidentReports.filter(function(r) {
    return r.status === 'pending';
  }).length;
  var processingIncidents = incidentReports.filter(function(r) {
    return r.status === 'processing';
  }).length;
  var resolvedIncidents = incidentReports.filter(function(r) {
    return r.status === 'resolved';
  }).length;

  document.getElementById('totalIncidents').textContent = totalIncidents;
  document.getElementById('pendingIncidents').textContent = pendingIncidents;
  document.getElementById('processingIncidents').textContent = processingIncidents;
  document.getElementById('resolvedIncidents').textContent = resolvedIncidents;
}

// Filter incidents
function filterIncidents() {
  var filtered = incidentReports;

  // Search filter
  if (adminFilters.search) {
    var searchLower = adminFilters.search.toLowerCase();
    filtered = filtered.filter(function(incident) {
      return incident.title.toLowerCase().includes(searchLower) ||
             incident.id.toLowerCase().includes(searchLower) ||
             (incident.description && incident.description.toLowerCase().includes(searchLower));
    });
  }

  // Type filter
  if (adminFilters.type) {
    filtered = filtered.filter(function(incident) {
      return incident.type === adminFilters.type;
    });
  }

  // Severity filter
  if (adminFilters.severity) {
    filtered = filtered.filter(function(incident) {
      return incident.severity === adminFilters.severity;
    });
  }

  // Status filter
  if (adminFilters.status) {
    filtered = filtered.filter(function(incident) {
      return incident.status === adminFilters.status;
    });
  }

  // Date range filter
  if (adminFilters.dateRange) {
    var now = new Date();
    var startDate;

    switch (adminFilters.dateRange) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
    }

    if (startDate) {
      filtered = filtered.filter(function(incident) {
        return new Date(incident.createdAt) >= startDate;
      });
    }
  }

  return filtered;
}

// Update incident table
function updateIncidentTable() {
  var filtered = filterIncidents();
  adminPagination.totalItems = filtered.length;
  adminPagination.totalPages = Math.ceil(adminPagination.totalItems / adminPagination.pageSize);

  // Ensure current page is valid
  if (adminPagination.currentPage > adminPagination.totalPages) {
    adminPagination.currentPage = Math.max(1, adminPagination.totalPages);
  }

  var startIndex = (adminPagination.currentPage - 1) * adminPagination.pageSize;
  var endIndex = startIndex + adminPagination.pageSize;
  var pageData = filtered.slice(startIndex, endIndex);

  var tableBody = document.getElementById('incidentTableBody');

  if (pageData.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="8" class="no-data">Không có dữ liệu</td></tr>';
  } else {
    tableBody.innerHTML = pageData.map(function(incident) {
      var typeNames = {
        'oga': 'Ổ gà',
        'tainan': 'Tai nạn',
        'ngapnuoc': 'Ngập nước',
        'vatcan': 'Vật cản',
        'kexe': 'Kẹt xe',
        'khac': 'Khác'
      };

      var severityNames = {
        'thap': 'Thấp',
        'trungbinh': 'Trung bình',
        'cao': 'Cao'
      };

      var statusNames = {
        'pending': 'Chờ xử lý',
        'processing': 'Đang xử lý',
        'resolved': 'Đã giải quyết'
      };

      var createdDate = new Date(incident.createdAt);
      var formattedDate = createdDate.toLocaleDateString('vi-VN');

      return '<tr>' +
             '<td>' + incident.id + '</td>' +
             '<td>' + incident.title + '</td>' +
             '<td><span class="type-badge">' + (typeNames[incident.type] || incident.type) + '</span></td>' +
             '<td><span class="severity-badge-admin ' + incident.severity + '">' + (severityNames[incident.severity] || incident.severity) + '</span></td>' +
             '<td><span class="status-badge-admin ' + incident.status + '">' + (statusNames[incident.status] || incident.status) + '</span></td>' +
             '<td>' + (incident.contact ? incident.contact.name : 'Ẩn danh') + '</td>' +
             '<td>' + formattedDate + '</td>' +
             '<td>' +
             '<div class="action-buttons">' +
             '<button onclick="viewIncidentDetailAdmin(\'' + incident.id + '\')" class="primary">Chi tiết</button>' +
             (incident.status === 'pending' ? '<button onclick="assignIncident(\'' + incident.id + '\')">Phân công</button>' : '') +
             '<button onclick="updateIncidentStatus(\'' + incident.id + '\')">Cập nhật</button>' +
             (incident.status !== 'resolved' ? '<button onclick="closeIncident(\'' + incident.id + '\')" class="danger">Đóng</button>' : '') +
             '</div>' +
             '</td>' +
             '</tr>';
    }).join('');
  }

  // Update pagination info
  document.getElementById('currentPage').textContent = adminPagination.currentPage;
  document.getElementById('totalPages').textContent = adminPagination.totalPages;
  document.getElementById('prevPage').disabled = adminPagination.currentPage === 1;
  document.getElementById('nextPage').disabled = adminPagination.currentPage === adminPagination.totalPages;
}

// Apply filters
document.getElementById('applyFilters').addEventListener('click', function() {
  adminFilters.search = document.getElementById('adminSearch').value;
  adminFilters.type = document.getElementById('filterType').value;
  adminFilters.severity = document.getElementById('filterSeverity').value;
  adminFilters.status = document.getElementById('filterStatus').value;
  adminFilters.dateRange = document.getElementById('filterDateRange').value;

  adminPagination.currentPage = 1;
  updateIncidentTable();
});

// Reset filters
document.getElementById('resetFilters').addEventListener('click', function() {
  document.getElementById('adminSearch').value = '';
  document.getElementById('filterType').value = '';
  document.getElementById('filterSeverity').value = '';
  document.getElementById('filterStatus').value = '';
  document.getElementById('filterDateRange').value = '';

  adminFilters = {
    search: '',
    type: '',
    severity: '',
    status: '',
    dateRange: ''
  };

  adminPagination.currentPage = 1;
  updateIncidentTable();
});

// Search on Enter key
document.getElementById('adminSearch').addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    document.getElementById('applyFilters').click();
  }
});

// Pagination controls
document.getElementById('prevPage').addEventListener('click', function() {
  if (adminPagination.currentPage > 1) {
    adminPagination.currentPage--;
    updateIncidentTable();
  }
});

document.getElementById('nextPage').addEventListener('click', function() {
  if (adminPagination.currentPage < adminPagination.totalPages) {
    adminPagination.currentPage++;
    updateIncidentTable();
  }
});

document.getElementById('pageSize').addEventListener('change', function() {
  adminPagination.pageSize = parseInt(this.value);
  adminPagination.currentPage = 1;
  updateIncidentTable();
});

// View incident detail (admin)
function viewIncidentDetailAdmin(incidentId) {
  var incident = incidentReports.find(function(r) {
    return r.id === incidentId;
  });

  if (incident) {
    var typeNames = {
      'oga': 'Ổ gà',
      'tainan': 'Tai nạn',
      'ngapnuoc': 'Ngập nước',
      'vatcan': 'Vật cản',
      'kexe': 'Kẹt xe',
      'khac': 'Khác'
    };

    var severityNames = {
      'thap': 'Thấp',
      'trungbinh': 'Trung bình',
      'cao': 'Cao'
    };

    var statusNames = {
      'pending': 'Chờ xử lý',
      'processing': 'Đang xử lý',
      'resolved': 'Đã giải quyết'
    };

    var createdDate = new Date(incident.createdAt);
    var formattedDate = createdDate.toLocaleString('vi-VN');

    var detailContent = '<div class="detail-section-admin">' +
                        '<h4>Thông tin chung</h4>' +
                        '<div class="detail-row-admin">' +
                        '<div class="detail-label-admin">Mã số:</div>' +
                        '<div class="detail-value-admin">' + incident.id + '</div>' +
                        '</div>' +
                        '<div class="detail-row-admin">' +
                        '<div class="detail-label-admin">Tiêu đề:</div>' +
                        '<div class="detail-value-admin">' + incident.title + '</div>' +
                        '</div>' +
                        '<div class="detail-row-admin">' +
                        '<div class="detail-label-admin">Loại:</div>' +
                        '<div class="detail-value-admin">' + (typeNames[incident.type] || incident.type) + '</div>' +
                        '</div>' +
                        '<div class="detail-row-admin">' +
                        '<div class="detail-label-admin">Mức độ:</div>' +
                        '<div class="detail-value-admin">' + (severityNames[incident.severity] || incident.severity) + '</div>' +
                        '</div>' +
                        '<div class="detail-row-admin">' +
                        '<div class="detail-label-admin">Trạng thái:</div>' +
                        '<div class="detail-value-admin">' + (statusNames[incident.status] || incident.status) + '</div>' +
                        '</div>' +
                        '<div class="detail-row-admin">' +
                        '<div class="detail-label-admin">Ngày tạo:</div>' +
                        '<div class="detail-value-admin">' + formattedDate + '</div>' +
                        '</div>' +
                        '</div>' +

                        '<div class="detail-section-admin">' +
                        '<h4>Mô tả chi tiết</h4>' +
                        '<div class="detail-row-admin">' +
                        '<div class="detail-value-admin">' + incident.description + '</div>' +
                        '</div>' +
                        '</div>' +

                        '<div class="detail-section-admin">' +
                        '<h4>Vị trí</h4>' +
                        '<div class="detail-row-admin">' +
                        '<div class="detail-label-admin">Địa chỉ:</div>' +
                        '<div class="detail-value-admin">' + (incident.location.address || 'Chưa có địa chỉ') + '</div>' +
                        '</div>' +
                        '<div class="detail-row-admin">' +
                        '<div class="detail-label-admin">Tọa độ:</div>' +
                        '<div class="detail-value-admin">' + incident.location.lat.toFixed(6) + ', ' + incident.location.lng.toFixed(6) + '</div>' +
                        '</div>' +
                        '</div>' +

                        '<div class="detail-section-admin">' +
                        '<h4>Thông tin người gửi</h4>' +
                        '<div class="detail-row-admin">' +
                        '<div class="detail-label-admin">Họ tên:</div>' +
                        '<div class="detail-value-admin">' + (incident.contact ? incident.contact.name : (incident.anonymous ? 'Ẩn danh' : 'Chưa cung cấp')) + '</div>' +
                        '</div>' +
                        '<div class="detail-row-admin">' +
                        '<div class="detail-label-admin">SĐT:</div>' +
                        '<div class="detail-value-admin">' + (incident.contact ? incident.contact.phone : 'Chưa cung cấp') + '</div>' +
                        '</div>' +
                        '<div class="detail-row-admin">' +
                        '<div class="detail-label-admin">Email:</div>' +
                        '<div class="detail-value-admin">' + (incident.contact ? incident.contact.email : 'Chưa cung cấp') + '</div>' +
                        '</div>' +
                        '<div class="detail-row-admin">' +
                        '<div class="detail-label-admin">Ẩn danh:</div>' +
                        '<div class="detail-value-admin">' + (incident.anonymous ? 'Có' : 'Không') + '</div>' +
                        '</div>' +
                        '</div>' +

                        '<div class="detail-section-admin">' +
                        '<h4>Thông tin xử lý</h4>' +
                        '<div class="detail-row-admin">' +
                        '<div class="detail-label-admin">Nhân viên:</div>' +
                        '<div class="detail-value-admin">' + (incident.assignedTo ? incident.assignedTo.name : 'Chưa phân công') + '</div>' +
                        '</div>' +
                        '<div class="detail-row-admin">' +
                        '<div class="detail-label-admin">Mức độ ưu tiên:</div>' +
                        '<div class="detail-value-admin">' + (incident.priority || 'Chưa đặt') + '</div>' +
                        '</div>' +
                        '<div class="detail-row-admin">' +
                        '<div class="detail-label-admin">Hạn chờ:</div>' +
                        '<div class="detail-value-admin">' + (incident.deadline ? new Date(incident.deadline).toLocaleString('vi-VN') : 'Chưa đặt') + '</div>' +
                        '</div>' +
                        '</div>' +

                        '<div class="detail-section-admin">' +
                        '<h4>Ghi chú</h4>' +
                        '<div class="notes-section">' +
                        '<div class="notes-list" id="incidentNotes">' +
                        (incident.notes && incident.notes.length > 0 ?
                          incident.notes.map(function(note) {
                            return '<div class="note-item">' +
                                   '<div class="note-time">' + new Date(note.timestamp).toLocaleString('vi-VN') + '</div>' +
                                   '<div class="note-content">' + note.content + '</div>' +
                                   '<div class="note-author">' + note.author + '</div>' +
                                   '</div>';
                          }).join('') :
                          '<p style="color: #999; font-size: 13px;">Chưa có ghi chú nào</p>'
                        ) +
                        '</div>' +
                        '<div class="add-note">' +
                        '<textarea id="newNoteContent" placeholder="Thêm ghi chú mới..."></textarea>' +
                        '<button onclick="addNote(\'' + incident.id + '\')">Thêm ghi chú</button>' +
                        '</div>' +
                        '</div>' +
                        '</div>' +

                        '<div class="admin-actions">' +
                        '<button class="btn btn-primary" onclick="assignIncident(\'' + incident.id + '\')">Phân công</button>' +
                        '<button class="btn btn-primary" onclick="updateIncidentStatus(\'' + incident.id + '\')">Cập nhật trạng thái</button>' +
                        (incident.status !== 'resolved' ? '<button class="btn btn-danger" onclick="closeIncident(\'' + incident.id + '\')">Đóng sự cố</button>' : '') +
                        '</div>';

    document.getElementById('incidentDetailContent').innerHTML = detailContent;
    document.getElementById('incidentDetailModal').style.display = 'flex';
  }
}

// Close incident detail modal
document.getElementById('closeIncidentDetailModal').addEventListener('click', function() {
  document.getElementById('incidentDetailModal').style.display = 'none';
});

document.getElementById('closeIncidentDetailModalBtn').addEventListener('click', function() {
  document.getElementById('incidentDetailModal').style.display = 'none';
});

// Assignment functionality
var currentAssignmentIncidentId = null;

function assignIncident(incidentId) {
  if (!hasPermission('process_incident')) {
    alert('Bạn không có quyền phân công sự cố');
    return;
  }

  currentAssignmentIncidentId = incidentId;
  document.getElementById('assignmentModal').style.display = 'flex';

  // Set default deadline to 24 hours from now
  var defaultDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000);
  document.getElementById('assignmentDeadline').value = defaultDeadline.toISOString().slice(0, 16);
}

document.getElementById('closeAssignmentModal').addEventListener('click', function() {
  document.getElementById('assignmentModal').style.display = 'none';
});

document.getElementById('cancelAssignment').addEventListener('click', function() {
  document.getElementById('assignmentModal').style.display = 'none';
});

// Staff selection
document.querySelectorAll('.staff-item').forEach(function(item) {
  item.addEventListener('click', function() {
    document.querySelectorAll('.staff-item').forEach(function(i) {
      i.classList.remove('selected');
    });
    this.classList.add('selected');
  });
});

document.getElementById('confirmAssignment').addEventListener('click', function() {
  var selectedStaff = document.querySelector('.staff-item.selected');
  if (!selectedStaff) {
    alert('Vui lòng chọn nhân viên');
    return;
  }

  var staffId = selectedStaff.getAttribute('data-staff-id');
  var staff = adminStaff.find(function(s) {
    return s.id === staffId;
  });

  var priority = document.getElementById('assignmentPriority').value;
  var deadline = document.getElementById('assignmentDeadline').value;

  var incident = incidentReports.find(function(r) {
    return r.id === currentAssignmentIncidentId;
  });

  if (incident) {
    incident.assignedTo = staff;
    incident.priority = priority;
    incident.deadline = deadline;
    incident.status = 'processing';
    incident.statusHistory = incident.statusHistory || [];
    incident.statusHistory.push({
      status: 'assigned',
      timestamp: new Date().toISOString(),
      note: 'Đã phân công cho ' + staff.name
    });

    logActivity('incident_assign', 'Phân công sự cố ' + currentAssignmentIncidentId + ' cho ' + staff.name);

    updateIncidentTable();
    updateAdminStatistics();
    updateReportsList();

    document.getElementById('assignmentModal').style.display = 'none';
    alert('Đã phân công thành công!');
  }
});

// Status update functionality
var currentStatusIncidentId = null;

function updateIncidentStatus(incidentId) {
  if (!hasPermission('process_incident')) {
    alert('Bạn không có quyền cập nhật trạng thái');
    return;
  }

  currentStatusIncidentId = incidentId;
  document.getElementById('statusUpdateModal').style.display = 'flex';

  // Set current status
  var incident = incidentReports.find(function(r) {
    return r.id === incidentId;
  });

  if (incident) {
    document.getElementById('newStatus').value = incident.status;
  }
}

document.getElementById('closeStatusUpdateModal').addEventListener('click', function() {
  document.getElementById('statusUpdateModal').style.display = 'none';
});

document.getElementById('cancelStatusUpdate').addEventListener('click', function() {
  document.getElementById('statusUpdateModal').style.display = 'none';
});

document.getElementById('confirmStatusUpdate').addEventListener('click', function() {
  var newStatus = document.getElementById('newStatus').value;
  var note = document.getElementById('statusNote').value;

  var incident = incidentReports.find(function(r) {
    return r.id === currentStatusIncidentId;
  });

  if (incident) {
    incident.status = newStatus;
    incident.statusHistory = incident.statusHistory || [];
    incident.statusHistory.push({
      status: newStatus,
      timestamp: new Date().toISOString(),
      note: note || 'Cập nhật trạng thái'
    });

    logActivity('incident_status_update', 'Cập nhật trạng thái ' + currentStatusIncidentId + ' thành ' + newStatus);

    updateIncidentTable();
    updateAdminStatistics();
    updateReportsList();

    document.getElementById('statusUpdateModal').style.display = 'none';
    document.getElementById('statusNote').value = '';

    alert('Đã cập nhật trạng thái thành công!');
  }
});

// Close incident
function closeIncident(incidentId) {
  if (!hasPermission('process_incident')) {
    alert('Bạn không có quyền đóng sự cố');
    return;
  }

  if (confirm('Bạn có chắc muốn đóng sự cố này?')) {
    var incident = incidentReports.find(function(r) {
      return r.id === incidentId;
    });

    if (incident) {
      incident.status = 'resolved';
      incident.statusHistory = incident.statusHistory || [];
      incident.statusHistory.push({
        status: 'resolved',
        timestamp: new Date().toISOString(),
        note: 'Đã đóng sự cố'
      });

      logActivity('incident_close', 'Đóng sự cố: ' + incidentId);

      updateIncidentTable();
      updateAdminStatistics();
      updateReportsList();

      alert('Đã đóng sự cố thành công!');
    }
  }
}

// Add note to incident
function addNote(incidentId) {
  var noteContent = document.getElementById('newNoteContent').value;

  if (!noteContent.trim()) {
    alert('Vui lòng nhập nội dung ghi chú');
    return;
  }

  var incident = incidentReports.find(function(r) {
    return r.id === incidentId;
  });

  if (incident) {
    incident.notes = incident.notes || [];
    incident.notes.push({
      content: noteContent,
      timestamp: new Date().toISOString(),
      author: currentUser ? currentUser.name : 'Admin'
    });

    logActivity('incident_note', 'Thêm ghi chú cho sự cố: ' + incidentId);

    // Refresh the notes display
    viewIncidentDetailAdmin(incidentId);
    document.getElementById('newNoteContent').value = '';

    alert('Đã thêm ghi chú thành công!');
  }
}

// Export functionality
document.getElementById('exportCSV').addEventListener('click', function() {
  exportToCSV();
});

document.getElementById('exportExcel').addEventListener('click', function() {
  exportToExcel();
});

function exportToCSV() {
  var filtered = filterIncidents();

  if (filtered.length === 0) {
    alert('Không có dữ liệu để xuất');
    return;
  }

  var headers = ['Mã số', 'Tiêu đề', 'Loại', 'Mức độ', 'Trạng thái', 'Người tạo', 'Ngày tạo', 'Mô tả'];
  var csvContent = headers.join(',') + '\n';

  filtered.forEach(function(incident) {
    var row = [
      incident.id,
      incident.title,
      incident.type,
      incident.severity,
      incident.status,
      incident.contact ? incident.contact.name : 'Ẩn danh',
      new Date(incident.createdAt).toLocaleString('vi-VN'),
      incident.description.replace(/,/g, ';') // Escape commas
    ];
    csvContent += row.join(',') + '\n';
  });

  var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  var link = document.createElement('a');
  var url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', 'su_co_' + new Date().toISOString().slice(0, 10) + '.csv');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  logActivity('export_csv', 'Xuất CSV với ' + filtered.length + ' sự cố');
}

function exportToExcel() {
  // Simulated Excel export (in real app, would use xlsx library)
  var filtered = filterIncidents();

  if (filtered.length === 0) {
    alert('Không có dữ liệu để xuất');
    return;
  }

  // Create a simple HTML table for Excel export
  var tableContent = '<table>' +
                      '<thead>' +
                      '<tr>' +
                      '<th>Mã số</th>' +
                      '<th>Tiêu đề</th>' +
                      '<th>Loại</th>' +
                      '<th>Mức độ</th>' +
                      '<th>Trạng thái</th>' +
                      '<th>Người tạo</th>' +
                      '<th>Ngày tạo</th>' +
                      '<th>Mô tả</th>' +
                      '</tr>' +
                      '</thead>' +
                      '<tbody>';

  filtered.forEach(function(incident) {
    tableContent += '<tr>' +
                   '<td>' + incident.id + '</td>' +
                   '<td>' + incident.title + '</td>' +
                   '<td>' + incident.type + '</td>' +
                   '<td>' + incident.severity + '</td>' +
                   '<td>' + incident.status + '</td>' +
                   '<td>' + (incident.contact ? incident.contact.name : 'Ẩn danh') + '</td>' +
                   '<td>' + new Date(incident.createdAt).toLocaleString('vi-VN') + '</td>' +
                   '<td>' + incident.description + '</td>' +
                   '</tr>';
  });

  tableContent += '</tbody></table>';

  var blob = new Blob([tableContent], { type: 'application/vnd.ms-excel' });
  var link = document.createElement('a');
  var url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', 'su_co_' + new Date().toISOString().slice(0, 10) + '.xls');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  logActivity('export_excel', 'Xuất Excel với ' + filtered.length + ' sự cố');
}

// Initialize admin panel
function initializeAdminPanel() {
  updateAdminUI();
  updateAdminStatistics();
  updateIncidentTable();
}

// Update role-based UI
var originalUpdateUserInterface = updateUserInterface;
updateUserInterface = function() {
  originalUpdateUserInterface();
  updateAdminUI();
};

// Update statistics charts
function updateStatisticsCharts() {
  // Type statistics
  var typeStats = {};
  incidentReports.forEach(function(incident) {
    typeStats[incident.type] = (typeStats[incident.type] || 0) + 1;
  });

  var typeChart = document.getElementById('typeChart');
  if (typeChart && Object.keys(typeStats).length > 0) {
    var maxTypeCount = Math.max(...Object.values(typeStats));
    typeChart.innerHTML = '<div class="simple-bar-chart">' +
                           Object.keys(typeStats).map(function(type) {
                             var typeNames = {
                               'oga': 'Ổ gà',
                               'tainan': 'Tai nạn',
                               'ngapnuoc': 'Ngập nước',
                               'vatcan': 'Vật cản',
                               'kexe': 'Kẹt xe',
                               'khac': 'Khác'
                             };
                             var percentage = (typeStats[type] / maxTypeCount) * 100;
                             return '<div class="bar-item">' +
                                    '<div class="bar-label">' + (typeNames[type] || type) + '</div>' +
                                    '<div class="bar-container">' +
                                    '<div class="bar-fill" style="width: ' + percentage + '%; background: #005BAC;"></div>' +
                                    '</div>' +
                                    '<div class="bar-value">' + typeStats[type] + '</div>' +
                                    '</div>';
                           }).join('') +
                           '</div>';
  }

  // Severity statistics
  var severityStats = {};
  incidentReports.forEach(function(incident) {
    severityStats[incident.severity] = (severityStats[incident.severity] || 0) + 1;
  });

  var areaChart = document.getElementById('areaChart');
  if (areaChart && Object.keys(severityStats).length > 0) {
    var maxSeverityCount = Math.max(...Object.values(severityStats));
    areaChart.innerHTML = '<div class="simple-bar-chart">' +
                           Object.keys(severityStats).map(function(severity) {
                             var severityNames = {
                               'thap': 'Thấp',
                               'trungbinh': 'Trung bình',
                               'cao': 'Cao'
                             };
                             var percentage = (severityStats[severity] / maxSeverityCount) * 100;
                             var colors = {
                               'thap': '#2ecc71',
                               'trungbinh': '#f39c12',
                               'cao': '#e74c3c'
                             };
                             return '<div class="bar-item">' +
                                    '<div class="bar-label">' + (severityNames[severity] || severity) + '</div>' +
                                    '<div class="bar-container">' +
                                    '<div class="bar-fill" style="width: ' + percentage + '%; background: ' + (colors[severity] || '#999') + ';"></div>' +
                                    '</div>' +
                                    '<div class="bar-value">' + severityStats[severity] + '</div>' +
                                    '</div>';
                           }).join('') +
                           '</div>';
  }

  // Status statistics (trend over time)
  var statusStats = {
    pending: incidentReports.filter(function(r) { return r.status === 'pending'; }).length,
    processing: incidentReports.filter(function(r) { return r.status === 'processing'; }).length,
    resolved: incidentReports.filter(function(r) { return r.status === 'resolved'; }).length
  };

  var trendChart = document.getElementById('trendChart');
  if (trendChart) {
    var maxStatusCount = Math.max(...Object.values(statusStats), 1);
    trendChart.innerHTML = '<div class="simple-bar-chart">' +
                          Object.keys(statusStats).map(function(status) {
                            var statusNames = {
                              'pending': 'Chờ xử lý',
                              'processing': 'Đang xử lý',
                              'resolved': 'Đã giải quyết'
                            };
                            var percentage = (statusStats[status] / maxStatusCount) * 100;
                            var colors = {
                              'pending': '#fff3cd',
                              'processing': '#cce5ff',
                              'resolved': '#d4edda'
                            };
                            return '<div class="bar-item">' +
                                   '<div class="bar-label">' + (statusNames[status] || status) + '</div>' +
                                   '<div class="bar-container">' +
                                   '<div class="bar-fill" style="width: ' + percentage + '%; background: ' + (colors[status] || '#999') + ';"></div>' +
                                   '</div>' +
                                   '<div class="bar-value">' + statusStats[status] + '</div>' +
                                   '</div>';
                          }).join('') +
                          '</div>';
  }

  // Processing time statistics
  var processingChart = document.getElementById('processingChart');
  if (processingChart) {
    var avgProcessingTime = calculateAverageProcessingTime();
    processingChart.innerHTML = '<div style="text-align: center;">' +
                                 '<div style="font-size: 32px; font-weight: bold; color: #005BAC;">' + avgProcessingTime + '</div>' +
                                 '<div style="font-size: 14px; color: #666;">phút trung bình</div>' +
                                 '<div style="font-size: 12px; color: #999; margin-top: 8px;">Thời gian xử lý</div>' +
                                 '</div>';
  }
}

function calculateAverageProcessingTime() {
  var processingTimes = [];

  incidentReports.forEach(function(incident) {
    if (incident.statusHistory && incident.statusHistory.length > 0) {
      var createdTime = new Date(incident.createdAt);
      var resolvedTime = new Date(incident.statusHistory[incident.statusHistory.length - 1].timestamp);
      var processingHours = (resolvedTime - createdTime) / (1000 * 60 * 60);
      processingTimes.push(processingHours);
    }
  });

  if (processingTimes.length === 0) return '0';
  return (processingTimes.reduce(function(a, b) { return a + b; }, 0) / processingTimes.length).toFixed(1);
}

// Update all admin data
function updateAllAdminData() {
  updateAdminStatistics();
  updateIncidentTable();
  updateStatisticsCharts();
}

// Initialize admin panel with all data
var originalInitializeAdminPanel = initializeAdminPanel;
initializeAdminPanel = function() {
  updateAdminUI();
  updateAllAdminData();
};

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
        addedBy: currentUser ? currentUser.id : 'anonymous'
      });

      // Add to status history
      report.statusHistory = report.statusHistory || [];
      report.statusHistory.push({
        status: 'supplemented',
        timestamp: new Date().toISOString(),
        note: 'Đã bổ sung thông tin'
      });

      logActivity('incident_supplement', 'Bổ sung thông tin: ' + reportId);

      updateReportsList();
      alert('Đã thêm thông tin bổ sung!');
    }
  } else if (report && report.status !== 'pending') {
    alert('Chỉ có thể bổ sung thông tin cho phản ánh đang chờ xử lý');
  }
}

// Edit report (only for pending reports)
function editReport(reportId) {
  // Check permission
  if (!hasPermission('edit_own_incident')) {
    alert('Bạn không có quyền chỉnh sửa phản ánh');
    return;
  }

  var report = incidentReports.find(function(r) {
    return r.id === reportId;
  });

  if (!report) {
    alert('Không tìm thấy phản ánh');
    return;
  }

  // Check if user owns this report or has processing permissions
  if (report.userId !== currentUser.id && !hasPermission('process_incident')) {
    alert('Bạn chỉ có thể chỉnh sửa phản ánh của mình');
    return;
  }

  if (report.status === 'pending') {
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

        logActivity('incident_edit', 'Chỉnh sửa phản ánh: ' + reportId);

        updateReportsList();
        alert('Đã cập nhật phản ánh!');
      }
    }
  } else {
    alert('Chỉ có thể chỉnh sửa phản ánh đang chờ xử lý');
  }
}

// Verification System
function showVerificationDialog(reportId) {
  // Check permission
  if (!hasPermission('verify_incident')) {
    alert('Bạn không có quyền xác minh phản ánh');
    return;
  }

  var report = incidentReports.find(function(r) {
    return r.id === reportId;
  });

  if (report) {
    var verificationOptions = prompt('Chọn trạng thái xác minh:\n1. Đã xác minh\n2. Chưa xác minh\n3. Trùng lặp\n4. Không hợp lệ\n\nNhập số (1-4):');

    if (verificationOptions) {
      var statusMap = {
        '1': 'verified',
        '2': 'unverified',
        '3': 'duplicate',
        '4': 'invalid'
      };

      var status = statusMap[verificationOptions];
      if (status) {
        report.verification = {
          status: status,
          verifiedAt: new Date().toISOString(),
          verifiedBy: currentUser ? currentUser.id : 'system',
          verifiedByName: currentUser ? currentUser.name : 'System',
          reliabilityLevel: status === 'verified' ? 'high' : status === 'unverified' ? 'medium' : 'low'
        };

        // Add to status history
        report.statusHistory = report.statusHistory || [];
        report.statusHistory.push({
          status: 'verified',
          verificationStatus: status,
          timestamp: new Date().toISOString(),
          note: 'Đã xác minh bởi ' + (currentUser ? currentUser.name : 'System')
        });

        logActivity('incident_verify', 'Xác minh phản ánh: ' + reportId + ' - ' + status);

        updateReportsList();
        alert('Đã cập nhật trạng thái xác minh!');
      }
    }
  }
}