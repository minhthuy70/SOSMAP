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
  // Traffic incidents
  tainan: '#e74c3c',    // Tai nạn - đỏ
  oga: '#f39c12',       // Ổ gà - cam
  ngapnuoc: '#3498db',  // Ngập nước - xanh dương
  vatcan: '#9b59b6',    // Vật cản - tím
  kexe: '#e67e22',       // Kẹt xe - cam đậm
  // Natural disasters
  bao: '#8e44ad',       // Bão - tím đậm
  lut: '#2980b9',       // Lũ lụt - xanh đậm
  satlo: '#d35400',     // Sạt lở - cam đậm
  dongdat: '#c0392b',   // Động đất - đỏ đậm
  hanhan: '#f39c12',     // Hạn hán - cam
  // Fire
  chay: '#e74c3c',      // Cháy - đỏ
  no: '#e67e22',        // Nổ - cam đậm
  // Health
  dich: '#7f8c8d',      // Dịch bệnh - xám
  onhiem: '#27ae60',    // Ô nhiễm - xanh lá
  // Infrastructure
  matdien: '#f1c40f',   // Mất điện - vàng
  matnuoc: '#3498db',   // Mất nước - xanh dương
  hata: '#9b59b6',      // Sự cố công trình - tím
  // Security
  tauthuyen: '#1abc9c', // Tàu thuyền - xanh ngọc
  anam: '#e74c3c',     // Mất tích - đỏ
  nguyhiem: '#e67e22', // Trẻ em nguy hiểm - cam đậm
  // Other
  khac: '#95a5a6'       // Khác - xám nhạt
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

  // Clear affected areas
  map.eachLayer(function(layer) {
    if (layer instanceof L.Circle && layer.options.isAffectedArea) {
      map.removeLayer(layer);
    }
  });

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
        ${incident.affectedArea ? '<p><strong>Vùng ảnh hưởng:</strong> ' + incident.affectedArea + ' km²</p>' : ''}
        ${incident.estimatedCasualties ? '<p><strong>Người bị ảnh hưởng:</strong> ' + incident.estimatedCasualties + '</p>' : ''}
      </div>
    `;

    marker.bindPopup(popupContent);
    marker.addTo(map);
    incidentMarkers.push(marker);

    // Draw affected area if specified
    if (incident.affectedArea && incident.affectedArea > 0) {
      var radius = Math.sqrt(incident.affectedArea / Math.PI) * 1000;
      var severityColors = {
        cap1: '#2ecc71',
        cap2: '#f39c12',
        cap3: '#3498db',
        cap4: '#e67e22',
        cap5: '#e74c3c'
      };

      var areaColor = severityColors[incident.severity] || '#f39c12';

      L.circle([incident.lat, incident.lng], {
        radius: radius,
        color: areaColor,
        fillColor: areaColor,
        fillOpacity: 0.2,
        weight: 2,
        isAffectedArea: true
      }).addTo(map).bindPopup('Vùng ảnh hưởng: ' + incident.affectedArea + ' km²');
    }
  });
}

// Helper functions
function getIncidentTypeName(type) {
  const names = {
    // Traffic
    'oga': 'Ổ gà',
    'tainan': 'Tai nạn',
    'ngapnuoc': 'Ngập nước',
    'vatcan': 'Vật cản',
    'kexe': 'Kẹt xe',
    // Natural disasters
    'bao': 'Bão, áp thấp nhiệt',
    'lut': 'Lũ lụt, lũ quét',
    'satlo': 'Sạt lở đất',
    'dongdat': 'Động đất, sóng thần',
    'hanhan': 'Hạn hán',
    // Fire
    'chay': 'Cháy rừng, cháy nhà',
    'no': 'Nổ',
    // Health
    'dich': 'Dịch bệnh',
    'onhiem': 'Ô nhiễm',
    // Infrastructure
    'matdien': 'Mất điện',
    'matnuoc': 'Mất nước',
    'hata': 'Sự cố công trình',
    // Security
    'tauthuyen': 'Sự cố tàu thuyền',
    'anam': 'Người mất tích',
    'nguyhiem': 'Trẻ em nguy hiểm',
    // Other
    'khac': 'Sự cố khác'
  };
  return names[type] || type;
}

function getSeverityName(severity) {
  const names = {
    'cap1': 'Cấp 1 - Rất thấp',
    'cap2': 'Cấp 2 - Thấp',
    'cap3': 'Cấp 3 - Trung bình',
    'cap4': 'Cấp 4 - Cao',
    'cap5': 'Cấp 5 - Rất cao',
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

// Update traffic by area
function updateTrafficByArea() {
  var areas = [
    { name: 'Quận 1', status: 'normal', speed: 45, time: 15 },
    { name: 'Quận 3', status: 'congested', speed: 30, time: 25 },
    { name: 'Quận 7', status: 'jammed', speed: 15, time: 40 },
    { name: 'Quận 12', status: 'dangerous', speed: 5, time: 60 }
  ];

  var areaList = document.getElementById('areaList');
  if (!areaList) return;

  var statusLabels = {
    normal: 'Bình thường',
    congested: 'Đông',
    jammed: 'Ùn tắc',
    dangerous: 'Nguy hiểm'
  };

  areaList.innerHTML = areas.map(function(area) {
    return `
      <div class="area-item">
        <div class="area-header">
          <span class="area-name">${area.name}</span>
          <span class="area-status ${area.status}">${statusLabels[area.status]}</span>
        </div>
        <div class="area-details">
          <span class="area-speed">${area.speed} km/h</span>
          <span class="area-time">${area.time} phút</span>
        </div>
      </div>
    `;
  }).join('');
}

// Update data source status
function updateDataSourceStatus() {
  var isOnline = Math.random() > 0.1; // 90% chance online
  var statusElement = document.getElementById('dataSourceStatus');
  
  if (statusElement) {
    if (isOnline) {
      statusElement.textContent = 'Đang kết nối';
      statusElement.style.color = '#28a745';
    } else {
      statusElement.textContent = 'Mất kết nối';
      statusElement.style.color = '#dc3545';
    }
  }

  // Show error notification if offline
  if (!isOnline) {
    showErrorNotification('Không thể kết nối đến nguồn dữ liệu giao thông');
  }
}

// Show error notification
function showErrorNotification(message) {
  var errorNotification = document.getElementById('errorNotification');
  var errorMessage = document.getElementById('errorMessage');
  
  if (errorNotification && errorMessage) {
    errorMessage.textContent = message;
    errorNotification.style.display = 'block';
  }
}

// Hide error notification
function hideErrorNotification() {
  var errorNotification = document.getElementById('errorNotification');
  if (errorNotification) {
    errorNotification.style.display = 'none';
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
    updateTrafficByArea();
    updateDataSourceStatus();
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
        updateDataSourceStatus();
      }, 3000);
    }
  }, 30000); // Check every 30 seconds
}

// Close error notification
document.getElementById('errorCloseBtn').addEventListener('click', function() {
  hideErrorNotification();
});

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

  // Check rate limiting
  if (!checkRateLimit(currentUser ? currentUser.id : 'anonymous')) {
    alert('Bạn đã gửi quá nhiều phản ánh. Vui lòng thử lại sau 1 phút.');
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

  // Sanitize inputs
  var title = sanitizeInput(document.getElementById('incidentTitle').value);
  var description = sanitizeInput(document.getElementById('incidentDescription').value);
  var contactName = sanitizeInput(document.getElementById('contactName').value);
  var contactPhone = sanitizeInput(document.getElementById('contactPhone').value);
  var contactEmail = sanitizeInput(document.getElementById('contactEmail').value);

  // Validate contact info if provided
  if (contactEmail && !validateEmail(contactEmail)) {
    alert('Email liên hệ không hợp lệ');
    return;
  }

  if (contactPhone && !validatePhone(contactPhone)) {
    alert('Số điện thoại liên hệ không hợp lệ');
    return;
  }

  // Create incident report object
  var report = {
    id: 'INC-' + Date.now(),
    userId: currentUser ? currentUser.id : null,
    type: document.getElementById('incidentType').value,
    title: title,
    description: description,
    location: {
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      address: sanitizeInput(document.getElementById('address').value)
    },
    severity: document.getElementById('severity').value,
    contact: {
      name: contactName,
      phone: contactPhone,
      email: contactEmail
    },
    anonymous: document.getElementById('anonymous').checked,
    status: 'pending',
    createdAt: new Date().toISOString(),
    hasImages: document.getElementById('incidentImage').files.length > 0,
    hasVideo: document.getElementById('incidentVideo').files.length > 0,
    // Multi-hazard specific fields
    affectedArea: parseFloat(document.getElementById('affectedArea').value) || null,
    estimatedCasualties: parseInt(document.getElementById('estimatedCasualties').value) || null,
    sourceReliability: document.getElementById('sourceReliability').value || 'medium',
    relatedIncidents: document.getElementById('relatedIncidents').value ? document.getElementById('relatedIncidents').value.split(',').map(function(id) { return id.trim(); }) : [],
    // Severity level (1-5)
    severityLevel: parseInt(document.getElementById('severity').value.replace('cap', '')) || 3,
    // Initial status
    incidentStatus: 'new', // new, monitoring, controlled, resolved
    source: 'user_report', // user_report, official, verified
    verification: {
      status: 'unverified',
      verifiedBy: null,
      verifiedAt: null,
      reliabilityLevel: document.getElementById('sourceReliability').value
    }
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
    severity: report.severity,
    severityLevel: report.severityLevel,
    affectedArea: report.affectedArea
  });

  // Draw affected area on map if specified
  if (report.affectedArea && report.affectedArea > 0) {
    var radius = Math.sqrt(report.affectedArea / Math.PI) * 1000; // Convert km² to meters
    var severityColors = {
      cap1: '#2ecc71',
      cap2: '#f39c12',
      cap3: '#3498db',
      cap4: '#e67e22',
      cap5: '#e74c3c'
    };

    var areaColor = severityColors[report.severity] || '#f39c12';

    L.circle([report.location.lat, report.location.lng], {
      radius: radius,
      color: areaColor,
      fillColor: areaColor,
      fillOpacity: 0.2,
      weight: 2,
      isAffectedArea: true
    }).addTo(map).bindPopup('Vùng ảnh hưởng: ' + report.affectedArea + ' km²');
  }

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

// File upload size validation
document.getElementById('incidentImage').addEventListener('change', function(e) {
  var files = e.target.files;
  if (files.length > 5) {
    alert('Chỉ được tải lên tối đa 5 ảnh');
    e.target.value = '';
    return;
  }

  for (var i = 0; i < files.length; i++) {
    if (!validateFileSize(files[i], securityConfig.maxImageSize)) {
      alert('Ảnh ' + (i + 1) + ' vượt quá kích thước cho phép (5MB)');
      e.target.value = '';
      return;
    }
  }
});

document.getElementById('incidentVideo').addEventListener('change', function(e) {
  var file = e.target.files[0];
  if (file && !validateFileSize(file, securityConfig.maxFileSize)) {
    alert('Video vượt quá kích thước cho phép (50MB)');
    e.target.value = '';
  }
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

// Security System
var securityConfig = {
  maxLoginAttempts: 5,
  lockoutDuration: 15 * 60 * 1000, // 15 minutes
  rateLimitWindow: 60 * 1000, // 1 minute
  maxSubmissionsPerWindow: 10,
  maxFileSize: 50 * 1024 * 1024, // 50MB
  maxImageSize: 5 * 1024 * 1024, // 5MB
  sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
  requirePasswordChange: false
};

var loginAttempts = {};
var submissionCounts = {};
var apiResponseTimes = [];
var errorLogs = [];

// Early Warning System
var warningDataSources = [
  { id: 'weather', name: 'Bản tin khí tượng', status: 'disconnected', lastUpdate: null, delay: 0 },
  { id: 'water', name: 'Mực nước sông/hồ đập', status: 'disconnected', lastUpdate: null, delay: 0 },
  { id: 'landslide', name: 'Cảnh báo sạt lở', status: 'disconnected', lastUpdate: null, delay: 0 },
  { id: 'earthquake', name: 'Động đất/Rung chấn', status: 'disconnected', lastUpdate: null, delay: 0 },
  { id: 'air', name: 'Chất lượng không khí', status: 'disconnected', lastUpdate: null, delay: 0 },
  { id: 'temperature', name: 'Nhiệt độ/Hạn hán', status: 'disconnected', lastUpdate: null, delay: 0 },
  { id: 'health', name: 'Dịch bệnh (Y tế)', status: 'disconnected', lastUpdate: null, delay: 0 }
];

var warnings = [];
var warningHistory = [];

var warningLevels = {
  low: { label: 'Cấp 1 - Thấp', color: '#2ecc71', class: 'low' },
  medium: { label: 'Cấp 2 - Trung bình', color: '#f39c12', class: 'medium' },
  high: { label: 'Cấp 3 - Cao', color: '#e67e22', class: 'high' },
  severe: { label: 'Cấp 4 - Nghiêm trọng', color: '#e74c3c', class: 'severe' },
  critical: { label: 'Cấp 5 - Cực kỳ nghiêm trọng', color: '#9b59b6', class: 'critical' }
};

var actionGuides = {
  storm: {
    title: 'Hướng dẫn sơ tán trước bão',
    vi: [
      'Theo dõi thông tin cảnh báo từ cơ quan chức năng',
      'Chuẩn bị túi cứu sinh với các vật dụng cần thiết',
      'Di chuyển đến khu vực an toàn theo chỉ dẫn',
      'Không quay lại nhà khi chưa có lệnh cho phép',
      'Cố định nhà cửa, đóng kín cửa sổ',
      'Tránh xa cửa kính và dây điện'
    ],
    en: [
      'Monitor official weather warnings',
      'Prepare emergency kit with essential items',
      'Move to safe areas as directed',
      'Do not return home until authorized',
      'Secure windows and doors',
      'Stay away from windows and power lines'
    ]
  },
  flood: {
    title: 'Hướng dẫn khi ngập lụt',
    vi: [
      'Không chạm vào thiết bị điện khi đang ngập nước',
      'Ngắt cầu dao tổng trước khi nước dâng cao',
      'Sử dụng đèn pin thay vì điện',
      'Không đi qua cầu, hàm và vùng nước chảy xiết',
      'Di chuyển đến nơi cao hơn nếu nước dâng nhanh'
    ],
    en: [
      'Do not touch electrical equipment in floodwater',
      'Turn off main power before water rises',
      'Use flashlights instead of electricity',
      'Do not cross bridges or fast-flowing water',
      'Move to higher ground if water rises quickly'
    ]
  },
  landslide: {
    title: 'Hướng dẫn khi sạt lở',
    vi: [
      'Cảnh báo tiếng động lớn hoặc tiếng cây gãy',
      'Di chuyển ngay lập tức sang vùng an toàn',
      'Không đi qua khu vực có dấu hiệu sạt lở',
      'Tránh xa đường dốc và bờ sông khi mưa lớn'
    ],
    en: [
      'Watch for loud rumbling or cracking sounds',
      'Move immediately to safe areas',
      'Do not cross areas showing landslide signs',
      'Avoid steep slopes and riverbanks during heavy rain'
    ]
  },
  earthquake: {
    title: 'Hướng dẫn khi động đất',
    vi: [
      'Nằm xuống, che đầu và giữ vững',
      'Tránh xa cửa kính, tường và các vật có thể rơi',
      'Nếu ở ngoài trời, đứng ở vùng trống, tránh xa tòa nhà',
      'Không sử dụng thang máy',
      'Sau khi rung lắc, kiểm tra gas và điện'
    ],
    en: [
      'Drop, cover, and hold on',
      'Stay away from windows, walls, and falling objects',
      'If outdoors, stay in open areas away from buildings',
      'Do not use elevators',
      'After shaking stops, check gas and electricity'
    ]
  },
  fire: {
    title: 'Hướng dẫn phòng cháy chữa cháy',
    vi: [
      'Báo ngay cho cơ quan chức năng',
      'Sử dụng thiết bị chữa cháy nếu an toàn',
      'Di chuyển theo lối thoát hiểm',
      'Không sử dụng thang máy',
      'Bò thấp để tránh khói'
    ],
    en: [
      'Immediately notify authorities',
      'Use fire extinguisher if safe to do so',
      'Follow emergency exits',
      'Do not use elevators',
      'Crawl low to avoid smoke'
    ]
  },
  epidemic: {
    title: 'Hướng dẫn phòng lây nhiễm',
    vi: [
      'Đeo khẩu trang nơi công cộng',
      'Rửa tay thường xuyên với xà phòng',
      'Giữ khoảng cách xã hội',
      'Theo dõi sức khỏe và báo cáo nếu có triệu chứng',
      'Tiêm phòng vắc-xin theo khuyến cáo'
    ],
    en: [
      'Wear masks in public places',
      'Wash hands frequently with soap',
      'Maintain social distancing',
      'Monitor health and report symptoms',
      'Get vaccinated as recommended'
    ]
  }
};

var emergencyHotlines = {
  'Hồ Chí Minh': {
    police: '113',
    fire: '114',
    rescue: '115',
    disaster: '1900 2110'
  },
  'Hà Nội': {
    police: '113',
    fire: '114',
    rescue: '115',
    disaster: '1900 2110'
  },
  'Đà Nẵng': {
    police: '113',
    fire: '114',
    rescue: '115',
    disaster: '1900 2110'
  },
  'default': {
    police: '113',
    fire: '114',
    rescue: '115',
    disaster: '1900 2110'
  }
};

// Simple password hashing (for demo - in production use bcrypt)
function hashPassword(password) {
  // Simple hash for demo purposes
  var hash = 0;
  for (var i = 0; i < password.length; i++) {
    var char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return 'hash_' + Math.abs(hash).toString(16);
}

// Input validation and sanitization
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;

  // Remove potentially dangerous characters
  var sanitized = input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');

  // Remove extra whitespace
  sanitized = sanitized.trim().replace(/\s+/g, ' ');

  return sanitized;
}

// Validate email format
function validateEmail(email) {
  var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate phone number (Vietnam format)
function validatePhone(phone) {
  var phoneRegex = /^(0|\+84)([3-9][0-9]{8}|[2-9][0-9]{7})$/;
  return phoneRegex.test(phone);
}

// Rate limiting for submissions
function checkRateLimit(identifier) {
  var now = Date.now();
  var windowStart = now - securityConfig.rateLimitWindow;

  // Clean old entries
  submissionCounts[identifier] = submissionCounts[identifier] || [];
  submissionCounts[identifier] = submissionCounts[identifier].filter(function(timestamp) {
    return timestamp > windowStart;
  });

  // Check limit
  if (submissionCounts[identifier].length >= securityConfig.maxSubmissionsPerWindow) {
    return false;
  }

  // Add current submission
  submissionCounts[identifier].push(now);
  return true;
}

// Rate limiting for login attempts
function checkLoginAttempts(email) {
  var now = Date.now();
  var attempts = loginAttempts[email] || { count: 0, lastAttempt: 0 };

  // Reset if lockout period has passed
  if (now - attempts.lastAttempt > securityConfig.lockoutDuration) {
    attempts.count = 0;
  }

  // Check if locked out
  if (attempts.count >= securityConfig.maxLoginAttempts) {
    var remainingTime = Math.ceil((securityConfig.lockoutDuration - (now - attempts.lastAttempt)) / 60000);
    return {
      allowed: false,
      message: 'Tài khoản đã bị khóa. Vui lòng thử lại sau ' + remainingTime + ' phút.'
    };
  }

  // Increment attempts
  attempts.count++;
  attempts.lastAttempt = now;
  loginAttempts[email] = attempts;

  return {
    allowed: true,
    attemptsRemaining: securityConfig.maxLoginAttempts - attempts.count
  };
}

// File size validation
function validateFileSize(file, maxSize) {
  maxSize = maxSize || securityConfig.maxFileSize;
  return file.size <= maxSize;
}

// Personal data protection - mask sensitive information
function maskPersonalData(data) {
  if (!data) return data;

  var masked = JSON.parse(JSON.stringify(data));

  // Mask email
  if (masked.email) {
    var emailParts = masked.email.split('@');
    if (emailParts.length === 2) {
      var username = emailParts[0];
      var maskedUsername = username.substring(0, 2) + '***' + username.substring(username.length - 1);
      masked.email = maskedUsername + '@' + emailParts[1];
    }
  }

  // Mask phone
  if (masked.phone) {
    masked.phone = masked.phone.substring(0, 3) + '***' + masked.phone.substring(masked.phone.length - 2);
  }

  // Remove password
  if (masked.password) {
    delete masked.password;
  }

  return masked;
}

// Data backup (local storage backup)
function backupData() {
  var backup = {
    timestamp: new Date().toISOString(),
    users: users.map(function(user) {
      return maskPersonalData(user);
    }),
    incidentReports: incidentReports.map(function(report) {
      // Remove sensitive personal data from backup
      var safeReport = JSON.parse(JSON.stringify(report));
      if (safeReport.contact) {
        safeReport.contact = maskPersonalData(safeReport.contact);
      }
      return safeReport;
    }),
    activityLog: activityLog
  };

  try {
    localStorage.setItem('sosmap_backup_' + Date.now(), JSON.stringify(backup));

    // Keep only last 5 backups
    var backupKeys = Object.keys(localStorage).filter(function(key) {
      return key.startsWith('sosmap_backup_');
    }).sort().reverse();

    if (backupKeys.length > 5) {
      backupKeys.slice(5).forEach(function(key) {
        localStorage.removeItem(key);
      });
    }

    logActivity('data_backup', 'Sao lưu dữ liệu thành công');
    return true;
  } catch (e) {
    logActivity('data_backup_failed', 'Sao lưu dữ liệu thất bại: ' + e.message);
    return false;
  }
}

// Restore data from backup
function restoreData(backupKey) {
  try {
    var backupData = JSON.parse(localStorage.getItem(backupKey));
    if (backupData) {
      incidentReports = backupData.incidentReports || [];
      activityLog = backupData.activityLog || [];
      logActivity('data_restore', 'Khôi phục dữ liệu từ backup: ' + backupKey);
      return true;
    }
  } catch (e) {
    logActivity('data_restore_failed', 'Khôi phục dữ liệu thất bại: ' + e.message);
  }
  return false;
}

// API response time logging
function logApiResponseTime(apiName, duration) {
  apiResponseTimes.push({
    api: apiName,
    duration: duration,
    timestamp: new Date().toISOString()
  });

  // Keep only last 100 entries
  if (apiResponseTimes.length > 100) {
    apiResponseTimes = apiResponseTimes.slice(-100);
  }
}

// Error logging
function logError(error, context) {
  var errorLog = {
    error: error.message || error,
    stack: error.stack,
    context: context,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href
  };

  errorLogs.push(errorLog);

  // Keep only last 50 errors
  if (errorLogs.length > 50) {
    errorLogs = errorLogs.slice(-50);
  }

  console.error('Error logged:', errorLog);
}

// System status monitoring
function getSystemStatus() {
  var avgResponseTime = apiResponseTimes.length > 0 ?
    apiResponseTimes.reduce(function(sum, log) { return sum + log.duration; }, 0) / apiResponseTimes.length : 0;

  var recentErrors = errorLogs.filter(function(log) {
    return Date.now() - new Date(log.timestamp).getTime() < 3600000; // Last hour
  }).length;

  return {
    status: recentErrors > 10 ? 'degraded' : 'healthy',
    avgResponseTime: avgResponseTime.toFixed(2) + 'ms',
    errorCount: recentErrors,
    uptime: processUptime(),
    memoryUsage: getMemoryUsage()
  };
}

function processUptime() {
  var uptime = Date.now() - window.performance.timing.navigationStart;
  var seconds = Math.floor(uptime / 1000);
  var minutes = Math.floor(seconds / 60);
  var hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return hours + 'h ' + (minutes % 60) + 'm';
  } else if (minutes > 0) {
    return minutes + 'm ' + (seconds % 60) + 's';
  } else {
    return seconds + 's';
  }
}

function getMemoryUsage() {
  if (performance.memory) {
    var used = performance.memory.usedJSHeapSize / 1048576; // Convert to MB
    var total = performance.memory.totalJSHeapSize / 1048576;
    return used.toFixed(2) + 'MB / ' + total.toFixed(2) + 'MB';
  }
  return 'N/A';
}

// Automated testing simulation
function runAutomatedTests() {
  var testResults = {
    passed: 0,
    failed: 0,
    tests: []
  };

  // Test 1: Password hashing
  try {
    var hash = hashPassword('test123');
    var test1Passed = hash !== 'test123' && hash.startsWith('hash_');
    testResults.tests.push({ name: 'Password hashing', passed: test1Passed });
    if (test1Passed) testResults.passed++; else testResults.failed++;
  } catch (e) {
    testResults.tests.push({ name: 'Password hashing', passed: false, error: e.message });
    testResults.failed++;
  }

  // Test 2: Input sanitization
  try {
    var sanitized = sanitizeInput('<script>alert("xss")</script>');
    var test2Passed = !sanitized.includes('<script>');
    testResults.tests.push({ name: 'Input sanitization', passed: test2Passed });
    if (test2Passed) testResults.passed++; else testResults.failed++;
  } catch (e) {
    testResults.tests.push({ name: 'Input sanitization', passed: false, error: e.message });
    testResults.failed++;
  }

  // Test 3: Email validation
  try {
    var validEmail = validateEmail('test@example.com');
    var invalidEmail = !validateEmail('invalid-email');
    var test3Passed = validEmail && invalidEmail;
    testResults.tests.push({ name: 'Email validation', passed: test3Passed });
    if (test3Passed) testResults.passed++; else testResults.failed++;
  } catch (e) {
    testResults.tests.push({ name: 'Email validation', passed: false, error: e.message });
    testResults.failed++;
  }

  // Test 4: Rate limiting
  try {
    var rateLimitPassed = checkRateLimit('test_user');
    testResults.tests.push({ name: 'Rate limiting', passed: rateLimitPassed });
    if (rateLimitPassed) testResults.passed++; else testResults.failed++;
  } catch (e) {
    testResults.tests.push({ name: 'Rate limiting', passed: false, error: e.message });
    testResults.failed++;
  }

  logActivity('automated_test', 'Kết quả test: ' + testResults.passed + ' passed, ' + testResults.failed + ' failed');

  return testResults;
}

// Security monitoring dashboard
function updateSecurityDashboard() {
  var status = getSystemStatus();
  var statusDiv = document.getElementById('systemStatus');

  if (statusDiv) {
    var statusColor = status.status === 'healthy' ? '#28a745' : '#dc3545';
    statusDiv.innerHTML = '<span style="color: ' + statusColor + ';">●</span> ' +
                          'Trạng thái: ' + status.status + ' | ' +
                          'Response time: ' + status.avgResponseTime + ' | ' +
                          'Errors: ' + status.errorCount + ' | ' +
                          'Uptime: ' + status.uptime + ' | ' +
                          'Memory: ' + status.memoryUsage;
  }
}

// Apply security enhancements to existing functions
var originalInitializeUsers = initializeUsers;
initializeUsers = function() {
  originalInitializeUsers();

  // Hash passwords for demo users
  users.forEach(function(user) {
    if (!user.password.startsWith('hash_')) {
      user.password = hashPassword(user.password);
    }
  });
};

// Apply debouncing to search
var originalPerformSearch = performSearch;
performSearch = debounce(function() {
  // Get current search value
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
}, 300);

// File upload size validation
document.getElementById('incidentImage').addEventListener('change', function(e) {
  var files = e.target.files;
  if (files.length > 5) {
    alert('Chỉ được tải lên tối đa 5 ảnh');
    e.target.value = '';
    return;
  }

  for (var i = 0; i < files.length; i++) {
    if (!validateFileSize(files[i], securityConfig.maxImageSize)) {
      alert('Ảnh ' + (i + 1) + ' vượt quá kích thước cho phép (5MB)');
      e.target.value = '';
      return;
    }
  }
});

document.getElementById('incidentVideo').addEventListener('change', function(e) {
  var file = e.target.files[0];
  if (file && !validateFileSize(file, securityConfig.maxFileSize)) {
    alert('Video vượt quá kích thước cho phép (50MB)');
    e.target.value = '';
  }
});

// Backup data periodically
setInterval(backupData, 3600000); // Backup every hour

// Update security dashboard periodically
setInterval(updateSecurityDashboard, 30000); // Update every 30 seconds

// Run automated tests periodically
setInterval(runAutomatedTests, 3600000); // Run tests every hour

// Caching System
var cache = {
  data: {},
  ttl: 5 * 60 * 1000, // 5 minutes default TTL
};

function setCache(key, value, ttl) {
  ttl = ttl || cache.ttl;
  cache.data[key] = {
    value: value,
    expires: Date.now() + ttl
  };
}

function getCache(key) {
  var item = cache.data[key];
  if (!item) return null;

  if (Date.now() > item.expires) {
    delete cache.data[key];
    return null;
  }

  return item.value;
}

function clearCache() {
  cache.data = {};
  logActivity('cache_clear', 'Đã xóa cache');
}

function clearExpiredCache() {
  var now = Date.now();
  var cleared = 0;

  Object.keys(cache.data).forEach(function(key) {
    if (now > cache.data[key].expires) {
      delete cache.data[key];
      cleared++;
    }
  });

  if (cleared > 0) {
    logActivity('cache_cleanup', 'Đã xóa ' + cleared + ' mục cache hết hạn');
  }
}

// Clear expired cache periodically
setInterval(clearExpiredCache, 60000); // Every minute

// Cache map data
function cacheMapData() {
  setCache('map_bounds', {
    center: map.getCenter(),
    zoom: map.getZoom()
  }, 60000); // 1 minute

  setCache('incident_data', incidentData, 30000); // 30 seconds
}

// Restore map data from cache
function restoreMapData() {
  var mapBounds = getCache('map_bounds');
  if (mapBounds) {
    map.setView(mapBounds.center, mapBounds.zoom);
  }

  var cachedIncidents = getCache('incident_data');
  if (cachedIncidents) {
    incidentData = cachedIncidents;
  }
}

// Cache on map move
map.on('moveend', cacheMapData);
map.on('zoomend', cacheMapData);

// Performance optimization: Lazy load markers
var markerCache = new Map();
var visibleBounds = null;

function loadMarkersInBounds(bounds) {
  visibleBounds = bounds;

  // Filter markers within bounds
  var visibleMarkers = incidentData.filter(function(incident) {
    return bounds.contains([incident.lat, incident.lng]);
  });

  // Only load markers not already cached
  var newMarkers = visibleMarkers.filter(function(incident) {
    return !markerCache.has(incident.id);
  });

  // Add new markers
  newMarkers.forEach(function(incident) {
    var marker = createMarker(incident);
    markerCache.set(incident.id, marker);
  });

  return visibleMarkers.length;
}

// Optimize marker rendering
function optimizeMarkerRendering() {
  var bounds = map.getBounds();
  var markerCount = loadMarkersInBounds(bounds);

  // Remove markers outside bounds to improve performance
  markerCache.forEach(function(marker, id) {
    var markerPos = marker.getLatLng();
    if (!bounds.contains(markerPos)) {
      if (map.hasLayer(marker)) {
        map.removeLayer(marker);
      }
    } else {
      if (!map.hasLayer(marker)) {
        map.addLayer(marker);
      }
    }
  });

  logActivity('marker_optimization', 'Hiển thị ' + markerCount + ' marker trong phạm vi');
}

// Optimize on map move
map.on('moveend', optimizeMarkerRendering);
map.on('zoomend', optimizeMarkerRendering);

// Performance monitoring: Page load time
window.addEventListener('load', function() {
  var loadTime = window.performance.timing.loadEventEnd - window.performance.timing.navigationStart;
  logActivity('page_load', 'Thời gian tải trang: ' + loadTime + 'ms');
});

// Performance monitoring: API calls
var originalFetch = window.fetch;
window.fetch = function() {
  var startTime = Date.now();
  var url = arguments[0];

  return originalFetch.apply(this, arguments).then(function(response) {
    var duration = Date.now() - startTime;
    var apiName = typeof url === 'string' ? url.split('/')[2] : 'unknown';
    logApiResponseTime(apiName, duration);

    if (duration > 3000) {
      logActivity('slow_api', 'API chậm: ' + apiName + ' - ' + duration + 'ms');
    }

    return response;
  }).catch(function(error) {
    var duration = Date.now() - startTime;
    logError(error, { context: 'API call', url: url, duration: duration });
    throw error;
  });
};

// Performance: Debounce function for frequent events
function debounce(func, wait) {
  var timeout;
  return function() {
    var context = this;
    var args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(function() {
      func.apply(context, args);
    }, wait);
  };
}

// Performance: Throttle function for scroll events
function throttle(func, limit) {
  var inThrottle;
  return function() {
    var context = this;
    var args = arguments;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(function() {
        inThrottle = false;
      }, limit);
    }
  };
}

// Apply debouncing to search
var debouncedSearch = debounce(performSearch, 300);
document.getElementById('searchBtn').addEventListener('click', debouncedSearch);

// Apply throttling to map events
map.on('move', throttle(function() {
  // Throttled map move handler
}, 100));

// Lazy load images
function lazyLoadImages() {
  var images = document.querySelectorAll('img[data-src]');
  var imageObserver = new IntersectionObserver(function(entries, observer) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        var img = entry.target;
        img.src = img.getAttribute('data-src');
        img.removeAttribute('data-src');
        observer.unobserve(img);
      }
    });
  });

  images.forEach(function(img) {
    imageObserver.observe(img);
  });
}

// Initialize lazy loading
lazyLoadImages();

// System health check endpoint simulation
function healthCheck() {
  var health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      map: map ? 'operational' : 'down',
      authentication: currentUser ? 'operational' : 'operational',
      database: localStorage ? 'operational' : 'degraded',
      cache: Object.keys(cache.data).length > 0 ? 'operational' : 'operational'
    },
    metrics: {
      uptime: processUptime(),
      memory: getMemoryUsage(),
      avgResponseTime: apiResponseTimes.length > 0 ?
        (apiResponseTimes.reduce(function(sum, log) { return sum + log.duration; }, 0) / apiResponseTimes.length).toFixed(2) + 'ms' : 'N/A',
      errorRate: errorLogs.length > 0 ? (errorLogs.length / 100).toFixed(2) + '%' : '0%'
    }
  };

  return health;
}

// Display system status in sidebar
function displaySystemStatus() {
  var health = healthCheck();
  var statusPanel = document.getElementById('systemStatusPanel');

  if (statusPanel) {
    var statusColor = health.status === 'healthy' ? '#28a745' : '#dc3545';
    statusPanel.innerHTML = '<div style="font-size: 12px; color: #666;">' +
                          '<div style="margin-bottom: 4px;"><span style="color: ' + statusColor + ';">●</span> ' +
                          'Trạng thái: ' + health.status + '</div>' +
                          '<div>Uptime: ' + health.metrics.uptime + '</div>' +
                          '<div>Memory: ' + health.metrics.memory + '</div>' +
                          '<div>Response: ' + health.metrics.avgResponseTime + '</div>' +
                          '</div>';
  }
}

// Add system status panel to sidebar
var statusPanelHTML = '<div class="system-status-panel" id="systemStatusPanel">' +
                     '</div>';

// Append to sidebar after traffic panel
var trafficPanel = document.querySelector('.traffic-warnings');
if (trafficPanel) {
  trafficPanel.insertAdjacentHTML('afterend', statusPanelHTML);
}

// Update system status periodically
setInterval(displaySystemStatus, 10000); // Every 10 seconds

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

  // Check rate limiting
  var rateCheck = checkLoginAttempts(email);
  if (!rateCheck.allowed) {
    alert(rateCheck.message);
    return;
  }

  if (rateCheck.attemptsRemaining <= 2) {
    alert('Cảnh báo: Bạn còn ' + rateCheck.attemptsRemaining + ' lần thử đăng nhập.');
  }

  var password = document.getElementById('loginPassword').value;
  var rememberMe = document.getElementById('rememberMe').checked;

  // Hash password for comparison
  var hashedPassword = hashPassword(password);

  // Find user
  var user = users.find(function(u) {
    return u.email === email && u.password === hashedPassword && u.isActive;
  });

  if (user) {
    // Reset login attempts on success
    loginAttempts[email] = { count: 0, lastAttempt: 0 };

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

  var name = sanitizeInput(document.getElementById('registerName').value);
  var email = sanitizeInput(document.getElementById('registerEmail').value);
  var phone = sanitizeInput(document.getElementById('registerPhone').value);
  var password = document.getElementById('registerPassword').value;
  var confirmPassword = document.getElementById('registerConfirmPassword').value;
  var agreeTerms = document.getElementById('agreeTerms').checked;

  // Validate email
  if (!validateEmail(email)) {
    alert('Email không hợp lệ');
    return;
  }

  // Validate phone if provided
  if (phone && !validatePhone(phone)) {
    alert('Số điện thoại không hợp lệ');
    return;
  }

  // Check rate limiting
  if (!checkRateLimit(email)) {
    alert('Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau 1 phút.');
    return;
  }

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
    password: hashPassword(password),
    role: 'reporter',
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

// Accessibility Features
// Font size controls
document.getElementById('fontSmall').addEventListener('click', function() {
  document.documentElement.className = 'font-small';
  announceToScreenReader('Font size set to small');
});

document.getElementById('fontMedium').addEventListener('click', function() {
  document.documentElement.className = 'font-medium';
  announceToScreenReader('Font size set to medium');
});

document.getElementById('fontLarge').addEventListener('click', function() {
  document.documentElement.className = 'font-large';
  announceToScreenReader('Font size set to large');
});

document.getElementById('fontXLarge').addEventListener('click', function() {
  document.documentElement.className = 'font-xlarge';
  announceToScreenReader('Font size set to extra large');
});

// Toggle accessibility panel
document.getElementById('accessibilityToggle').addEventListener('click', function() {
  var controls = document.getElementById('fontSizeControls');
  controls.classList.toggle('active');

  if (controls.classList.contains('active')) {
    announceToScreenReader('Accessibility options opened');
  } else {
    announceToScreenReader('Accessibility options closed');
  }
});

// Announce to screen readers via ARIA live region
function announceToScreenReader(message) {
  var liveRegion = document.getElementById('ariaLiveRegion');
  if (liveRegion) {
    liveRegion.textContent = message;
    // Clear after announcement
    setTimeout(function() {
      liveRegion.textContent = '';
    }, 1000);
  }
}

// Keyboard navigation improvements
// Add keyboard support for map controls
document.querySelectorAll('.map-control-btn').forEach(function(btn) {
  btn.setAttribute('tabindex', '0');
  btn.setAttribute('role', 'button');
  btn.setAttribute('aria-label', btn.title || 'Map control');

  btn.addEventListener('keypress', function(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      btn.click();
    }
  });
});

// Add keyboard support for incident markers
function addKeyboardSupportToMarkers() {
  var markers = document.querySelectorAll('.leaflet-marker-icon');
  markers.forEach(function(marker) {
    marker.setAttribute('tabindex', '0');
    marker.setAttribute('role', 'button');
    marker.setAttribute('aria-label', 'Incident marker');

    marker.addEventListener('keypress', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        // Trigger click to open popup
        marker.click();
      }
    });
  });
}

// Add ARIA labels to form elements
document.querySelectorAll('input, select, textarea').forEach(function(element) {
  if (!element.getAttribute('aria-label') && !element.getAttribute('aria-labelledby')) {
    var label = document.querySelector('label[for="' + element.id + '"]');
    if (label) {
      element.setAttribute('aria-labelledby', label.id);
    }
  }
});

// Add ARIA labels to buttons without text
document.querySelectorAll('button').forEach(function(btn) {
  if (!btn.textContent.trim() && !btn.getAttribute('aria-label')) {
    var icon = btn.querySelector('svg');
    if (icon) {
      var title = btn.getAttribute('title');
      if (title) {
        btn.setAttribute('aria-label', title);
      }
    }
  }
});

// Initialize Early Warning System
function initializeEarlyWarningSystem() {
  // Load warning data from localStorage
  var savedWarnings = localStorage.getItem('sosmap_warnings');
  if (savedWarnings) {
    warnings = JSON.parse(savedWarnings);
  }

  var savedHistory = localStorage.getItem('sosmap_warning_history');
  if (savedHistory) {
    warningHistory = JSON.parse(savedHistory);
  }

  // Update warning data sources panel
  updateWarningDataSources();

  // Simulate connecting to warning data sources
  simulateWarningDataSources();

  // Render active warnings
  renderWarnings();

  // Check for expired warnings
  setInterval(checkExpiredWarnings, 60000); // Check every minute

  // Update warning data sources status
  setInterval(updateWarningDataSources, 30000); // Update every 30 seconds
}

function updateWarningDataSources() {
  var panel = document.getElementById('dataSourcesList');
  if (!panel) return;

  var now = new Date();
  warningDataSources.forEach(function(source) {
    if (source.lastUpdate) {
      var diff = now - new Date(source.lastUpdate);
      source.delay = Math.floor(diff / 1000); // delay in seconds
    }
  });

  // Update UI
  var warningSources = panel.querySelectorAll('.warning-source');
  warningSources.forEach(function(element, index) {
    if (index < warningDataSources.length) {
      var source = warningDataSources[index];
      var statusElement = element.querySelector('.data-source-status');
      var timestampElement = element.querySelector('.data-source-timestamp');

      if (statusElement) {
        statusElement.textContent = source.status === 'connected' ? 'Đã kết nối' : 'Ngắt kết nối';
        statusElement.className = 'data-source-status ' + source.status;
      }

      if (timestampElement) {
        if (source.lastUpdate) {
          var time = new Date(source.lastUpdate);
          timestampElement.textContent = time.toLocaleTimeString('vi-VN');
          if (source.delay > 300) {
            timestampElement.style.color = '#e74c3c';
          } else {
            timestampElement.style.color = '#999';
          }
        } else {
          timestampElement.textContent = '--:--:--';
        }
      }
    }
  });
}

function simulateWarningDataSources() {
  // Simulate connecting to warning data sources
  warningDataSources.forEach(function(source, index) {
    setTimeout(function() {
      source.status = 'connecting';
      updateWarningDataSources();

      setTimeout(function() {
        source.status = 'connected';
        source.lastUpdate = new Date().toISOString();
        updateWarningDataSources();
      }, 2000 + Math.random() * 3000);
    }, index * 1000);
  });
}

function renderWarnings() {
  var list = document.getElementById('warningList');
  if (!list) return;

  var activeWarnings = warnings.filter(function(w) {
    return w.status === 'active' && new Date(w.endTime) > new Date();
  });

  if (activeWarnings.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
        <p>Không có cảnh báo nào</p>
      </div>
    `;
    return;
  }

  list.innerHTML = activeWarnings.map(function(warning) {
    var level = warningLevels[warning.level] || warningLevels.medium;
    var startTime = new Date(warning.startTime);
    var endTime = new Date(warning.endTime);
    var isConfirmed = warning.confirmations && warning.confirmations[currentUser ? currentUser.id : 'anonymous'];

    return `
      <div class="warning-item ${level.class} ${warning.status}">
        <div class="warning-header">
          <div class="warning-title">${warning.title}</div>
          <span class="warning-badge ${level.class}">${level.label}</span>
        </div>
        <div class="warning-content">${warning.content}</div>
        <div class="warning-meta">
          <span>Thời gian: ${startTime.toLocaleString('vi-VN')} - ${endTime.toLocaleString('vi-VN')}</span>
          <span>Khu vực: ${warning.area}</span>
        </div>
        ${warning.actionGuide ? `<div class="warning-actions">
          <button class="warning-action-btn" onclick="showActionGuide('${warning.type}')">Xem hướng dẫn</button>
          ${warning.requireConfirmation && !isConfirmed ? `<button class="warning-action-btn confirm" onclick="confirmWarning('${warning.id}')">Xác nhận đã nhận</button>` : ''}
          ${isConfirmed ? '<span style="color: #2ecc71; font-size: 12px;">✓ Đã xác nhận</span>' : ''}
        </div>` : ''}
      </div>
    `;
  }).join('');
}

function checkExpiredWarnings() {
  var now = new Date();
  var expiredCount = 0;

  warnings.forEach(function(warning) {
    if (warning.status === 'active' && new Date(warning.endTime) < now) {
      warning.status = 'expired';
      expiredCount++;
    }
  });

  if (expiredCount > 0) {
    saveWarnings();
    renderWarnings();
  }
}

function saveWarnings() {
  localStorage.setItem('sosmap_warnings', JSON.stringify(warnings));
  localStorage.setItem('sosmap_warning_history', JSON.stringify(warningHistory));
}

function createWarning(data) {
  var warning = {
    id: 'WRN-' + Date.now(),
    type: data.type,
    level: data.level,
    title: data.title,
    content: data.content,
    contentVI: data.contentVI,
    contentEN: data.contentEN,
    area: data.area,
    radius: data.radius,
    startTime: data.startTime,
    endTime: data.endTime,
    targets: data.targets,
    requireConfirmation: data.requireConfirmation,
    sendReminder: data.sendReminder,
    actionGuide: data.actionGuide,
    status: 'active',
    createdBy: currentUser ? currentUser.id : 'system',
    createdAt: new Date().toISOString(),
    confirmations: {},
    reminders: []
  };

  warnings.push(warning);
  warningHistory.push({
    action: 'create',
    warningId: warning.id,
    timestamp: new Date().toISOString(),
    details: warning
  });

  saveWarnings();
  renderWarnings();

  // Send browser notifications for active warnings
  if (Notification.permission === 'granted') {
    new Notification('Cảnh báo mới: ' + warning.title, {
      body: warning.content,
      icon: '/favicon.ico'
    });
  }

  logActivity('warning_create', 'Tạo cảnh báo: ' + warning.id);

  return warning;
}

function confirmWarning(warningId) {
  var warning = warnings.find(function(w) {
    return w.id === warningId;
  });

  if (!warning) {
    alert('Không tìm thấy cảnh báo');
    return;
  }

  var userId = currentUser ? currentUser.id : 'anonymous';
  warning.confirmations[userId] = {
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent
  };

  saveWarnings();
  renderWarnings();

  alert('Đã xác nhận nhận cảnh báo!');
  logActivity('warning_confirm', 'Xác nhận cảnh báo: ' + warningId);
}

function revokeWarning(warningId) {
  var warning = warnings.find(function(w) {
    return w.id === warningId;
  });

  if (!warning) {
    alert('Không tìm thấy cảnh báo');
    return;
  }

  warning.status = 'revoked';
  warning.revokedAt = new Date().toISOString();
  warning.revokedBy = currentUser ? currentUser.id : 'system';

  warningHistory.push({
    action: 'revoke',
    warningId: warningId,
    timestamp: new Date().toISOString(),
    details: warning
  });

  saveWarnings();
  renderWarnings();
  renderWarningHistory();

  alert('Đã thu hồi cảnh báo!');
  logActivity('warning_revoke', 'Thu hồi cảnh báo: ' + warningId);
}

function showActionGuide(type) {
  var guide = actionGuides[type];
  if (!guide) {
    alert('Không có hướng dẫn cho loại sự cố này');
    return;
  }

  var content = document.getElementById('actionGuideContent');
  if (content) {
    var currentLang = 'vi'; // Default to Vietnamese
    content.innerHTML = `
      <h4>${guide.title}</h4>
      <ul>
        ${guide[currentLang].map(function(item) {
          return '<li>' + item + '</li>';
        }).join('')}
      </ul>
      <h4>Số điện thoại khẩn cấp</h4>
      <ul class="hotline-list">
        <li>Cảnh sát: ${emergencyHotlines.default.police}</li>
        <li>Cứu hỏa: ${emergencyHotlines.default.fire}</li>
        <li>Cứu hộ: ${emergencyHotlines.default.rescue}</li>
        <li>Tổng đài thiên tai: ${emergencyHotlines.default.disaster}</li>
      </ul>
    `;
  }

  document.getElementById('actionGuideModal').style.display = 'block';
}

function renderWarningHistory() {
  var list = document.getElementById('warningHistoryList');
  if (!list) return;

  if (warningHistory.length === 0) {
    list.innerHTML = '<div class="empty-state"><p>Không có lịch sử cảnh báo</p></div>';
    return;
  }

  list.innerHTML = warningHistory.map(function(entry) {
    var warning = entry.details;
    var level = warningLevels[warning.level] || warningLevels.medium;
    var time = new Date(entry.timestamp);

    return `
      <div class="warning-history-item">
        <div class="warning-history-info">
          <div class="warning-history-title">${warning.title}</div>
          <div class="warning-history-meta">
            ${entry.action === 'create' ? 'Tạo mới' : entry.action === 'revoke' ? 'Thu hồi' : 'Cập nhật'} - ${time.toLocaleString('vi-VN')}
          </div>
          <span class="warning-history-status ${warning.status}">${warning.status === 'active' ? 'Đang hoạt động' : warning.status === 'expired' ? 'Đã hết hạn' : 'Đã thu hồi'}</span>
        </div>
        <div class="warning-history-actions">
          ${warning.status === 'active' ? `<button class="warning-action-btn" onclick="revokeWarning('${warning.id}')">Thu hồi</button>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

// Warning Modal Event Listeners
document.getElementById('createWarningBtn').addEventListener('click', function() {
  document.getElementById('warningModal').style.display = 'block';
});

document.getElementById('closeWarningModal').addEventListener('click', function() {
  document.getElementById('warningModal').style.display = 'none';
});

document.getElementById('cancelWarningBtn').addEventListener('click', function() {
  document.getElementById('warningModal').style.display = 'none';
});

document.getElementById('submitWarningBtn').addEventListener('click', function() {
  var type = document.getElementById('warningType').value;
  var level = document.getElementById('warningLevel').value;
  var title = document.getElementById('warningTitle').value;
  var content = document.getElementById('warningContent').value;
  var contentVI = document.getElementById('warningContentVI').value;
  var contentEN = document.getElementById('warningContentEN').value;
  var area = document.getElementById('warningArea').value;
  var radius = document.getElementById('warningRadius').value;
  var startTime = document.getElementById('warningStartTime').value;
  var endTime = document.getElementById('warningEndTime').value;
  var requireConfirmation = document.getElementById('requireConfirmation').checked;
  var sendReminder = document.getElementById('sendReminder').checked;
  var actionGuide = document.getElementById('actionGuide').value;

  var targets = [];
  document.querySelectorAll('input[name="target"]:checked').forEach(function(checkbox) {
    targets.push(checkbox.value);
  });

  if (!type || !level || !title || !content || !area || !startTime || !endTime) {
    alert('Vui lòng điền đầy đủ các trường bắt buộc');
    return;
  }

  if (new Date(startTime) >= new Date(endTime)) {
    alert('Thời gian bắt đầu phải trước thời gian hết hạn');
    return;
  }

  var warningData = {
    type: type,
    level: level,
    title: title,
    content: content,
    contentVI: contentVI,
    contentEN: contentEN,
    area: area,
    radius: radius ? parseFloat(radius) : null,
    startTime: new Date(startTime).toISOString(),
    endTime: new Date(endTime).toISOString(),
    targets: targets,
    requireConfirmation: requireConfirmation,
    sendReminder: sendReminder,
    actionGuide: actionGuide
  };

  createWarning(warningData);
  document.getElementById('warningModal').style.display = 'none';
  document.getElementById('warningForm').reset();
  alert('Đã phát hành cảnh báo!');
});

document.getElementById('warningArea').addEventListener('change', function() {
  var customGroup = document.getElementById('customAreaGroup');
  if (this.value === 'custom') {
    customGroup.style.display = 'block';
  } else {
    customGroup.style.display = 'none';
  }
});

// Warning History Modal Event Listeners
document.getElementById('viewHistoryBtn').addEventListener('click', function() {
  renderWarningHistory();
  document.getElementById('warningHistoryModal').style.display = 'block';
});

document.getElementById('closeHistoryModal').addEventListener('click', function() {
  document.getElementById('warningHistoryModal').style.display = 'none';
});

document.getElementById('closeHistoryBtn').addEventListener('click', function() {
  document.getElementById('warningHistoryModal').style.display = 'none';
});

// Action Guide Modal Event Listeners
document.getElementById('closeActionGuideModal').addEventListener('click', function() {
  document.getElementById('actionGuideModal').style.display = 'none';
});

document.getElementById('closeActionGuideBtn').addEventListener('click', function() {
  document.getElementById('actionGuideModal').style.display = 'none';
});

// Initialize early warning system on page load
// earlyWarningSystem initialization is now called from main DOMContentLoaded

// Search & Rescue System
var rescueRequests = [];
var rescueTeams = [
  { id: 'medical', name: 'Đội Y tế', status: 'available', capacity: 5, skills: ['y tế', 'cấp cứu'], location: { lat: 10.7769, lng: 106.7009 } },
  { id: 'water', name: 'Đội Dưới nước', status: 'available', capacity: 8, skills: ['lặn', 'cứu đuối'], location: { lat: 10.7800, lng: 106.7050 } },
  { id: 'mountain', name: 'Đội Leo núi', status: 'busy', capacity: 6, skills: ['leo núi', 'tìm kiếm'], location: { lat: 10.7750, lng: 106.6950 } },
  { id: 'fire', name: 'Đội PCCC', status: 'available', capacity: 10, skills: ['phòng cháy', 'cứu hỏa'], location: { lat: 10.7780, lng: 106.7100 } }
];
var volunteers = [];
var dispatchMap = null;

var rescueTypes = {
  trapped: 'Mắc kẹt',
  injured: 'Bị thương',
  missing: 'Mất tích',
  medical: 'Cần y tế khẩn cấp',
  evacuation: 'Cần sơ tán',
  other: 'Khác'
};

var rescueStatuses = {
  pending: 'Đang chờ',
  assigned: 'Đã phân công',
  in_progress: 'Đang xử lý',
  completed: 'Đã hoàn thành',
  cancelled: 'Đã hủy'
};

function initializeRescueSystem() {
  // Load rescue requests from localStorage
  var savedRequests = localStorage.getItem('sosmap_rescue_requests');
  if (savedRequests) {
    rescueRequests = JSON.parse(savedRequests);
  }

  var savedVolunteers = localStorage.getItem('sosmap_volunteers');
  if (savedVolunteers) {
    volunteers = JSON.parse(savedVolunteers);
  }

  // Render rescue requests
  renderRescueRequests();

  // Check for overdue requests
  setInterval(checkOverdueRescueRequests, 60000); // Check every minute
}

function renderRescueRequests() {
  var list = document.getElementById('rescueRequestsList');
  if (!list) return;

  var activeRequests = rescueRequests.filter(function(r) {
    return r.status !== 'cancelled' && r.status !== 'completed';
  });

  if (activeRequests.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
        <p>Không có yêu cầu cứu hộ nào</p>
      </div>
    `;
    return;
  }

  list.innerHTML = activeRequests.map(function(request) {
    var typeLabel = rescueTypes[request.type] || request.type;
    var statusLabel = rescueStatuses[request.status] || request.status;
    var isEmergency = request.priority === 'emergency';

    return `
      <div class="rescue-request-item ${request.status}">
        <div class="rescue-request-header">
          <div class="rescue-request-title">
            ${isEmergency ? '🆘 ' : ''}${typeLabel} - ${request.peopleCount} người
          </div>
          <span class="rescue-request-badge ${isEmergency ? 'emergency' : ''}">${statusLabel}</span>
        </div>
        <div class="rescue-request-content">${request.description}</div>
        <div class="rescue-request-meta">
          <span>${new Date(request.createdAt).toLocaleString('vi-VN')}</span>
          <span>Mã: ${request.id}</span>
        </div>
        <div class="rescue-request-actions">
          <button class="rescue-action-btn" onclick="showRescueDetail('${request.id}')">Chi tiết</button>
          ${request.status === 'pending' ? `<button class="rescue-action-btn" onclick="cancelRescueRequest('${request.id}')">Hủy</button>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

function createRescueRequest(data) {
  var request = {
    id: 'SOS-' + Date.now(),
    type: data.type,
    peopleCount: data.peopleCount,
    vulnerableGroups: data.vulnerableGroups || [],
    description: data.description,
    location: data.location,
    gpsAccuracy: data.gpsAccuracy,
    contact: data.contact,
    name: data.name,
    hasImage: data.hasImage,
    hasVideo: data.hasVideo,
    allowRelative: data.allowRelative,
    enableTracking: data.enableTracking,
    status: 'pending',
    priority: 'emergency',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    assignedTeam: null,
    timeline: [],
    communications: []
  };

  // Add initial timeline entry
  request.timeline.push({
    action: 'created',
    timestamp: new Date().toISOString(),
    note: 'Yêu cầu cứu hộ được tạo'
  });

  rescueRequests.push(request);
  saveRescueRequests();
  renderRescueRequests();

  // Send browser notification
  if (Notification.permission === 'granted') {
    new Notification('🆘 Yêu cầu cứu hộ mới: ' + request.id, {
      body: request.description,
      icon: '/favicon.ico',
      requireInteraction: true
    });
  }

  logActivity('rescue_create', 'Tạo yêu cầu cứu hộ: ' + request.id);

  return request;
}

function cancelRescueRequest(requestId) {
  var request = rescueRequests.find(function(r) {
    return r.id === requestId;
  });

  if (!request) {
    alert('Không tìm thấy yêu cầu cứu hộ');
    return;
  }

  if (request.status !== 'pending') {
    alert('Chỉ có thể hủy yêu cầu đang chờ xử lý');
    return;
  }

  if (!confirm('Bạn có chắc muốn hủy yêu cầu cứu hộ này?')) {
    return;
  }

  request.status = 'cancelled';
  request.cancelledAt = new Date().toISOString();
  request.cancelledBy = currentUser ? currentUser.id : 'anonymous';

  request.timeline.push({
    action: 'cancelled',
    timestamp: new Date().toISOString(),
    note: 'Yêu cầu được hủy bởi người yêu cầu'
  });

  saveRescueRequests();
  renderRescueRequests();

  alert('Đã hủy yêu cầu cứu hộ!');
  logActivity('rescue_cancel', 'Hủy yêu cầu cứu hộ: ' + requestId);
}

function showRescueDetail(requestId) {
  var request = rescueRequests.find(function(r) {
    return r.id === requestId;
  });

  if (!request) {
    alert('Không tìm thấy yêu cầu cứu hộ');
    return;
  }

  var content = document.getElementById('rescueDetailContent');
  if (content) {
    var typeLabel = rescueTypes[request.type] || request.type;
    var statusLabel = rescueStatuses[request.status] || request.status;

    content.innerHTML = `
      <div class="rescue-detail">
        <div class="detail-row">
          <strong>Mã yêu cầu:</strong> ${request.id}
        </div>
        <div class="detail-row">
          <strong>Loại yêu cầu:</strong> ${typeLabel}
        </div>
        <div class="detail-row">
          <strong>Số người:</strong> ${request.peopleCount}
        </div>
        ${request.vulnerableGroups.length > 0 ? `
        <div class="detail-row">
          <strong>Nhóm yếu thế:</strong> ${request.vulnerableGroups.join(', ')}
        </div>
        ` : ''}
        <div class="detail-row">
          <strong>Mô tả:</strong> ${request.description}
        </div>
        <div class="detail-row">
          <strong>Vị trí:</strong> ${request.location.lat.toFixed(6)}, ${request.location.lng.toFixed(6)}
        </div>
        ${request.gpsAccuracy ? `
        <div class="detail-row">
          <strong>Độ chính xác GPS:</strong> ±${request.gpsAccuracy}m
        </div>
        ` : ''}
        <div class="detail-row">
          <strong>Liên hệ:</strong> ${request.contact} (${request.name || 'Không tên'})
        </div>
        <div class="detail-row">
          <strong>Trạng thái:</strong> ${statusLabel}
        </div>
        <div class="detail-row">
          <strong>Thời gian tạo:</strong> ${new Date(request.createdAt).toLocaleString('vi-VN')}
        </div>
        ${request.assignedTeam ? `
        <div class="detail-row">
          <strong>Đội cứu hộ:</strong> ${request.assignedTeam}
        </div>
        ` : ''}
        <div class="detail-row">
          <strong>Lịch sử:</strong>
          <ul>
            ${request.timeline.map(function(entry) {
              return '<li>' + new Date(entry.timestamp).toLocaleString('vi-VN') + ' - ' + entry.note + '</li>';
            }).join('')}
          </ul>
        </div>
      </div>
    `;
  }

  document.getElementById('rescueDetailModal').style.display = 'block';
}

function checkOverdueRescueRequests() {
  var now = new Date();
  var overdueThreshold = 30 * 60 * 1000; // 30 minutes

  rescueRequests.forEach(function(request) {
    if (request.status === 'pending' || request.status === 'assigned') {
      var elapsed = now - new Date(request.createdAt);
      if (elapsed > overdueThreshold) {
        // Alert about overdue request
        if (Notification.permission === 'granted') {
          new Notification('⚠️ Yêu cầu cứu hộ quá hạn: ' + request.id, {
            body: 'Yêu cầu đã chờ quá 30 phút chưa được xử lý',
            icon: '/favicon.ico'
          });
        }
        logActivity('rescue_overdue', 'Yêu cầu quá hạn: ' + request.id);
      }
    }
  });
}

function saveRescueRequests() {
  localStorage.setItem('sosmap_rescue_requests', JSON.stringify(rescueRequests));
}

function saveVolunteers() {
  localStorage.setItem('sosmap_volunteers', JSON.stringify(volunteers));
}

// Emergency Rescue Modal Event Listeners
document.getElementById('emergencyRescueBtn').addEventListener('click', function() {
  document.getElementById('emergencyRescueModal').style.display = 'block';
  // Get current location automatically
  getCurrentLocation();
});

document.getElementById('closeEmergencyRescueModal').addEventListener('click', function() {
  document.getElementById('emergencyRescueModal').style.display = 'none';
});

document.getElementById('cancelEmergencyRescueBtn').addEventListener('click', function() {
  document.getElementById('emergencyRescueModal').style.display = 'none';
});

document.getElementById('getCurrentLocationBtn').addEventListener('click', function() {
  getCurrentLocation();
});

function getCurrentLocation() {
  var locationInput = document.getElementById('rescueLocation');
  var latInput = document.getElementById('rescueLat');
  var lngInput = document.getElementById('rescueLng');
  var accuracyDiv = document.getElementById('gpsAccuracy');

  locationInput.value = 'Đang lấy vị trí...';

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      function(position) {
        var lat = position.coords.latitude;
        var lng = position.coords.longitude;
        var accuracy = position.coords.accuracy;

        latInput.value = lat;
        lngInput.value = lng;
        locationInput.value = lat.toFixed(6) + ', ' + lng.toFixed(6);
        accuracyDiv.textContent = 'Độ chính xác: ±' + Math.round(accuracy) + 'm';
        accuracyDiv.style.color = accuracy < 50 ? '#2ecc71' : accuracy < 100 ? '#f39c12' : '#e74c3c';
      },
      function(error) {
        locationInput.value = 'Không thể lấy vị trí';
        accuracyDiv.textContent = 'Lỗi: ' + error.message;
        accuracyDiv.style.color = '#e74c3c';
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  } else {
    locationInput.value = 'Trình duyệt không hỗ trợ GPS';
    accuracyDiv.textContent = 'Geolocation không được hỗ trợ';
  }
}

document.getElementById('submitEmergencyRescueBtn').addEventListener('click', function() {
  var type = document.getElementById('rescueType').value;
  var peopleCount = parseInt(document.getElementById('rescuePeopleCount').value);
  var description = document.getElementById('rescueDescription').value;
  var contact = document.getElementById('rescueContact').value;
  var name = document.getElementById('rescueName').value;
  var lat = document.getElementById('rescueLat').value;
  var lng = document.getElementById('rescueLng').value;
  var allowRelative = document.getElementById('allowRelativeRequest').checked;
  var enableTracking = document.getElementById('enableRealtimeTracking').checked;

  var vulnerableGroups = [];
  document.querySelectorAll('input[name="vulnerable"]:checked').forEach(function(checkbox) {
    vulnerableGroups.push(checkbox.value);
  });

  if (!type || !peopleCount || !description || !contact) {
    alert('Vui lòng điền đầy đủ các trường bắt buộc');
    return;
  }

  if (!lat || !lng) {
    alert('Vui lòng lấy vị trí GPS');
    return;
  }

  var hasImage = document.getElementById('rescueImage').files.length > 0;
  var hasVideo = document.getElementById('rescueVideo').files.length > 0;

  var rescueData = {
    type: type,
    peopleCount: peopleCount,
    vulnerableGroups: vulnerableGroups,
    description: description,
    location: { lat: parseFloat(lat), lng: parseFloat(lng) },
    gpsAccuracy: parseFloat(document.getElementById('gpsAccuracy').textContent) || null,
    contact: contact,
    name: name,
    hasImage: hasImage,
    hasVideo: hasVideo,
    allowRelative: allowRelative,
    enableTracking: enableTracking
  };

  createRescueRequest(rescueData);
  document.getElementById('emergencyRescueModal').style.display = 'none';
  document.getElementById('emergencyRescueForm').reset();
  alert('Đã gửi yêu cầu cứu hộ khẩn cấp! Mã yêu cầu: ' + rescueRequests[rescueRequests.length - 1].id);
});

// Rescue Requests Modal Event Listeners
document.getElementById('viewRescueRequestsBtn').addEventListener('click', function() {
  renderRescueRequestsTable();
  document.getElementById('rescueRequestsModal').style.display = 'block';
});

document.getElementById('closeRescueRequestsModal').addEventListener('click', function() {
  document.getElementById('rescueRequestsModal').style.display = 'none';
});

document.getElementById('closeRescueRequestsBtn').addEventListener('click', function() {
  document.getElementById('rescueRequestsModal').style.display = 'none';
});

function renderRescueRequestsTable() {
  var table = document.getElementById('rescueRequestsTable');
  if (!table) return;

  var statusFilter = document.getElementById('rescueStatusFilter').value;
  var typeFilter = document.getElementById('rescueTypeFilter').value;

  var filteredRequests = rescueRequests.filter(function(r) {
    var statusMatch = statusFilter === 'all' || r.status === statusFilter;
    var typeMatch = typeFilter === 'all' || r.type === typeFilter;
    return statusMatch && typeMatch;
  });

  if (filteredRequests.length === 0) {
    table.innerHTML = '<div class="empty-state"><p>Không có yêu cầu nào</p></div>';
    return;
  }

  table.innerHTML = filteredRequests.map(function(request) {
    var typeLabel = rescueTypes[request.type] || request.type;
    var statusLabel = rescueStatuses[request.status] || request.status;

    return `
      <div class="rescue-table-row">
        <div class="rescue-table-cell">
          <strong>${request.id}</strong><br>
          ${typeLabel} - ${request.peopleCount} người
        </div>
        <div class="rescue-table-cell">
          ${request.description.substring(0, 50)}...
        </div>
        <div class="rescue-table-cell status">
          <span class="rescue-request-badge ${request.status}">${statusLabel}</span>
        </div>
        <div class="rescue-table-cell actions">
          <button class="rescue-action-btn" onclick="showRescueDetail('${request.id}')">Xem</button>
        </div>
      </div>
    `;
  }).join('');
}

document.getElementById('rescueStatusFilter').addEventListener('change', renderRescueRequestsTable);
document.getElementById('rescueTypeFilter').addEventListener('change', renderRescueRequestsTable);

// Rescue Detail Modal Event Listeners
document.getElementById('closeRescueDetailModal').addEventListener('click', function() {
  document.getElementById('rescueDetailModal').style.display = 'none';
});

document.getElementById('closeRescueDetailBtn').addEventListener('click', function() {
  document.getElementById('rescueDetailModal').style.display = 'none';
});

document.getElementById('cancelRescueBtn').addEventListener('click', function() {
  var requestId = document.querySelector('.rescue-detail .detail-row strong').textContent.replace('Mã yêu cầu: ', '');
  cancelRescueRequest(requestId);
  document.getElementById('rescueDetailModal').style.display = 'none';
});

// Dispatch Center Modal Event Listeners
document.getElementById('dispatchCenterBtn').addEventListener('click', function() {
  document.getElementById('dispatchCenterModal').style.display = 'block';
  initializeDispatchMap();
  renderDispatchRequests();
  renderTeamsList();
});

document.getElementById('closeDispatchCenterModal').addEventListener('click', function() {
  document.getElementById('dispatchCenterModal').style.display = 'none';
});

document.getElementById('closeDispatchCenterBtn').addEventListener('click', function() {
  document.getElementById('dispatchCenterModal').style.display = 'none';
});

function initializeDispatchMap() {
  if (dispatchMap) {
    dispatchMap.remove();
  }

  dispatchMap = L.map('dispatchMap').setView([10.7769, 106.7009], 13);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(dispatchMap);

  // Add rescue request markers
  rescueRequests.filter(function(r) {
    return r.status === 'pending' || r.status === 'assigned' || r.status === 'in_progress';
  }).forEach(function(request) {
    var marker = L.marker([request.location.lat, request.location.lng])
      .addTo(dispatchMap)
      .bindPopup('<b>' + request.id + '</b><br>' + rescueTypes[request.type] + '<br>' + request.peopleCount + ' người');
  });

  // Add team markers
  rescueTeams.forEach(function(team) {
    if (team.location) {
      var marker = L.marker([team.location.lat, team.location.lng], {
        icon: L.divIcon({
          className: 'team-marker',
          html: '<div style="background: ' + (team.status === 'available' ? '#2ecc71' : '#e74c3c') + '; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white;"></div>',
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        })
      })
      .addTo(dispatchMap)
      .bindPopup('<b>' + team.name + '</b><br>' + (team.status === 'available' ? 'Sẵn sàng' : 'Đang nhiệm vụ'));
    }
  });
}

function renderDispatchRequests() {
  var list = document.getElementById('dispatchRequestsList');
  if (!list) return;

  var pendingRequests = rescueRequests.filter(function(r) {
    return r.status === 'pending' || r.status === 'assigned';
  });

  if (pendingRequests.length === 0) {
    list.innerHTML = '<div class="empty-state"><p>Không có yêu cầu nào</p></div>';
    return;
  }

  list.innerHTML = pendingRequests.map(function(request) {
    var typeLabel = rescueTypes[request.type] || request.type;
    var elapsed = Math.floor((new Date() - new Date(request.createdAt)) / 60000); // minutes

    return `
      <div class="dispatch-request-item" onclick="selectDispatchRequest('${request.id}')">
        <div class="rescue-request-title">${request.id}</div>
        <div class="rescue-request-content">${typeLabel} - ${request.peopleCount} người</div>
        <div class="rescue-request-meta">${elapsed} phút trước</div>
      </div>
    `;
  }).join('');
}

function renderTeamsList() {
  var list = document.getElementById('teamsList');
  if (!list) return;

  list.innerHTML = rescueTeams.map(function(team) {
    return `
      <div class="team-item">
        <div class="team-info">
          <span class="team-name">${team.name}</span>
          <span class="team-status ${team.status}">${team.status === 'available' ? 'Sẵn sàng' : 'Đang nhiệm vụ'}</span>
        </div>
        <div class="team-capacity">${team.capacity} thành viên</div>
      </div>
    `;
  }).join('');
}

function selectDispatchRequest(requestId) {
  // Highlight selected request
  var items = document.querySelectorAll('.dispatch-request-item');
  items.forEach(function(item) {
    item.classList.remove('selected');
  });

  event.currentTarget.classList.add('selected');

  // Show details and assign options
  var request = rescueRequests.find(function(r) {
    return r.id === requestId;
  });

  if (request) {
    // Pan map to request location
    if (dispatchMap) {
      dispatchMap.setView([request.location.lat, request.location.lng], 15);
    }
  }
}

// Volunteer Registration Modal Event Listeners
document.getElementById('volunteerModal') && document.getElementById('volunteerModal').addEventListener('click', function() {
  document.getElementById('volunteerModal').style.display = 'block';
});

document.getElementById('closeVolunteerModal') && document.getElementById('closeVolunteerModal').addEventListener('click', function() {
  document.getElementById('volunteerModal').style.display = 'none';
});

document.getElementById('cancelVolunteerBtn') && document.getElementById('cancelVolunteerBtn').addEventListener('click', function() {
  document.getElementById('volunteerModal').style.display = 'none';
});

document.getElementById('submitVolunteerBtn') && document.getElementById('submitVolunteerBtn').addEventListener('click', function() {
  var name = document.getElementById('volunteerName').value;
  var phone = document.getElementById('volunteerPhone').value;
  var area = document.getElementById('volunteerArea').value;
  var skills = document.getElementById('volunteerSkills').value;
  var equipment = document.getElementById('volunteerEquipment').value;
  var available = document.getElementById('volunteerAvailable').checked;

  if (!name || !phone || !area) {
    alert('Vui lòng điền đầy đủ các trường bắt buộc');
    return;
  }

  var volunteer = {
    id: 'VOL-' + Date.now(),
    name: name,
    phone: phone,
    area: area,
    skills: skills,
    equipment: equipment,
    status: available ? 'available' : 'unavailable',
    registeredAt: new Date().toISOString(),
    missions: []
  };

  volunteers.push(volunteer);
  saveVolunteers();

  document.getElementById('volunteerModal').style.display = 'none';
  document.getElementById('volunteerForm').reset();
  alert('Đã đăng ký tình nguyện viên! Mã: ' + volunteer.id);
  logActivity('volunteer_register', 'Đăng ký tình nguyện viên: ' + volunteer.id);
});

// Initialize rescue system on page load
// rescueSystem initialization is now called from main DOMContentLoaded

// Relief & Logistics System
var reliefNeeds = [];
var warehouses = [
  { id: 'wh1', name: 'Kho chính HCM', location: 'TP.HCM', status: 'active', inventory: [] },
  { id: 'wh2', name: 'Kho Hà Nội', location: 'Hà Nội', status: 'active', inventory: [] },
  { id: 'wh3', name: 'Điểm tiếp nhận Đà Nẵng', location: 'Đà Nẵng', status: 'active', inventory: [] }
];
var inventory = [
  { id: 'inv1', warehouseId: 'wh1', name: 'Lương thực', quantity: 500, unit: 'kg', expiry: '2024-12-31', sponsor: 'UNICEF', status: 'normal' },
  { id: 'inv2', warehouseId: 'wh1', name: 'Nước uống', quantity: 1000, unit: 'lít', expiry: '2025-06-30', sponsor: 'Chính phủ', status: 'normal' },
  { id: 'inv3', warehouseId: 'wh1', name: 'Thuốc', quantity: 50, unit: 'hộp', expiry: '2024-10-15', sponsor: 'WHO', status: 'warning' }
];
var donationCampaigns = [
  { id: 'camp1', title: 'Cứu trợ bão lũ miền Trung', target: 1000000000, raised: 750000000, status: 'active', startDate: '2024-09-01', donors: 1234 },
  { id: 'camp2', title: 'Hỗ trợ nạn nhân động đất', target: 1000000000, raised: 450000000, status: 'active', startDate: '2024-09-15', donors: 567 }
];
var donations = [
  { id: 'don1', campaignId: 'camp1', donor: 'Nguyễn Văn A', amount: 5000000, date: '2024-09-22T10:30', transactionId: 'TXN123456' },
  { id: 'don2', campaignId: 'camp1', donor: 'Trần Thị B', amount: 2000000, date: '2024-09-22T09:15', transactionId: 'TXN123455' },
  { id: 'don3', campaignId: 'camp1', donor: 'Lê Văn C', amount: 10000000, date: '2024-09-21T16:45', transactionId: 'TXN123454' }
];

var reliefTypes = {
  food: 'Lương thực',
  water: 'Nước uống',
  milk: 'Sữa cho trẻ em',
  medicine: 'Thuốc',
  medical_supplies: 'Vật tư y tế',
  protection: 'Đồ bảo hộ',
  clothing: 'Quần áo',
  blankets: 'Chăn màn',
  personal: 'Đồ dùng cá nhân',
  water_treatment: 'Xử lý nước',
  generator: 'Máy phát điện',
  fuel: 'Nhiên liệu',
  boat: 'Thuyền',
  truck: 'Xe tải',
  rescue_vehicle: 'Phương tiện cứu hộ'
};

var reliefPriorities = {
  low: 'Thấp',
  medium: 'Trung bình',
  high: 'Cao',
  critical: 'Khẩn cấp'
};

function initializeReliefSystem() {
  // Load relief needs from localStorage
  var savedNeeds = localStorage.getItem('sosmap_relief_needs');
  if (savedNeeds) {
    reliefNeeds = JSON.parse(savedNeeds);
  }

  // Render relief needs
  renderReliefNeeds();

  // Check for overdue needs
  setInterval(checkOverdueReliefNeeds, 60000); // Check every minute
}

function renderReliefNeeds() {
  var list = document.getElementById('reliefNeedsList');
  if (!list) return;

  var activeNeeds = reliefNeeds.filter(function(n) {
    return n.status !== 'cancelled' && n.status !== 'fulfilled';
  });

  if (activeNeeds.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="2">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
          <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
          <line x1="12" y1="22.08" x2="12" y2="12"></line>
        </svg>
        <p>Không có nhu cầu cứu trợ nào</p>
      </div>
    `;
    return;
  }

  list.innerHTML = activeNeeds.map(function(need) {
    var typeLabel = reliefTypes[need.type] || need.type;
    var priorityLabel = reliefPriorities[need.priority] || need.priority;

    return `
      <div class="relief-need-item ${need.priority}">
        <div class="relief-need-header">
          <div class="relief-need-title">${typeLabel} - ${need.quantity} ${need.unit}</div>
          <span class="relief-need-badge ${need.priority === 'critical' ? 'critical' : ''}">${priorityLabel}</span>
        </div>
        <div class="relief-need-content">${need.description || 'Không có mô tả'}</div>
        <div class="relief-need-meta">
          <span>${new Date(need.createdAt).toLocaleString('vi-VN')}</span>
          <span>Mã: ${need.id}</span>
        </div>
      </div>
    `;
  }).join('');
}

function createReliefRequest(data) {
  var request = {
    id: 'REL-' + Date.now(),
    type: data.type,
    quantity: data.quantity,
    unit: data.unit,
    deadline: data.deadline,
    location: data.location,
    beneficiary: data.beneficiary,
    beneficiaryName: data.beneficiaryName,
    description: data.description,
    contact: data.contact,
    priority: data.priority,
    officialConfirm: data.officialConfirm,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    fulfilled: false,
    fulfilledAt: null
  };

  reliefNeeds.push(request);
  saveReliefNeeds();
  renderReliefNeeds();

  logActivity('relief_create', 'Tạo yêu cầu cứu trợ: ' + request.id);

  return request;
}

function checkOverdueReliefNeeds() {
  var now = new Date();
  var overdueThreshold = 24 * 60 * 60 * 1000; // 24 hours

  reliefNeeds.forEach(function(need) {
    if (need.status === 'pending' && new Date(need.deadline) < now) {
      // Alert about overdue need
      if (Notification.permission === 'granted') {
        new Notification('⚠️ Nhu cầu cứu trợ quá hạn: ' + need.id, {
          body: 'Nhu cầu đã quá hạn chưa được đáp ứng',
          icon: '/favicon.ico'
        });
      }
      logActivity('relief_overdue', 'Nhu cầu quá hạn: ' + need.id);
    }
  });
}

function saveReliefNeeds() {
  localStorage.setItem('sosmap_relief_needs', JSON.stringify(reliefNeeds));
}

// Relief Request Modal Event Listeners
document.getElementById('requestReliefBtn').addEventListener('click', function() {
  document.getElementById('reliefRequestModal').style.display = 'block';
});

document.getElementById('closeReliefRequestModal').addEventListener('click', function() {
  document.getElementById('reliefRequestModal').style.display = 'none';
});

document.getElementById('cancelReliefRequestBtn').addEventListener('click', function() {
  document.getElementById('reliefRequestModal').style.display = 'none';
});

document.getElementById('submitReliefRequestBtn').addEventListener('click', function() {
  var type = document.getElementById('reliefType').value;
  var quantity = parseInt(document.getElementById('reliefQuantity').value);
  var unit = document.getElementById('reliefUnit').value;
  var deadline = document.getElementById('reliefDeadline').value;
  var location = document.getElementById('reliefLocation').value;
  var beneficiary = document.getElementById('reliefBeneficiary').value;
  var beneficiaryName = document.getElementById('reliefBeneficiaryName').value;
  var description = document.getElementById('reliefDescription').value;
  var contact = document.getElementById('reliefContact').value;
  var priority = document.getElementById('reliefPriority').value;
  var officialConfirm = document.getElementById('reliefOfficialConfirm').checked;

  if (!type || !quantity || !unit || !deadline || !contact) {
    alert('Vui lòng điền đầy đủ các trường bắt buộc');
    return;
  }

  var reliefData = {
    type: type,
    quantity: quantity,
    unit: unit,
    deadline: new Date(deadline).toISOString(),
    location: location,
    beneficiary: beneficiary,
    beneficiaryName: beneficiaryName,
    description: description,
    contact: contact,
    priority: priority,
    officialConfirm: officialConfirm
  };

  createReliefRequest(reliefData);
  document.getElementById('reliefRequestModal').style.display = 'none';
  document.getElementById('reliefRequestForm').reset();
  alert('Đã gửi yêu cầu cứu trợ! Mã yêu cầu: ' + reliefNeeds[reliefNeeds.length - 1].id);
});

// Warehouse Modal Event Listeners
document.getElementById('warehouseBtn').addEventListener('click', function() {
  document.getElementById('warehouseModal').style.display = 'block';
  renderInventoryTable();
});

document.getElementById('closeWarehouseModal').addEventListener('click', function() {
  document.getElementById('warehouseModal').style.display = 'none';
});

document.getElementById('closeWarehouseBtn').addEventListener('click', function() {
  document.getElementById('warehouseModal').style.display = 'none';
});

function renderInventoryTable() {
  var tbody = document.getElementById('inventoryTableBody');
  if (!tbody) return;

  tbody.innerHTML = inventory.map(function(item) {
    var statusColor = item.status === 'normal' ? '#d4edda' : item.status === 'warning' ? '#fff3cd' : '#f8d7da';
    var statusText = item.status === 'normal' ? 'Bình thường' : item.status === 'warning' ? 'Cảnh báo' : 'Nguy cấp';
    var statusBgColor = item.status === 'normal' ? '#155724' : item.status === 'warning' ? '#856404' : '#721c24';

    return `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${item.unit}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.expiry}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.sponsor}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">
          <span style="background: ${statusColor}; color: ${statusBgColor}; padding: 2px 8px; border-radius: 4px; font-size: 11px;">${statusText}</span>
        </td>
      </tr>
    `;
  }).join('');
}

// Warehouse tab switching
document.querySelectorAll('.tab-btn').forEach(function(btn) {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.tab-btn').forEach(function(b) {
      b.classList.remove('active');
    });
    this.classList.add('active');
    // TODO: Load content based on tab
  });
});

// Donation Modal Event Listeners
document.getElementById('donationBtn').addEventListener('click', function() {
  document.getElementById('donationModal').style.display = 'block';
});

document.getElementById('closeDonationModal').addEventListener('click', function() {
  document.getElementById('donationModal').style.display = 'none';
});

document.getElementById('closeDonationBtn').addEventListener('click', function() {
  document.getElementById('donationModal').style.display = 'none';
});

function showDonationForm(campaignId) {
  // Show donation form for specific campaign
  alert('Form đóng góp cho chiến dịch: ' + campaignId);
}

function showDonationDetails(campaignId) {
  // Show campaign details
  alert('Chi tiết chiến dịch: ' + campaignId);
}

// Initialize relief system on page load
// reliefSystem initialization is now called from main DOMContentLoaded

// Public Health System
var healthCases = [
  { id: 'case1', type: 'suspected', location: { lat: 10.7769, lng: 106.7009 }, date: '2024-09-22', verified: false },
  { id: 'case2', type: 'confirmed', location: { lat: 10.7800, lng: 106.7050 }, date: '2024-09-21', verified: true },
  { id: 'case3', type: 'cluster', location: { lat: 10.7750, lng: 106.6950 }, date: '2024-09-20', verified: true }
];
var healthFacilities = [
  { id: 'fac1', name: 'Bệnh viện Chợ Rẫy', type: 'hospital', location: { lat: 10.7769, lng: 106.7009 }, services: ['emergency', 'pediatric', 'neonatal', 'medicine', 'oxygen'], departments: ['surgery', 'pediatric', 'internal', 'infectious'], capacity: '24/7', currentCapacity: 'medium', phone: '028 3855 8888', distance: 2.5 },
  { id: 'fac2', name: 'Trạm y tế Quận 1', type: 'clinic', location: { lat: 10.7800, lng: 106.7050 }, services: ['testing', 'vaccination', 'medicine'], departments: ['general', 'vaccination'], capacity: 'regular', currentCapacity: 'low', phone: '028 3823 4567', distance: 1.8 },
  { id: 'fac3', name: 'Bệnh viện Nhi Đồng', type: 'specialized', location: { lat: 10.7750, lng: 106.6950 }, services: ['emergency', 'pediatric', 'infectious', 'neonatal', 'oxygen'], departments: ['pediatric', 'infectious', 'neonatal', 'surgery'], capacity: '24/7', currentCapacity: 'high', phone: '028 3839 1234', distance: 3.2 },
  { id: 'fac4', name: 'Bệnh viện Thành phố Thủ Đức', type: 'hospital', location: { lat: 10.7700, lng: 106.6900 }, services: ['emergency', 'medicine', 'oxygen'], departments: ['emergency', 'internal'], capacity: '24/7', currentCapacity: 'medium', phone: '028 3772 0000', distance: 5.1 }
];
var healthRequests = [];
var healthMap = null;
var healthDataAccessLog = [];

var healthCaseTypes = {
  suspected: 'Ca nghi ngờ',
  confirmed: 'Ca xác nhận',
  cluster: 'Điểm dịch',
  recovered: 'Đã hồi phục',
  deceased: 'Đã tử vong'
};

function initializeHealthSystem() {
  // Load health requests from localStorage
  var savedRequests = localStorage.getItem('sosmap_health_requests');
  if (savedRequests) {
    healthRequests = JSON.parse(savedRequests);
  }

  // Load health data access log
  var savedLog = localStorage.getItem('sosmap_health_access_log');
  if (savedLog) {
    healthDataAccessLog = JSON.parse(savedLog);
  }

  // Update health alerts
  updateHealthAlerts();
}

function updateHealthAlerts() {
  var alertsDiv = document.getElementById('healthAlerts');
  if (!alertsDiv) return;

  var caseCount = healthCases.filter(function(c) {
    return c.type === 'confirmed' || c.type === 'suspected';
  }).length;

  var alertLevel = caseCount > 10 ? 'high' : caseCount > 5 ? 'medium' : 'low';
  var alertText = alertLevel === 'high' ? 'Cao' : alertLevel === 'medium' ? 'Trung bình' : 'Thấp';

  alertsDiv.innerHTML = `
    <div class="health-alert-item ${alertLevel === 'high' ? 'warning' : 'info'}">
      <span class="alert-icon">${alertLevel === 'high' ? '⚠️' : 'ℹ️'}</span>
      <span class="alert-text">Mức độ cảnh báo: ${alertText} (${caseCount} ca)</span>
    </div>
    <div class="health-alert-item info">
      <span class="alert-icon">ℹ️</span>
      <span class="alert-text">Cập nhật: 5 phút trước</span>
    </div>
  `;
}

function initializeHealthMap() {
  if (healthMap) {
    healthMap.remove();
  }

  healthMap = L.map('healthMap').setView([10.7769, 106.7009], 13);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(healthMap);

  // Add case markers
  healthCases.forEach(function(c) {
    var color = c.type === 'suspected' ? '#f39c12' : c.type === 'confirmed' ? '#e74c3c' : c.type === 'cluster' ? '#9b59b6' : '#3498db';
    var icon = L.divIcon({
      className: 'health-marker',
      html: '<div style="background: ' + color + '; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });

    L.marker([c.location.lat, c.location.lng], { icon: icon })
      .addTo(healthMap)
      .bindPopup('<b>' + healthCaseTypes[c.type] + '</b><br>Ngày: ' + c.date + '<br>Xác minh: ' + (c.verified ? 'Có' : 'Chưa'));
  });

  // Add facility markers
  healthFacilities.forEach(function(f) {
    var marker = L.marker([f.location.lat, f.location.lng])
      .addTo(healthMap)
      .bindPopup('<b>' + f.name + '</b><br>' + f.type + '<br>' + f.capacity + '<br>' + f.phone);
  });
}

function createHealthRequest(data) {
  var request = {
    id: 'HLTH-' + Date.now(),
    type: data.type,
    symptoms: data.symptoms,
    householdMembers: data.householdMembers,
    closeContacts: data.closeContacts,
    quarantineDuration: data.quarantineDuration,
    contact: data.contact,
    address: data.address,
    priority: data.priority,
    medicineRequest: data.medicineRequest,
    emergencyReport: data.emergencyReport,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  healthRequests.push(request);
  saveHealthRequests();

  logHealthDataAccess('create_health_request', request.id);

  alert('Đã gửi yêu cầu y tế! Mã yêu cầu: ' + request.id);
  logActivity('health_request', 'Tạo yêu cầu y tế: ' + request.id);

  return request;
}

function saveHealthRequests() {
  localStorage.setItem('sosmap_health_requests', JSON.stringify(healthRequests));
}

function logHealthDataAccess(action, resourceId) {
  var logEntry = {
    action: action,
    resourceId: resourceId,
    userId: currentUser ? currentUser.id : 'anonymous',
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent
  };

  healthDataAccessLog.push(logEntry);
  localStorage.setItem('sosmap_health_access_log', JSON.stringify(healthDataAccessLog));
}

function anonymizeHealthData(data) {
  // Remove personally identifiable information
  var anonymized = JSON.parse(JSON.stringify(data));
  if (anonymized.contact) {
    anonymized.contact = maskContact(anonymized.contact);
  }
  if (anonymized.address) {
    anonymized.address = maskAddress(anonymized.address);
  }
  return anonymized;
}

function maskContact(contact) {
  // Mask phone number: 0901234567 -> 0901***567
  if (contact.length > 6) {
    return contact.substring(0, 4) + '***' + contact.substring(contact.length - 3);
  }
  return '***';
}

function maskAddress(address) {
  // Mask detailed address: 123 Nguyễn Văn A -> 123 ***
  var parts = address.split(',');
  if (parts.length > 1) {
    return parts[0] + ', ***';
  }
  return '***';
}

// Health Map Modal Event Listeners
document.getElementById('healthMapBtn').addEventListener('click', function() {
  document.getElementById('healthMapModal').style.display = 'block';
  initializeHealthMap();
});

document.getElementById('closeHealthMapModal').addEventListener('click', function() {
  document.getElementById('healthMapModal').style.display = 'none';
});

document.getElementById('closeHealthMapBtn').addEventListener('click', function() {
  document.getElementById('healthMapModal').style.display = 'none';
});

// Health Request Modal Event Listeners
document.getElementById('healthRequestBtn').addEventListener('click', function() {
  document.getElementById('healthRequestModal').style.display = 'block';
});

document.getElementById('closeHealthRequestModal').addEventListener('click', function() {
  document.getElementById('healthRequestModal').style.display = 'none';
});

document.getElementById('cancelHealthRequestBtn').addEventListener('click', function() {
  document.getElementById('healthRequestModal').style.display = 'none';
});

document.getElementById('submitHealthRequestBtn').addEventListener('click', function() {
  var type = document.getElementById('healthRequestType').value;
  var symptoms = document.getElementById('healthSymptoms').value;
  var householdMembers = parseInt(document.getElementById('healthHouseholdMembers').value) || 0;
  var closeContacts = parseInt(document.getElementById('healthCloseContacts').value) || 0;
  var quarantineDuration = parseInt(document.getElementById('healthQuarantineDuration').value) || 0;
  var contact = document.getElementById('healthContact').value;
  var address = document.getElementById('healthAddress').value;
  var priority = document.getElementById('healthPriority').value;
  var medicineRequest = document.getElementById('healthMedicineRequest').checked;
  var emergencyReport = document.getElementById('healthEmergencyReport').checked;

  if (!type || !contact || !address) {
    alert('Vui lòng điền đầy đủ các trường bắt buộc');
    return;
  }

  var healthData = {
    type: type,
    symptoms: symptoms,
    householdMembers: householdMembers,
    closeContacts: closeContacts,
    quarantineDuration: quarantineDuration,
    contact: contact,
    address: address,
    priority: priority,
    medicineRequest: medicineRequest,
    emergencyReport: emergencyReport
  };

  createHealthRequest(healthData);
  document.getElementById('healthRequestModal').style.display = 'none';
  document.getElementById('healthRequestForm').reset();
});

// Health Facilities Modal Event Listeners
document.getElementById('healthFacilitiesBtn').addEventListener('click', function() {
  document.getElementById('healthFacilitiesModal').style.display = 'block';
  renderHealthFacilities();
});

document.getElementById('closeHealthFacilitiesModal').addEventListener('click', function() {
  document.getElementById('healthFacilitiesModal').style.display = 'none';
});

document.getElementById('closeHealthFacilitiesBtn').addEventListener('click', function() {
  document.getElementById('healthFacilitiesModal').style.display = 'none';
});

function renderHealthFacilities() {
  var list = document.getElementById('facilitiesList');
  if (!list) return;

  list.innerHTML = healthFacilities.map(function(facility) {
    return `
      <div class="facility-item">
        <div class="facility-info">
          <div class="facility-name">${facility.name}</div>
          <div class="facility-type">${facility.type === 'hospital' ? 'Bệnh viện đa khoa' : facility.type === 'clinic' ? 'Trạm y tế' : 'Bệnh viện chuyên khoa'}</div>
          <div class="facility-capacity">${facility.capacity === '24/7' ? 'Cấp cứu 24/7' : 'Khám chữa thường'}</div>
        </div>
        <div class="facility-services">
          ${facility.services.map(function(service) {
            return '<span class="service-tag">' + service + '</span>';
          }).join('')}
        </div>
        <div class="facility-actions">
          <button class="btn btn-primary" style="font-size: 12px;" onclick="routeToFacility('${facility.id}')">Chỉ đường</button>
          <button class="btn btn-secondary" style="font-size: 12px;" onclick="callFacility('${facility.phone}')">Gọi</button>
        </div>
      </div>
    `;
  }).join('');
}

function routeToFacility(facilityId) {
  var facility = healthFacilities.find(function(f) {
    return f.id === facilityId;
  });

  if (facility) {
    // Open routing in map
    alert('Đang chỉ đường đến: ' + facility.name);
    logActivity('facility_route', 'Chỉ đường đến cơ sở y tế: ' + facility.name);
  }
}

function callFacility(phone) {
  alert('Đang gọi: ' + phone);
  logActivity('facility_call', 'Gọi cơ sở y tế: ' + phone);
}

// Health data filter event listeners
document.getElementById('healthMapFilter') && document.getElementById('healthMapFilter').addEventListener('change', function() {
  // Filter health map markers
  var filter = this.value;
  // TODO: Implement filter logic
});

document.getElementById('healthRegionFilter') && document.getElementById('healthRegionFilter').addEventListener('change', function() {
  // Filter by region
  var filter = this.value;
  // TODO: Implement filter logic
});

document.getElementById('facilityTypeFilter') && document.getElementById('facilityTypeFilter').addEventListener('change', function() {
  // Filter facilities by type
  var filter = this.value;
  // TODO: Implement filter logic
});

document.getElementById('facilitySearch') && document.getElementById('facilitySearch').addEventListener('input', function() {
  // Search facilities
  var search = this.value;
  // TODO: Implement search logic
});

// Initialize health system on page load
// healthSystem initialization is now called from main DOMContentLoaded

// Emergency Care System
var emergencyRequests = [];
var currentEmergencyPriority = 'medium';

function callAmbulance() {
  alert('Đang gọi xe cấp cứu (115)...');
  logActivity('emergency_call', 'Gọi xe cấp cứu: 115');
  // In production, this would initiate actual phone call
}

function callFireDepartment() {
  alert('Đang gọi cứu hỏa (114)...');
  logActivity('emergency_call', 'Gọi cứu hỏa: 114');
}

function callPolice() {
  alert('Đang gọi cảnh sát (113)...');
  logActivity('emergency_call', 'Gọi cảnh sát: 113');
}

function setEmergencyPriority(priority) {
  currentEmergencyPriority = priority;
  document.querySelectorAll('.priority-btn').forEach(function(btn) {
    btn.classList.remove('active');
  });
  event.currentTarget.classList.add('active');
  logActivity('emergency_priority', 'Đặt mức độ khẩn cấp: ' + priority);
}

function getEmergencyLocation() {
  var coordsDiv = document.getElementById('emergencyCoords');
  if (!coordsDiv) return;

  coordsDiv.textContent = 'Đang lấy vị trí...';

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      function(position) {
        var lat = position.coords.latitude;
        var lng = position.coords.longitude;
        coordsDiv.textContent = lat.toFixed(6) + ', ' + lng.toFixed(6);
        coordsDiv.style.color = '#2ecc71';
      },
      function(error) {
        coordsDiv.textContent = 'Không thể lấy vị trí';
        coordsDiv.style.color = '#e74c3c';
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  } else {
    coordsDiv.textContent = 'Geolocation không được hỗ trợ';
  }
}

function createEmergencyRequest(data) {
  var request = {
    id: 'EMG-' + Date.now(),
    priority: data.priority,
    description: data.description,
    location: data.location,
    contactName: data.contactName,
    contactPhone: data.contactPhone,
    specialNeeds: data.specialNeeds,
    status: 'pending',
    createdAt: new Date().toISOString(),
    assignedTo: null,
    estimatedArrival: null
  };

  emergencyRequests.push(request);
  saveEmergencyRequests();

  // Send browser notification
  if (Notification.permission === 'granted') {
    new Notification('🆘 SOS Khẩn cấp: ' + request.id, {
      body: request.description,
      icon: '/favicon.ico',
      requireInteraction: true
    });
  }

  alert('Đã gửi SOS khẩn cấp! Mã yêu cầu: ' + request.id);
  logActivity('emergency_create', 'Tạo yêu cầu cấp cứu khẩn cấp: ' + request.id);

  return request;
}

function saveEmergencyRequests() {
  localStorage.setItem('sosmap_emergency_requests', JSON.stringify(emergencyRequests));
}

// Emergency Care Modal Event Listeners
document.getElementById('emergencyCareBtn').addEventListener('click', function() {
  document.getElementById('emergencyCareModal').style.display = 'block';
  getEmergencyLocation();
});

document.getElementById('closeEmergencyCareModal').addEventListener('click', function() {
  document.getElementById('emergencyCareModal').style.display = 'none';
});

document.getElementById('closeEmergencyCareBtn').addEventListener('click', function() {
  document.getElementById('emergencyCareModal').style.display = 'none';
});

document.getElementById('refreshEmergencyLocation').addEventListener('click', function() {
  getEmergencyLocation();
});

document.getElementById('submitEmergencyBtn').addEventListener('click', function() {
  var description = document.getElementById('emergencyDescription').value;
  var contactName = document.getElementById('emergencyContactName').value;
  var contactPhone = document.getElementById('emergencyContactPhone').value;

  var specialNeeds = [];
  document.querySelectorAll('input[name="emergencySpecialNeeds"]:checked').forEach(function(checkbox) {
    specialNeeds.push(checkbox.value);
  });

  if (!description || !contactPhone) {
    alert('Vui lòng điền mô tả tình huống và số điện thoại');
    return;
  }

  var coordsDiv = document.getElementById('emergencyCoords');
  var location = coordsDiv.textContent.includes(',') ? coordsDiv.textContent : null;

  var emergencyData = {
    priority: currentEmergencyPriority,
    description: description,
    location: location,
    contactName: contactName,
    contactPhone: contactPhone,
    specialNeeds: specialNeeds
  };

  createEmergencyRequest(emergencyData);
  document.getElementById('emergencyCareModal').style.display = 'none';
  document.getElementById('emergencyDescription').value = '';
  document.getElementById('emergencyContactName').value = '';
  document.getElementById('emergencyContactPhone').value = '';
});

// Enhanced facility rendering with new data
function renderHealthFacilities() {
  var list = document.getElementById('facilitiesList');
  if (!list) return;

  list.innerHTML = healthFacilities.map(function(facility) {
    var capacityColor = facility.currentCapacity === 'high' ? '#f8d7da' : facility.currentCapacity === 'medium' ? '#fff3cd' : '#d4edda';
    var capacityText = facility.currentCapacity === 'high' ? 'Cao' : facility.currentCapacity === 'medium' ? 'Trung bình' : 'Thấp';

    return `
      <div class="facility-item">
        <div class="facility-info">
          <div class="facility-name">${facility.name}</div>
          <div class="facility-type">${facility.type === 'hospital' ? 'Bệnh viện đa khoa' : facility.type === 'clinic' ? 'Trạm y tế' : 'Bệnh viện chuyên khoa'}</div>
          <div class="facility-capacity">${facility.capacity} • Sức tiếp nhận: <span style="color: ${capacityColor}; font-weight: 600;">${capacityText}</span></div>
          <div class="facility-distance">${facility.distance} km</div>
        </div>
        <div class="facility-services">
          ${facility.services.map(function(service) {
            return '<span class="service-tag">' + service + '</span>';
          }).join('')}
        </div>
        <div class="facility-departments">
          ${facility.departments.map(function(dept) {
            return '<span class="dept-tag">' + dept + '</span>';
          }).join('')}
        </div>
        <div class="facility-actions">
          <button class="btn btn-primary" style="font-size: 12px;" onclick="routeToFacility('${facility.id}')">Chỉ đường</button>
          <button class="btn btn-secondary" style="font-size: 12px;" onclick="callFacility('${facility.phone}')">Gọi</button>
        </div>
      </div>
    `;
  }).join('');
}

// Fire & Infrastructure System
var fireReports = [];
var infrastructureReports = [];
var fireIncidents = [];

var fireTypes = {
  fire: 'Cháy',
  explosion: 'Nổ',
  smoke: 'Khói',
  gas_leak: 'Rò rỉ gas'
};

var buildingTypes = {
  residential: 'Nhà ở',
  apartment: 'Chung cư',
  commercial: 'Tòa nhà thương mại',
  industrial: 'Nhà xưởng/kho',
  school: 'Trường học',
  hospital: 'Bệnh viện',
  market: 'Chợ',
  other: 'Khác'
};

var dangerLevels = {
  low: 'Thấp',
  medium: 'Trung bình',
  high: 'Cao',
  critical: 'Rất cao'
};

function initializeFireSystem() {
  // Load fire reports from localStorage
  var savedFireReports = localStorage.getItem('sosmap_fire_reports');
  if (savedFireReports) {
    fireReports = JSON.parse(savedFireReports);
  }

  // Load infrastructure reports
  var savedInfraReports = localStorage.getItem('sosmap_infrastructure_reports');
  if (savedInfraReports) {
    infrastructureReports = JSON.parse(savedInfraReports);
  }

  updateFireAlerts();
}

function updateFireAlerts() {
  var alertsDiv = document.getElementById('fireAlerts');
  if (!alertsDiv) return;

  var activeFires = fireReports.filter(function(r) {
    return r.status !== 'resolved' && r.status !== 'cancelled';
  });

  if (activeFires.length === 0) {
    alertsDiv.innerHTML = `
      <div class="fire-alert-item info">
        <span class="alert-icon">ℹ️</span>
        <span class="alert-text">Không có sự cố nào trong khu vực</span>
      </div>
    `;
    return;
  }

  alertsDiv.innerHTML = activeFires.map(function(report) {
    var level = report.dangerLevel;
    var alertClass = level === 'critical' ? 'critical' : level === 'high' ? 'warning' : 'info';
    var icon = level === 'critical' ? '🔥' : level === 'high' ? '⚠️' : 'ℹ️';

    return `
      <div class="fire-alert-item ${alertClass}">
        <span class="alert-icon">${icon}</span>
        <span class="alert-text">${fireTypes[report.type]} - ${buildingTypes[report.buildingType]}</span>
      </div>
    `;
  }).join('');
}

function createFireReport(data) {
  var report = {
    id: 'FIRE-' + Date.now(),
    type: data.type,
    buildingType: data.buildingType,
    dangerLevel: data.dangerLevel,
    trappedPeople: data.trappedPeople,
    accessDirection: data.accessDirection,
    location: data.location,
    description: data.description,
    contact: data.contact,
    hasImage: data.hasImage,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    assignedTo: null,
    windDirection: null,
    spreadRisk: null
  };

  fireReports.push(report);
  saveFireReports();
  updateFireAlerts();

  // Add marker to map
  if (data.location && data.location.lat && data.location.lng) {
    var marker = L.marker([data.location.lat, data.location.lng], {
      icon: L.divIcon({
        className: 'fire-marker',
        html: '<div style="background: #e74c3c; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); animation: pulse 2s infinite;"></div>',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      })
    })
    .addTo(map)
    .bindPopup('<b>🔥 Cháy nổ</b><br>' + fireTypes[data.type] + '<br>' + buildingTypes[data.buildingType]);
  }

  // Send browser notification
  if (Notification.permission === 'granted') {
    new Notification('🔥 Báo cáo cháy nổ: ' + report.id, {
      body: report.description,
      icon: '/favicon.ico',
      requireInteraction: true
    });
  }

  alert('Đã gửi báo cáo cháy nổ! Mã báo cáo: ' + report.id);
  logActivity('fire_report', 'Báo cáo cháy nổ: ' + report.id);

  return report;
}

function createInfrastructureReport(data) {
  var report = {
    id: 'INFRA-' + Date.now(),
    type: data.type,
    location: data.location,
    description: data.description,
    responsibleUnit: data.responsibleUnit,
    contact: data.contact,
    priority: data.priority,
    hasImage: data.hasImage,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    assignedTo: null,
    resolvedAt: null
  };

  infrastructureReports.push(report);
  saveInfrastructureReports();

  alert('Đã gửi báo cáo sự cố hạ tầng! Mã báo cáo: ' + report.id);
  logActivity('infrastructure_report', 'Báo cáo sự cố hạ tầng: ' + report.id);

  return report;
}

function saveFireReports() {
  localStorage.setItem('sosmap_fire_reports', JSON.stringify(fireReports));
}

function saveInfrastructureReports() {
  localStorage.setItem('sosmap_infrastructure_reports', JSON.stringify(infrastructureReports));
}

// Fire Report Modal Event Listeners
document.getElementById('reportFireBtn').addEventListener('click', function() {
  document.getElementById('fireReportModal').style.display = 'block';
  getFireLocation();
});

document.getElementById('closeFireReportModal').addEventListener('click', function() {
  document.getElementById('fireReportModal').style.display = 'none';
});

document.getElementById('cancelFireReportBtn').addEventListener('click', function() {
  document.getElementById('fireReportModal').style.display = 'none';
});

document.getElementById('getFireLocationBtn').addEventListener('click', function() {
  getFireLocation();
});

function getFireLocation() {
  var locationInput = document.getElementById('fireLocation');
  var latInput = document.getElementById('fireLat');
  var lngInput = document.getElementById('fireLng');

  locationInput.value = 'Đang lấy vị trí...';

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      function(position) {
        var lat = position.coords.latitude;
        var lng = position.coords.longitude;
        latInput.value = lat;
        lngInput.value = lng;
        locationInput.value = lat.toFixed(6) + ', ' + lng.toFixed(6);
      },
      function(error) {
        locationInput.value = 'Không thể lấy vị trí';
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  } else {
    locationInput.value = 'Geolocation không được hỗ trợ';
  }
}

document.getElementById('submitFireReportBtn').addEventListener('click', function() {
  var type = document.getElementById('fireType').value;
  var buildingType = document.getElementById('fireBuildingType').value;
  var dangerLevel = document.getElementById('fireDangerLevel').value;
  var trappedPeople = parseInt(document.getElementById('fireTrappedPeople').value) || 0;
  var accessDirection = document.getElementById('fireAccessDirection').value;
  var description = document.getElementById('fireDescription').value;
  var contact = document.getElementById('fireContact').value;
  var hasImage = document.getElementById('fireImage').files.length > 0;

  var lat = document.getElementById('fireLat').value;
  var lng = document.getElementById('fireLng').value;

  if (!type || !buildingType || !dangerLevel || !description || !contact) {
    alert('Vui lòng điền đầy đủ các trường bắt buộc');
    return;
  }

  var fireData = {
    type: type,
    buildingType: buildingType,
    dangerLevel: dangerLevel,
    trappedPeople: trappedPeople,
    accessDirection: accessDirection,
    location: lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : null,
    description: description,
    contact: contact,
    hasImage: hasImage
  };

  createFireReport(fireData);
  document.getElementById('fireReportModal').style.display = 'none';
  document.getElementById('fireReportForm').reset();
});

// Infrastructure Report Modal Event Listeners
document.getElementById('reportInfrastructureBtn').addEventListener('click', function() {
  document.getElementById('infrastructureReportModal').style.display = 'block';
  getInfraLocation();
});

document.getElementById('closeInfrastructureReportModal').addEventListener('click', function() {
  document.getElementById('infrastructureReportModal').style.display = 'none';
});

document.getElementById('cancelInfrastructureReportBtn').addEventListener('click', function() {
  document.getElementById('infrastructureReportModal').style.display = 'none';
});

document.getElementById('getInfraLocationBtn').addEventListener('click', function() {
  getInfraLocation();
});

function getInfraLocation() {
  var locationInput = document.getElementById('infraLocation');
  var latInput = document.getElementById('infraLat');
  var lngInput = document.getElementById('infraLng');

  locationInput.value = 'Đang lấy vị trí...';

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      function(position) {
        var lat = position.coords.latitude;
        var lng = position.coords.longitude;
        latInput.value = lat;
        lngInput.value = lng;
        locationInput.value = lat.toFixed(6) + ', ' + lng.toFixed(6);
      },
      function(error) {
        locationInput.value = 'Không thể lấy vị trí';
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  } else {
    locationInput.value = 'Geolocation không được hỗ trợ';
  }
}

document.getElementById('submitInfrastructureReportBtn').addEventListener('click', function() {
  var type = document.getElementById('infraType').value;
  var description = document.getElementById('infraDescription').value;
  var responsibleUnit = document.getElementById('infraResponsibleUnit').value;
  var contact = document.getElementById('infraContact').value;
  var priority = document.getElementById('infraPriority').value;
  var hasImage = document.getElementById('infraImage').files.length > 0;

  var lat = document.getElementById('infraLat').value;
  var lng = document.getElementById('infraLng').value;

  if (!type || !description || !contact) {
    alert('Vui lòng điền đầy đủ các trường bắt buộc');
    return;
  }

  var infraData = {
    type: type,
    location: lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : null,
    description: description,
    responsibleUnit: responsibleUnit,
    contact: contact,
    priority: priority,
    hasImage: hasImage
  };

  createInfrastructureReport(infraData);
  document.getElementById('infrastructureReportModal').style.display = 'none';
  document.getElementById('infrastructureReportForm').reset();
});

// Initialize fire system on page load
// fireSystem initialization is now called from main DOMContentLoaded

// Public Safety System
var trafficConditions = [
  { id: 'tc1', type: 'blocked', road: 'Đường Nguyễn Huệ', status: 'Đường cấm (do ngập nước)', direction: 'Từ Quận 1 → Quận 3' },
  { id: 'tc2', type: 'one_way', road: 'Đường Lê Duẩn', status: 'Một chiều tạm thời', direction: 'Chỉ hướng đi từ Bắc → Nam' },
  { id: 'tc3', type: 'blocked_point', road: 'Ngã tư Phạm Ngọc Thạch', status: 'Điểm chặn (do sự cố)', direction: 'Đóng toàn bộ' },
  { id: 'tc4', type: 'priority', road: 'Đường Xa lộ Hà Nội', status: 'Tuyến ưu tiên cấp cứu', direction: 'Ưu tiên xe 115, 114' },
  { id: 'tc5', type: 'priority', road: 'Đường Nguyễn Văn Linh', status: 'Tuyến ưu tiên cấp cứu', direction: 'Ưu tiên xe 115, 114' },
  { id: 'tc6', type: 'congestion', road: 'Đường Cộng Hòa', status: 'Kẹt xe nặng', delay: 'Chậm 30 phút' },
  { id: 'tc7', type: 'congestion', road: 'Đường Nguyễn Trãi', status: 'Kẹt xe trung bình', delay: 'Chậm 15 phút' }
];

var environmentReports = [];
var environmentAlerts = [
  { type: 'heat', level: 'warning', message: 'Cảnh báo nắng nóng gay gắt (32-35°C)' },
  { type: 'air', level: 'info', message: 'Không có cảnh báo bụi mịn' },
  { type: 'water', level: 'info', message: 'Không có cảnh báo ô nhiễm nguồn nước' }
];

var envReportTypes = {
  air_pollution: 'Ô nhiễm không khí',
  dust: 'Bụi mịn',
  water_pollution: 'Ô nhiễm nguồn nước',
  oil_spill: 'Tràn dầu',
  chemical_spill: 'Hóa chất tràn',
  hazardous_waste: 'Chất thải nguy hại',
  dangerous_animal: 'Động vật nguy hiểm',
  affected_animal: 'Động vật bị ảnh hưởng'
};

function initializeSafetySystem() {
  // Load environment reports from localStorage
  var savedEnvReports = localStorage.getItem('sosmap_environment_reports');
  if (savedEnvReports) {
    environmentReports = JSON.parse(savedEnvReports);
  }

  updateSafetyAlerts();
}

function updateSafetyAlerts() {
  var alertsDiv = document.getElementById('safetyAlerts');
  if (!alertsDiv) return;

  alertsDiv.innerHTML = environmentAlerts.map(function(alert) {
    var alertClass = alert.level === 'warning' ? 'warning' : alert.level === 'danger' ? 'danger' : 'info';
    var icon = alert.level === 'warning' ? '⚠️' : alert.level === 'danger' ? '🔴' : 'ℹ️';

    return `
      <div class="safety-alert-item ${alertClass}">
        <span class="alert-icon">${icon}</span>
        <span class="alert-text">${alert.message}</span>
      </div>
    `;
  }).join('');
}

function createEnvironmentReport(data) {
  var report = {
    id: 'ENV-' + Date.now(),
    type: data.type,
    location: data.location,
    description: data.description,
    contact: data.contact,
    hasImage: data.hasImage,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    assignedTo: null,
    resolvedAt: null
  };

  environmentReports.push(report);
  saveEnvironmentReports();

  alert('Đã gửi báo cáo môi trường! Mã báo cáo: ' + report.id);
  logActivity('environment_report', 'Báo cáo môi trường: ' + report.id);

  return report;
}

function saveEnvironmentReports() {
  localStorage.setItem('sosmap_environment_reports', JSON.stringify(environmentReports));
}

// Traffic Modal Event Listeners
document.getElementById('trafficBtn').addEventListener('click', function() {
  document.getElementById('trafficModal').style.display = 'block';
});

document.getElementById('closeTrafficModal').addEventListener('click', function() {
  document.getElementById('trafficModal').style.display = 'none';
});

document.getElementById('closeTrafficBtn').addEventListener('click', function() {
  document.getElementById('trafficModal').style.display = 'none';
});

document.getElementById('trafficFilter') && document.getElementById('trafficFilter').addEventListener('change', function() {
  var filter = this.value;
  // Filter traffic conditions based on type
  // TODO: Implement filter logic
});

// Environment Modal Event Listeners
document.getElementById('environmentBtn').addEventListener('click', function() {
  document.getElementById('environmentModal').style.display = 'block';
  getEnvLocation();
});

document.getElementById('closeEnvironmentModal').addEventListener('click', function() {
  document.getElementById('environmentModal').style.display = 'none';
});

document.getElementById('closeEnvironmentBtn').addEventListener('click', function() {
  document.getElementById('environmentModal').style.display = 'none';
});

document.getElementById('getEnvLocationBtn').addEventListener('click', function() {
  getEnvLocation();
});

function getEnvLocation() {
  var locationInput = document.getElementById('envReportLocation');
  var latInput = document.getElementById('envLat');
  var lngInput = document.getElementById('envLng');

  locationInput.value = 'Đang lấy vị trí...';

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      function(position) {
        var lat = position.coords.latitude;
        var lng = position.coords.longitude;
        latInput.value = lat;
        lngInput.value = lng;
        locationInput.value = lat.toFixed(6) + ', ' + lng.toFixed(6);
      },
      function(error) {
        locationInput.value = 'Không thể lấy vị trí';
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  } else {
    locationInput.value = 'Geolocation không được hỗ trợ';
  }
}

document.getElementById('submitEnvironmentReportBtn').addEventListener('click', function() {
  var type = document.getElementById('envReportType').value;
  var description = document.getElementById('envReportDescription').value;
  var contact = document.getElementById('envReportContact').value;
  var hasImage = document.getElementById('envReportImage').files.length > 0;

  var lat = document.getElementById('envLat').value;
  var lng = document.getElementById('envLng').value;

  if (!type || !description || !contact) {
    alert('Vui lòng điền đầy đủ các trường bắt buộc');
    return;
  }

  var envData = {
    type: type,
    location: lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : null,
    description: description,
    contact: contact,
    hasImage: hasImage
  };

  createEnvironmentReport(envData);
  document.getElementById('environmentModal').style.display = 'none';
  document.getElementById('environmentReportForm').reset();
});

// Initialize safety system on page load
// safetySystem initialization is now called from main DOMContentLoaded

// Missing Persons System
var missingPersons = [];
var missingPersonSightings = [];

var missingPriorities = {
  low: 'Thấp',
  medium: 'Trung bình',
  high: 'Cao',
  critical: 'Khẩn cấp'
};

var healthRisks = {
  none: 'Không có',
  low: 'Thấp',
  medium: 'Trung bình',
  high: 'Cao',
  critical: 'Rất cao'
};

function initializeMissingPersonsSystem() {
  // Load missing persons from localStorage
  var savedMissing = localStorage.getItem('sosmap_missing_persons');
  if (savedMissing) {
    missingPersons = JSON.parse(savedMissing);
  }

  updateMissingAlerts();
}

function updateMissingAlerts() {
  var alertsDiv = document.getElementById('missingAlerts');
  if (!alertsDiv) return;

  var activeMissing = missingPersons.filter(function(p) {
    return p.status === 'missing';
  });

  if (activeMissing.length === 0) {
    alertsDiv.innerHTML = `
      <div class="missing-alert-item info">
        <span class="alert-icon">ℹ️</span>
        <span class="alert-text">Không có người mất tích nào</span>
      </div>
    `;
    return;
  }

  alertsDiv.innerHTML = activeMissing.map(function(person) {
    var level = person.priority;
    var alertClass = level === 'critical' ? 'critical' : level === 'high' ? 'warning' : 'info';
    var icon = level === 'critical' ? '🔴' : level === 'high' ? '⚠️' : 'ℹ️';

    return `
      <div class="missing-alert-item ${alertClass}">
        <span class="alert-icon">${icon}</span>
        <span class="alert-text">${person.name} (${person.age} tuổi) - ${missingPriorities[level]}</span>
      </div>
    `;
  }).join('');
}

function createMissingPersonReport(data) {
  var report = {
    id: 'MISS-' + Date.now(),
    name: data.name,
    age: data.age,
    gender: data.gender,
    physicalDescription: data.physicalDescription,
    clothing: data.clothing,
    lastLocation: data.lastLocation,
    lastSeenTime: data.lastSeenTime,
    healthRisk: data.healthRisk,
    priority: data.priority,
    reporterName: data.reporterName,
    reporterContact: data.reporterContact,
    reporterRelation: data.reporterRelation,
    hasPhoto: data.hasPhoto,
    sensitiveInfo: data.sensitiveInfo,
    status: 'missing',
    verified: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    foundAt: null,
    history: [],
    sightings: []
  };

  // Add initial history entry
  report.history.push({
    action: 'created',
    timestamp: new Date().toISOString(),
    note: 'Báo cáo người mất tích được tạo',
    source: 'reporter'
  });

  missingPersons.push(report);
  saveMissingPersons();
  updateMissingAlerts();

  // Send browser notification
  if (Notification.permission === 'granted') {
    new Notification('🔍 Báo cáo người mất tích: ' + report.name, {
      body: report.physicalDescription,
      icon: '/favicon.ico',
      requireInteraction: true
    });
  }

  alert('Đã gửi báo cáo người mất tích! Mã báo cáo: ' + report.id);
  logActivity('missing_person_report', 'Báo cáo người mất tích: ' + report.id);

  return report;
}

function markMissingPersonFound(personId) {
  var person = missingPersons.find(function(p) {
    return p.id === personId;
  });

  if (!person) {
    alert('Không tìm thấy thông tin người mất tích');
    return;
  }

  if (!confirm('Xác nhận đã tìm thấy người này?')) {
    return;
  }

  person.status = 'found';
  person.foundAt = new Date().toISOString();
  person.history.push({
    action: 'found',
    timestamp: new Date().toISOString(),
    note: 'Đã tìm thấy người mất tích',
    source: 'system'
  });

  saveMissingPersons();
  updateMissingAlerts();
  renderMissingPersonsList();

  alert('Đã đánh dấu là đã tìm thấy!');
  logActivity('missing_person_found', 'Đã tìm thấy: ' + personId);
}

function addSighting(personId, sightingData) {
  var person = missingPersons.find(function(p) {
    return p.id === personId;
  });

  if (!person) {
    alert('Không tìm thấy thông tin người mất tích');
    return;
  }

  var sighting = {
    id: 'SIGHT-' + Date.now(),
    location: sightingData.location,
    time: sightingData.time,
    description: sightingData.description,
    reporter: sightingData.reporter,
    contact: sightingData.contact,
    timestamp: new Date().toISOString(),
    verified: false
  };

  person.sightings.push(sighting);
  person.history.push({
    action: 'sighting',
    timestamp: new Date().toISOString(),
    note: 'Nhận được thông tin nhìn thấy',
    source: 'community'
  });

  saveMissingPersons();

  alert('Đã gửi thông tin nhìn thấy!');
  logActivity('missing_person_sighting', 'Thông tin nhìn thấy: ' + personId);
}

function saveMissingPersons() {
  localStorage.setItem('sosmap_missing_persons', JSON.stringify(missingPersons));
}

// Missing Person Report Modal Event Listeners
document.getElementById('reportMissingBtn').addEventListener('click', function() {
  document.getElementById('missingPersonModal').style.display = 'block';
  getMissingLocation();
});

document.getElementById('closeMissingPersonModal').addEventListener('click', function() {
  document.getElementById('missingPersonModal').style.display = 'none';
});

document.getElementById('cancelMissingPersonBtn').addEventListener('click', function() {
  document.getElementById('missingPersonModal').style.display = 'none';
});

document.getElementById('getMissingLocationBtn').addEventListener('click', function() {
  getMissingLocation();
});

function getMissingLocation() {
  var locationInput = document.getElementById('missingLastLocation');
  var latInput = document.getElementById('missingLat');
  var lngInput = document.getElementById('missingLng');

  locationInput.value = 'Đang lấy vị trí...';

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      function(position) {
        var lat = position.coords.latitude;
        var lng = position.coords.longitude;
        latInput.value = lat;
        lngInput.value = lng;
        locationInput.value = lat.toFixed(6) + ', ' + lng.toFixed(6);
      },
      function(error) {
        locationInput.value = 'Không thể lấy vị trí';
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  } else {
    locationInput.value = 'Geolocation không được hỗ trợ';
  }
}

document.getElementById('submitMissingPersonBtn').addEventListener('click', function() {
  var name = document.getElementById('missingName').value;
  var age = parseInt(document.getElementById('missingAge').value);
  var gender = document.getElementById('missingGender').value;
  var physicalDescription = document.getElementById('missingPhysicalDescription').value;
  var clothing = document.getElementById('missingClothing').value;
  var lastSeenTime = document.getElementById('missingLastSeenTime').value;
  var healthRisk = document.getElementById('missingHealthRisk').value;
  var priority = document.getElementById('missingPriority').value;
  var reporterName = document.getElementById('missingReporterName').value;
  var reporterContact = document.getElementById('missingReporterContact').value;
  var reporterRelation = document.getElementById('missingReporterRelation').value;
  var hasPhoto = document.getElementById('missingPhoto').files.length > 0;
  var sensitiveInfo = document.getElementById('missingSensitiveInfo').checked;

  var lat = document.getElementById('missingLat').value;
  var lng = document.getElementById('missingLng').value;

  if (!name || !age || !gender || !physicalDescription || !lastSeenTime || !reporterName || !reporterContact) {
    alert('Vui lòng điền đầy đủ các trường bắt buộc');
    return;
  }

  var missingData = {
    name: name,
    age: age,
    gender: gender,
    physicalDescription: physicalDescription,
    clothing: clothing,
    lastLocation: lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : null,
    lastSeenTime: new Date(lastSeenTime).toISOString(),
    healthRisk: healthRisk,
    priority: priority,
    reporterName: reporterName,
    reporterContact: reporterContact,
    reporterRelation: reporterRelation,
    hasPhoto: hasPhoto,
    sensitiveInfo: sensitiveInfo
  };

  createMissingPersonReport(missingData);
  document.getElementById('missingPersonModal').style.display = 'none';
  document.getElementById('missingPersonForm').reset();
});

// Missing Persons List Modal Event Listeners
document.getElementById('viewMissingListBtn').addEventListener('click', function() {
  renderMissingPersonsList();
  document.getElementById('missingListModal').style.display = 'block';
});

document.getElementById('closeMissingListModal').addEventListener('click', function() {
  document.getElementById('missingListModal').style.display = 'none';
});

document.getElementById('closeMissingListBtn').addEventListener('click', function() {
  document.getElementById('missingListModal').style.display = 'none';
});

function renderMissingPersonsList() {
  var list = document.getElementById('missingPersonsList');
  if (!list) return;

  var statusFilter = document.getElementById('missingStatusFilter').value;
  var priorityFilter = document.getElementById('missingPriorityFilter').value;

  var filteredPersons = missingPersons.filter(function(p) {
    var statusMatch = statusFilter === 'all' || p.status === statusFilter;
    var priorityMatch = priorityFilter === 'all' || p.priority === priorityFilter;
    return statusMatch && priorityMatch;
  });

  if (filteredPersons.length === 0) {
    list.innerHTML = '<div class="empty-state"><p>Không có người mất tích nào</p></div>';
    return;
  }

  list.innerHTML = filteredPersons.map(function(person) {
    var priorityLabel = missingPriorities[person.priority] || person.priority;
    var statusLabel = person.status === 'missing' ? 'Đang tìm kiếm' : person.status === 'found' ? 'Đã tìm thấy' : 'Đã hủy';
    var displayName = person.sensitiveInfo ? person.name.substring(0, 1) + '***' : person.name;

    return `
      <div class="missing-person-item ${person.status}">
        <div class="missing-person-header">
          <div class="missing-person-name">${displayName} (${person.age} tuổi)</div>
          <span class="missing-person-badge ${person.priority}">${priorityLabel}</span>
        </div>
        <div class="missing-person-details">
          <strong>Giới tính:</strong> ${person.gender === 'male' ? 'Nam' : person.gender === 'female' ? 'Nữ' : 'Khác'}<br>
          <strong>Đặc điểm:</strong> ${person.physicalDescription}<br>
          ${person.clothing ? '<strong>Quần áo:</strong> ' + person.clothing + '<br>' : ''}
          <strong>Vị trí cuối:</strong> ${person.lastLocation ? person.lastLocation.lat.toFixed(6) + ', ' + person.lastLocation.lng.toFixed(6) : 'Chưa có'}<br>
          <strong>Thời gian:</strong> ${new Date(person.lastSeenTime).toLocaleString('vi-VN')}<br>
          <strong>Nguy cơ sức khỏe:</strong> ${healthRisks[person.healthRisk]}<br>
          <strong>Người báo cáo:</strong> ${person.reporterName} (${person.reporterRelation || 'Không rõ'})
        </div>
        <div class="missing-person-meta">
          <span>Mã: ${person.id}</span>
          <span>Trạng thái: ${statusLabel}</span>
        </div>
        <div class="missing-person-actions">
          <button class="missing-action-btn" onclick="viewMissingPersonDetails('${person.id}')">Chi tiết</button>
          ${person.status === 'missing' ? `<button class="missing-action-btn" onclick="markMissingPersonFound('${person.id}')">Đã tìm thấy</button>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

function viewMissingPersonDetails(personId) {
  var person = missingPersons.find(function(p) {
    return p.id === personId;
  });

  if (!person) {
    alert('Không tìm thấy thông tin người mất tích');
    return;
  }

  // TODO: Show detailed modal with full information, history, and sightings
  alert('Chi tiết người mất tích: ' + person.name);
}

document.getElementById('missingStatusFilter') && document.getElementById('missingStatusFilter').addEventListener('change', renderMissingPersonsList);
document.getElementById('missingPriorityFilter') && document.getElementById('missingPriorityFilter').addEventListener('change', renderMissingPersonsList);

// Initialize missing persons system on page load
document.addEventListener('DOMContentLoaded', function() {
  initializeMissingPersonsSystem();
});

// Community System
var communityReports = [];
var reportChannels = ['web', 'sms', 'zalo_oa', 'hotline'];
var verificationStatus = {
  unverified: 'Chưa xác minh',
  verified: 'Đã xác minh',
  corrected: 'Đã đính chính',
  rejected: 'Đã từ chối'
};

function initializeCommunitySystem() {
  // Load community reports from localStorage
  var savedReports = localStorage.getItem('sosmap_community_reports');
  if (savedReports) {
    communityReports = JSON.parse(savedReports);
  }

  updateCommunityStats();
}

function updateCommunityStats() {
  var statsDiv = document.getElementById('communityStats');
  if (!statsDiv) return;

  var today = new Date().toDateString();
  var todayReports = communityReports.filter(function(r) {
    return new Date(r.createdAt).toDateString() === today;
  }).length;

  var pendingReports = communityReports.filter(function(r) {
    return r.status === 'pending';
  }).length;

  statsDiv.innerHTML = `
    <div class="stat-item">
      <span class="stat-value">${todayReports}</span>
      <span class="stat-label">Phản ánh hôm nay</span>
    </div>
    <div class="stat-item">
      <span class="stat-value">${pendingReports}</span>
      <span class="stat-label">Đang xử lý</span>
    </div>
  `;
}

function createQuickReport(data) {
  var report = {
    id: 'QUICK-' + Date.now(),
    type: data.type,
    priority: data.priority,
    content: data.content,
    location: data.location,
    contact: data.contact,
    hasMedia: data.hasMedia,
    language: data.language,
    anonymous: data.anonymous,
    channel: 'web',
    status: 'pending',
    verificationStatus: 'unverified',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    verifiedBy: null,
    verifiedAt: null,
    correction: null,
    history: [],
    sources: [],
    duplicateOf: null,
    spamScore: 0
  };

  // Check for duplicates
  var duplicate = checkDuplicateReport(report);
  if (duplicate) {
    report.duplicateOf = duplicate.id;
    report.spamScore += 50;
  }

  // Check for spam
  var spamScore = calculateSpamScore(report);
  report.spamScore = spamScore;

  // Add initial history entry
  report.history.push({
    action: 'created',
    timestamp: new Date().toISOString(),
    note: 'Phản ánh nhanh được tạo',
    channel: report.channel
  });

  communityReports.push(report);
  saveCommunityReports();
  updateCommunityStats();

  // Send browser notification for critical reports
  if (data.priority === 'critical' && Notification.permission === 'granted') {
    new Notification('🚨 Phản ánh khẩn cấp', {
      body: data.content,
      icon: '/favicon.ico',
      requireInteraction: true
    });
  }

  alert('Đã gửi phản ánh! Mã phản ánh: ' + report.id);
  logActivity('community_report', 'Phản ánh cộng đồng: ' + report.id);

  return report;
}

function checkDuplicateReport(report) {
  // Check for similar content or location
  return communityReports.find(function(r) {
    var timeDiff = new Date(report.createdAt) - new Date(r.createdAt);
    var isRecent = timeDiff < 3600000; // Within 1 hour
    var isSimilarLocation = report.location && r.location &&
      Math.abs(report.location.lat - r.location.lat) < 0.001 &&
      Math.abs(report.location.lng - r.location.lng) < 0.001;
    var isSimilarContent = report.content && r.content &&
      report.content.substring(0, 50) === r.content.substring(0, 50);

    return isRecent && (isSimilarLocation || isSimilarContent);
  });
}

function calculateSpamScore(report) {
  var score = 0;

  // Check for duplicate content
  if (report.duplicateOf) {
    score += 50;
  }

  // Check for short content
  if (report.content && report.content.length < 20) {
    score += 20;
  }

  // Check for excessive uppercase
  if (report.content && report.content.length > 0) {
    var uppercaseRatio = (report.content.match(/[A-Z]/g) || []).length / report.content.length;
    if (uppercaseRatio > 0.5) {
      score += 30;
    }
  }

  return score;
}

function verifyReport(reportId, verifiedBy, notes) {
  var report = communityReports.find(function(r) {
    return r.id === reportId;
  });

  if (!report) {
    alert('Không tìm thấy phản ánh');
    return;
  }

  report.verificationStatus = 'verified';
  report.verifiedBy = verifiedBy;
  report.verifiedAt = new Date().toISOString();
  report.history.push({
    action: 'verified',
    timestamp: new Date().toISOString(),
    note: notes || 'Đã xác minh',
    verifiedBy: verifiedBy
  });

  saveCommunityReports();
  renderCommunityFeed();

  alert('Đã xác minh phản ánh!');
  logActivity('report_verify', 'Xác minh phản ánh: ' + reportId);
}

function correctReport(reportId, correction, correctedBy) {
  var report = communityReports.find(function(r) {
    return r.id === reportId;
  });

  if (!report) {
    alert('Không tìm thấy phản ánh');
    return;
  }

  report.verificationStatus = 'corrected';
  report.correction = {
    originalContent: report.content,
    correctedContent: correction,
    correctedBy: correctedBy,
    correctedAt: new Date().toISOString()
  };
  report.history.push({
    action: 'corrected',
    timestamp: new Date().toISOString(),
    note: 'Đã đính chính thông tin',
    correctedBy: correctedBy
  });

  saveCommunityReports();
  renderCommunityFeed();

  alert('Đã đính chính phản ánh!');
  logActivity('report_correct', 'Đính chính phản ánh: ' + reportId);
}

function addSourceToReport(reportId, source) {
  var report = communityReports.find(function(r) {
    return r.id === reportId;
  });

  if (!report) {
    alert('Không tìm thấy phản ánh');
    return;
  }

  report.sources.push({
    type: source.type,
    contact: source.contact,
    timestamp: new Date().toISOString(),
    verified: false
  });

  report.history.push({
    action: 'source_added',
    timestamp: new Date().toISOString(),
    note: 'Thêm nguồn xác minh',
    source: source.type
  });

  saveCommunityReports();

  alert('Đã thêm nguồn xác minh!');
}

function saveCommunityReports() {
  localStorage.setItem('sosmap_community_reports', JSON.stringify(communityReports));
}

// Quick Report Modal Event Listeners
document.getElementById('quickReportBtn').addEventListener('click', function() {
  document.getElementById('quickReportModal').style.display = 'block';
  getQuickLocation();
});

document.getElementById('closeQuickReportModal').addEventListener('click', function() {
  document.getElementById('quickReportModal').style.display = 'none';
});

document.getElementById('cancelQuickReportBtn').addEventListener('click', function() {
  document.getElementById('quickReportModal').style.display = 'none';
});

document.getElementById('getQuickLocationBtn').addEventListener('click', function() {
  getQuickLocation();
});

function getQuickLocation() {
  var locationInput = document.getElementById('quickReportLocation');
  var latInput = document.getElementById('quickLat');
  var lngInput = document.getElementById('quickLng');

  locationInput.value = 'Đang lấy vị trí...';

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      function(position) {
        var lat = position.coords.latitude;
        var lng = position.coords.longitude;
        latInput.value = lat;
        lngInput.value = lng;
        locationInput.value = lat.toFixed(6) + ', ' + lng.toFixed(6);
      },
      function(error) {
        locationInput.value = 'Không thể lấy vị trí';
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  } else {
    locationInput.value = 'Geolocation không được hỗ trợ';
  }
}

document.getElementById('submitQuickReportBtn').addEventListener('click', function() {
  var type = document.getElementById('quickReportType').value;
  var priority = document.getElementById('quickReportPriority').value;
  var content = document.getElementById('quickReportContent').value;
  var contact = document.getElementById('quickReportContact').value;
  var hasMedia = document.getElementById('quickReportMedia').files.length > 0;
  var language = document.getElementById('quickReportLanguage').value;
  var anonymous = document.getElementById('quickReportAnonymous').checked;

  var lat = document.getElementById('quickLat').value;
  var lng = document.getElementById('quickLng').value;

  if (!type || !priority || !content) {
    alert('Vui lòng điền đầy đủ các trường bắt buộc');
    return;
  }

  var quickData = {
    type: type,
    priority: priority,
    content: content,
    location: lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : null,
    contact: contact,
    hasMedia: hasMedia,
    language: language,
    anonymous: anonymous
  };

  createQuickReport(quickData);
  document.getElementById('quickReportModal').style.display = 'none';
  document.getElementById('quickReportForm').reset();
});

// Community Feed Modal Event Listeners
document.getElementById('communityFeedBtn').addEventListener('click', function() {
  renderCommunityFeed();
  document.getElementById('communityFeedModal').style.display = 'block';
});

document.getElementById('closeCommunityFeedModal').addEventListener('click', function() {
  document.getElementById('communityFeedModal').style.display = 'none';
});

document.getElementById('closeCommunityFeedBtn').addEventListener('click', function() {
  document.getElementById('communityFeedModal').style.display = 'none';
});

function renderCommunityFeed() {
  var feed = document.getElementById('communityFeed');
  if (!feed) return;

  var typeFilter = document.getElementById('feedTypeFilter').value;
  var priorityFilter = document.getElementById('feedPriorityFilter').value;

  var filteredReports = communityReports.filter(function(r) {
    var typeMatch = typeFilter === 'all' || r.verificationStatus === typeFilter;
    var priorityMatch = priorityFilter === 'all' || r.priority === priorityFilter;
    return typeMatch && priorityMatch;
  });

  if (filteredReports.length === 0) {
    feed.innerHTML = '<div class="empty-state"><p>Không có phản ánh nào</p></div>';
    return;
  }

  feed.innerHTML = filteredReports.map(function(report) {
    var statusLabel = verificationStatus[report.verificationStatus] || report.verificationStatus;
    var displayName = report.anonymous ? 'Ẩn danh' : 'Người dùng';

    return `
      <div class="feed-item ${report.verificationStatus}">
        <div class="feed-header">
          <div class="feed-type">${report.type} - Mức độ: ${report.priority}</div>
          <span class="feed-badge ${report.verificationStatus}">${statusLabel}</span>
        </div>
        <div class="feed-content">
          ${report.correction ? '<strong>Đã đính chính:</strong> ' + report.correction.correctedContent : report.content}
        </div>
        <div class="feed-meta">
          <span>${displayName}</span>
          <span>${new Date(report.createdAt).toLocaleString('vi-VN')}</span>
          <span>Mã: ${report.id}</span>
        </div>
        ${report.verificationStatus === 'unverified' ? `
        <div class="feed-actions">
          <button class="feed-action-btn" onclick="verifyReport('${report.id}', 'admin', 'Đã xác minh')">Xác minh</button>
          <button class="feed-action-btn" onclick="correctReport('${report.id}', 'Thông tin chính xác...', 'admin')">Đính chính</button>
        </div>
        ` : ''}
      </div>
    `;
  }).join('');
}

document.getElementById('feedTypeFilter') && document.getElementById('feedTypeFilter').addEventListener('change', renderCommunityFeed);
document.getElementById('feedPriorityFilter') && document.getElementById('feedPriorityFilter').addEventListener('change', renderCommunityFeed);

// Initialize community system on page load
document.addEventListener('DOMContentLoaded', function() {
  initializeCommunitySystem();
});

// Governance System
var adminUnits = [
  { id: 'unit1', name: 'Quận 1', level: 'district', status: 'active', duty: 'Đang trực', boundary: 'Q1', phone: '028 3839 xxxx' },
  { id: 'unit2', name: 'Quận 3', level: 'district', status: 'active', duty: 'Đang trực', boundary: 'Q3', phone: '028 3823 xxxx' },
  { id: 'unit3', name: 'Quận 5', level: 'district', status: 'warning', duty: '-', boundary: 'Q5', phone: '028 3838 xxxx' }
];

var leadAgencies = [
  { id: 'agency1', type: 'traffic', name: 'Sở Giao thông Vận tải', phone: '1900 xxxx', email: 'sgtvt@hcmc.gov.vn' },
  { id: 'agency2', type: 'health', name: 'Sở Y tế', phone: '1900 xxxx', email: 'syte@hcmc.gov.vn' },
  { id: 'agency3', type: 'police', name: 'Công an TP', phone: '113', email: 'canhcm@hcmc.gov.vn' },
  { id: 'agency4', type: 'fire', name: 'Cảnh sát PCCC', phone: '114', email: 'pccc@hcmc.gov.vn' }
];

var emergencyChannels = [
  { id: 'channel1', name: 'Hotline chính', number: '1900 xxxx', status: 'active' },
  { id: 'channel2', name: 'Ca trực', number: '090 xxx xxx', status: 'active' },
  { id: 'channel3', name: 'Zalo OA', number: '@sosmap_zalo', status: 'active' }
];

var interAgencyAssignments = [];
var escalatedIncidents = [];

var governanceLevels = {
  province: 'Tỉnh/Thành phố',
  district: 'Quận/Huyện',
  commune: 'Xã/Phường',
  village: 'Thôn/Bản'
};

function initializeGovernanceSystem() {
  // Load assignments from localStorage
  var savedAssignments = localStorage.getItem('sosmap_inter_agency_assignments');
  if (savedAssignments) {
    interAgencyAssignments = JSON.parse(savedAssignments);
  }

  // Load escalated incidents
  var savedEscalated = localStorage.getItem('sosmap_escalated_incidents');
  if (savedEscalated) {
    escalatedIncidents = JSON.parse(savedEscalated);
  }

  updateGovernanceAlerts();
}

function updateGovernanceAlerts() {
  var alertsDiv = document.getElementById('governanceAlerts');
  if (!alertsDiv) return;

  var overdueAssignments = interAgencyAssignments.filter(function(a) {
    return a.status === 'in_progress' && new Date(a.deadline) < new Date();
  }).length;

  if (overdueAssignments > 0) {
    alertsDiv.innerHTML = `
      <div class="governance-alert-item warning">
        <span class="alert-icon">⚠️</span>
        <span class="alert-text">${overdueAssignments} nhiệm vụ quá hạn cam kết</span>
      </div>
    `;
  } else {
    alertsDiv.innerHTML = `
      <div class="governance-alert-item info">
        <span class="alert-icon">ℹ️</span>
        <span class="alert-text">Hệ thống hoạt động bình thường</span>
      </div>
    `;
  }
}

function createInterAgencyAssignment(data) {
  var assignment = {
    id: 'IA-' + Date.now(),
    incidentId: data.incidentId,
    agencies: data.agencies,
    deadline: data.deadline,
    notes: data.notes,
    status: 'in_progress',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    completedAt: null,
    history: []
  };

  assignment.history.push({
    action: 'created',
    timestamp: new Date().toISOString(),
    note: 'Nhiệm vụ liên cơ quan được tạo'
  });

  interAgencyAssignments.push(assignment);
  saveInterAgencyAssignments();
  updateGovernanceAlerts();

  alert('Đã tạo nhiệm vụ liên cơ quan! Mã nhiệm vụ: ' + assignment.id);
  logActivity('inter_agency_assignment', 'Tạo nhiệm vụ liên cơ quan: ' + assignment.id);

  return assignment;
}

function escalateIncident(incidentId, fromLevel, toLevel, reason) {
  var escalation = {
    id: 'ESC-' + Date.now(),
    incidentId: incidentId,
    fromLevel: fromLevel,
    toLevel: toLevel,
    reason: reason,
    escalatedAt: new Date().toISOString(),
    acknowledged: false,
    acknowledgedAt: null
  };

  escalatedIncidents.push(escalation);
  saveEscalatedIncidents();

  alert('Đã chuyển giao sự cố lên cấp cao hơn!');
  logActivity('incident_escalation', 'Chuyển giao sự cố: ' + incidentId);

  return escalation;
}

function saveInterAgencyAssignments() {
  localStorage.setItem('sosmap_inter_agency_assignments', JSON.stringify(interAgencyAssignments));
}

function saveEscalatedIncidents() {
  localStorage.setItem('sosmap_escalated_incidents', JSON.stringify(escalatedIncidents));
}

// Governance Dashboard Modal Event Listeners
document.getElementById('governanceDashboardBtn').addEventListener('click', function() {
  document.getElementById('governanceDashboardModal').style.display = 'block';
});

document.getElementById('closeGovernanceDashboardModal').addEventListener('click', function() {
  document.getElementById('governanceDashboardModal').style.display = 'none';
});

document.getElementById('closeGovernanceDashboardBtn').addEventListener('click', function() {
  document.getElementById('governanceDashboardModal').style.display = 'none';
});

document.getElementById('governanceLevel') && document.getElementById('governanceLevel').addEventListener('change', function() {
  var level = this.value;
  // Update dashboard based on level
  // TODO: Implement level-specific dashboard
});

document.getElementById('governanceLocation') && document.getElementById('governanceLocation').addEventListener('change', function() {
  var location = this.value;
  // Update dashboard based on location
  // TODO: Implement location-specific dashboard
});

// Governance Assignments Modal Event Listeners
document.getElementById('governanceAssignmentsBtn').addEventListener('click', function() {
  document.getElementById('governanceAssignmentsModal').style.display = 'block';
});

document.getElementById('closeGovernanceAssignmentsModal').addEventListener('click', function() {
  document.getElementById('governanceAssignmentsModal').style.display = 'none';
});

document.getElementById('closeGovernanceAssignmentsBtn').addEventListener('click', function() {
  document.getElementById('governanceAssignmentsModal').style.display = 'none';
});

document.getElementById('createAssignmentBtn') && document.getElementById('createAssignmentBtn').addEventListener('click', function() {
  var incidentId = document.getElementById('assignmentIncident').value;
  var deadline = document.getElementById('assignmentDeadline').value;
  var notes = document.getElementById('assignmentNotes').value;

  var agencies = [];
  document.querySelectorAll('input[name="agency"]:checked').forEach(function(checkbox) {
    agencies.push(checkbox.value);
  });

  if (!incidentId || !deadline || agencies.length === 0) {
    alert('Vui lòng điền đầy đủ các trường bắt buộc');
    return;
  }

  var assignmentData = {
    incidentId: incidentId,
    agencies: agencies,
    deadline: new Date(deadline).toISOString(),
    notes: notes
  };

  createInterAgencyAssignment(assignmentData);
  document.getElementById('assignmentIncident').value = '';
  document.getElementById('assignmentDeadline').value = '';
  document.getElementById('assignmentNotes').value = '';
  document.querySelectorAll('input[name="agency"]').forEach(function(cb) {
    cb.checked = false;
  });
});

// Initialize governance system on page load
document.addEventListener('DOMContentLoaded', function() {
  initializeGovernanceSystem();
});

// Planning & Drills System
var emergencyPlans = [];
var activeDrill = null;
var drillHistory = [];

var planTypes = {
  flood: 'Bão lũ',
  epidemic: 'Dịch bệnh',
  fire: 'Cháy nổ',
  earthquake: 'Động đất',
  other: 'Khác'
};

function initializePlanningSystem() {
  // Load plans from localStorage
  var savedPlans = localStorage.getItem('sosmap_emergency_plans');
  if (savedPlans) {
    emergencyPlans = JSON.parse(savedPlans);
  }

  // Load drill history
  var savedDrills = localStorage.getItem('sosmap_drill_history');
  if (savedDrills) {
    drillHistory = JSON.parse(savedDrills);
  }

  updatePlanningAlerts();
}

function updatePlanningAlerts() {
  var alertsDiv = document.getElementById('planningAlerts');
  if (!alertsDiv) return;

  if (activeDrill) {
    alertsDiv.innerHTML = `
      <div class="planning-alert-item warning">
        <span class="alert-icon">🎯</span>
        <span class="alert-text">Đang diễn tập: ${activeDrill.planName}</span>
      </div>
    `;
  } else {
    alertsDiv.innerHTML = `
      <div class="planning-alert-item info">
        <span class="alert-icon">ℹ️</span>
        <span class="alert-text">Không có diễn tập nào đang diễn ra</span>
      </div>
    `;
  }
}

function createEmergencyPlan(data) {
  var plan = {
    id: 'PLAN-' + Date.now(),
    type: data.type,
    name: data.name,
    area: data.area,
    participants: data.participants,
    timeline: data.timeline,
    tasks: data.tasks,
    resources: data.resources,
    contact: data.contact,
    isDrill: data.isDrill,
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'active'
  };

  emergencyPlans.push(plan);
  saveEmergencyPlans();

  alert('Đã tạo phương án! Mã phương án: ' + plan.id);
  logActivity('plan_create', 'Tạo phương án: ' + plan.id);

  return plan;
}

function startDrill(planId, startTime, participants) {
  var plan = emergencyPlans.find(function(p) {
    return p.id === planId;
  });

  if (!plan) {
    alert('Không tìm thấy phương án');
    return;
  }

  activeDrill = {
    id: 'DRILL-' + Date.now(),
    planId: planId,
    planName: plan.name,
    startTime: new Date(startTime).toISOString(),
    participants: participants,
    status: 'in_progress',
    responseTimes: [],
    readinessScores: [],
    evaluation: null,
    lessons: null,
    recommendations: null,
    endedAt: null
  };

  updatePlanningAlerts();

  alert('Đã bắt đầu diễn tập!');
  logActivity('drill_start', 'Bắt đầu diễn tập: ' + activeDrill.id);

  return activeDrill;
}

function endDrill(evaluation, lessons, recommendations) {
  if (!activeDrill) {
    alert('Không có diễn tập nào đang diễn ra');
    return;
  }

  activeDrill.status = 'completed';
  activeDrill.endedAt = new Date().toISOString();
  activeDrill.evaluation = evaluation;
  activeDrill.lessons = lessons;
  activeDrill.recommendations = recommendations;

  drillHistory.push(activeDrill);
  saveDrillHistory();

  var completedDrill = activeDrill;
  activeDrill = null;
  updatePlanningAlerts();

  alert('Đã kết thúc diễn tập và lưu báo cáo!');
  logActivity('drill_end', 'Kết thúc diễn tập: ' + completedDrill.id);

  return completedDrill;
}

function recordResponseTime(unitId, responseTime) {
  if (!activeDrill) return;

  activeDrill.responseTimes.push({
    unitId: unitId,
    responseTime: responseTime,
    timestamp: new Date().toISOString()
  });
}

function recordReadinessScore(unitId, score) {
  if (!activeDrill) return;

  activeDrill.readinessScores.push({
    unitId: unitId,
    score: score,
    timestamp: new Date().toISOString()
  });
}

function saveEmergencyPlans() {
  localStorage.setItem('sosmap_emergency_plans', JSON.stringify(emergencyPlans));
}

function saveDrillHistory() {
  localStorage.setItem('sosmap_drill_history', JSON.stringify(drillHistory));
}

// Create Plan Modal Event Listeners
document.getElementById('createPlanBtn').addEventListener('click', function() {
  document.getElementById('createPlanModal').style.display = 'block';
});

document.getElementById('closeCreatePlanModal').addEventListener('click', function() {
  document.getElementById('createPlanModal').style.display = 'none';
});

document.getElementById('cancelCreatePlanBtn').addEventListener('click', function() {
  document.getElementById('createPlanModal').style.display = 'none';
});

document.getElementById('submitCreatePlanBtn').addEventListener('click', function() {
  var type = document.getElementById('planType').value;
  var name = document.getElementById('planName').value;
  var area = document.getElementById('planArea').value;
  var participants = document.getElementById('planParticipants').value;
  var timeline = document.getElementById('planTimeline').value;
  var tasks = document.getElementById('planTasks').value;
  var resources = document.getElementById('planResources').value;
  var contact = document.getElementById('planContact').value;
  var isDrill = document.getElementById('planIsDrill').checked;

  if (!type || !name || !area || !participants || !contact) {
    alert('Vui lòng điền đầy đủ các trường bắt buộc');
    return;
  }

  var planData = {
    type: type,
    name: name,
    area: area,
    participants: participants,
    timeline: timeline,
    tasks: tasks,
    resources: resources,
    contact: contact,
    isDrill: isDrill
  };

  createEmergencyPlan(planData);
  document.getElementById('createPlanModal').style.display = 'none';
  document.getElementById('createPlanForm').reset();
});

// Drill Modal Event Listeners
document.getElementById('startDrillBtn').addEventListener('click', function() {
  document.getElementById('drillModal').style.display = 'block';
});

document.getElementById('closeDrillModal').addEventListener('click', function() {
  document.getElementById('drillModal').style.display = 'none';
});

document.getElementById('closeDrillBtn').addEventListener('click', function() {
  document.getElementById('drillModal').style.display = 'none';
});

document.getElementById('startDrillBtn') && document.getElementById('startDrillBtn').addEventListener('click', function() {
  var planId = document.getElementById('drillPlan').value;
  var startTime = document.getElementById('drillStartTime').value;
  var participants = document.getElementById('drillParticipants').value;

  if (!planId || !startTime || !participants) {
    alert('Vui lòng điền đầy đủ các trường bắt buộc');
    return;
  }

  startDrill(planId, startTime, participants);

  document.getElementById('drillSetup').style.display = 'none';
  document.getElementById('drillMonitoring').style.display = 'block';

  // Start elapsed time counter
  var elapsedCounter = 0;
  var elapsedInterval = setInterval(function() {
    if (!activeDrill || activeDrill.status !== 'in_progress') {
      clearInterval(elapsedInterval);
      return;
    }
    elapsedCounter++;
    document.getElementById('drillElapsedTime').textContent = elapsedCounter + ' phút';
  }, 60000); // Update every minute

  document.getElementById('drillStartTimeDisplay').textContent = new Date(startTime).toLocaleString('vi-VN');
});

document.getElementById('simulateAlertBtn') && document.getElementById('simulateAlertBtn').addEventListener('click', function() {
  if (!activeDrill) return;

  // Simulate alert
  if (Notification.permission === 'granted') {
    new Notification('📢 Diễn tập cảnh báo', {
      body: 'Đây là mô phỏng cảnh báo cho diễn tập: ' + activeDrill.planName,
      icon: '/favicon.ico'
    });
  }

  alert('Đã mô phỏng cảnh báo!');
  logActivity('drill_simulate_alert', 'Mô phỏng cảnh báo: ' + activeDrill.id);
});

document.getElementById('endDrillBtn') && document.getElementById('endDrillBtn').addEventListener('click', function() {
  document.getElementById('drillMonitoring').style.display = 'none';
  document.getElementById('drillReport').style.display = 'block';
});

document.getElementById('submitDrillReportBtn') && document.getElementById('submitDrillReportBtn').addEventListener('click', function() {
  var evaluation = document.getElementById('drillEvaluation').value;
  var lessons = document.getElementById('drillLessons').value;
  var recommendations = document.getElementById('drillRecommendations').value;

  endDrill(evaluation, lessons, recommendations);

  document.getElementById('drillModal').style.display = 'none';
  document.getElementById('drillReport').style.display = 'none';
  document.getElementById('drillSetup').style.display = 'block';
  document.getElementById('drillEvaluation').value = '';
  document.getElementById('drillLessons').value = '';
  document.getElementById('drillRecommendations').value = '';
});

// Initialize planning system on page load
document.addEventListener('DOMContentLoaded', function() {
  initializePlanningSystem();
});

// Resilient Access System
var offlineData = {
  emergencyContacts: [
    { id: 'contact1', name: 'Cấp cứu', number: '115', category: 'emergency' },
    { id: 'contact2', name: 'Cứu hỏa', number: '114', category: 'emergency' },
    { id: 'contact3', name: 'Cảnh sát', number: '113', category: 'emergency' },
    { id: 'contact4', name: 'UBND Quận 1', number: '028 3822 xxxx', category: 'local' },
    { id: 'contact5', name: 'Công an Q1', number: '028 3839 xxxx', category: 'local' },
    { id: 'contact6', name: 'Điện lực khẩn cấp', number: '1900 xxxx', category: 'utility' },
    { id: 'contact7', name: 'Nước sạch khẩn cấp', number: '1900 xxxx', category: 'utility' },
    { id: 'contact8', name: 'Trạm bơm Nhà Bè', number: '090 xxx xxx', category: 'shelter' },
    { id: 'contact9', name: 'Điểm cấp nước Công viên Tao Đàn', number: '091 xxx xxx', category: 'shelter' }
  ],
  offlineReports: [],
  lastSyncTime: null,
  isOnline: true
};

var offlinePriorityLevels = {
  critical: 'Khẩn cấp',
  high: 'Cao',
  medium: 'Trung bình',
  low: 'Thấp'
};

function initializeResilientSystem() {
  // Load offline data from localStorage
  var savedContacts = localStorage.getItem('sosmap_emergency_contacts');
  if (savedContacts) {
    offlineData.emergencyContacts = JSON.parse(savedContacts);
  }

  var savedReports = localStorage.getItem('sosmap_offline_reports');
  if (savedReports) {
    offlineData.offlineReports = JSON.parse(savedReports);
  }

  var savedSyncTime = localStorage.getItem('sosmap_last_sync');
  if (savedSyncTime) {
    offlineData.lastSyncTime = savedSyncTime;
  }

  // Monitor connection status
  window.addEventListener('online', function() {
    offlineData.isOnline = true;
    updateResilientStatus();
    syncOfflineData();
  });

  window.addEventListener('offline', function() {
    offlineData.isOnline = false;
    updateResilientStatus();
  });

  updateResilientStatus();
}

function updateResilientStatus() {
  var statusDiv = document.getElementById('resilientStatus');
  if (!statusDiv) return;

  var connectionClass = offlineData.isOnline ? 'online' : 'offline';
  var connectionIcon = offlineData.isOnline ? '🟢' : '🔴';
  var connectionText = offlineData.isOnline ? 'Đang kết nối' : 'Mất kết nối';

  var hasOfflineData = offlineData.emergencyContacts.length > 0;
  var dataIcon = hasOfflineData ? '📦' : '📭';
  var dataText = hasOfflineData ? 'Dữ liệu offline: Đã tải' : 'Dữ liệu offline: Chưa tải';

  statusDiv.innerHTML = `
    <div class="connection-status ${connectionClass}">
      <span class="status-icon">${connectionIcon}</span>
      <span class="status-text">${connectionText}</span>
    </div>
    <div class="offline-data">
      <span class="data-icon">${dataIcon}</span>
      <span class="data-text">${dataText}</span>
    </div>
  `;
}

function downloadOfflineMap() {
  // Simulate downloading offline map data
  var offlineMapData = {
    version: '1.0',
    downloadedAt: new Date().toISOString(),
    contacts: offlineData.emergencyContacts,
    shelters: [
      { name: 'Trạm bơm Nhà Bè', location: { lat: 10.75, lng: 106.65 }, phone: '090 xxx xxx' },
      { name: 'Điểm cấp nước Công viên Tao Đàn', location: { lat: 10.78, lng: 106.70 }, phone: '091 xxx xxx' }
    ],
    emergencyGuides: {
      cpr: '30 lần nén, 2 lần thở mỗi phút',
      bleeding: 'Áp trực tiếp vào vết thương',
      fire: 'Hạ thấp thân, bò lăn ra khỏi ngọn lửa',
      flood: 'Không cố bơi, chờ lực cứu hộ'
    }
  };

  localStorage.setItem('sosmap_offline_map', JSON.stringify(offlineMapData));
  offlineData.lastSyncTime = new Date().toISOString();
  localStorage.setItem('sosmap_last_sync', offlineData.lastSyncTime);

  alert('Đã tải bản đồ offline! Dữ liệu sẽ có sẵn khi mất kết nối.');
  logActivity('offline_download', 'Tải bản đồ offline');
  updateResilientStatus();
}

function createOfflineReport(data) {
  var report = {
    id: 'OFF-' + Date.now(),
    type: data.type,
    content: data.content,
    location: data.location,
    priority: data.priority,
    contact: data.contact,
    timestamp: new Date().toISOString(),
    synced: false,
    syncedAt: null
  };

  offlineData.offlineReports.push(report);
  saveOfflineReports();

  if (!offlineData.isOnline) {
    // Try to send via SMS (simulated)
    sendSMSReport(report);
  }

  alert('Đã tạo phản ánh ' + (offlineData.isOnline ? 'online' : 'offline') + '! Mã: ' + report.id);
  logActivity('offline_report', 'Tạo phản ánh offline: ' + report.id);

  return report;
}

function sendSMSReport(report) {
  // Simulate SMS sending
  console.log('Sending SMS report:', report);
  // In production, this would call an SMS API
  logActivity('sms_sent', 'Gửi SMS: ' + report.id);
}

function syncOfflineData() {
  if (offlineData.offlineReports.length === 0) {
    return;
  }

  var syncedCount = 0;
  offlineData.offlineReports.forEach(function(report) {
    if (!report.synced) {
      // Sync with server
      report.synced = true;
      report.syncedAt = new Date().toISOString();
      syncedCount++;
    }
  });

  if (syncedCount > 0) {
    saveOfflineReports();
    alert('Đã đồng bộ ' + syncedCount + ' phản ánh từ offline!');
    logActivity('offline_sync', 'Đồng bộ offline: ' + syncedCount + ' phản ánh');
  }

  offlineData.lastSyncTime = new Date().toISOString();
  localStorage.setItem('sosmap_last_sync', offlineData.lastSyncTime);
}

function saveOfflineReports() {
  localStorage.setItem('sosmap_offline_reports', JSON.stringify(offlineData.offlineReports));
}

function callEmergency(number) {
  alert('Đang gọi: ' + number);
  logActivity('emergency_call', 'Gọi khẩn cấp: ' + number);
}

// Resilient Panel Event Listeners
document.getElementById('downloadOfflineBtn').addEventListener('click', function() {
  downloadOfflineMap();
});

document.getElementById('viewEmergencyContactsBtn').addEventListener('click', function() {
  document.getElementById('emergencyContactsModal').style.display = 'block';
});

document.getElementById('closeEmergencyContactsModal').addEventListener('click', function() {
  document.getElementById('emergencyContactsModal').style.display = 'none';
});

document.getElementById('closeEmergencyContactsBtn').addEventListener('click', function() {
  document.getElementById('emergencyContactsModal').style.display = 'none';
});

// Initialize resilient system on page load
document.addEventListener('DOMContentLoaded', function() {
  initializeResilientSystem();
});

// Privacy & Safety System (Additional features to complete the section)
var dataDeletionRequests = [];
var privacyConsents = [];
var securityIncidents = [];

function initializePrivacySystem() {
  // Load deletion requests
  var savedDeletions = localStorage.getItem('sosmap_deletion_requests');
  if (savedDeletions) {
    dataDeletionRequests = JSON.parse(savedDeletions);
  }

  // Load privacy consents
  var savedConsents = localStorage.getItem('sosmap_privacy_consents');
  if (savedConsents) {
    privacyConsents = JSON.parse(savedConsents);
  }

  // Load security incidents
  var savedIncidents = localStorage.getItem('sosmap_security_incidents');
  if (savedIncidents) {
    securityIncidents = JSON.parse(savedIncidents);
  }
}

function requestDataDeletion(userId, reason) {
  var request = {
    id: 'DEL-' + Date.now(),
    userId: userId,
    reason: reason,
    status: 'pending',
    requestedAt: new Date().toISOString(),
    processedAt: null,
    deletedAt: null
  };

  dataDeletionRequests.push(request);
  saveDeletionRequests();

  alert('Đã gửi yêu cầu xóa dữ liệu! Mã yêu cầu: ' + request.id);
  logActivity('data_deletion_request', 'Yêu cầu xóa dữ liệu: ' + request.id);

  return request;
}

function processDataDeletion(requestId) {
  var request = dataDeletionRequests.find(function(r) {
    return r.id === requestId;
  });

  if (!request) {
    alert('Không tìm thấy yêu cầu xóa');
    return;
  }

  request.status = 'approved';
  request.processedAt = new Date().toISOString();
  request.deletedAt = new Date().toISOString();

  // Delete user data (simulated)
  deleteUserData(request.userId);

  saveDeletionRequests();

  alert('Đã xử lý yêu cầu xóa dữ liệu!');
  logActivity('data_deletion_processed', 'Xóa dữ liệu: ' + requestId);
}

function deleteUserData(userId) {
  // Simulate data deletion
  localStorage.removeItem('sosmap_user_' + userId);
  localStorage.removeItem('sosmap_incidents_' + userId);
  // In production, this would delete from the database
}

function saveDeletionRequests() {
  localStorage.setItem('sosmap_deletion_requests', JSON.stringify(dataDeletionRequests));
}

function createPrivacyConsent(userId, consentType, consentDetails) {
  var consent = {
    id: 'CONSENT-' + Date.now(),
    userId: userId,
    consentType: consentType,
    consentDetails: consentDetails,
    givenAt: new Date().toISOString(),
    revokedAt: null,
    version: '1.0'
  };

  privacyConsents.push(consent);
  savePrivacyConsents();

  logActivity('privacy_consent', 'Đồng ý bảo mật: ' + consent.id);

  return consent;
}

function revokePrivacyConsent(consentId) {
  var consent = privacyConsents.find(function(c) {
    return c.id === consentId;
  });

  if (!consent) {
    alert('Không tìm thấy đồng ý bảo mật');
    return;
  }

  consent.revokedAt = new Date().toISOString();
  savePrivacyConsents();

  alert('Đã thu hồi đồng ý bảo mật!');
  logActivity('privacy_consent_revoked', 'Thu hồi đồng ý: ' + consentId);
}

function savePrivacyConsents() {
  localStorage.setItem('sosmap_privacy_consents', JSON.stringify(privacyConsents));
}

function reportSecurityIncident(type, description, severity) {
  var incident = {
    id: 'SEC-' + Date.now(),
    type: type,
    description: description,
    severity: severity,
    status: 'open',
    reportedAt: new Date().toISOString(),
    resolvedAt: null,
    resolution: null
  };

  securityIncidents.push(incident);
  saveSecurityIncidents();

  alert('Đã báo cáo sự cố bảo mật! Mã sự cố: ' + incident.id);
  logActivity('security_incident_report', 'Báo cáo sự cố bảo mật: ' + incident.id);

  return incident;
}

function saveSecurityIncidents() {
  localStorage.setItem('sosmap_security_incidents', JSON.stringify(securityIncidents));
}

// Initialize privacy system on page load
document.addEventListener('DOMContentLoaded', function() {
  initializePrivacySystem();
});

// Reporting & Transparency System
var reportingData = {
  incidents: {
    total: 156,
    resolved: 139,
    avgResponseTime: '2.5h',
    byType: {
      traffic: 60,
      infrastructure: 40,
      fire: 25,
      other: 31
    },
    byArea: [
      { area: 'Quận 1', total: 45, resolved: 42, avgTime: '2.1h' },
      { area: 'Quận 3', total: 38, resolved: 35, avgTime: '2.3h' },
      { area: 'Quận 5', total: 32, resolved: 28, avgTime: '2.8h' },
      { area: 'Quận 7', total: 28, resolved: 24, avgTime: '3.0h' },
      { area: 'Quận Bình Thạnh', total: 13, resolved: 10, avgTime: '2.5h' }
    ]
  },
  rescue: {
    totalRescued: 1234,
    activeRescue: 23,
    rescueTeams: 12,
    byType: {
      trapped: 45,
      injured: 35,
      missing: 20,
      medical: 55
    }
  },
  relief: {
    totalNeeds: 89,
    fulfilledNeeds: 67,
    donationAmount: '2.5 tỷ',
    inventory: [
      { location: 'Kho chính HCM', food: '500 kg', water: '2000 L', medicine: '100 hộp', status: 'Bình thường' },
      { location: 'Kho Hà Nội', food: '300 kg', water: '1500 L', medicine: '80 hộp', status: 'Bình thường' },
      { location: 'Điểm tiếp nhận Đà Nẵng', food: '100 kg', water: '500 L', medicine: '30 hộp', status: 'Cảnh báo' }
    ]
  },
  health: {
    totalCases: 234,
    quarantineCount: 89,
    recoveredCount: 145,
    byType: {
      suspected: 35,
      confirmed: 54,
      recovered: 145
    }
  },
  shelters: {
    totalShelters: 12,
    peopleInShelters: 3456,
    arrivedToday: 234,
    data: [
      { name: 'Trạm bơm Nhà Bè', capacity: 500, current: 423, arrived: 45, departed: 12 },
      { name: 'Trường học Q1', capacity: 800, current: 654, arrived: 89, departed: 34 },
      { name: 'Trung tâm văn hóa Q3', capacity: 600, current: 512, arrived: 67, departed: 23 }
    ]
  }
};

function initializeReportingSystem() {
  // Load reporting data from localStorage
  var savedReportingData = localStorage.getItem('sosmap_reporting_data');
  if (savedReportingData) {
    reportingData = JSON.parse(savedReportingData);
  }
}

function updateReportingDashboard() {
  // Update incidents summary
  document.getElementById('totalIncidents').textContent = reportingData.incidents.total;
  document.getElementById('resolvedIncidents').textContent = reportingData.incidents.resolved;
  document.getElementById('avgResponseTime').textContent = reportingData.incidents.avgResponseTime;

  // Update rescue summary
  document.getElementById('totalRescued').textContent = reportingData.rescue.totalRescued.toLocaleString();
  document.getElementById('activeRescue').textContent = reportingData.rescue.activeRescue;
  document.getElementById('rescueTeams').textContent = reportingData.rescue.rescueTeams;

  // Update relief summary
  document.getElementById('totalNeeds').textContent = reportingData.relief.totalNeeds;
  document.getElementById('fulfilledNeeds').textContent = reportingData.relief.fulfilledNeeds;
  document.getElementById('donationAmount').textContent = reportingData.relief.donationAmount;

  // Update health summary
  document.getElementById('totalCases').textContent = reportingData.health.totalCases;
  document.getElementById('quarantineCount').textContent = reportingData.health.quarantineCount;
  document.getElementById('recoveredCount').textContent = reportingData.health.recoveredCount;

  // Update shelters summary
  document.getElementById('totalShelters').textContent = reportingData.shelters.totalShelters;
  document.getElementById('peopleInShelters').textContent = reportingData.shelters.peopleInShelters.toLocaleString();
  document.getElementById('arrivedToday').textContent = reportingData.shelters.arrivedToday;
}

function exportReport(format) {
  var timestamp = new Date().toISOString();
  var filename = 'sosmap_report_' + new Date().getTime();

  if (format === 'csv') {
    exportCSV(filename);
  } else if (format === 'excel') {
    exportExcel(filename);
  } else if (format === 'pdf') {
    exportPDF(filename);
  } else if (format === 'map') {
    exportMap(filename);
  }

  logActivity('report_export', 'Xuất báo cáo: ' + format);
}

function exportCSV(filename) {
  var csvContent = 'data:text/csv;charset=utf-8,';
  csvContent += 'Loại,Số lượng,Đã giải quyết,Thời gian TB\n';
  csvContent += 'Sự cố,' + reportingData.incidents.total + ',' + reportingData.incidents.resolved + ',' + reportingData.incidents.avgResponseTime + '\n';
  csvContent += 'Cứu hộ,' + reportingData.rescue.totalRescued + ',' + reportingData.rescue.activeRescue + ' đang xử lý,-\n';
  csvContent += 'Cứu trợ,' + reportingData.relief.totalNeeds + ',' + reportingData.relief.fulfilledNeeds + ',-\n';
  csvContent += 'Sức khỏe,' + reportingData.health.totalCases + ',' + reportingData.health.recoveredCount + ' hồi phục,-\n';

  var encodedUri = encodeURI(csvContent);
  var link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', filename + '.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  alert('Đã xuất báo cáo CSV!');
}

function exportExcel(filename) {
  // Simulate Excel export
  alert('Đang xuất báo cáo Excel... (Chức năng này yêu cầu thư viện Excel)');
  logActivity('excel_export', 'Xuất Excel: ' + filename);
}

function exportPDF(filename) {
  // Simulate PDF export
  alert('Đang xuất báo cáo PDF... (Chức năng này yêu cầu thư viện PDF)');
  logActivity('pdf_export', 'Xuất PDF: ' + filename);
}

function exportMap(filename) {
  // Simulate map export
  alert('Đang xuất bản đồ báo cáo...');
  logActivity('map_export', 'Xuất bản đồ: ' + filename);
}

function generatePublicIndex() {
  var publicIndex = {
    totalIncidents: reportingData.incidents.total,
    resolvedRate: Math.round((reportingData.incidents.resolved / reportingData.incidents.total) * 100) + '%',
    totalRescued: reportingData.rescue.totalRescued,
    donationAmount: reportingData.relief.donationAmount,
    updatedAt: new Date().toISOString()
  };

  return publicIndex;
}

// Reporting Panel Event Listeners
document.getElementById('reportingDashboardBtn').addEventListener('click', function() {
  document.getElementById('reportingDashboardModal').style.display = 'block';
  updateReportingDashboard();
});

document.getElementById('exportReportBtn').addEventListener('click', function() {
  document.getElementById('reportingDashboardModal').style.display = 'block';
  updateReportingDashboard();
});

document.getElementById('closeReportingDashboardModal').addEventListener('click', function() {
  document.getElementById('reportingDashboardModal').style.display = 'none';
});

document.getElementById('closeReportingDashboardBtn').addEventListener('click', function() {
  document.getElementById('reportingDashboardModal').style.display = 'none';
});

// Tab switching
document.querySelectorAll('.reporting-tab').forEach(function(tab) {
  tab.addEventListener('click', function() {
    // Remove active class from all tabs
    document.querySelectorAll('.reporting-tab').forEach(function(t) {
      t.classList.remove('active');
    });

    // Add active class to clicked tab
    this.classList.add('active');

    // Hide all tab contents
    document.querySelectorAll('.reporting-tab-content').forEach(function(content) {
      content.style.display = 'none';
    });

    // Show selected tab content
    var tabName = this.getAttribute('data-tab');
    document.getElementById(tabName + '-tab').style.display = 'block';
  });
});

// Export buttons
document.getElementById('exportCSVBtn').addEventListener('click', function() {
  exportReport('csv');
});

document.getElementById('exportExcelBtn').addEventListener('click', function() {
  exportReport('excel');
});

document.getElementById('exportPDFBtn').addEventListener('click', function() {
  exportReport('pdf');
});

document.getElementById('exportMapBtn').addEventListener('click', function() {
  exportReport('map');
});

// Initialize reporting system on page load
document.addEventListener('DOMContentLoaded', function() {
  initializeReportingSystem();
});

// Emergency Integrations System
var integrationsData = {
  emergencyCall: {
    enabled: true,
    callsToday: 234,
    avgResponseTime: '15s',
    status: 'active'
  },
  weather: {
    enabled: true,
    lastUpdate: '5 phút trước',
    stations: 45,
    status: 'active'
  },
  rainWater: {
    enabled: true,
    lastUpdate: 'Thời gian thực',
    stations: 89,
    status: 'active'
  },
  camera: {
    enabled: true,
    totalCameras: 156,
    onlineCameras: 148,
    status: 'active'
  },
  healthcare: {
    enabled: true,
    facilities: 67,
    syncMode: 'Tự động',
    status: 'active'
  },
  fireRescue: {
    enabled: true,
    teams: 23,
    syncMode: 'Thời gian thực',
    status: 'active'
  },
  smsEmail: {
    enabled: true,
    smsToday: 1234,
    emailToday: 567,
    status: 'active'
  },
  map: {
    enabled: true,
    source: 'Leaflet OpenStreetMap',
    resolution: 'Cao',
    status: 'active'
  },
  payment: {
    enabled: true,
    transactionsToday: 89,
    totalValue: '45.6 triệu',
    status: 'active'
  },
  iot: {
    enabled: true,
    devices: 234,
    onlineDevices: 228,
    status: 'active'
  }
};

var apiKeys = [
  {
    id: 'api1',
    name: 'Cơ quan Y tế TP.HCM',
    key: 'sk_live_xxxxxxxxxxxxxxxxxxxx',
    rateLimit: 10000,
    usedToday: 2345,
    createdAt: '15/01/2024',
    status: 'active'
  },
  {
    id: 'api2',
    name: 'Công an Quận 1',
    key: 'sk_live_yyyyyyyyyyyyyyyyyyyy',
    rateLimit: 5000,
    usedToday: 1234,
    createdAt: '20/01/2024',
    status: 'active'
  },
  {
    id: 'api3',
    name: 'Tổ chức Y tế Red Cross',
    key: 'sk_live_zzzzzzzzzzzzzzzzzzzz',
    rateLimit: 3000,
    usedToday: 2890,
    createdAt: '10/01/2024',
    status: 'warning'
  },
  {
    id: 'api4',
    name: 'Ứng dụng đối tác A',
    key: 'sk_live_wwwwwwwwwwwwwwwwwwww',
    rateLimit: 2000,
    usedToday: 0,
    createdAt: '10/01/2024',
    revokedAt: '05/02/2024',
    status: 'revoked'
  }
];

function initializeIntegrationsSystem() {
  // Load integrations data from localStorage
  var savedIntegrations = localStorage.getItem('sosmap_integrations');
  if (savedIntegrations) {
    integrationsData = JSON.parse(savedIntegrations);
  }

  // Load API keys from localStorage
  var savedApiKeys = localStorage.getItem('sosmap_api_keys');
  if (savedApiKeys) {
    apiKeys = JSON.parse(savedApiKeys);
  }

  updateIntegrationsStatus();
}

function updateIntegrationsStatus() {
  var statusDiv = document.getElementById('integrationsStatus');
  if (!statusDiv) return;

  var activeIntegrations = Object.keys(integrationsData).filter(function(key) {
    return integrationsData[key].enabled;
  });

  var icons = {
    emergencyCall: '📞',
    weather: '🌤️',
    healthcare: '🏥'
  };

  var names = {
    emergencyCall: 'Tổng đài khẩn cấp',
    weather: 'Khí tượng thủy văn',
    healthcare: 'Cơ sở y tế'
  };

  var html = '';
  activeIntegrations.slice(0, 3).forEach(function(key) {
    html += `
      <div class="integration-item active">
        <span class="integration-icon">${icons[key] || '🔗'}</span>
        <span class="integration-name">${names[key] || key}</span>
        <span class="integration-status">Đang hoạt động</span>
      </div>
    `;
  });

  statusDiv.innerHTML = html;
}

function toggleIntegration(integrationKey) {
  integrationsData[integrationKey].enabled = !integrationsData[integrationKey].enabled;
  saveIntegrationsData();
  updateIntegrationsStatus();

  var status = integrationsData[integrationKey].enabled ? 'kích hoạt' : 'tắt';
  alert('Đã ' + status + ' tích hợp ' + integrationKey);
  logActivity('integration_toggle', 'Toggle tích hợp: ' + integrationKey);
}

function saveIntegrationsData() {
  localStorage.setItem('sosmap_integrations', JSON.stringify(integrationsData));
}

function generateApiKey(organizationName, rateLimit) {
  var newKey = {
    id: 'api' + Date.now(),
    name: organizationName,
    key: 'sk_live_' + generateRandomString(24),
    rateLimit: rateLimit,
    usedToday: 0,
    createdAt: new Date().toLocaleDateString('vi-VN'),
    status: 'active'
  };

  apiKeys.push(newKey);
  saveApiKeys();

  alert('Đã tạo API Key mới! Mã: ' + newKey.key);
  logActivity('api_key_created', 'Tạo API Key: ' + organizationName);

  return newKey;
}

function generateRandomString(length) {
  var chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  var result = '';
  for (var i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function revokeApiKey(apiId) {
  var apiKey = apiKeys.find(function(k) {
    return k.id === apiId;
  });

  if (!apiKey) {
    alert('Không tìm thấy API Key');
    return;
  }

  apiKey.status = 'revoked';
  apiKey.revokedAt = new Date().toLocaleDateString('vi-VN');
  saveApiKeys();

  alert('Đã thu hồi API Key!');
  logActivity('api_key_revoked', 'Thu hồi API Key: ' + apiId);
}

function deleteApiKey(apiId) {
  var index = apiKeys.findIndex(function(k) {
    return k.id === apiId;
  });

  if (index === -1) {
    alert('Không tìm thấy API Key');
    return;
  }

  apiKeys.splice(index, 1);
  saveApiKeys();

  alert('Đã xóa API Key!');
  logActivity('api_key_deleted', 'Xóa API Key: ' + apiId);
}

function saveApiKeys() {
  localStorage.setItem('sosmap_api_keys', JSON.stringify(apiKeys));
}

function checkApiUsage(apiKey) {
  var key = apiKeys.find(function(k) {
    return k.key === apiKey;
  });

  if (!key) {
    return { allowed: false, reason: 'Invalid API key' };
  }

  if (key.status === 'revoked') {
    return { allowed: false, reason: 'API key revoked' };
  }

  if (key.usedToday >= key.rateLimit) {
    return { allowed: false, reason: 'Rate limit exceeded' };
  }

  key.usedToday++;
  saveApiKeys();

  return { allowed: true, remaining: key.rateLimit - key.usedToday };
}

// Integrations Panel Event Listeners
document.getElementById('manageIntegrationsBtn').addEventListener('click', function() {
  document.getElementById('integrationsManagementModal').style.display = 'block';
});

document.getElementById('apiManagementBtn').addEventListener('click', function() {
  document.getElementById('apiManagementModal').style.display = 'block';
});

document.getElementById('closeIntegrationsManagementModal').addEventListener('click', function() {
  document.getElementById('integrationsManagementModal').style.display = 'none';
});

document.getElementById('closeIntegrationsManagementBtn').addEventListener('click', function() {
  document.getElementById('integrationsManagementModal').style.display = 'none';
});

document.getElementById('closeApiManagementModal').addEventListener('click', function() {
  document.getElementById('apiManagementModal').style.display = 'none';
});

document.getElementById('closeApiManagementBtn').addEventListener('click', function() {
  document.getElementById('apiManagementModal').style.display = 'none';
});

document.getElementById('generateApiKeyBtn').addEventListener('click', function() {
  var organizationName = prompt('Nhập tên tổ chức:');
  if (!organizationName) return;

  var rateLimit = prompt('Nhập giới hạn lưu lượng (requests/ngày):', '10000');
  if (!rateLimit) return;

  generateApiKey(organizationName, parseInt(rateLimit));
});

// Toggle switches for integrations
document.querySelectorAll('.toggle-switch input').forEach(function(toggle) {
  toggle.addEventListener('change', function() {
    var card = this.closest('.integration-card');
    var integrationName = card.querySelector('.integration-info h4').textContent;
    var integrationKey = Object.keys(integrationsData).find(function(key) {
      return key.toLowerCase().includes(integrationName.toLowerCase().split(' ')[0].toLowerCase());
    });

    if (integrationKey) {
      toggleIntegration(integrationKey);
    }
  });
});

// Initialize integrations system on page load
document.addEventListener('DOMContentLoaded', function() {
  initializeIntegrationsSystem();
});

// Operations & Quality Management System
var operationsData = {
  currentShift: {
    name: 'Ca Sáng',
    time: '08:00-16:00',
    staff: ['Trần Văn T', 'Lê Thị U'],
    processed: 45,
    pending: 12
  },
  shifts: [
    { day: 'Thứ 2', date: '15/01', morning: ['Nguyễn Văn A', 'Trần Thị B'], afternoon: ['Lê Văn C', 'Phạm Thị D'], night: ['Hoàng Văn E', 'Nguyễn Thị F'] },
    { day: 'Thứ 3', date: '16/01', morning: ['Trần Văn G', 'Lê Thị H'], afternoon: ['Phạm Văn I', 'Nguyễn Thị K'], night: ['Hoàng Văn L', 'Trần Thị M'] },
    { day: 'Thứ 4', date: '17/01', morning: ['Nguyễn Văn N', 'Phạm Thị O'], afternoon: ['Lê Văn P', 'Trần Thị Q'], night: ['Hoàng Văn R', 'Nguyễn Thị S'] },
    { day: 'Thứ 5', date: '18/01', morning: ['Trần Văn T', 'Lê Thị U'], afternoon: ['Phạm Văn V', 'Nguyễn Thị W'], night: ['Hoàng Văn X', 'Trần Thị Y'] }
  ],
  systemStatus: {
    server: { status: 'active', uptime: '99.9%' },
    api: { status: 'active', responseTime: '45ms' },
    database: { status: 'active', queries: '2,345/s' },
    memory: { status: 'warning', usage: '75%' },
    storage: { status: 'active', usage: '45%' },
    alerts: { status: 'active', delay: '2s' }
  },
  requestQueue: {
    waiting: 23,
    processing: 45,
    overdue: 12,
    items: [
      { id: 'REQ-001234', type: 'Cứu hộ khẩn cấp', time: '45 phút', status: 'overdue', priority: 'urgent' },
      { id: 'REQ-001235', type: 'Báo cáo cháy', time: '20 phút', status: 'processing', priority: 'high' },
      { id: 'REQ-001236', type: 'Sự cố hạ tầng', time: '15 phút', status: 'waiting', priority: 'medium' },
      { id: 'REQ-001237', type: 'Phản ánh cộng đồng', time: '10 phút', status: 'waiting', priority: 'low' }
    ]
  },
  alerts: [
    { id: 'alert1', type: 'critical', icon: '🔴', title: 'Yêu cầu quá hạn', message: 'REQ-001234 đã quá hạn 45 phút chưa được phản hồi', time: '5 phút trước' },
    { id: 'alert2', type: 'warning', icon: '🟡', title: 'Bộ nhớ cao', message: 'Sử dụng bộ nhớ đạt 75% dung lượng', time: '10 phút trước' },
    { id: 'alert3', type: 'info', icon: '🔵', title: 'Sao lưu hoàn tất', message: 'Sao lưu dữ liệu hàng ngày đã hoàn tất', time: '1 giờ trước' }
  ],
  logs: [
    { time: '10:45:23', level: 'ERROR', message: 'Database connection timeout' },
    { time: '10:44:15', level: 'WARNING', message: 'High memory usage: 75%' },
    { time: '10:43:00', level: 'INFO', message: 'Backup completed successfully' },
    { time: '10:42:30', level: 'INFO', message: 'New API key created: sk_live_xxx' },
    { time: '10:41:15', level: 'INFO', message: 'User login: admin@example.com' }
  ],
  backupSchedule: {
    lastBackup: new Date().toISOString(),
    nextBackup: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    status: 'completed'
  },
  staff: [
    { id: 'staff1', name: 'Nguyễn Văn A', role: 'Trưởng ca', permissions: ['all'], trained: true },
    { id: 'staff2', name: 'Trần Thị B', role: 'Nhân viên', permissions: ['incident', 'alert'], trained: true },
    { id: 'staff3', name: 'Lê Văn C', role: 'Nhân viên', permissions: ['incident'], trained: false }
  ],
  documents: [
    { id: 'doc1', name: 'Quy trình xử lý sự cố', type: 'procedure', updatedAt: '15/01/2024' },
    { id: 'doc2', name: 'Danh sách liên lạc khẩn cấp', type: 'contact', updatedAt: '10/01/2024' },
    { id: 'doc3', name: 'Hướng dẫn sử dụng hệ thống', type: 'guide', updatedAt: '20/01/2024' }
  ]
};

function initializeOperationsSystem() {
  // Load operations data from localStorage
  var savedOperations = localStorage.getItem('sosmap_operations');
  if (savedOperations) {
    operationsData = JSON.parse(savedOperations);
  }

  updateOperationsStatus();
  startMonitoring();
}

function updateOperationsStatus() {
  var statusDiv = document.getElementById('operationsStatus');
  if (!statusDiv) return;

  statusDiv.innerHTML = `
    <div class="status-item">
      <span class="status-label">Ca trực hiện tại:</span>
      <span class="status-value">${operationsData.currentShift.name} (${operationsData.currentShift.time})</span>
    </div>
    <div class="status-item">
      <span class="status-label">Hàng đợi:</span>
      <span class="status-value">${operationsData.requestQueue.waiting} yêu cầu</span>
    </div>
    <div class="status-item">
      <span class="status-label">Máy chủ:</span>
      <span class="status-value ${operationsData.systemStatus.server.status}">Đang hoạt động</span>
    </div>
  `;
}

function startMonitoring() {
  // Check for overdue requests every minute
  setInterval(function() {
    checkOverdueRequests();
  }, 60000);

  // Check system health every 30 seconds
  setInterval(function() {
    checkSystemHealth();
  }, 30000);

  // Log system status every 5 minutes
  setInterval(function() {
    logSystemStatus();
  }, 300000);
}

function checkOverdueRequests() {
  var overdueCount = operationsData.requestQueue.items.filter(function(item) {
    return item.status === 'overdue';
  }).length;

  if (overdueCount > 0) {
    createAlert('warning', 'Yêu cầu quá hạn', overdueCount + ' yêu cầu đã quá hạn chưa được phản hồi');
  }
}

function checkSystemHealth() {
  // Simulate system health check
  var health = {
    server: operationsData.systemStatus.server.status === 'active',
    api: operationsData.systemStatus.api.status === 'active',
    database: operationsData.systemStatus.database.status === 'active'
  };

  if (!health.server || !health.api || !health.database) {
    createAlert('critical', 'Lỗi hệ thống', 'Một hoặc nhiều dịch vụ không hoạt động');
  }

  // Check memory usage
  if (parseInt(operationsData.systemStatus.memory.usage) > 80) {
    createAlert('warning', 'Bộ nhớ cao', 'Sử dụng bộ nhớ đạt ' + operationsData.systemStatus.memory.usage);
  }
}

function logSystemStatus() {
  var log = {
    time: new Date().toLocaleTimeString('vi-VN'),
    level: 'INFO',
    message: 'System health check: All services operational'
  };

  operationsData.logs.unshift(log);
  if (operationsData.logs.length > 100) {
    operationsData.logs.pop();
  }

  saveOperationsData();
}

function createAlert(type, title, message) {
  var alert = {
    id: 'alert' + Date.now(),
    type: type,
    icon: type === 'critical' ? '🔴' : type === 'warning' ? '🟡' : '🔵',
    title: title,
    message: message,
    time: 'Vừa xong'
  };

  operationsData.alerts.unshift(alert);
  if (operationsData.alerts.length > 50) {
    operationsData.alerts.pop();
  }

  saveOperationsData();

  // Show browser notification if supported
  if (Notification.permission === 'granted') {
    new Notification('SOSMAP Alert: ' + title, {
      body: message,
      icon: '/icon.png'
    });
  }
}

function createShift(day, date, morningStaff, afternoonStaff, nightStaff) {
  var shift = {
    day: day,
    date: date,
    morning: morningStaff,
    afternoon: afternoonStaff,
    night: nightStaff
  };

  operationsData.shifts.push(shift);
  saveOperationsData();

  alert('Đã tạo ca trực cho ' + day + ' ' + date);
  logActivity('shift_created', 'Tạo ca trực: ' + day + ' ' + date);

  return shift;
}

function assignStaffToShift(shiftId, staffId, shiftType) {
  var shift = operationsData.shifts.find(function(s) {
    return s.day === shiftId;
  });

  if (!shift) {
    alert('Không tìm thấy ca trực');
    return;
  }

  var staff = operationsData.staff.find(function(s) {
    return s.id === staffId;
  });

  if (!staff) {
    alert('Không tìm thấy nhân viên');
    return;
  }

  shift[shiftType].push(staff.name);
  saveOperationsData();

  alert('Đã phân công ' + staff.name + ' vào ca ' + shiftType);
  logActivity('staff_assigned', 'Phân công nhân viên: ' + staff.name);
}

function performBackup() {
  operationsData.backupSchedule.lastBackup = new Date().toISOString();
  operationsData.backupSchedule.nextBackup = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  operationsData.backupSchedule.status = 'completed';

  saveOperationsData();

  createAlert('info', 'Sao lưu hoàn tất', 'Sao lưu dữ liệu đã hoàn tất');
  logActivity('backup_completed', 'Sao lưu dữ liệu hoàn tất');
}

function testBackupRecovery() {
  // Simulate backup recovery test
  alert('Đang kiểm tra khôi phục từ bản sao lưu...');
  logActivity('backup_test', 'Kiểm tra khôi phục bản sao lưu');

  setTimeout(function() {
    alert('Kiểm tra khôi phục thành công!');
    createAlert('info', 'Kiểm tra khôi phục', 'Khôi phục từ bản sao lưu thành công');
  }, 2000);
}

function testLoadCapacity() {
  // Simulate load capacity test
  alert('Đang kiểm tra sức chịu tải...');
  logActivity('load_test', 'Kiểm tra sức chịu tải');

  setTimeout(function() {
    alert('Kiểm tra sức chịu tải hoàn tất! Hệ thống có thể xử lý 10,000 requests/phút');
    createAlert('info', 'Kiểm tra tải', 'Sức chịu tải: 10,000 requests/phút');
  }, 3000);
}

function testLegacyDevice() {
  // Simulate legacy device test
  alert('Đang kiểm tra khả năng truy cập trên thiết bị cũ...');
  logActivity('legacy_test', 'Kiểm tra thiết bị cũ');

  setTimeout(function() {
    alert('Kiểm tra hoàn tất! Hệ thống tương thích với iOS 12+, Android 8+');
    createAlert('info', 'Kiểm tra thiết bị cũ', 'Tương thích: iOS 12+, Android 8+');
  }, 2000);
}

function addDocument(name, type) {
  var document = {
    id: 'doc' + Date.now(),
    name: name,
    type: type,
    updatedAt: new Date().toLocaleDateString('vi-VN')
  };

  operationsData.documents.push(document);
  saveOperationsData();

  alert('Đã thêm tài liệu: ' + name);
  logActivity('document_added', 'Thêm tài liệu: ' + name);

  return document;
}

function trainStaff(staffId) {
  var staff = operationsData.staff.find(function(s) {
    return s.id === staffId;
  });

  if (!staff) {
    alert('Không tìm thấy nhân viên');
    return;
  }

  staff.trained = true;
  saveOperationsData();

  alert('Đã đào tạo ' + staff.name);
  logActivity('staff_trained', 'Đào tạo nhân viên: ' + staff.name);
}

function grantPermission(staffId, permission) {
  var staff = operationsData.staff.find(function(s) {
    return s.id === staffId;
  });

  if (!staff) {
    alert('Không tìm thấy nhân viên');
    return;
  }

  if (!staff.permissions.includes(permission)) {
    staff.permissions.push(permission);
    saveOperationsData();

    alert('Đã cấp quyền ' + permission + ' cho ' + staff.name);
    logActivity('permission_granted', 'Cấp quyền: ' + permission + ' cho ' + staff.name);
  }
}

function saveOperationsData() {
  localStorage.setItem('sosmap_operations', JSON.stringify(operationsData));
}

// Operations Panel Event Listeners
document.getElementById('shiftManagementBtn').addEventListener('click', function() {
  document.getElementById('shiftManagementModal').style.display = 'block';
});

document.getElementById('systemMonitoringBtn').addEventListener('click', function() {
  document.getElementById('systemMonitoringModal').style.display = 'block';
});

document.getElementById('closeShiftManagementModal').addEventListener('click', function() {
  document.getElementById('shiftManagementModal').style.display = 'none';
});

document.getElementById('closeShiftManagementBtn').addEventListener('click', function() {
  document.getElementById('shiftManagementModal').style.display = 'none';
});

document.getElementById('closeSystemMonitoringModal').addEventListener('click', function() {
  document.getElementById('systemMonitoringModal').style.display = 'none';
});

document.getElementById('closeSystemMonitoringBtn').addEventListener('click', function() {
  document.getElementById('systemMonitoringModal').style.display = 'none';
});

document.getElementById('createShiftBtn').addEventListener('click', function() {
  var day = prompt('Nhập ngày (Thứ 2, Thứ 3...):');
  if (!day) return;

  var date = prompt('Nhập ngày tháng (DD/MM):');
  if (!date) return;

  createShift(day, date, [], [], []);
});

document.getElementById('assignStaffBtn').addEventListener('click', function() {
  alert('Chức năng phân công nhân viên sẽ được mở rộng trong phiên bản tiếp theo');
});

// Monitoring tab switching
document.querySelectorAll('.monitoring-tab').forEach(function(tab) {
  tab.addEventListener('click', function() {
    document.querySelectorAll('.monitoring-tab').forEach(function(t) {
      t.classList.remove('active');
    });

    this.classList.add('active');

    document.querySelectorAll('.monitoring-tab-content').forEach(function(content) {
      content.style.display = 'none';
    });

    var tabName = this.getAttribute('data-tab');
    document.getElementById(tabName + '-tab').style.display = 'block';
  });
});

// Initialize operations system on page load
document.addEventListener('DOMContentLoaded', function() {
  initializeOperationsSystem();
});

// Multi-Hazard Incidents System
var incidentsData = {
  incidents: [
    {
      id: 'INC-001',
      type: 'storm',
      title: 'Bão số 9 ảnh hưởng miền Trung',
      description: 'Bão số 9 đang di chuyển vào đất liền các tỉnh miền Trung, gió mạnh cấp 12-14',
      severity: 5,
      status: 'active',
      location: { lat: 16.05, lng: 108.20 },
      address: 'Các tỉnh miền Trung',
      source: 'Cơ quan khí tượng thủy văn',
      reliability: 'verified',
      area: 50,
      createdAt: '15/01/2024',
      updatedAt: '15/01/2024',
      relatedReports: ['report1', 'report2'],
      officialConfirmed: true,
      confirmedBy: 'Bộ Tài nguyên và Môi trường',
      confirmedAt: '15/01/2024 10:00'
    },
    {
      id: 'INC-002',
      type: 'flood',
      title: 'Ngập nước tại Quận 7',
      description: 'Mưa lớn gây ngập cục bộ tại một số phường của Quận 7',
      severity: 3,
      status: 'new',
      location: { lat: 10.75, lng: 106.65 },
      address: 'Quận 7, TP.HCM',
      source: 'Người dân',
      reliability: 'unverified',
      area: 5,
      createdAt: '16/01/2024',
      updatedAt: '16/01/2024',
      relatedReports: [],
      officialConfirmed: false
    },
    {
      id: 'INC-003',
      type: 'fire',
      title: 'Cháy nhà kho khu công nghiệp',
      description: 'Cháy nhà kho tại khu công nghiệp, nguyên nhân đang điều tra',
      severity: 4,
      status: 'contained',
      location: { lat: 10.80, lng: 106.70 },
      address: 'Khu công nghiệp, TP.HCM',
      source: 'Cảnh sát PCCC',
      reliability: 'verified',
      area: 2,
      createdAt: '17/01/2024',
      updatedAt: '17/01/2024',
      relatedReports: ['report3'],
      officialConfirmed: true,
      confirmedBy: 'Cảnh sát PCCC TP.HCM',
      confirmedAt: '17/01/2024 14:30'
    },
    {
      id: 'INC-004',
      type: 'disease',
      title: 'Ổ dịch cúm A tại trường học',
      description: 'Phát hiện 15 học sinh mắc cúm A tại trường THCS XYZ',
      severity: 2,
      status: 'resolved',
      location: { lat: 10.78, lng: 106.68 },
      address: 'Quận 3, TP.HCM',
      source: 'Trung tâm y tế',
      reliability: 'verified',
      area: 1,
      createdAt: '10/01/2024',
      updatedAt: '15/01/2024',
      relatedReports: [],
      officialConfirmed: true,
      confirmedBy: 'Trung tâm y tế Quận 3',
      confirmedAt: '10/01/2024 09:00'
    }
  ],
  totalOpen: 23,
  highSeverity: 5,
  level5: 2
};

var incidentTypes = {
  storm: 'Bão, áp thấp nhiệt đới và gió mạnh',
  flood: 'Lũ lụt, lũ quét và nước dâng',
  landslide: 'Sạt lở đất, sạt lở bờ sông và bờ biển',
  earthquake: 'Động đất, sóng thần và rung chấn',
  drought: 'Hạn hán, xâm nhập mặn và thiếu nước',
  extreme_weather: 'Nắng nóng cực đoạn, rét đậm rét hại và lốc xoáy',
  fire: 'Cháy rừng, cháy nhà và nổ',
  accident: 'Tai nạn giao thông và sự cố công trình',
  disease: 'Dịch bệnh, ổ dịch và nguy cơ lây nhiễm',
  pollution: 'Ô nhiễm không khí, nguồn nước và hóa chất độc hại',
  infrastructure: 'Mất điện, mất nước, mất sông và sự cố hạ tầng',
  maritime: 'Sự cố tàu thuyền, hàng hải và khu vực biển đảo',
  security: 'Sự cố an ninh, mất tích và trẻ em gặp nguy hiểm',
  other: 'Sự cố khác'
};

var severityLevels = {
  1: { name: 'Cấp 1 - Thấp', color: '#28a745', class: 'level1' },
  2: { name: 'Cấp 2 - Trung bình', color: '#007bff', class: 'level2' },
  3: { name: 'Cấp 3 - Cao', color: '#ffc107', class: 'level3' },
  4: { name: 'Cấp 4 - Rất cao', color: '#dc3545', class: 'level4' },
  5: { name: 'Cấp 5 - Nghiêm trọng', color: '#000000', class: 'level5' }
};

var statusLabels = {
  new: 'Mới',
  active: 'Đang xử lý',
  contained: 'Tạm kiểm soát',
  resolved: 'Đã giải quyết'
};

function initializeMultiHazardSystem() {
  // Load incidents from localStorage
  var savedIncidents = localStorage.getItem('sosmap_incidents');
  if (savedIncidents) {
    incidentsData.incidents = JSON.parse(savedIncidents);
  }

  updateMultiHazardStatus();
}

function updateMultiHazardStatus() {
  var statusDiv = document.getElementById('multihazardStatus');
  if (!statusDiv) return;

  var openIncidents = incidentsData.incidents.filter(function(inc) {
    return inc.status !== 'resolved';
  }).length;

  var highSeverity = incidentsData.incidents.filter(function(inc) {
    return inc.severity >= 4;
  }).length;

  var level5 = incidentsData.incidents.filter(function(inc) {
    return inc.severity === 5;
  }).length;

  statusDiv.innerHTML = `
    <div class="status-item">
      <span class="status-label">Sự cố mở:</span>
      <span class="status-value">${openIncidents}</span>
    </div>
    <div class="status-item">
      <span class="status-label">Cấp độ cao:</span>
      <span class="status-value warning">${highSeverity}</span>
    </div>
    <div class="status-item">
      <span class="status-label">Cấp 5 (Nghiêm trọng):</span>
      <span class="status-value critical">${level5}</span>
    </div>
  `;
}

function createIncident(data) {
  var incident = {
    id: 'INC-' + String(incidentsData.incidents.length + 1).padStart(3, '0'),
    type: data.type,
    title: data.title,
    description: data.description,
    severity: parseInt(data.severity),
    status: data.status,
    location: data.location,
    address: data.address,
    source: data.source,
    reliability: data.reliability,
    area: parseFloat(data.area) || 0,
    createdAt: new Date().toLocaleDateString('vi-VN'),
    updatedAt: new Date().toLocaleDateString('vi-VN'),
    relatedReports: data.relatedReports || [],
    officialConfirmed: false,
    files: data.files || []
  };

  incidentsData.incidents.unshift(incident);
  saveIncidents();
  updateMultiHazardStatus();

  alert('Đã tạo sự cố! Mã: ' + incident.id);
  logActivity('incident_created', 'Tạo sự cố: ' + incident.id + ' - ' + incident.title);

  return incident;
}

function updateIncident(incidentId, data) {
  var incident = incidentsData.incidents.find(function(inc) {
    return inc.id === incidentId;
  });

  if (!incident) {
    alert('Không tìm thấy sự cố');
    return;
  }

  // Update fields
  if (data.title) incident.title = data.title;
  if (data.description) incident.description = data.description;
  if (data.severity) incident.severity = parseInt(data.severity);
  if (data.status) incident.status = data.status;
  if (data.location) incident.location = data.location;
  if (data.address) incident.address = data.address;
  if (data.reliability) incident.reliability = data.reliability;
  if (data.area !== undefined) incident.area = parseFloat(data.area);

  incident.updatedAt = new Date().toLocaleDateString('vi-VN');

  saveIncidents();
  updateMultiHazardStatus();

  alert('Đã cập nhật sự cố!');
  logActivity('incident_updated', 'Cập nhật sự cố: ' + incidentId);
}

function confirmIncidentOfficial(incidentId, confirmedBy) {
  var incident = incidentsData.incidents.find(function(inc) {
    return inc.id === incidentId;
  });

  if (!incident) {
    alert('Không tìm thấy sự cố');
    return;
  }

  incident.officialConfirmed = true;
  incident.confirmedBy = confirmedBy;
  incident.confirmedAt = new Date().toLocaleString('vi-VN');
  incident.reliability = 'verified';

  saveIncidents();

  alert('Đã xác nhận chính thức sự cố!');
  logActivity('incident_confirmed', 'Xác nhận chính thức: ' + incidentId + ' bởi ' + confirmedBy);
}

function linkReportToIncident(incidentId, reportId) {
  var incident = incidentsData.incidents.find(function(inc) {
    return inc.id === incidentId;
  });

  if (!incident) {
    alert('Không tìm thấy sự cố');
    return;
  }

  if (!incident.relatedReports.includes(reportId)) {
    incident.relatedReports.push(reportId);
    saveIncidents();

    alert('Đã liên kết phản ánh với sự cố!');
    logActivity('report_linked', 'Liên kết phản ánh ' + reportId + ' với sự cố ' + incidentId);
  }
}

function saveIncidents() {
  localStorage.setItem('sosmap_incidents', JSON.stringify(incidentsData.incidents));
}

function renderIncidentsTable(filterType, filterSeverity, filterStatus) {
  var tbody = document.querySelector('.incidents-table tbody');
  if (!tbody) return;

  var filtered = incidentsData.incidents.filter(function(inc) {
    if (filterType !== 'all' && inc.type !== filterType) return false;
    if (filterSeverity !== 'all' && inc.severity !== parseInt(filterSeverity)) return false;
    if (filterStatus !== 'all' && inc.status !== filterStatus) return false;
    return true;
  });

  tbody.innerHTML = filtered.map(function(inc) {
    var severity = severityLevels[inc.severity];
    var statusClass = inc.status;

    return `
      <tr>
        <td>${inc.id}</td>
        <td>${incidentTypes[inc.type].split(',')[0]}</td>
        <td>${inc.title}</td>
        <td><span class="severity-badge ${severity.class}">${severity.name}</span></td>
        <td><span class="status-badge ${statusClass}">${statusLabels[inc.status]}</span></td>
        <td>${inc.createdAt}</td>
        <td>
          <button class="btn btn-secondary" style="font-size: 11px;" onclick="viewIncidentDetail('${inc.id}')">Xem</button>
          <button class="btn btn-secondary" style="font-size: 11px;" onclick="editIncident('${inc.id}')">Sửa</button>
        </td>
      </tr>
    `;
  }).join('');
}

function viewIncidentDetail(incidentId) {
  var incident = incidentsData.incidents.find(function(inc) {
    return inc.id === incidentId;
  });

  if (!incident) {
    alert('Không tìm thấy sự cố');
    return;
  }

  alert('Chi tiết sự cố:\n\n' +
    'Mã: ' + incident.id + '\n' +
    'Loại: ' + incidentTypes[incident.type] + '\n' +
    'Tiêu đề: ' + incident.title + '\n' +
    'Mô tả: ' + incident.description + '\n' +
    'Cấp độ: ' + severityLevels[incident.severity].name + '\n' +
    'Trạng thái: ' + statusLabels[incident.status] + '\n' +
    'Địa chỉ: ' + incident.address + '\n' +
    'Nguồn tin: ' + incident.source + '\n' +
    'Độ tin cậy: ' + incident.reliability + '\n' +
    'Vùng ảnh hưởng: ' + incident.area + ' km\n' +
    'Ngày tạo: ' + incident.createdAt + '\n' +
    'Đã xác nhận chính thức: ' + (incident.officialConfirmed ? 'Có' : 'Không'));
}

function editIncident(incidentId) {
  alert('Chức năng sửa sự cố sẽ được mở rộng trong phiên bản tiếp theo');
  logActivity('incident_edit_attempt', 'Thử sửa sự cố: ' + incidentId);
}

function generateHeatMap(type, timeRange) {
  // Simulate heat map generation
  var container = document.getElementById('heatMapContainer');
  if (!container) return;

  container.innerHTML = `
    <div class="heat-map-placeholder">
      <p style="color: #666;">Đang tạo bản đồ nhiệt...</p>
      <p style="color: #999; font-size: 12px;">Loại: ${type === 'all' ? 'Tất cả' : incidentTypes[type].split(',')[0]}</p>
      <p style="color: #999; font-size: 12px;">Thời gian: ${timeRange}</p>
    </div>
  `;

  setTimeout(function() {
    container.innerHTML = `
      <div class="heat-map-placeholder">
        <p style="color: #666;">Bản đồ nhiệt sẽ hiển thị tại đây</p>
        <p style="color: #999; font-size: 12px;">Yêu cầu thư viện heatmap để hiển thị bản đồ nhiệt thực tế</p>
        <p style="color: #28a745; font-size: 12px;">✓ Đã tạo bản đồ nhiệt cho ${incidentsData.incidents.length} sự cố</p>
      </div>
    `;
  }, 1000);

  logActivity('heatmap_generated', 'Tạo bản đồ nhiệt: ' + type + ' - ' + timeRange);
}

// Multi-Hazard Panel Event Listeners
document.getElementById('createIncidentBtn').addEventListener('click', function() {
  document.getElementById('createIncidentModal').style.display = 'block';
});

document.getElementById('viewIncidentsBtn').addEventListener('click', function() {
  document.getElementById('viewIncidentsModal').style.display = 'block';
  renderIncidentsTable('all', 'all', 'all');
});

document.getElementById('heatMapBtn').addEventListener('click', function() {
  document.getElementById('heatMapModal').style.display = 'block';
  generateHeatMap('all', 'today');
});

document.getElementById('closeCreateIncidentModal').addEventListener('click', function() {
  document.getElementById('createIncidentModal').style.display = 'none';
});

document.getElementById('closeCreateIncidentBtn').addEventListener('click', function() {
  document.getElementById('createIncidentModal').style.display = 'none';
});

document.getElementById('closeViewIncidentsModal').addEventListener('click', function() {
  document.getElementById('viewIncidentsModal').style.display = 'none';
});

document.getElementById('closeViewIncidentsBtn').addEventListener('click', function() {
  document.getElementById('viewIncidentsModal').style.display = 'none';
});

document.getElementById('closeHeatMapModal').addEventListener('click', function() {
  document.getElementById('heatMapModal').style.display = 'none';
});

document.getElementById('closeHeatMapBtn').addEventListener('click', function() {
  document.getElementById('heatMapModal').style.display = 'none';
});

document.getElementById('saveIncidentBtn').addEventListener('click', function() {
  var type = document.getElementById('incidentType').value;
  var title = document.getElementById('incidentTitle').value;
  var description = document.getElementById('incidentDescription').value;
  var severity = document.getElementById('incidentSeverity').value;
  var status = document.getElementById('incidentStatus').value;
  var location = document.getElementById('incidentLocation').value;
  var source = document.getElementById('incidentSource').value;
  var reliability = document.getElementById('incidentReliability').value;
  var area = document.getElementById('incidentArea').value;

  if (!type || !title || !description || !severity || !status || !location) {
    alert('Vui lòng điền các trường bắt buộc (*)');
    return;
  }

  createIncident({
    type: type,
    title: title,
    description: description,
    severity: severity,
    status: status,
    location: { lat: 10.77, lng: 106.69 }, // Default location
    address: location,
    source: source,
    reliability: reliability,
    area: area
  });

  document.getElementById('createIncidentModal').style.display = 'none';

  // Reset form
  document.getElementById('incidentType').value = '';
  document.getElementById('incidentTitle').value = '';
  document.getElementById('incidentDescription').value = '';
  document.getElementById('incidentSeverity').value = '1';
  document.getElementById('incidentStatus').value = 'new';
  document.getElementById('incidentLocation').value = '';
  document.getElementById('incidentSource').value = '';
  document.getElementById('incidentReliability').value = 'unverified';
  document.getElementById('incidentArea').value = '';
});

document.getElementById('selectLocationBtn').addEventListener('click', function() {
  // Simulate location selection
  var lat = 10.77 + (Math.random() - 0.5) * 0.1;
  var lng = 106.69 + (Math.random() - 0.5) * 0.1;

  document.getElementById('coordinatesDisplay').style.display = 'block';
  document.getElementById('coordinatesValue').textContent = lat.toFixed(6) + ', ' + lng.toFixed(6);

  logActivity('location_selected', 'Chọn vị trí: ' + lat.toFixed(6) + ', ' + lng.toFixed(6));
});

// Filter event listeners
document.getElementById('filterIncidentType').addEventListener('change', function() {
  var type = this.value;
  var severity = document.getElementById('filterSeverity').value;
  var status = document.getElementById('filterStatus').value;
  renderIncidentsTable(type, severity, status);
});

document.getElementById('filterSeverity').addEventListener('change', function() {
  var type = document.getElementById('filterIncidentType').value;
  var severity = this.value;
  var status = document.getElementById('filterStatus').value;
  renderIncidentsTable(type, severity, status);
});

document.getElementById('filterStatus').addEventListener('change', function() {
  var type = document.getElementById('filterIncidentType').value;
  var severity = document.getElementById('filterSeverity').value;
  var status = this.value;
  renderIncidentsTable(type, severity, status);
});

// Heat map event listeners
document.getElementById('heatMapType').addEventListener('change', function() {
  var type = this.value;
  var time = document.getElementById('heatMapTime').value;
  generateHeatMap(type, time);
});

document.getElementById('heatMapTime').addEventListener('change', function() {
  var type = document.getElementById('heatMapType').value;
  var time = this.value;
  generateHeatMap(type, time);
});

// Initialize multi-hazard system on page load
document.addEventListener('DOMContentLoaded', function() {
  initializeMultiHazardSystem();
});

// Flood & Evacuation System
var floodData = {
  waterLevel: 2.5,
  waterStatus: 'Cảnh báo',
  shelters: [
    {
      id: 'shelter1',
      name: 'Trạm bơm Nhà Bè',
      location: 'Quận Nhà Bè, TP.HCM',
      capacity: 500,
      current: 423,
      amenities: ['water', 'electricity', 'medical', 'toilet'],
      lat: 10.75,
      lng: 106.65
    },
    {
      id: 'shelter2',
      name: 'Trường học Q1',
      location: 'Quận 1, TP.HCM',
      capacity: 800,
      current: 800,
      amenities: ['water', 'electricity', 'medical', 'toilet'],
      lat: 10.78,
      lng: 106.68
    },
    {
      id: 'shelter3',
      name: 'Trung tâm văn hóa Q3',
      location: 'Quận 3, TP.HCM',
      capacity: 600,
      current: 390,
      amenities: ['water', 'electricity', 'medical'],
      lat: 10.77,
      lng: 106.69
    }
  ],
  stations: [
    { id: 'station1', name: 'Trạm Nhà Bè', level: 2.5, status: 'warning' },
    { id: 'station2', name: 'Trạm Bình Chánh', level: 3.8, status: 'danger' },
    { id: 'station3', name: 'Trạm Củ Chi', level: 1.2, status: 'safe' },
    { id: 'station4', name: 'Trạm Long An', level: 4.5, status: 'critical' }
  ],
  routes: [
    {
      id: 'route1',
      name: 'Tuyến sơ tán A - Khu dân cư Nhà Bè',
      start: 'Khu dân cư Nhà Bè',
      end: 'Trạm bơm Nhà Bè',
      type: 'avoid_flood',
      transport: 'walking + rescue_vehicle',
      status: 'active'
    },
    {
      id: 'route2',
      name: 'Tuyến sơ tán B - Khu dân cư Bình Chánh',
      start: 'Khu dân cư Bình Chánh',
      end: 'Trường học Bình Chánh',
      type: 'avoid_landslide',
      transport: 'rescue_vehicle',
      status: 'blocked'
    }
  ],
  blockedRoads: [
    { name: 'Đường Nguyễn Văn Linh - đoạn qua Bình Chánh', reason: 'Ngập nước 1.5m', time: '2 giờ trước' },
    { name: 'Đường Hà Nội - đoạn qua Củ Chi', reason: 'Sạt lở đất', time: '5 giờ trước' }
  ],
  evacuees: [
    {
      id: 'evacuee1',
      familyName: 'Hộ gia đình Nguyễn Văn A',
      address: '123 Đường ABC, Quận Nhà Bè',
      people: 5,
      vulnerable: { children: 2, elderly: 1, disabled: 0, pregnant: 0 },
      status: 'evacuating',
      shelter: null
    },
    {
      id: 'evacuee2',
      familyName: 'Hộ gia đình Trần Thị B',
      address: '456 Đường XYZ, Quận Bình Chánh',
      people: 3,
      vulnerable: { children: 0, elderly: 0, disabled: 1, pregnant: 0 },
      status: 'pending',
      shelter: null
    },
    {
      id: 'evacuee3',
      familyName: 'Hộ gia đình Lê Văn C',
      address: '789 Đường DEF, Quận 3',
      people: 4,
      vulnerable: { children: 0, elderly: 0, disabled: 0, pregnant: 1 },
      status: 'arrived',
      shelter: 'shelter3'
    }
  ],
  totalEvacuated: 3456
};

function initializeFloodSystem() {
  // Load flood data from localStorage
  var savedFloodData = localStorage.getItem('sosmap_flood');
  if (savedFloodData) {
    floodData = JSON.parse(savedFloodData);
  }

  updateFloodStatus();
}

function updateFloodStatus() {
  var statusDiv = document.getElementById('floodStatus');
  if (!statusDiv) return;

  statusDiv.innerHTML = `
    <div class="status-item">
      <span class="status-label">Mực nước:</span>
      <span class="status-value">${floodData.waterLevel}m (${floodData.waterStatus})</span>
    </div>
    <div class="status-item">
      <span class="status-label">Điểm trú an:</span>
      <span class="status-value">${floodData.shelters.length} điểm</span>
    </div>
    <div class="status-item">
      <span class="status-label">Người sơ tán:</span>
      <span class="status-value">${floodData.totalEvacuated.toLocaleString()}</span>
    </div>
  `;
}

function updateWaterLevel(level) {
  floodData.waterLevel = parseFloat(level);

  if (level < 2) {
    floodData.waterStatus = 'An toàn';
  } else if (level < 3) {
    floodData.waterStatus = 'Cảnh báo';
  } else if (level < 4) {
    floodData.waterStatus = 'Nguy hiểm';
  } else {
    floodData.waterStatus = 'Rất nguy hiểm';
  }

  saveFloodData();
  updateFloodStatus();

  logActivity('water_level_updated', 'Cập nhật mực nước: ' + level + 'm');
}

function addShelter(data) {
  var shelter = {
    id: 'shelter' + Date.now(),
    name: data.name,
    location: data.location,
    capacity: parseInt(data.capacity),
    current: 0,
    amenities: data.amenities,
    lat: data.lat,
    lng: data.lng
  };

  floodData.shelters.push(shelter);
  saveFloodData();

  alert('Đã thêm điểm trú an!');
  logActivity('shelter_added', 'Thêm điểm trú an: ' + data.name);

  return shelter;
}

function updateShelterCapacity(shelterId, change) {
  var shelter = floodData.shelters.find(function(s) {
    return s.id === shelterId;
  });

  if (!shelter) {
    alert('Không tìm thấy điểm trú an');
    return;
  }

  shelter.current += change;
  if (shelter.current < 0) shelter.current = 0;
  if (shelter.current > shelter.capacity) shelter.current = shelter.capacity;

  saveFloodData();

  logActivity('shelter_capacity_updated', 'Cập nhật sức chỗ: ' + shelter.name);
}

function addRoute(data) {
  var route = {
    id: 'route' + Date.now(),
    name: data.name,
    start: data.start,
    end: data.end,
    type: data.type,
    transport: data.transport,
    status: 'active'
  };

  floodData.routes.push(route);
  saveFloodData();

  alert('Đã thêm tuyến sơ tán!');
  logActivity('route_added', 'Thêm tuyến sơ tán: ' + data.name);

  return route;
}

function blockRoute(routeId, reason) {
  var route = floodData.routes.find(function(r) {
    return r.id === routeId;
  });

  if (!route) {
    alert('Không tìm thấy tuyến sơ tán');
    return;
  }

  route.status = 'blocked';

  floodData.blockedRoads.push({
    name: route.name,
    reason: reason,
    time: 'Vừa xong'
  });

  saveFloodData();

  alert('Đã chặn tuyến sơ tán!');
  logActivity('route_blocked', 'Chặn tuyến: ' + route.name);
}

function addEvacuee(data) {
  var evacuee = {
    id: 'evacuee' + Date.now(),
    familyName: data.familyName,
    address: data.address,
    people: parseInt(data.people),
    vulnerable: data.vulnerable,
    status: 'pending',
    shelter: null
  };

  floodData.evacuees.push(evacuee);
  saveFloodData();

  alert('Đã thêm người sơ tán!');
  logActivity('evacuee_added', 'Thêm người sơ tán: ' + data.familyName);

  return evacuee;
}

function confirmEvacueeArrival(evacueeId, shelterId) {
  var evacuee = floodData.evacuees.find(function(e) {
    return e.id === evacueeId;
  });

  if (!evacuee) {
    alert('Không tìm thấy người sơ tán');
    return;
  }

  var shelter = floodData.shelters.find(function(s) {
    return s.id === shelterId;
  });

  if (!shelter) {
    alert('Không tìm thấy điểm trú an');
    return;
  }

  if (shelter.current >= shelter.capacity) {
    alert('Điểm trú an đã đầy!');
    return;
  }

  evacuee.status = 'arrived';
  evacuee.shelter = shelterId;
  shelter.current++;

  floodData.totalEvacuated++;
  saveFloodData();
  updateFloodStatus();

  alert('Đã xác nhận đến nơi!');
  logActivity('evacuee_arrived', 'Xác nhận đến nơi: ' + evacuee.familyName);
}

function requestPickup(evacueeId) {
  var evacuee = floodData.evacuees.find(function(e) {
    return e.id === evacueeId;
  });

  if (!evacuee) {
    alert('Không tìm thấy người sơ tán');
    return;
  }

  alert('Đã đăng ký yêu cầu đón don cho: ' + evacuee.familyName);
  logActivity('pickup_requested', 'Đăng ký đón don: ' + evacuee.familyName);
}

function saveFloodData() {
  localStorage.setItem('sosmap_flood', JSON.stringify(floodData));
}

// Flood Panel Event Listeners
document.getElementById('floodMapBtn').addEventListener('click', function() {
  document.getElementById('floodMapModal').style.display = 'block';
});

document.getElementById('evacuationPlanBtn').addEventListener('click', function() {
  document.getElementById('evacuationPlanModal').style.display = 'block';
});

document.getElementById('closeFloodMapModal').addEventListener('click', function() {
  document.getElementById('floodMapModal').style.display = 'none';
});

document.getElementById('closeFloodMapBtn').addEventListener('click', function() {
  document.getElementById('floodMapModal').style.display = 'none';
});

document.getElementById('closeEvacuationPlanModal').addEventListener('click', function() {
  document.getElementById('evacuationPlanModal').style.display = 'none';
});

document.getElementById('closeEvacuationPlanBtn').addEventListener('click', function() {
  document.getElementById('evacuationPlanModal').style.display = 'none';
});

// Flood map controls
document.getElementById('floodWaterLevel').addEventListener('change', function() {
  updateWaterLevel(this.value);
});

// Evacuation tab switching
document.querySelectorAll('.evacuation-tab').forEach(function(tab) {
  tab.addEventListener('click', function() {
    document.querySelectorAll('.evacuation-tab').forEach(function(t) {
      t.classList.remove('active');
    });

    this.classList.add('active');

    document.querySelectorAll('.evacuation-tab-content').forEach(function(content) {
      content.style.display = 'none';
    });

    var tabName = this.getAttribute('data-tab');
    document.getElementById(tabName + '-tab').style.display = 'block';
  });
});

// Evacuation action buttons
document.getElementById('addShelterBtn').addEventListener('click', function() {
  var name = prompt('Nhập tên điểm trú an:');
  if (!name) return;

  var location = prompt('Nhập địa chỉ:');
  if (!location) return;

  var capacity = prompt('Nhập sức chứa:');
  if (!capacity) return;

  addShelter({
    name: name,
    location: location,
    capacity: capacity,
    amenities: ['water', 'electricity'],
    lat: 10.77,
    lng: 106.69
  });
});

document.getElementById('addRouteBtn').addEventListener('click', function() {
  alert('Chức năng thêm tuyến sơ tán sẽ được mở rộng trong phiên bản tiếp theo');
});

document.getElementById('addEvacueeBtn').addEventListener('click', function() {
  var familyName = prompt('Nhập tên hộ gia đình:');
  if (!familyName) return;

  var address = prompt('Nhập địa chỉ:');
  if (!address) return;

  var people = prompt('Nhập số người:');
  if (!people) return;

  addEvacuee({
    familyName: familyName,
    address: address,
    people: people,
    vulnerable: { children: 0, elderly: 0, disabled: 0, pregnant: 0 }
  });
});

document.getElementById('confirmArrivalBtn').addEventListener('click', function() {
  alert('Chọn người sơ tán từ danh sách để xác nhận đến nơi');
});

document.getElementById('pickupRequestBtn').addEventListener('click', function() {
  alert('Chọn người sơ tán từ danh sách để đăng ký đón don');
});

// Initialize flood system on page load
document.addEventListener('DOMContentLoaded', function() {
  initializeFloodSystem();
});

// Security & Performance System
var securitySettings = {
  passwordEncryption: true,
  rateLimit: 5,
  fileSizeLimit: 10,
  apiAuth: true,
  hidePersonalInfo: true,
  backupInterval: 24,
  inputSanitization: true
};

var performanceData = {
  apiResponseTime: 45,
  cacheHitRate: 85,
  memoryUsage: 45,
  cpuUsage: 65,
  storageUsage: 55,
  networkUsage: 78,
  apiMetrics: [
    { endpoint: '/api/incidents', requests: 2345, avgResponse: 42, successRate: 99.8, status: 'ok' },
    { endpoint: '/api/alerts', requests: 1234, avgResponse: 38, successRate: 99.5, status: 'ok' },
    { endpoint: '/api/locations', requests: 567, avgResponse: 55, successRate: 98.9, status: 'slow' },
    { endpoint: '/api/users', requests: 890, avgResponse: 45, successRate: 99.7, status: 'ok' }
  ],
  cacheData: [
    { name: 'Map Data', size: 125, hits: 85 },
    { name: 'Incident Data', size: 45, hits: 78 },
    { name: 'User Data', size: 23, hits: 92 },
    { name: 'Configuration', size: 5, hits: 98 }
  ],
  errorLogs: [
    { time: '10:45:23', type: 'Server', message: 'Database connection timeout', count: 3 },
    { time: '10:44:15', type: 'Network', message: 'API request timeout (5000ms)', count: 5 },
    { time: '10:43:00', type: 'Client', message: 'Validation error on form input', count: 12 },
    { time: '10:42:30', type: 'Server', message: 'High memory usage warning', count: 1 }
  ]
};

var rateLimitTracker = {};
var cacheStore = {};

function initializeSecuritySystem() {
  // Load security settings from localStorage
  var savedSettings = localStorage.getItem('sosmap_security_settings');
  if (savedSettings) {
    securitySettings = JSON.parse(savedSettings);
  }

  // Load performance data from localStorage
  var savedPerformance = localStorage.getItem('sosmap_performance_data');
  if (savedPerformance) {
    performanceData = JSON.parse(savedPerformance);
  }

  // Initialize cache
  initializeCache();

  // Start performance monitoring
  startPerformanceMonitoring();

  updateSecurityStatus();
}

function updateSecurityStatus() {
  var statusDiv = document.getElementById('securityStatus');
  if (!statusDiv) return;

  statusDiv.innerHTML = `
    <div class="status-item">
      <span class="status-label">Trạng thái bảo mật:</span>
      <span class="status-value ${securitySettings.apiAuth ? 'success' : 'warning'}">${securitySettings.apiAuth ? 'Đang hoạt động' : 'Tắt'}</span>
    </div>
    <div class="status-item">
      <span class="status-label">API Response:</span>
      <span class="status-value">${performanceData.apiResponseTime}ms</span>
    </div>
    <div class="status-item">
      <span class="status-label">Cache hit rate:</span>
      <span class="status-value">${performanceData.cacheHitRate}%</span>
    </div>
  `;
}

// Security Functions
function encryptPassword(password) {
  if (!securitySettings.passwordEncryption) {
    return password;
  }

  // Simulate SHA-256 encryption (in production, use actual crypto library)
  var hash = 0;
  for (var i = 0; i < password.length; i++) {
    var char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }

  return 'sha256_' + Math.abs(hash).toString(16);
}

function sanitizeInput(input) {
  if (!securitySettings.inputSanitization) {
    return input;
  }

  // Remove potentially dangerous characters
  var sanitized = input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();

  return sanitized;
}

function checkRateLimit(userId) {
  var now = Date.now();
  var userLimit = rateLimitTracker[userId];

  if (!userLimit) {
    rateLimitTracker[userId] = { count: 1, resetTime: now + 60000 };
    return true;
  }

  if (now > userLimit.resetTime) {
    rateLimitTracker[userId] = { count: 1, resetTime: now + 60000 };
    return true;
  }

  if (userLimit.count >= securitySettings.rateLimit) {
    return false;
  }

  userLimit.count++;
  return true;
}

function checkFileSize(fileSize) {
  var maxSizeMB = securitySettings.fileSizeLimit;
  var maxSizeBytes = maxSizeMB * 1024 * 1024;

  return fileSize <= maxSizeBytes;
}

function authenticateApi(apiKey) {
  if (!securitySettings.apiAuth) {
    return true;
  }

  // Simulate API key validation
  var validKeys = ['sk_live_xxx', 'sk_live_yyy', 'sk_live_zzz'];
  return validKeys.includes(apiKey);
}

function hidePersonalInfo(data, userRole) {
  if (!securitySettings.hidePersonalInfo) {
    return data;
  }

  // Hide personal info for non-authorized users
  if (userRole !== 'admin' && userRole !== 'staff') {
    if (data.phone) {
      data.phone = data.phone.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2');
    }
    if (data.email) {
      var parts = data.email.split('@');
      data.email = parts[0].substring(0, 3) + '***@' + parts[1];
    }
    if (data.address) {
      data.address = '***'; // Hide address
    }
  }

  return data;
}

function createBackup() {
  var backup = {
    timestamp: new Date().toISOString(),
    version: '1.0',
    data: {
      incidents: localStorage.getItem('sosmap_incidents'),
      flood: localStorage.getItem('sosmap_flood'),
      operations: localStorage.getItem('sosmap_operations'),
      privacy: localStorage.getItem('sosmap_privacy_consents')
    }
  };

  localStorage.setItem('sosmap_backup_' + Date.now(), JSON.stringify(backup));

  alert('Đã tạo bản sao lưu!');
  logActivity('backup_created', 'Tạo bản sao lưu');
}

function restoreBackup(backupId) {
  var backup = localStorage.getItem('sosmap_backup_' + backupId);

  if (!backup) {
    alert('Không tìm thấy bản sao lưu');
    return;
  }

  var backupData = JSON.parse(backup);

  if (backupData.data.incidents) {
    localStorage.setItem('sosmap_incidents', backupData.data.incidents);
  }
  if (backupData.data.flood) {
    localStorage.setItem('sosmap_flood', backupData.data.flood);
  }
  if (backupData.data.operations) {
    localStorage.setItem('sosmap_operations', backupData.data.operations);
  }
  if (backupData.data.privacy) {
    localStorage.setItem('sosmap_privacy_consents', backupData.data.privacy);
  }

  alert('Đã khôi phục từ bản sao lưu!');
  logActivity('backup_restored', 'Khôi phục bản sao lưu: ' + backupId);
}

// Performance Functions
function initializeCache() {
  var savedCache = localStorage.getItem('sosmap_cache');
  if (savedCache) {
    cacheStore = JSON.parse(savedCache);
  }
}

function getCache(key) {
  var item = cacheStore[key];
  if (!item) {
    return null;
  }

  if (Date.now() > item.expiry) {
    delete cacheStore[key];
    saveCache();
    return null;
  }

  return item.data;
}

function setCache(key, data, ttl) {
  var ttl = ttl || 3600000; // Default 1 hour
  cacheStore[key] = {
    data: data,
    expiry: Date.now() + ttl
  };
  saveCache();
}

function clearCache() {
  cacheStore = {};
  saveCache();

  alert('Đã xóa cache!');
  logActivity('cache_cleared', 'Xóa cache');
}

function warmCache() {
  // Simulate cache warming
  setCache('map_data', { tiles: [], markers: [] }, 3600000);
  setCache('incident_data', { incidents: [] }, 3600000);
  setCache('user_data', { users: [] }, 3600000);
  setCache('config', { settings: {} }, 86400000);

  alert('Đã warm cache!');
  logActivity('cache_warmed', 'Warm cache');
}

function saveCache() {
  localStorage.setItem('sosmap_cache', JSON.stringify(cacheStore));
}

function trackApiResponse(endpoint, responseTime, success) {
  var metric = performanceData.apiMetrics.find(function(m) {
    return m.endpoint === endpoint;
  });

  if (metric) {
    metric.requests++;
    metric.avgResponse = Math.round((metric.avgResponse + responseTime) / 2);
    if (!success) {
      metric.successRate = Math.max(0, metric.successRate - 0.1);
    }
  }

  savePerformanceData();
}

function logError(type, message) {
  var error = {
    time: new Date().toLocaleTimeString('vi-VN'),
    type: type,
    message: message,
    count: 1
  };

  // Check if similar error exists
  var existingError = performanceData.errorLogs.find(function(e) {
    return e.type === type && e.message === message;
  });

  if (existingError) {
    existingError.count++;
  } else {
    performanceData.errorLogs.unshift(error);
  }

  if (performanceData.errorLogs.length > 50) {
    performanceData.errorLogs.pop();
  }

  savePerformanceData();
}

function startPerformanceMonitoring() {
  // Update performance metrics every 30 seconds
  setInterval(function() {
    // Simulate performance changes
    performanceData.apiResponseTime = 40 + Math.floor(Math.random() * 20);
    performanceData.cacheHitRate = 80 + Math.floor(Math.random() * 15);
    performanceData.memoryUsage = 40 + Math.floor(Math.random() * 20);
    performanceData.cpuUsage = 60 + Math.floor(Math.random() * 20);

    updateSecurityStatus();
    savePerformanceData();
  }, 30000);
}

function savePerformanceData() {
  localStorage.setItem('sosmap_performance_data', JSON.stringify(performanceData));
}

function saveSecuritySettings() {
  localStorage.setItem('sosmap_security_settings', JSON.stringify(securitySettings));
}

// Security Panel Event Listeners
document.getElementById('securitySettingsBtn').addEventListener('click', function() {
  document.getElementById('securitySettingsModal').style.display = 'block';
});

document.getElementById('performanceMonitorBtn').addEventListener('click', function() {
  document.getElementById('performanceMonitorModal').style.display = 'block';
});

document.getElementById('closeSecuritySettingsModal').addEventListener('click', function() {
  document.getElementById('securitySettingsModal').style.display = 'none';
});

document.getElementById('closeSecuritySettingsBtn').addEventListener('click', function() {
  document.getElementById('securitySettingsModal').style.display = 'none';
});

document.getElementById('closePerformanceMonitorModal').addEventListener('click', function() {
  document.getElementById('performanceMonitorModal').style.display = 'none';
});

document.getElementById('saveSecuritySettingsBtn').addEventListener('click', function() {
  securitySettings.passwordEncryption = document.getElementById('enablePasswordEncryption').checked;
  securitySettings.rateLimit = parseInt(document.getElementById('rateLimitInput').value);
  securitySettings.fileSizeLimit = parseInt(document.getElementById('fileSizeLimitInput').value);
  securitySettings.apiAuth = document.getElementById('enableApiAuth').checked;
  securitySettings.hidePersonalInfo = document.getElementById('hidePersonalInfo').checked;
  securitySettings.backupInterval = parseInt(document.getElementById('backupIntervalInput').value);
  securitySettings.inputSanitization = document.getElementById('enableInputSanitization').checked;

  saveSecuritySettings();
  updateSecurityStatus();

  alert('Đã lưu cài đặt bảo mật!');
  logActivity('security_settings_saved', 'Lưu cài đặt bảo mật');
});

document.getElementById('manualBackupBtn').addEventListener('click', function() {
  createBackup();
});

document.getElementById('restoreBackupBtn').addEventListener('click', function() {
  var backupId = prompt('Nhập ID bản sao lưu (ví dụ: 1234567890):');
  if (backupId) {
    restoreBackup(backupId);
  }
});

// Performance tab switching
document.querySelectorAll('.performance-tab').forEach(function(tab) {
  tab.addEventListener('click', function() {
    document.querySelectorAll('.performance-tab').forEach(function(t) {
      t.classList.remove('active');
    });

    this.classList.add('active');

    document.querySelectorAll('.performance-tab-content').forEach(function(content) {
      content.style.display = 'none';
    });

    var tabName = this.getAttribute('data-tab');
    document.getElementById(tabName + '-tab').style.display = 'block';
  });
});

// Cache actions
document.getElementById('clearCacheBtn').addEventListener('click', function() {
  clearCache();
});

document.getElementById('warmCacheBtn').addEventListener('click', function() {
  warmCache();
});

// Initialize security system on page load
document.addEventListener('DOMContentLoaded', function() {
  initializeSecuritySystem();
});

// Lazy Loading for Markers
var markerLazyLoad = {
  loadedMarkers: new Set(),
  viewportMarkers: [],
  observer: null
};

function initializeLazyLoading() {
  if ('IntersectionObserver' in window) {
    markerLazyLoad.observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          loadMarker(entry.target);
          markerLazyLoad.observer.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: '100px'
    });
  }
}

function loadMarker(markerElement) {
  var markerId = markerElement.getAttribute('data-marker-id');
  if (markerId && !markerLazyLoad.loadedMarkers.has(markerId)) {
    // Load marker data
    markerLazyLoad.loadedMarkers.add(markerId);
    markerElement.classList.add('loaded');
  }
}

function setupLazyMarkers() {
  var markers = document.querySelectorAll('[data-marker-id]');
  markers.forEach(function(marker) {
    if (markerLazyLoad.observer) {
      markerLazyLoad.observer.observe(marker);
    }
  });
}

// Pagination for Lists
function setupPagination(listId, itemsPerPage) {
  var list = document.getElementById(listId);
  if (!list) return;

  var items = list.querySelectorAll('.list-item');
  var totalPages = Math.ceil(items.length / itemsPerPage);

  for (var i = 0; i < items.length; i++) {
    if (i >= itemsPerPage) {
      items[i].style.display = 'none';
    }
  }

  // Add pagination controls
  var pagination = document.createElement('div');
  pagination.className = 'pagination';

  for (var page = 1; page <= totalPages; page++) {
    var pageBtn = document.createElement('button');
    pageBtn.textContent = page;
    pageBtn.className = 'page-btn';
    pageBtn.onclick = function() {
      showPage(listId, items, this.textContent, itemsPerPage);
    };
    pagination.appendChild(pageBtn);
  }

  list.parentNode.appendChild(pagination);
}

function showPage(listId, items, pageNumber, itemsPerPage) {
  var startIndex = (pageNumber - 1) * itemsPerPage;
  var endIndex = startIndex + itemsPerPage;

  items.forEach(function(item, index) {
    if (index >= startIndex && index < endIndex) {
      item.style.display = '';
    } else {
      item.style.display = 'none';
    }
  });
}

// Auto-testing
function runAutoTests() {
  console.log('Running auto-tests...');

  // Test rate limiting
  var rateLimitPassed = checkRateLimit('test_user');
  console.log('Rate limit test:', rateLimitPassed ? 'PASSED' : 'FAILED');

  // Test input sanitization
  var sanitized = sanitizeInput('<script>alert("xss")</script>');
  var sanitizationPassed = sanitized.indexOf('<script') === -1;
  console.log('Input sanitization test:', sanitizationPassed ? 'PASSED' : 'FAILED');

  // Test file size check
  var fileSizeCheck = checkFileSize(5 * 1024 * 1024); // 5MB
  console.log('File size check test:', fileSizeCheck ? 'PASSED' : 'FAILED');

  // Test cache
  setCache('test_key', 'test_value', 60000);
  var cached = getCache('test_key');
  var cacheTest = cached === 'test_value';
  console.log('Cache test:', cacheTest ? 'PASSED' : 'FAILED');

  console.log('Auto-tests completed');
  logActivity('auto_test_run', 'Chạy kiểm thử tự động');
}

// Initialize security system on page load
document.addEventListener('DOMContentLoaded', function() {
  initializeSecuritySystem();
  initializeLazyLoading();
  setupLazyMarkers();
});

// Mobile & Accessibility Improvements
var mobileSettings = {
  sidebarOpen: false,
  fontSize: 'medium',
  highContrast: false,
  reducedMotion: false
};

function initializeMobileFeatures() {
  // Load mobile settings from localStorage
  var savedSettings = localStorage.getItem('sosmap_mobile_settings');
  if (savedSettings) {
    mobileSettings = JSON.parse(savedSettings);
  }

  // Apply saved settings
  applyFontSize(mobileSettings.fontSize);
  applyHighContrast(mobileSettings.highContrast);
  applyReducedMotion(mobileSettings.reducedMotion);

  // Setup mobile toggle button
  setupSidebarToggle();

  // Setup FAB
  setupFAB();

  // Setup keyboard navigation
  setupKeyboardNavigation();

  // Setup ARIA live regions
  setupARIALiveRegions();
}

function setupSidebarToggle() {
  var toggleBtn = document.querySelector('.sidebar-toggle');
  var sidebar = document.querySelector('.sidebar');
  var navbarNav = document.querySelector('.navbar-nav');

  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', function() {
      mobileSettings.sidebarOpen = !mobileSettings.sidebarOpen;
      sidebar.classList.toggle('active', mobileSettings.sidebarOpen);
      navbarNav.classList.toggle('active', mobileSettings.sidebarOpen);
      saveMobileSettings();
    });
  }

  // Close sidebar when clicking outside
  document.addEventListener('click', function(e) {
    if (mobileSettings.sidebarOpen && 
        !sidebar.contains(e.target) && 
        !toggleBtn.contains(e.target) &&
        !navbarNav.contains(e.target)) {
      mobileSettings.sidebarOpen = false;
      sidebar.classList.remove('active');
      navbarNav.classList.remove('active');
      saveMobileSettings();
    }
  });
}

function setupFAB() {
  var fab = document.getElementById('quickReportFab');
  if (fab) {
    fab.addEventListener('click', function() {
      // Open report modal or navigate to report section
      var reportSection = document.getElementById('report-section');
      if (reportSection) {
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(function(section) {
          section.classList.remove('active');
        });
        // Show report section
        reportSection.classList.add('active');
        // Update nav links
        document.querySelectorAll('.nav-link').forEach(function(link) {
          link.classList.remove('active');
        });
        var reportLink = document.querySelector('[data-section="report"]');
        if (reportLink) {
          reportLink.classList.add('active');
        }
      }
    });
  }
}

function setupKeyboardNavigation() {
  // Enable keyboard navigation for modal
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      // Close all modals
      document.querySelectorAll('.modal').forEach(function(modal) {
        modal.style.display = 'none';
      });
    }

    // Tab navigation focus trap in modals
    if (e.key === 'Tab') {
      var openModal = document.querySelector('.modal[style*="display: block"]');
      if (openModal) {
        var focusableElements = openModal.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        var firstElement = focusableElements[0];
        var lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    }
  });
}

function setupARIALiveRegions() {
  var ariaLive = document.getElementById('ariaLiveRegion');
  if (ariaLive) {
    // Function to announce messages to screen readers
    window.announceToScreenReader = function(message) {
      ariaLive.textContent = message;
      setTimeout(function() {
        ariaLive.textContent = '';
      }, 1000);
    };
  }
}

function applyFontSize(size) {
  var html = document.documentElement;
  html.classList.remove('font-small', 'font-medium', 'font-large', 'font-xlarge');
  html.classList.add('font-' + size);
}

function applyHighContrast(enabled) {
  if (enabled) {
    document.body.classList.add('high-contrast');
  } else {
    document.body.classList.remove('high-contrast');
  }
}

function applyReducedMotion(enabled) {
  if (enabled) {
    document.body.classList.add('reduced-motion');
  } else {
    document.body.classList.remove('reduced-motion');
  }
}

// Font size controls
document.getElementById('fontSmall').addEventListener('click', function() {
  mobileSettings.fontSize = 'small';
  applyFontSize('small');
  saveMobileSettings();
});

document.getElementById('fontMedium').addEventListener('click', function() {
  mobileSettings.fontSize = 'medium';
  applyFontSize('medium');
  saveMobileSettings();
});

document.getElementById('fontLarge').addEventListener('click', function() {
  mobileSettings.fontSize = 'large';
  applyFontSize('large');
  saveMobileSettings();
});

document.getElementById('fontXLarge').addEventListener('click', function() {
  mobileSettings.fontSize = 'xlarge';
  applyFontSize('xlarge');
  saveMobileSettings();
});

// Accessibility toggle
document.getElementById('accessibilityToggle').addEventListener('click', function() {
  var controls = document.getElementById('fontSizeControls');
  controls.classList.toggle('active');
});

// Save mobile settings
function saveMobileSettings() {
  localStorage.setItem('sosmap_mobile_settings', JSON.stringify(mobileSettings));
}

// Touch gesture support for map
function setupTouchGestures() {
  var map = document.getElementById('map');
  if (!map) return;

  var touchStartX = 0;
  var touchStartY = 0;

  map.addEventListener('touchstart', function(e) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  map.addEventListener('touchend', function(e) {
    var touchEndX = e.changedTouches[0].clientX;
    var touchEndY = e.changedTouches[0].clientY;
    var diffX = touchEndX - touchStartX;
    var diffY = touchEndY - touchStartY;

    // Simple swipe detection
    if (Math.abs(diffX) > 50 || Math.abs(diffY) > 50) {
      announceToScreenReader('Thao tác vuốt bản đồ');
    }
  }, { passive: true });
}

// Camera capture support
function captureCamera(callback) {
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      .then(function(stream) {
        if (callback) callback(stream);
      })
      .catch(function(error) {
        console.error('Camera capture error:', error);
        alert('Không thể truy cập camera: ' + error.message);
      });
  } else {
    alert('Trình duyệt không hỗ trợ truy cập camera');
  }
}

// GPS capture with high accuracy
function captureGPS(callback) {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      function(position) {
        if (callback) callback(position);
      },
      function(error) {
        console.error('GPS capture error:', error);
        alert('Không thể lấy vị trí: ' + error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  } else {
    alert('Trình duyệt không hỗ trợ GPS');
  }
}

// Offline detection and notification
function setupOfflineDetection() {
  window.addEventListener('online', function() {
    announceToScreenReader('Đã kết nối lại mạng');
    logActivity('network_status', 'Online');
  });

  window.addEventListener('offline', function() {
    announceToScreenReader('Đã mất kết nối mạng');
    logActivity('network_status', 'Offline');
  });
}

// Initialize mobile features on page load
document.addEventListener('DOMContentLoaded', function() {
  initializeMobileFeatures();
  setupTouchGestures();
  setupOfflineDetection();
});

// Geolocation & Integration System
var geolocationData = {
  apiStatus: {
    traffic: 'active',
    camera: 'active',
    stations: 'active'
  },
  lastSync: {
    traffic: new Date().toISOString(),
    camera: new Date().toISOString(),
    stations: new Date().toISOString()
  },
  syncLogs: [],
  trafficIncidents: [
    { id: 'TRF-001', type: 'Tai nạn', location: 'Quận 1', time: '10:45', status: 'synced' },
    { id: 'TRF-002', type: 'Kẹt xe', location: 'quận 3', time: '10:42', status: 'synced' },
    { id: 'TRF-003', type: 'Ngập nước', location: 'Quận 7', time: '10:40', status: 'pending' }
  ],
  cameras: [
    { id: 'CAM001', name: 'Camera Nguyễn Văn Linh', location: 'Quận 7', km: '12+5', status: 'online' },
    { id: 'CAM002', name: 'Camera Hà Nội', location: 'Quận 1', km: '8+3', status: 'online' },
    { id: 'CAM003', name: 'Camera Lê Duẩnh', location: 'Quận Bình Thạnh', km: '15+7', status: 'offline' },
    { id: 'CAM004', name: 'Camera Xa lộ Hà Nội', location: 'Quận 2', km: '5+2', status: 'online' }
  ],
  stations: [
    { id: 'STN001', name: 'Trạm đo mưa Nhà Bè', type: 'rain', value: '2.5m', unit: 'mực nước', status: 'warning' },
    { id: 'STN002', name: 'Trạm mực nước Bình Chánh', type: 'water', value: '3.8m', unit: 'mực nước', status: 'danger' },
    { id: 'STN003', name: 'Trạm nhiệt độ Củ Chi', type: 'temperature', value: '35°C', unit: 'nhiệt độ', status: 'success' },
    { id: 'STN004', name: 'Trạm chất lượng không khí', type: 'air', value: '45', unit: 'AQI', status: 'success' }
  ]
};

function initializeGeolocationSystem() {
  // Load geolocation data from localStorage
  var savedData = localStorage.getItem('sosmap_geolocation');
  if (savedData) {
    geolocationData = JSON.parse(savedData);
  }

  updateGeolocationStatus();
}

function updateGeolocationStatus() {
  var statusDiv = document.getElementById('geolocationStatus');
  if (!statusDiv) return;

  var onlineCameras = geolocationData.cameras.filter(function(c) {
    return c.status === 'online';
  }).length;

  statusDiv.innerHTML = `
    <div class="status-item">
      <span class="status-label">API Traffic:</span>
      <span class="status-value ${geolocationData.apiStatus.traffic === 'active' ? 'success' : 'warning'}">${geolocationData.apiStatus.traffic === 'active' ? 'Đang hoạt động' : 'Tắt'}</span>
    </div>
    <div class="status-item">
      <span class="status-label">Data Sync:</span>
      <span class="status-value">Đồng bộ</span>
    </div>
    <div class="status-item">
      <span class="status-label">Camera Online:</span>
      <span class="status-value">${onlineCameras}/${geolocationData.cameras.length}</span>
    </div>
  `;
}

// Reverse Geocoding
function reverseGeocoding(lat, lng, coordinateSystem) {
  // Simulate reverse geocoding
  var result = {
    address: '',
    street: '',
    ward: '',
    district: '',
    province: '',
    inVietnam: false
  };

  // Check if coordinates are within Vietnam bounds
  // Vietnam bounds approximately: lat 8-23, lng 102-110
  var inVietnam = lat >= 8 && lat <= 23 && lng >= 102 && lng <= 110;
  result.inVietnam = inVietnam;

  if (inVietnam) {
    // Simulate address lookup based on coordinates
    if (lat > 10.7 && lat < 10.8 && lng > 106.6 && lng < 106.8) {
      result.address = 'Quận 1, Thành phố Hồ Chí Minh';
      result.street = 'Đường Nguyễn Huệ';
      result.ward = 'Phường Bến Nghé';
      result.district = 'Quận 1';
      result.province = 'Thành phố Hồ Chí Minh';
    } else if (lat > 10.75 && lat < 10.78 && lng > 106.65 && lng < 106.7) {
      result.address = 'Quận 7, Thành phố Hồ Chí Minh';
      result.street = 'Đường Nguyễn Văn Linh';
      result.ward = 'Phường Hiệp Thành';
      result.district = 'Quận 7';
      result.province = 'Thành phố Hồ Chí Minh';
    } else if (lat > 21.0 && lat < 21.1 && lng > 105.8 && lng < 106.0) {
      result.address = 'Quận Hoàn Kiếm, Thành phố Hà Nội';
      result.street = 'Đường Trần Hưng Đạo';
      result.ward = 'Phường Đồng Xuân';
      result.district = 'Quận Hoàn Kiếm';
      result.province = 'Thành phố Hà Nội';
    } else {
      result.address = 'Việt Nam';
      result.street = 'Đường chưa xác định';
      result.ward = 'Phường chưa xác định';
      result.district = 'Quận/Huyện chưa xác định';
      result.province = 'Tỉnh/Thành phố chưa xác định';
    }
  } else {
    result.address = 'Ngoài phạm vi Việt Nam';
    result.street = 'N/A';
    result.ward = 'N/A';
    result.district = 'N/A';
    result.province = 'N/A';
  }

  return result;
}

function convertCoordinateSystem(lat, lng, fromSystem, toSystem) {
  // Simulate coordinate system conversion
  // In production, use proper coordinate transformation libraries
  var converted = { lat: lat, lng: lng };

  if (fromSystem !== toSystem) {
    // Simple offset simulation (not accurate)
    if (toSystem === 'VN2000') {
      converted.lat += 0.0001;
      converted.lng += 0.0001;
    } else if (toSystem === 'UTM') {
      // Would require proper UTM conversion
      console.log('UTM conversion requires proper library');
    }
  }

  return converted;
}

function checkVietnamBounds(lat, lng) {
  // Vietnam bounds approximately
  return lat >= 8 && lat <= 23 && lng >= 102 && lng <= 110;
}

// API Integration
function syncTrafficData() {
  // Simulate API call to traffic data source
  var newIncidents = Math.floor(Math.random() * 10);
  
  geolocationData.trafficIncidents.push({
    id: 'TRF-' + Date.now(),
    type: 'Tai nạn',
    location: 'Quận ' + (Math.floor(Math.random() * 7) + 1),
    time: new Date().toLocaleTimeString('vi-VN'),
    status: 'synced'
  });

  geolocationData.lastSync.traffic = new Date().toISOString();
  saveGeolocationData();

  addSyncLog('traffic', 'success', 'Đồng bộ ' + newIncidents + ' sự cố thành công');
  updateGeolocationStatus();

  logActivity('traffic_sync', 'Đồng bộ dữ liệu giao thông');
}

function syncCameraData() {
  // Simulate camera sync
  var onlineCount = geolocationData.cameras.filter(function(c) {
    return c.status === 'online';
  }).length;

  addSyncLog('camera', 'success', 'Đồng bộ ' + onlineCount + ' camera thành công');
  updateGeolocationStatus();

  logActivity('camera_sync', 'Đồng bộ dữ liệu camera');
}

function syncStationData() {
  // Simulate station sync
  var syncedCount = geolocationData.stations.length;
  var failedCount = Math.floor(Math.random() * 2);

  if (failedCount > 0) {
    addSyncLog('stations', 'warning', failedCount + ' trạm không phản hồi (timeout)');
  }

  addSyncLog('stations', 'success', 'Đồng bộ ' + (syncedCount - failedCount) + ' trạm thành công');
  updateGeolocationStatus();

  logActivity('stations_sync', 'Đồng bộ dữ liệu trạm quan trắc');
}

function addSyncLog(type, status, message) {
  var log = {
    time: new Date().toLocaleTimeString('vi-VN'),
    type: type,
    status: status,
    message: message
  };

  geolocationData.syncLogs.unshift(log);
  if (geolocationData.syncLogs.length > 50) {
    geolocationData.syncLogs.pop();
  }

  saveGeolocationData();
}

function checkDataValidity(data, dataType) {
  // Simulate data validity check
  var validity = {
    isValid: true,
    issues: [],
    latency: 0
  };

  if (dataType === 'traffic') {
    validity.latency = Math.floor(Math.random() * 500) + 100;
    if (validity.latency > 1000) {
      validity.isValid = false;
      validity.issues.push('API response timeout');
    }
  } else if (dataType === 'camera') {
    validity.latency = Math.floor(Math.random() * 300) + 50;
  }

  return validity;
}

function saveGeolocationData() {
  localStorage.setItem('sosmap_geolocation', JSON.stringify(geolocationData));
}

// Geolocation Panel Event Listeners
document.getElementById('reverseGeocodingBtn').addEventListener('click', function() {
  document.getElementById('reverseGeocodingModal').style.display = 'block';
});

document.getElementById('dataSourcesBtn').addEventListener('click', function() {
  document.getElementById('dataSourcesModal').style.display = 'block';
});

document.getElementById('closeReverseGeocodingModal').addEventListener('click', function() {
  document.getElementById('reverseGeocodingModal').style.display = 'none';
});

document.getElementById('closeReverseGeocodingBtn').addEventListener('click', function() {
  document.getElementById('reverseGeocodingModal').style.display = 'none';
});

document.getElementById('closeDataSourcesModal').addEventListener('click', function() {
  document.getElementById('dataSourcesModal').style.display = 'none';
});

document.getElementById('closeDataSourcesBtn').addEventListener('click', function() {
  document.getElementById('dataSourcesModal').style.display = 'none';
});

document.getElementById('convertToAddressBtn').addEventListener('click', function() {
  var lat = parseFloat(document.getElementById('latitudeInput').value);
  var lng = parseFloat(document.getElementById('longitudeInput').value);
  var system = document.getElementById('coordinateSystem').value;

  if (isNaN(lat) || isNaN(lng)) {
    alert('Vui lòng nhập vĩ độ và kinh độ hợp lệ');
    return;
  }

  var result = reverseGeocoding(lat, lng, system);

  document.getElementById('geocodingResult').style.display = 'block';
  document.getElementById('addressResult').textContent = result.address;
  document.getElementById('streetResult').textContent = result.street;
  document.getElementById('wardResult').textContent = result.ward;
  document.getElementById('districtResult').textContent = result.district;
  document.getElementById('provinceResult').textContent = result.province;
  document.getElementById('inVietnamResult').textContent = result.inVietnam ? 'Có' : 'Không';

  logActivity('reverse_geocoding', 'Reverse geocoding: ' + lat + ', ' + lng);
});

// Data sources tab switching
document.querySelectorAll('.data-sources-tab').forEach(function(tab) {
  tab.addEventListener('click', function() {
    document.querySelectorAll('.data-sources-tab').forEach(function(t) {
      t.classList.remove('active');
    });

    this.classList.add('active');

    document.querySelectorAll('.data-sources-tab-content').forEach(function(content) {
      content.style.display = 'none';
    });

    var tabName = this.getAttribute('data-tab');
    document.getElementById(tabName + '-tab').style.display = 'block';
  });
});

// Sync buttons
document.getElementById('syncTrafficBtn').addEventListener('click', function() {
  syncTrafficData();
});

document.getElementById('syncCameraBtn').addEventListener('click', function() {
  syncCameraData();
});

document.getElementById('syncStationsBtn').addEventListener('click', function() {
  syncStationData();
});

document.getElementById('configureTrafficApiBtn').addEventListener('click', function() {
  alert('Chức năng cấu hình API sẽ được mở rộng trong phiên bản tiếp theo');
});

// Log filter
document.getElementById('logTypeFilter').addEventListener('change', function() {
  var filterType = this.value;
  var logList = document.querySelector('.log-list');
  var logs = geolocationData.syncLogs.filter(function(log) {
    return filterType === 'all' || log.type === filterType;
  });

  logList.innerHTML = logs.map(function(log) {
    var statusClass = log.status === 'success' ? 'success' : log.status === 'warning' ? 'warning' : 'error';
    return `
      <div class="log-item ${statusClass}">
        <span class="log-time">${log.time}</span>
        <span class="log-type">${log.type}</span>
        <span class="log-message">${log.message}</span>
      </div>
    `;
  }).join('');
});

// Initialize geolocation system on page load
document.addEventListener('DOMContentLoaded', function() {
  initializeGeolocationSystem();
});

// Incident Administration System
var incidentAdminData = {
  incidents: [
    { id: 'INC-001', type: 'traffic', description: 'Tai nạn giao thông tại ngã tư', location: 'Quận 1, TP.HCM', coordinates: '10.7769, 106.7009', priority: 'high', status: 'in_progress', assignee: 'Nguyễn Văn A', reporter: 'Nguyễn Văn X', createdAt: '15/01/2026 10:45', history: [{ time: '15/01/2026 10:45', action: 'Tạo sự cố', user: 'Nguyễn Văn X' }, { time: '15/01/2026 11:00', action: 'Phân công cho Nguyễn Văn A', user: 'Admin' }], evidence: [{ type: 'image', name: 'anh_tai_nan.jpg' }, { type: 'video', name: 'video_tai_nan.mp4' }] },
    { id: 'INC-002', type: 'flood', description: 'Ngập nước sâu 0.5m', location: 'Quận 7, TP.HCM', coordinates: '10.7569, 106.6809', priority: 'medium', status: 'new', assignee: '', reporter: 'Trần Thị Y', createdAt: '15/01/2026 10:30', history: [{ time: '15/01/2026 10:30', action: 'Tạo sự cố', user: 'Trần Thị Y' }], evidence: [] },
    { id: 'INC-003', type: 'fire', description: 'Cháy nhà kho khu công nghiệp', location: 'Quận 12, TP.HCM', coordinates: '10.8269, 106.6409', priority: 'critical', status: 'resolved', assignee: 'Trần Thị B', reporter: 'Lê Văn Z', createdAt: '14/01/2026 15:20', history: [{ time: '14/01/2026 15:20', action: 'Tạo sự cố', user: 'Lê Văn Z' }, { time: '14/01/2026 15:45', action: 'Phân công cho Trần Thị B', user: 'Admin' }, { time: '14/01/2026 18:30', action: 'Đã giải quyết', user: 'Trần Thị B' }], evidence: [{ type: 'image', name: 'anh_chay.jpg' }] },
    { id: 'INC-004', type: 'health', description: 'Cần cấp cứu khẩn cấp', location: 'Quận 3, TP.HCM', coordinates: '10.7869, 106.6909', priority: 'critical', status: 'in_progress', assignee: 'Lê Văn C', reporter: 'Phạm Thị W', createdAt: '15/01/2026 09:15', history: [{ time: '15/01/2026 09:15', action: 'Tạo sự cố', user: 'Phạm Thị W' }, { time: '15/01/2026 09:20', action: 'Phân công cho Lê Văn C', user: 'Admin' }], evidence: [] },
    { id: 'INC-005', type: 'infrastructure', description: 'Cây đổ chắn đường', location: 'Quận 5, TP.HCM', coordinates: '10.7669, 106.6709', priority: 'low', status: 'closed', assignee: 'Phạm Thị D', reporter: 'Hoàng Văn V', createdAt: '13/01/2026 14:00', history: [{ time: '13/01/2026 14:00', action: 'Tạo sự cố', user: 'Hoàng Văn V' }, { time: '13/01/2026 14:30', action: 'Phân công cho Phạm Thị D', user: 'Admin' }, { time: '13/01/2026 16:00', action: 'Đã giải quyết', user: 'Phạm Thị D' }, { time: '13/01/2026 16:30', action: 'Đã đóng', user: 'Admin' }], evidence: [{ type: 'image', name: 'anh_cay_do.jpg' }] }
  ],
  currentPage: 1,
  itemsPerPage: 10,
  filters: {
    search: '',
    type: 'all',
    priority: 'all',
    status: 'all',
    dateFrom: '',
    dateTo: ''
  },
  stats: {
    total: 156,
    inProgress: 23,
    resolved: 133,
    avgProcessingTime: 2.5
  }
};

function initializeIncidentAdmin() {
  // Load incident data from localStorage
  var savedData = localStorage.getItem('sosmap_incident_admin');
  if (savedData) {
    incidentAdminData = JSON.parse(savedData);
  }

  updateIncidentAdminStatus();
}

function updateIncidentAdminStatus() {
  var statusDiv = document.getElementById('incidentAdminStatus');
  if (!statusDiv) return;

  var inProgress = incidentAdminData.incidents.filter(function(i) {
    return i.status === 'in_progress' || i.status === 'new';
  }).length;

  var resolved = incidentAdminData.incidents.filter(function(i) {
    return i.status === 'resolved' || i.status === 'closed';
  }).length;

  statusDiv.innerHTML = `
    <div class="status-item">
      <span class="status-label">Tổng sự cố:</span>
      <span class="status-value">${incidentAdminData.incidents.length}</span>
    </div>
    <div class="status-item">
      <span class="status-label">Đang xử lý:</span>
      <span class="status-value warning">${inProgress}</span>
    </div>
    <div class="status-item">
      <span class="status-label">Đã giải quyết:</span>
      <span class="status-value success">${resolved}</span>
    </div>
  `;
}

function filterIncidents() {
  var filtered = incidentAdminData.incidents.filter(function(incident) {
    var matchSearch = true;
    if (incidentAdminData.filters.search) {
      var search = incidentAdminData.filters.search.toLowerCase();
      matchSearch = incident.id.toLowerCase().includes(search) ||
                   incident.description.toLowerCase().includes(search) ||
                   incident.location.toLowerCase().includes(search);
    }

    var matchType = incidentAdminData.filters.type === 'all' || incident.type === incidentAdminData.filters.type;
    var matchPriority = incidentAdminData.filters.priority === 'all' || incident.priority === incidentAdminData.filters.priority;
    var matchStatus = incidentAdminData.filters.status === 'all' || incident.status === incidentAdminData.filters.status;

    return matchSearch && matchType && matchPriority && matchStatus;
  });

  return filtered;
}

function renderIncidentTable() {
  var filtered = filterIncidents();
  var tableBody = document.getElementById('incidentTableBody');
  if (!tableBody) return;

  var startIndex = (incidentAdminData.currentPage - 1) * incidentAdminData.itemsPerPage;
  var endIndex = startIndex + incidentAdminData.itemsPerPage;
  var pageData = filtered.slice(startIndex, endIndex);

  tableBody.innerHTML = pageData.map(function(incident) {
    var priorityLabels = {
      low: 'Thấp',
      medium: 'Trung bình',
      high: 'Cao',
      critical: 'Khẩn cấp'
    };

    var statusLabels = {
      new: 'Mới',
      in_progress: 'Đang xử lý',
      resolved: 'Đã giải quyết',
      closed: 'Đã đóng'
    };

    var typeLabels = {
      traffic: 'Giao thông',
      flood: 'Ngập lũ',
      fire: 'Cháy nổ',
      health: 'Sức khỏe',
      infrastructure: 'Hạ tầng'
    };

    return `
      <tr>
        <td>${incident.id}</td>
        <td>${typeLabels[incident.type] || incident.type}</td>
        <td>${incident.description}</td>
        <td>${incident.location}</td>
        <td><span class="priority-badge ${incident.priority}">${priorityLabels[incident.priority]}</span></td>
        <td><span class="status-badge ${incident.status}">${statusLabels[incident.status]}</span></td>
        <td>${incident.assignee || '-'}</td>
        <td>${incident.createdAt}</td>
        <td>
          <button class="btn btn-sm btn-primary" onclick="viewIncidentDetail('${incident.id}')">Xem</button>
        </td>
      </tr>
    `;
  }).join('');

  // Update pagination
  var totalPages = Math.ceil(filtered.length / incidentAdminData.itemsPerPage);
  document.querySelector('.page-info').textContent = 'Trang ' + incidentAdminData.currentPage + ' / ' + totalPages;
}

function viewIncidentDetail(incidentId) {
  var incident = incidentAdminData.incidents.find(function(i) {
    return i.id === incidentId;
  });

  if (!incident) return;

  document.getElementById('incidentDetailId').textContent = incident.id;
  document.getElementById('detailType').textContent = incident.type;
  document.getElementById('detailDescription').textContent = incident.description;
  document.getElementById('detailLocation').textContent = incident.location;
  document.getElementById('detailCoordinates').textContent = incident.coordinates;
  document.getElementById('detailPriority').textContent = incident.priority;
  document.getElementById('detailStatus').textContent = incident.status;
  document.getElementById('detailReporter').textContent = incident.reporter;
  document.getElementById('detailCreatedAt').textContent = incident.createdAt;
  document.getElementById('detailAssignee').value = incident.assignee || '';
  document.getElementById('detailStatusUpdate').value = incident.status;

  // Render history
  var historyList = document.getElementById('detailHistory');
  historyList.innerHTML = incident.history.map(function(h) {
    return `
      <div class="history-item">
        <span class="history-time">${h.time}</span>
        <span class="history-action">${h.action}</span>
        <span class="history-user">${h.user}</span>
      </div>
    `;
  }).join('');

  // Render evidence
  var evidenceList = document.getElementById('detailEvidence');
  if (incident.evidence && incident.evidence.length > 0) {
    evidenceList.innerHTML = incident.evidence.map(function(e) {
      var icon = e.type === 'image' ? '📷' : e.type === 'video' ? '📹' : '📄';
      return `
        <div class="evidence-item">
          <span class="evidence-icon">${icon}</span>
          <span class="evidence-name">${e.name}</span>
          <button class="btn btn-sm btn-secondary">Xem</button>
        </div>
      `;
    }).join('');
  } else {
    evidenceList.innerHTML = '<p style="color: #999; font-size: 13px;">Không có minh chứng</p>';
  }

  document.getElementById('incidentDetailModal').style.display = 'block';
}

function saveIncidentDetail() {
  var incidentId = document.getElementById('incidentDetailId').textContent;
  var incident = incidentAdminData.incidents.find(function(i) {
    return i.id === incidentId;
  });

  if (!incident) return;

  var newAssignee = document.getElementById('detailAssignee').value;
  var newStatus = document.getElementById('detailStatusUpdate').value;
  var notes = document.getElementById('detailNotes').value;

  // Check if status changed
  if (newStatus !== incident.status) {
    incident.history.push({
      time: new Date().toLocaleString('vi-VN'),
      action: 'Cập nhật trạng thái: ' + newStatus,
      user: 'Admin'
    });
    incident.status = newStatus;
  }

  // Check if assignee changed
  if (newAssignee !== incident.assignee) {
    incident.history.push({
      time: new Date().toLocaleString('vi-VN'),
      action: 'Phân công cho ' + newAssignee,
      user: 'Admin'
    });
    incident.assignee = newAssignee;
  }

  // Add notes if provided
  if (notes) {
    incident.history.push({
      time: new Date().toLocaleString('vi-VN'),
      action: 'Ghi chú: ' + notes,
      user: 'Admin'
    });
  }

  saveIncidentAdminData();
  updateIncidentAdminStatus();
  renderIncidentTable();

  alert('Đã lưu thay đổi!');
  logActivity('incident_updated', 'Cập nhật sự cố: ' + incidentId);
}

function exportIncidentsToCSV() {
  var filtered = filterIncidents();
  var csv = 'ID,Loại,Mô tả,Vị trí,Ưu tiên,Trạng thái,Người xử lý,Người báo cáo,Ngày tạo\n';

  filtered.forEach(function(incident) {
    csv += incident.id + ',' + incident.type + ',' + incident.description + ',' + incident.location + ',' + incident.priority + ',' + incident.status + ',' + incident.assignee + ',' + incident.reporter + ',' + incident.createdAt + '\n';
  });

  var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  var link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'incidents_' + new Date().toISOString().split('T')[0] + '.csv';
  link.click();

  logActivity('incidents_exported', 'Xuất CSV: ' + filtered.length + ' sự cố');
}

function saveIncidentAdminData() {
  localStorage.setItem('sosmap_incident_admin', JSON.stringify(incidentAdminData));
}

// Incident Administration Event Listeners
document.getElementById('incidentListBtn').addEventListener('click', function() {
  document.getElementById('incidentListModal').style.display = 'block';
  renderIncidentTable();
});

document.getElementById('incidentStatsBtn').addEventListener('click', function() {
  document.getElementById('incidentStatsModal').style.display = 'block';
});

document.getElementById('closeIncidentListModal').addEventListener('click', function() {
  document.getElementById('incidentListModal').style.display = 'none';
});

document.getElementById('closeIncidentListBtn').addEventListener('click', function() {
  document.getElementById('incidentListModal').style.display = 'none';
});

document.getElementById('closeIncidentDetailModal').addEventListener('click', function() {
  document.getElementById('incidentDetailModal').style.display = 'none';
});

document.getElementById('closeIncidentDetailBtn').addEventListener('click', function() {
  document.getElementById('incidentDetailModal').style.display = 'none';
});

document.getElementById('closeIncidentStatsModal').addEventListener('click', function() {
  document.getElementById('incidentStatsModal').style.display = 'none';
});

document.getElementById('closeIncidentStatsBtn').addEventListener('click', function() {
  document.getElementById('incidentStatsModal').style.display = 'none';
});

document.getElementById('applyIncidentFiltersBtn').addEventListener('click', function() {
  incidentAdminData.filters.search = document.getElementById('incidentSearch').value;
  incidentAdminData.filters.type = document.getElementById('incidentTypeFilter').value;
  incidentAdminData.filters.priority = document.getElementById('incidentPriorityFilter').value;
  incidentAdminData.filters.status = document.getElementById('incidentStatusFilter').value;
  incidentAdminData.filters.dateFrom = document.getElementById('incidentDateFrom').value;
  incidentAdminData.filters.dateTo = document.getElementById('incidentDateTo').value;
  incidentAdminData.currentPage = 1;

  renderIncidentTable();
});

document.getElementById('resetIncidentFiltersBtn').addEventListener('click', function() {
  document.getElementById('incidentSearch').value = '';
  document.getElementById('incidentTypeFilter').value = 'all';
  document.getElementById('incidentPriorityFilter').value = 'all';
  document.getElementById('incidentStatusFilter').value = 'all';
  document.getElementById('incidentDateFrom').value = '';
  document.getElementById('incidentDateTo').value = '';

  incidentAdminData.filters = {
    search: '',
    type: 'all',
    priority: 'all',
    status: 'all',
    dateFrom: '',
    dateTo: ''
  };
  incidentAdminData.currentPage = 1;

  renderIncidentTable();
});

document.getElementById('prevPageBtn').addEventListener('click', function() {
  if (incidentAdminData.currentPage > 1) {
    incidentAdminData.currentPage--;
    renderIncidentTable();
  }
});

document.getElementById('nextPageBtn').addEventListener('click', function() {
  var filtered = filterIncidents();
  var totalPages = Math.ceil(filtered.length / incidentAdminData.itemsPerPage);
  if (incidentAdminData.currentPage < totalPages) {
    incidentAdminData.currentPage++;
    renderIncidentTable();
  }
});

document.getElementById('saveIncidentDetailBtn').addEventListener('click', function() {
  saveIncidentDetail();
});

document.getElementById('exportIncidentsBtn').addEventListener('click', function() {
  exportIncidentsToCSV();
});

document.getElementById('applyStatsFiltersBtn').addEventListener('click', function() {
  // Apply stats filters (simulated)
  alert('Đã áp dụng bộ lọc thống kê');
});

document.getElementById('exportStatsBtn').addEventListener('click', function() {
  // Export stats report (simulated)
  alert('Đã xuất báo cáo thống kê');
  logActivity('stats_exported', 'Xuất báo cáo thống kê');
});

// Make viewIncidentDetail available globally
window.viewIncidentDetail = viewIncidentDetail;

// Account & Access Control System
var accountData = {
  currentUser: {
    id: 'USR001',
    name: 'Nguyễn Văn A',
    email: 'nguyenvana@example.com',
    phone: '0901234567',
    address: '123 Đường ABC, Quận 1, TP.HCM',
    role: 'admin',
    createdAt: '01/01/2026'
  },
  users: [
    { id: 'USR001', name: 'Nguyễn Văn A', email: 'nguyenvana@example.com', role: 'admin' },
    { id: 'USR002', name: 'Trần Thị B', email: 'tranthib@example.com', role: 'staff' },
    { id: 'USR003', name: 'Lê Văn C', email: 'levanc@example.com', role: 'reporter' },
    { id: 'USR004', name: 'Phạm Thị D', email: 'phamthid@example.com', role: 'viewer' }
  ],
  loginHistory: [
    { time: '15/01/2026 10:45', ip: '192.168.1.100', device: 'Chrome / Windows', status: 'success' },
    { time: '14/01/2026 15:30', ip: '192.168.1.100', device: 'Chrome / Windows', status: 'success' },
    { time: '13/01/2026 09:15', ip: '192.168.1.101', device: 'Firefox / Mac', status: 'warning' }
  ],
  auditLog: [
    { time: '15/01/2026 10:45:23', user: 'nguyenvana@example.com', action: 'login', detail: 'Đăng nhập thành công', ip: '192.168.1.100', device: 'Chrome / Windows' },
    { time: '15/01/2026 10:30:15', user: 'tranthib@example.com', action: 'update', detail: 'Cập nhật sự cố INC-001', ip: '192.168.1.101', device: 'Firefox / Mac' },
    { time: '15/01/2026 10:15:00', user: 'levanc@example.com', action: 'create', detail: 'Tạo phản ánh mới', ip: '192.168.1.102', device: 'Safari / iOS' },
    { time: '15/01/2026 09:45:30', user: 'nguyenvana@example.com', action: 'logout', detail: 'Đăng xuất', ip: '192.168.1.100', device: 'Chrome / Windows' },
    { time: '15/01/2026 09:30:00', user: 'phamthid@example.com', action: 'login', detail: 'Đăng nhập thành công', ip: '192.168.1.103', device: 'Edge / Windows' }
  ],
  auditFilters: {
    user: 'all',
    action: 'all',
    dateFrom: '',
    dateTo: ''
  },
  actionsToday: 23
};

function initializeAccountSystem() {
  // Load account data from localStorage
  var savedData = localStorage.getItem('sosmap_account');
  if (savedData) {
    accountData = JSON.parse(savedData);
  }

  updateAccountStatus();
}

function updateAccountStatus() {
  var statusDiv = document.getElementById('accountStatus');
  if (!statusDiv) return;

  var roleLabels = {
    viewer: 'Viewer',
    reporter: 'Reporter',
    staff: 'Staff',
    admin: 'Admin'
  };

  statusDiv.innerHTML = `
    <div class="status-item">
      <span class="status-label">Đăng nhập:</span>
      <span class="status-value success">Đã đăng nhập</span>
    </div>
    <div class="status-item">
      <span class="status-label">Vai trò:</span>
      <span class="status-value">${roleLabels[accountData.currentUser.role] || accountData.currentUser.role}</span>
    </div>
    <div class="status-item">
      <span class="status-label">Thao tác hôm nay:</span>
      <span class="status-value">${accountData.actionsToday}</span>
    </div>
  `;
}

function saveProfile() {
  var name = document.getElementById('profileName').value;
  var email = document.getElementById('profileEmail').value;
  var phone = document.getElementById('profilePhone').value;
  var address = document.getElementById('profileAddress').value;

  accountData.currentUser.name = name;
  accountData.currentUser.email = email;
  accountData.currentUser.phone = phone;
  accountData.currentUser.address = address;

  saveAccountData();
  updateAccountStatus();

  // Add to audit log
  addAuditLog('update', 'Cập nhật hồ sơ tài khoản');

  alert('Đã lưu thông tin hồ sơ!');
}

function updatePassword() {
  var currentPassword = document.getElementById('currentPassword').value;
  var newPassword = document.getElementById('newPassword').value;
  var confirmPassword = document.getElementById('confirmPassword').value;

  if (!currentPassword || !newPassword || !confirmPassword) {
    alert('Vui lòng nhập đầy đủ thông tin');
    return;
  }

  if (newPassword !== confirmPassword) {
    alert('Mật khẩu mới không khớp');
    return;
  }

  if (newPassword.length < 8) {
    alert('Mật khẩu phải có ít nhất 8 ký tự');
    return;
  }

  // Simulate password update
  alert('Đã cập nhật mật khẩu thành công!');

  // Clear inputs
  document.getElementById('currentPassword').value = '';
  document.getElementById('newPassword').value = '';
  document.getElementById('confirmPassword').value = '';

  // Add to audit log
  addAuditLog('update', 'Đổi mật khẩu');

  logActivity('password_changed', 'Đổi mật khẩu');
}

function forgotPassword() {
  var email = accountData.currentUser.email;
  alert('Đã gửi email khôi phục mật khẩu đến: ' + email);
  
  // Add to audit log
  addAuditLog('update', 'Yêu cầu khôi phục mật khẩu');
}

function deleteAccount() {
  if (confirm('Bạn có chắc chắn muốn xóa tài khoản? Hành động này không thể hoàn tác.')) {
    alert('Để xóa tài khoản, vui lòng liên hệ quản trị viên hoặc gửi yêu cầu qua email.');
    
    // Add to audit log
    addAuditLog('delete', 'Yêu cầu xóa tài khoản');
  }
}

function saveRoles() {
  var roleSelects = document.querySelectorAll('.role-select');
  var changes = [];

  roleSelects.forEach(function(select, index) {
    var user = accountData.users[index];
    if (user && user.role !== select.value) {
      changes.push({
        user: user.email,
        oldRole: user.role,
        newRole: select.value
      });
      user.role = select.value;
    }
  });

  if (changes.length > 0) {
    saveAccountData();
    
    changes.forEach(function(change) {
      addAuditLog('update', 'Thay đổi vai trò: ' + change.user + ' từ ' + change.oldRole + ' sang ' + change.newRole);
    });

    alert('Đã lưu thay đổi phân quyền!');
  } else {
    alert('Không có thay đổi nào được lưu.');
  }
}

function addAuditLog(action, detail) {
  var log = {
    time: new Date().toLocaleString('vi-VN'),
    user: accountData.currentUser.email,
    action: action,
    detail: detail,
    ip: '192.168.1.' + Math.floor(Math.random() * 255),
    device: 'Chrome / Windows'
  };

  accountData.auditLog.unshift(log);
  if (accountData.auditLog.length > 100) {
    accountData.auditLog.pop();
  }

  accountData.actionsToday++;
  saveAccountData();
}

function filterAuditLog() {
  var filtered = accountData.auditLog.filter(function(log) {
    var matchUser = accountData.auditFilters.user === 'all' || log.user === accountData.auditFilters.user;
    var matchAction = accountData.auditFilters.action === 'all' || log.action === accountData.auditFilters.action;
    return matchUser && matchAction;
  });

  return filtered;
}

function renderAuditTable() {
  var filtered = filterAuditLog();
  var auditTable = document.querySelector('.audit-table tbody');
  if (!auditTable) return;

  var actionLabels = {
    login: 'Đăng nhập',
    logout: 'Đăng xuất',
    create: 'Tạo',
    update: 'Cập nhật',
    delete: 'Xóa'
  };

  auditTable.innerHTML = filtered.slice(0, 10).map(function(log) {
    return `
      <tr>
        <td>${log.time}</td>
        <td>${log.user}</td>
        <td><span class="action-badge ${log.action}">${actionLabels[log.action] || log.action}</span></td>
        <td>${log.detail}</td>
        <td>${log.ip}</td>
        <td>${log.device}</td>
      </tr>
    `;
  }).join('');
}

function exportAuditLog() {
  var filtered = filterAuditLog();
  var csv = 'Thời gian,Người dùng,Hành động,Chi tiết,IP,Thiết bị\n';

  filtered.forEach(function(log) {
    csv += log.time + ',' + log.user + ',' + log.action + ',' + log.detail + ',' + log.ip + ',' + log.device + '\n';
  });

  var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  var link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'audit_log_' + new Date().toISOString().split('T')[0] + '.csv';
  link.click();

  logActivity('audit_exported', 'Xuất audit log: ' + filtered.length + ' records');
}

function saveAccountData() {
  localStorage.setItem('sosmap_account', JSON.stringify(accountData));
}

// Account Panel Event Listeners
document.getElementById('accountProfileBtn').addEventListener('click', function() {
  document.getElementById('accountProfileModal').style.display = 'block';
});

document.getElementById('accountSecurityBtn').addEventListener('click', function() {
  document.getElementById('accountSecurityModal').style.display = 'block';
});

document.getElementById('accountRolesBtn').addEventListener('click', function() {
  document.getElementById('accountRolesModal').style.display = 'block';
});

document.getElementById('accountAuditBtn').addEventListener('click', function() {
  document.getElementById('accountAuditModal').style.display = 'block';
  renderAuditTable();
});

document.getElementById('closeAccountProfileModal').addEventListener('click', function() {
  document.getElementById('accountProfileModal').style.display = 'none';
});

document.getElementById('closeAccountProfileBtn').addEventListener('click', function() {
  document.getElementById('accountProfileModal').style.display = 'none';
});

document.getElementById('closeAccountSecurityModal').addEventListener('click', function() {
  document.getElementById('accountSecurityModal').style.display = 'none';
});

document.getElementById('closeAccountSecurityBtn').addEventListener('click', function() {
  document.getElementById('accountSecurityModal').style.display = 'none';
});

document.getElementById('closeAccountRolesModal').addEventListener('click', function() {
  document.getElementById('accountRolesModal').style.display = 'none';
});

document.getElementById('closeAccountRolesBtn').addEventListener('click', function() {
  document.getElementById('accountRolesModal').style.display = 'none';
});

document.getElementById('closeAccountAuditModal').addEventListener('click', function() {
  document.getElementById('accountAuditModal').style.display = 'none';
});

document.getElementById('closeAccountAuditBtn').addEventListener('click', function() {
  document.getElementById('accountAuditModal').style.display = 'none';
});

document.getElementById('saveProfileBtn').addEventListener('click', function() {
  saveProfile();
});

document.getElementById('changePasswordBtn').addEventListener('click', function() {
  document.getElementById('accountSecurityModal').style.display = 'none';
  document.getElementById('accountSecurityModal').style.display = 'block';
});

document.getElementById('updatePasswordBtn').addEventListener('click', function() {
  updatePassword();
});

document.getElementById('forgotPasswordBtn').addEventListener('click', function() {
  forgotPassword();
});

document.getElementById('deleteAccountBtn').addEventListener('click', function() {
  deleteAccount();
});

document.getElementById('saveRolesBtn').addEventListener('click', function() {
  saveRoles();
});

document.getElementById('applyAuditFiltersBtn').addEventListener('click', function() {
  accountData.auditFilters.user = document.getElementById('auditUserFilter').value;
  accountData.auditFilters.action = document.getElementById('auditActionFilter').value;
  accountData.auditFilters.dateFrom = document.getElementById('auditDateFrom').value;
  accountData.auditFilters.dateTo = document.getElementById('auditDateTo').value;
  renderAuditTable();
});

document.getElementById('exportAuditBtn').addEventListener('click', function() {
  exportAuditLog();
});

// Initialize account system on page load
document.addEventListener('DOMContentLoaded', function() {
  initializeAccountSystem();
});

// Incident Reporting System
var incidentReportingData = {
  myReports: [
    { id: 'RPT-001', type: 'accident', title: 'Tai nạn tại ngã tư', content: 'Có tai nạn giao thông tại ngã tư, cần sự hỗ trợ', location: 'Quận 1, TP.HCM', coordinates: '10.7769, 106.7009', status: 'processing', createdAt: '15/01/2026 10:45', userId: 'USR001', evidence: [{ type: 'image', name: 'anh_tai_nan.jpg' }], history: [{ time: '15/01/2026 10:45', action: 'Tạo phản ánh', user: 'Nguyễn Văn A' }, { time: '15/01/2026 11:00', action: 'Đã tiếp nhận', user: 'Staff' }, { time: '15/01/2026 12:30', action: 'Đang xử lý', user: 'Staff' }] },
    { id: 'RPT-002', type: 'flood', title: 'Ngập đường Nguyễn Văn Linh', content: 'Ngập nước sâu 0.5m', location: 'Quận 7, TP.HCM', coordinates: '10.7569, 106.6809', status: 'resolved', createdAt: '14/01/2026 15:20', userId: 'USR001', evidence: [], history: [{ time: '14/01/2026 15:20', action: 'Tạo phản ánh', user: 'Nguyễn Văn A' }, { time: '14/01/2026 16:00', action: 'Đã giải quyết', user: 'Staff' }] },
    { id: 'RPT-003', type: 'congestion', title: 'Kẹt xe đường Hà Nội', content: 'Kẹt xe kéo dài 2km', location: 'Quận 1, TP.HCM', coordinates: '10.7869, 106.6909', status: 'pending', createdAt: '15/01/2026 09:30', userId: 'USR001', evidence: [], history: [{ time: '15/01/2026 09:30', action: 'Tạo phản ánh', user: 'Nguyễn Văn A' }] }
  ],
  verificationQueue: [
    { id: 'RPT-001', type: 'accident', title: 'Tai nạn tại ngã tư', userId: 'USR001', userName: 'Nguyễn Văn A', reliability: 'high', verificationStatus: 'verified', verifiedBy: 'USR002', verifiedAt: '15/01/2026 11:00' },
    { id: 'RPT-002', type: 'flood', title: 'Ngập đường Nguyễn Văn Linh', userId: 'USR002', userName: 'Trần Thị Y', reliability: 'medium', verificationStatus: 'pending', verifiedBy: null, verifiedAt: null },
    { id: 'RPT-003', type: 'congestion', title: 'Kẹt xe đường Hà Nội', userId: 'USR003', userName: 'Lê Văn Z', reliability: 'low', verificationStatus: 'duplicate', verifiedBy: 'USR004', verifiedAt: '15/01/2026 10:00' }
  ],
  filters: {
    status: 'all',
    verificationStatus: 'all',
    reliability: 'all'
  }
};

function initializeIncidentReporting() {
  // Load incident reporting data from localStorage
  var savedData = localStorage.getItem('sosmap_incident_reporting');
  if (savedData) {
    incidentReportingData = JSON.parse(savedData);
  }

  updateIncidentReportingStatus();
}

function updateIncidentReportingStatus() {
  var statusDiv = document.getElementById('incidentReportingStatus');
  if (!statusDiv) return;

  var myReports = incidentReportingData.myReports;
  var processing = myReports.filter(function(r) {
    return r.status === 'processing' || r.status === 'pending' || r.status === 'received';
  }).length;
  var resolved = myReports.filter(function(r) {
    return r.status === 'resolved';
  }).length;

  statusDiv.innerHTML = `
    <div class="status-item">
      <span class="status-label">Phản ánh của tôi:</span>
      <span class="status-value">${myReports.length}</span>
    </div>
    <div class="status-item">
      <span class="status-label">Đang xử lý:</span>
      <span class="status-value warning">${processing}</span>
    </div>
    <div class="status-item">
      <span class="status-label">Đã giải quyết:</span>
      <span class="status-value success">${resolved}</span>
    </div>
  `;
}

function submitReport() {
  var type = document.getElementById('reportType').value;
  var title = document.getElementById('reportTitle').value;
  var content = document.getElementById('reportContent').value;
  var location = document.getElementById('reportLocation').value;
  var contactName = document.getElementById('reportContactName').value;
  var contactPhone = document.getElementById('reportContactPhone').value;
  var contactEmail = document.getElementById('reportContactEmail').value;
  var isAnonymous = document.getElementById('reportAnonymous').checked;

  // Validation
  if (!type || !title || !content) {
    alert('Vui lòng điền các trường bắt buộc (*)');
    return;
  }

  // Generate report ID
  var reportId = 'RPT-' + String(incidentReportingData.myReports.length + 1).padStart(3, '0');

  // Create report
  var report = {
    id: reportId,
    type: type,
    title: title,
    content: content,
    location: location || 'Chưa có địa chỉ',
    coordinates: document.getElementById('coordinatesValue').textContent || '',
    status: 'pending',
    createdAt: new Date().toLocaleString('vi-VN'),
    userId: accountData.currentUser.id,
    userName: isAnonymous ? 'Ẩn danh' : accountData.currentUser.name,
    contactInfo: isAnonymous ? null : {
      name: contactName,
      phone: contactPhone,
      email: contactEmail
    },
    evidence: [],
    history: [{
      time: new Date().toLocaleString('vi-VN'),
      action: 'Tạo phản ánh',
      user: accountData.currentUser.name
    }]
  };

  incidentReportingData.myReports.unshift(report);
  saveIncidentReportingData();
  updateIncidentReportingStatus();

  // Add to audit log
  addAuditLog('create', 'Tạo phản ánh: ' + reportId);

  alert('Đã gửi phản ánh thành công! Mã số: ' + reportId);

  // Reset form
  resetReportForm();

  // Close modal
  document.getElementById('createReportModal').style.display = 'none';

  logActivity('report_created', 'Tạo phản ánh: ' + reportId);
}

function resetReportForm() {
  document.getElementById('reportType').value = '';
  document.getElementById('reportTitle').value = '';
  document.getElementById('reportContent').value = '';
  document.getElementById('reportLocation').value = '';
  document.getElementById('coordinatesDisplay').style.display = 'none';
  document.getElementById('coordinatesValue').textContent = '';
  document.getElementById('reportImage').value = '';
  document.getElementById('reportVideo').value = '';
  document.getElementById('reportContactName').value = '';
  document.getElementById('reportContactPhone').value = '';
  document.getElementById('reportContactEmail').value = '';
  document.getElementById('reportAnonymous').checked = false;
}

function selectLocationOnMap() {
  // Simulate location selection
  alert('Chọn vị trí trên bản đồ (tính năng demo)');
  document.getElementById('reportLocation').value = 'Quận 1, TP.HCM';
  document.getElementById('coordinatesDisplay').style.display = 'block';
  document.getElementById('coordinatesValue').textContent = '10.7769, 106.7009';
}

function useGpsLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      function(position) {
        var lat = position.coords.latitude.toFixed(6);
        var lng = position.coords.longitude.toFixed(6);
        document.getElementById('reportLocation').value = 'Vị trí GPS';
        document.getElementById('coordinatesDisplay').style.display = 'block';
        document.getElementById('coordinatesValue').textContent = lat + ', ' + lng;
      },
      function(error) {
        alert('Không thể lấy vị trí GPS: ' + error.message);
      }
    );
  } else {
    alert('Trình duyệt không hỗ trợ GPS');
  }
}

function renderMyReports() {
  var filtered = incidentReportingData.myReports.filter(function(report) {
    return incidentReportingData.filters.status === 'all' || report.status === incidentReportingData.filters.status;
  });

  var tableBody = document.getElementById('myReportsTableBody');
  if (!tableBody) return;

  var typeLabels = {
    accident: 'Tai nạn',
    congestion: 'Kẹt xe',
    flood: 'Ngập nước',
    obstacle: 'Vật cản',
    road_damage: 'Hỏng đường',
    traffic_light: 'Hỏng đèn',
    other: 'Khác'
  };

  var statusLabels = {
    pending: 'Chờ tiếp nhận',
    received: 'Đã tiếp nhận',
    processing: 'Đang xử lý',
    resolved: 'Đã giải quyết',
    rejected: 'Đã từ chối'
  };

  tableBody.innerHTML = filtered.map(function(report) {
    var canEdit = report.status === 'pending';
    var canCancel = report.status === 'pending';

    return `
      <tr>
        <td>${report.id}</td>
        <td>${typeLabels[report.type] || report.type}</td>
        <td>${report.title}</td>
        <td>${report.location}</td>
        <td><span class="status-badge ${report.status}">${statusLabels[report.status]}</span></td>
        <td>${report.createdAt}</td>
        <td>
          <button class="btn btn-sm btn-primary" onclick="viewMyReportDetail('${report.id}')">Xem</button>
          ${canEdit ? '<button class="btn btn-sm btn-secondary" onclick="editMyReport(\'' + report.id + '\')">Sửa</button>' : ''}
          ${canCancel ? '<button class="btn btn-sm btn-danger" onclick="cancelMyReport(\'' + report.id + '\')">Hủy</button>' : ''}
        </td>
      </tr>
    `;
  }).join('');
}

function viewMyReportDetail(reportId) {
  var report = incidentReportingData.myReports.find(function(r) {
    return r.id === reportId;
  });

  if (!report) return;

  document.getElementById('myReportDetailId').textContent = report.id;
  document.getElementById('detailReportType').textContent = report.type;
  document.getElementById('detailReportTitle').textContent = report.title;
  document.getElementById('detailReportContent').textContent = report.content;
  document.getElementById('detailReportLocation').textContent = report.location;
  document.getElementById('detailReportCoordinates').textContent = report.coordinates || 'N/A';
  document.getElementById('detailReportStatus').textContent = report.status;
  document.getElementById('detailReportCreatedAt').textContent = report.createdAt;

  // Render evidence
  var evidenceList = document.getElementById('detailReportEvidence');
  if (report.evidence && report.evidence.length > 0) {
    evidenceList.innerHTML = report.evidence.map(function(e) {
      var icon = e.type === 'image' ? '📷' : e.type === 'video' ? '📹' : '📄';
      return `
        <div class="evidence-item">
          <span class="evidence-icon">${icon}</span>
          <span class="evidence-name">${e.name}</span>
          <button class="btn btn-sm btn-secondary">Xem</button>
        </div>
      `;
    }).join('');
  } else {
    evidenceList.innerHTML = '<p style="color: #999; font-size: 13px;">Không có minh chứng</p>';
  }

  // Render history
  var historyList = document.getElementById('detailReportHistory');
  historyList.innerHTML = report.history.map(function(h) {
    return `
      <div class="history-item">
        <span class="history-time">${h.time}</span>
        <span class="history-action">${h.action}</span>
        <span class="history-user">${h.user}</span>
      </div>
    `;
  }).join('');

  document.getElementById('myReportDetailModal').style.display = 'block';
}

function editMyReport(reportId) {
  var report = incidentReportingData.myReports.find(function(r) {
    return r.id === reportId;
  });

  if (!report) return;

  // Populate create report form with existing data
  document.getElementById('reportType').value = report.type;
  document.getElementById('reportTitle').value = report.title;
  document.getElementById('reportContent').value = report.content;
  document.getElementById('reportLocation').value = report.location;

  // Store the report ID being edited
  document.getElementById('createReportModal').setAttribute('data-editing', reportId);

  // Change submit button text
  document.getElementById('submitReportBtn').textContent = '💾 Cập nhật phản ánh';

  document.getElementById('createReportModal').style.display = 'block';
}

function cancelMyReport(reportId) {
  if (confirm('Bạn có chắc chắn muốn hủy phản ánh này?')) {
    var report = incidentReportingData.myReports.find(function(r) {
      return r.id === reportId;
    });

    if (report) {
      report.status = 'rejected';
      report.history.push({
        time: new Date().toLocaleString('vi-VN'),
        action: 'Hủy phản ánh',
        user: accountData.currentUser.name
      });

      saveIncidentReportingData();
      updateIncidentReportingStatus();
      renderMyReports();

      addAuditLog('update', 'Hủy phản ánh: ' + reportId);

      alert('Đã hủy phản ánh!');
    }
  }
}

function addAdditionalInfo() {
  var additionalInfo = document.getElementById('additionalInfo').value;
  var additionalImage = document.getElementById('additionalImage').files;

  if (!additionalInfo && additionalImage.length === 0) {
    alert('Vui lòng nhập thông tin bổ sung hoặc tải ảnh');
    return;
  }

  var reportId = document.getElementById('myReportDetailId').textContent;
  var report = incidentReportingData.myReports.find(function(r) {
    return r.id === reportId;
  });

  if (report) {
    if (additionalInfo) {
      report.content += '\n\n[Bổ sung ' + new Date().toLocaleString('vi-VN') + ']: ' + additionalInfo;
    }

    if (additionalImage.length > 0) {
      for (var i = 0; i < additionalImage.length; i++) {
        report.evidence.push({
          type: 'image',
          name: additionalImage[i].name
        });
      }
    }

    report.history.push({
      time: new Date().toLocaleString('vi-VN'),
      action: 'Bổ sung thông tin',
      user: accountData.currentUser.name
    });

    saveIncidentReportingData();

    alert('Đã gửi bổ sung!');
    document.getElementById('additionalInfo').value = '';
    document.getElementById('additionalImage').value = '';

    addAuditLog('update', 'Bổ sung thông tin phản ánh: ' + reportId);
  }
}

function renderVerificationQueue() {
  var filtered = incidentReportingData.verificationQueue.filter(function(report) {
    var matchStatus = incidentReportingData.filters.verificationStatus === 'all' || report.verificationStatus === incidentReportingData.filters.verificationStatus;
    var matchReliability = incidentReportingData.filters.reliability === 'all' || report.reliability === incidentReportingData.filters.reliability;
    return matchStatus && matchReliability;
  });

  var tableBody = document.getElementById('verificationTableBody');
  if (!tableBody) return;

  var typeLabels = {
    accident: 'Tai nạn',
    congestion: 'Kẹt xe',
    flood: 'Ngập nước',
    obstacle: 'Vật cản',
    road_damage: 'Hỏng đường',
    traffic_light: 'Hỏng đèn',
    other: 'Khác'
  };

  var verificationStatusLabels = {
    pending: 'Chờ xác minh',
    verified: 'Đã xác minh',
    duplicate: 'Trùng lặp',
    invalid: 'Không hợp lệ'
  };

  var reliabilityLabels = {
    high: 'Cao',
    medium: 'Trung bình',
    low: 'Thấp'
  };

  tableBody.innerHTML = filtered.map(function(report) {
    var isPending = report.verificationStatus === 'pending';

    return `
      <tr>
        <td>${report.id}</td>
        <td>${typeLabels[report.type] || report.type}</td>
        <td>${report.title}</td>
        <td>${report.userName}</td>
        <td><span class="reliability-badge ${report.reliability}">${reliabilityLabels[report.reliability]}</span></td>
        <td><span class="verification-badge ${report.verificationStatus}">${verificationStatusLabels[report.verificationStatus]}</span></td>
        <td>${report.verifiedBy || '-'}</td>
        <td>
          <button class="btn btn-sm btn-secondary" onclick="viewVerificationDetail('${report.id}')">Xem</button>
          ${isPending ? `
            <button class="btn btn-sm btn-primary" onclick="verifyReport('${report.id}', 'verified')">✓ Xác minh</button>
            <button class="btn btn-sm btn-warning" onclick="verifyReport('${report.id}', 'duplicate')">🔁 Trùng</button>
            <button class="btn btn-sm btn-danger" onclick="verifyReport('${report.id}', 'invalid')">✗ Không hợp lệ</button>
          ` : ''}
        </td>
      </tr>
    `;
  }).join('');
}

function verifyReport(reportId, status) {
  var report = incidentReportingData.verificationQueue.find(function(r) {
    return r.id === reportId;
  });

  if (report) {
    report.verificationStatus = status;
    report.verifiedBy = accountData.currentUser.id;
    report.verifiedAt = new Date().toLocaleString('vi-VN');

    saveIncidentReportingData();
    renderVerificationQueue();

    addAuditLog('update', 'Xác minh phản ánh: ' + reportId + ' - ' + status);

    alert('Đã xác minh phản ánh!');
  }
}

function viewVerificationDetail(reportId) {
  // Open report detail modal
  viewMyReportDetail(reportId);
}

function saveIncidentReportingData() {
  localStorage.setItem('sosmap_incident_reporting', JSON.stringify(incidentReportingData));
}

// Incident Reporting Event Listeners
document.getElementById('createReportBtn').addEventListener('click', function() {
  document.getElementById('createReportModal').style.display = 'block';
  document.getElementById('createReportModal').removeAttribute('data-editing');
  document.getElementById('submitReportBtn').textContent = '📤 Gửi phản ánh';
});

document.getElementById('myReportsBtn').addEventListener('click', function() {
  document.getElementById('myReportsModal').style.display = 'block';
  renderMyReports();
});

document.getElementById('verificationBtn').addEventListener('click', function() {
  document.getElementById('verificationModal').style.display = 'block';
  renderVerificationQueue();
});

document.getElementById('closeCreateReportModal').addEventListener('click', function() {
  document.getElementById('createReportModal').style.display = 'none';
});

document.getElementById('resetReportBtn').addEventListener('click', function() {
  resetReportForm();
});

document.getElementById('submitReportBtn').addEventListener('click', function() {
  var editingId = document.getElementById('createReportModal').getAttribute('data-editing');
  if (editingId) {
    // Update existing report
    submitReport();
    document.getElementById('createReportModal').removeAttribute('data-editing');
    document.getElementById('submitReportBtn').textContent = '📤 Gửi phản ánh';
  } else {
    // Create new report
    submitReport();
  }
});

document.getElementById('selectLocationBtn').addEventListener('click', function() {
  selectLocationOnMap();
});

document.getElementById('useGpsBtn').addEventListener('click', function() {
  useGpsLocation();
});

document.getElementById('closeMyReportsModal').addEventListener('click', function() {
  document.getElementById('myReportsModal').style.display = 'none';
});

document.getElementById('closeMyReportsBtn').addEventListener('click', function() {
  document.getElementById('myReportsModal').style.display = 'none';
});

document.getElementById('closeMyReportDetailModal').addEventListener('click', function() {
  document.getElementById('myReportDetailModal').style.display = 'none';
});

document.getElementById('closeMyReportDetailBtn').addEventListener('click', function() {
  document.getElementById('myReportDetailModal').style.display = 'none';
});

document.getElementById('addAdditionalInfoBtn').addEventListener('click', function() {
  addAdditionalInfo();
});

document.getElementById('applyMyReportsFiltersBtn').addEventListener('click', function() {
  incidentReportingData.filters.status = document.getElementById('myReportsStatusFilter').value;
  renderMyReports();
});

document.getElementById('closeVerificationModal').addEventListener('click', function() {
  document.getElementById('verificationModal').style.display = 'none';
});

document.getElementById('closeVerificationBtn').addEventListener('click', function() {
  document.getElementById('verificationModal').style.display = 'none';
});

document.getElementById('applyVerificationFiltersBtn').addEventListener('click', function() {
  incidentReportingData.filters.verificationStatus = document.getElementById('verificationStatusFilter').value;
  incidentReportingData.filters.reliability = document.getElementById('verificationReliabilityFilter').value;
  renderVerificationQueue();
});

// Make functions available globally
window.viewMyReportDetail = viewMyReportDetail;
window.editMyReport = editMyReport;
window.cancelMyReport = cancelMyReport;
window.verifyReport = verifyReport;
window.viewVerificationDetail = viewVerificationDetail;

// Initialize incident reporting on page load
document.addEventListener('DOMContentLoaded', function() {
  initializeIncidentReporting();
  initializeMobileMenu();
  initializeNavigationActiveState();
  initializeTrafficStatus();
  initializeUsers();
  initializeDataSources();
  initializeAdminPanel();
  initializeOperationsSystem();
  initializeReportingSystem();
  initializePrivacySystem();
  initializeOfflineSystem();
  initializePlanningSystem();
  initializeGovernanceSystem();
  initializeCommunitySystem();
  initializeMissingPersonsSystem();
  initializePublicSafetySystem();
  initializeFireInfrastructureSystem();
  initializeEmergencyCareSystem();
  initializePublicHealthSystem();
  initializeReliefLogisticsSystem();
  initializeEmergencyIntegrationsSystem();
  initializeRescueSystem();
  initializeFloodEvacuationSystem();
  initializeEarlyWarningSystem();
  initializeMultiHazardSystem();
  initializeCache();
  initializeLazyLoading();
  initializeMobileFeatures();
  initializeGeolocationSystem();
  initializeIncidentAdmin();
  initializeAccountSystem();
  initializeSecuritySystem();
});

// Multi-Hazard Incidents System
var multiHazardIncidents = [];
var incidentHeatMap = null;

var incidentTypes = {
  storm: 'Bão, áp thấp nhiệt độ và gió mạnh',
  flood: 'Lũ lụt, lũ quét và nước dâng',
  landslide: 'Sạt lở đất, sạt lở bờ sông và bờ biển',
  earthquake: 'Động đất, sóng thần và rung chấn',
  drought: 'Hạn hán, xâm nhập mặn và thiếu nước',
  fire: 'Cháy rừng, cháy nhà và nổ',
  accident: 'Tai nạn giao thông và sự cố công trình',
  disease: 'Dịch bệnh, ổ dịch và nguy cơ lây nhiễm',
  pollution: 'Ô nhiễm không khí, nguồn nước và hóa chất độc hại',
  extreme_weather: 'Nắng nóng cực đoan, rét đậm rét hại và lốc xoáy',
  infrastructure: 'Mất điện, mất nước, mất sóng và sự cố hạ tầng',
  maritime: 'Sự cố tàu thuyền, hàng hải và khu vực biển đảo',
  security: 'Sự cố an ninh, mất tích và trẻ em gặp nguy hiểm',
  other: 'Sự cố khác'
};

var incidentSeverities = {
  1: { label: 'Cấp 1 - Thấp', class: 'severity-1', color: '#2ecc71' },
  2: { label: 'Cấp 2 - Trung bình', class: 'severity-2', color: '#3498db' },
  3: { label: 'Cấp 3 - Cao', class: 'severity-3', color: '#f39c12' },
  4: { label: 'Cấp 4 - Rất cao', class: 'severity-4', color: '#e67e22' },
  5: { label: 'Cấp 5 - Nghiêm trọng', class: 'severity-5', color: '#e74c3c' }
};

var incidentStatuses = {
  new: 'Mới',
  in_progress: 'Đang xử lý',
  controlled: 'Đã kiểm soát',
  resolved: 'Đã giải quyết'
};

function initializeMultiHazardSystem() {
  var savedIncidents = localStorage.getItem('sosmap_multihazard_incidents');
  if (savedIncidents) {
    multiHazardIncidents = JSON.parse(savedIncidents);
  }

  updateMultiHazardPanel();

  document.getElementById('createIncidentBtn').addEventListener('click', function() {
    document.getElementById('createIncidentModal').style.display = 'block';
  });

  document.getElementById('viewIncidentsBtn').addEventListener('click', function() {
    renderIncidentsList();
    document.getElementById('viewIncidentsModal').style.display = 'block';
  });

  document.getElementById('heatMapBtn').addEventListener('click', function() {
    document.getElementById('heatMapModal').style.display = 'block';
    initializeIncidentHeatMap();
  });

  document.getElementById('closeCreateIncidentModal').addEventListener('click', function() {
    document.getElementById('createIncidentModal').style.display = 'none';
  });

  document.getElementById('closeViewIncidentsModal').addEventListener('click', function() {
    document.getElementById('viewIncidentsModal').style.display = 'none';
  });

  document.getElementById('closeHeatMapModal').addEventListener('click', function() {
    document.getElementById('heatMapModal').style.display = 'none';
  });

  document.getElementById('closeIncidentDetailModal').addEventListener('click', function() {
    document.getElementById('incidentDetailModal').style.display = 'none';
  });

  document.getElementById('cancelIncidentBtn').addEventListener('click', function() {
    document.getElementById('createIncidentModal').style.display = 'none';
  });

  document.getElementById('incidentTypeFilter').addEventListener('change', renderIncidentsList);
  document.getElementById('incidentSeverityFilter').addEventListener('change', renderIncidentsList);
  document.getElementById('incidentStatusFilter').addEventListener('change', renderIncidentsList);
}

function updateMultiHazardPanel() {
  var statusDiv = document.getElementById('multihazardStatus');
  if (statusDiv) {
    var openIncidents = multiHazardIncidents.filter(function(i) { return i.status !== 'resolved'; }).length;
    var highSeverity = multiHazardIncidents.filter(function(i) { return i.severity >= 4 && i.status !== 'resolved'; }).length;
    var criticalSeverity = multiHazardIncidents.filter(function(i) { return i.severity === 5 && i.status !== 'resolved'; }).length;

    statusDiv.innerHTML = `
      <div class="status-item">
        <span class="status-label">Sự cố mở:</span>
        <span class="status-value">${openIncidents}</span>
      </div>
      <div class="status-item">
        <span class="status-label">Cấp độ cao:</span>
        <span class="status-value ${highSeverity > 0 ? 'warning' : 'success'}">${highSeverity}</span>
      </div>
      <div class="status-item">
        <span class="status-label">Cấp 5 (Nghiêm trọng):</span>
        <span class="status-value ${criticalSeverity > 0 ? 'critical' : 'success'}">${criticalSeverity}</span>
      </div>
    `;
  }
}

function getIncidentLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      function(position) {
        document.getElementById('incidentLat').value = position.coords.latitude.toFixed(6);
        document.getElementById('incidentLng').value = position.coords.longitude.toFixed(6);
      },
      function(error) {
        alert('Không thể lấy vị trí: ' + error.message);
      },
      { enableHighAccuracy: true }
    );
  } else {
    alert('Trình duyệt không hỗ trợ GPS');
  }
}

function submitIncident() {
  var type = document.getElementById('incidentType').value;
  var severity = parseInt(document.getElementById('incidentSeverity').value);
  var title = document.getElementById('incidentTitle').value;
  var description = document.getElementById('incidentDescription').value;
  var lat = document.getElementById('incidentLat').value;
  var lng = document.getElementById('incidentLng').value;
  var area = document.getElementById('incidentArea').value;
  var source = document.getElementById('incidentSource').value;
  var reliability = document.getElementById('incidentReliability').value;
  var reports = document.getElementById('incidentReports').value;

  if (!type || !severity || !title || !description) {
    alert('Vui lòng điền đầy đủ các trường bắt buộc');
    return;
  }

  var incident = {
    id: 'INC-' + Date.now(),
    type: type,
    severity: severity,
    title: title,
    description: description,
    location: lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : null,
    area: area,
    source: source,
    reliability: reliability,
    reports: reports ? reports.split(',').map(function(r) { return r.trim(); }) : [],
    hasImage: document.getElementById('incidentImage').files.length > 0,
    hasVideo: document.getElementById('incidentVideo').files.length > 0,
    hasAudio: document.getElementById('incidentAudio').files.length > 0,
    status: 'new',
    isOfficial: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    timeline: []
  };

  incident.timeline.push({
    action: 'created',
    timestamp: new Date().toISOString(),
    note: 'Sự cố được tạo'
  });

  multiHazardIncidents.push(incident);
  saveMultiHazardIncidents();
  updateMultiHazardPanel();

  document.getElementById('createIncidentModal').style.display = 'none';
  document.getElementById('incidentForm').reset();
  alert('Đã tạo sự cố! Mã: ' + incident.id);
  logActivity('incident_create', 'Tạo sự cố đa rủi ro: ' + incident.id);
}

function renderIncidentsList() {
  var list = document.getElementById('incidentsList');
  if (!list) return;

  var typeFilter = document.getElementById('incidentTypeFilter').value;
  var severityFilter = document.getElementById('incidentSeverityFilter').value;
  var statusFilter = document.getElementById('incidentStatusFilter').value;

  var filtered = multiHazardIncidents.filter(function(i) {
    var typeMatch = typeFilter === 'all' || i.type === typeFilter;
    var severityMatch = severityFilter === 'all' || i.severity === parseInt(severityFilter);
    var statusMatch = statusFilter === 'all' || i.status === statusFilter;
    return typeMatch && severityMatch && statusMatch;
  });

  if (filtered.length === 0) {
    list.innerHTML = '<div class="empty-state"><p>Không có sự cố nào</p></div>';
    return;
  }

  list.innerHTML = filtered.map(function(incident) {
    var typeLabel = incidentTypes[incident.type] || incident.type;
    var severity = incidentSeverities[incident.severity];
    var status = incidentStatuses[incident.status];
    var time = new Date(incident.createdAt).toLocaleString('vi-VN');

    return `
      <tr>
        <td>${incident.id}</td>
        <td>${typeLabel}</td>
        <td>${incident.title}</td>
        <td><span class="severity-badge ${severity.class}">${severity.label}</span></td>
        <td><span class="status-badge ${incident.status}">${status}</span></td>
        <td>${time}</td>
        <td><button class="btn btn-sm" onclick="viewIncidentDetail('${incident.id}')">Xem</button></td>
      </tr>
    `;
  }).join('');
}

function initializeIncidentHeatMap() {
  if (incidentHeatMap) {
    incidentHeatMap.remove();
  }

  incidentHeatMap = L.map('incidentHeatMap').setView([10.7769, 106.7009], 12);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(incidentHeatMap);

  multiHazardIncidents.forEach(function(incident) {
    if (incident.location) {
      var severity = incidentSeverities[incident.severity];
      var marker = L.circleMarker([incident.location.lat, incident.location.lng], {
        radius: incident.severity * 5000,
        color: severity.color,
        fillColor: severity.color,
        fillOpacity: 0.4
      }).addTo(incidentHeatMap).bindPopup('<b>' + incident.id + '</b><br>' + incident.title + '<br>' + severity.label);
    }
  });
}

function viewIncidentDetail(incidentId) {
  var incident = multiHazardIncidents.find(function(i) { return i.id === incidentId; });
  if (!incident) return;

  var typeLabel = incidentTypes[incident.type] || incident.type;
  var severity = incidentSeverities[incident.severity];
  var status = incidentStatuses[incident.status];

  var content = document.getElementById('incidentDetailContent');
  content.innerHTML = `
    <div class="detail-row">
      <strong>Mã sự cố:</strong> ${incident.id}
    </div>
    <div class="detail-row">
      <strong>Loại:</strong> ${typeLabel}
    </div>
    <div class="detail-row">
      <strong>Cấp độ:</strong> <span class="severity-badge ${severity.class}">${severity.label}</span>
    </div>
    <div class="detail-row">
      <strong>Trạng thái:</strong> <span class="status-badge ${incident.status}">${status}</span></div>
    <div class="detail-row">
      <strong>Tiêu đề:</strong> ${incident.title}
    </div>
    <div class="detail-row">
      <strong>Mô tả:</strong> ${incident.description}
    </div>
    <div class="detail-row">
      <strong>Vị trí:</strong> ${incident.location ? incident.location.lat + ', ' + incident.location.lng : 'Chưa có'}
    </div>
    <div class="detail-row">
      <strong>Khu vực:</strong> ${incident.area || 'Chưa có'}
    </div>
    <div class="detail-row">
      <strong>Nguồn tin:</strong> ${incident.source || 'Chưa có'}
    </div>
    <div class="detail-row">
      <strong>Mức độ tin cậy:</strong> ${incident.reliability}
    </div>
    <div class="detail-row">
      <strong>Đã xác nhận chính thức:</strong> ${incident.isOfficial ? 'Có' : 'Chưa'}
    </div>
    <div class="detail-row">
      <strong>Phản ánh liên kết:</strong> ${incident.reports.length > 0 ? incident.reports.join(', ') : 'Không có'}
    </div>
    <div class="detail-row">
      <strong>Đính kèm:</strong> ${incident.hasImage ? 'Ảnh' : ''} ${incident.hasVideo ? 'Video' : ''} ${incident.hasAudio ? 'Âm thanh' : ''} ${!incident.hasImage && !incident.hasVideo && !incident.hasAudio ? 'Không có' : ''}
    </div>
  `;

  var timelineDiv = document.getElementById('incidentTimeline');
  timelineDiv.innerHTML = incident.timeline.map(function(entry) {
    var time = new Date(entry.timestamp).toLocaleString('vi-VN');
    return `
      <div class="timeline-entry">
        <div class="timeline-time">${time}</div>
        <div class="timeline-action">${entry.action}</div>
        <div class="timeline-note">${entry.note}</div>
      </div>
    `;
  }).join('');

  document.getElementById('viewIncidentsModal').style.display = 'none';
  document.getElementById('incidentDetailModal').style.display = 'block';
}

function confirmIncident() {
  alert('Đã xác nhận chính thức sự cố');
  logActivity('incident_confirm', 'Xác nhận chính thức sự cố');
}

function updateIncidentStatus() {
  alert('Cập nhật trạng thái sự cố');
  logActivity('incident_status_update', 'Cập nhật trạng thái sự cố');
}

function addTimelineEntry() {
  alert('Thêm diễn biến mới');
  logActivity('incident_timeline', 'Thêm diễn biến sự cố');
}

function saveMultiHazardIncidents() {
  localStorage.setItem('sosmap_multihazard_incidents', JSON.stringify(multiHazardIncidents));
}

// Flood & Evacuation System
var floodData = {
  waterLevels: [
    { id: 'sg', name: 'Trạm Sài Gòn', location: 'Quận 1', currentLevel: 2.5, warningLevel: 2.0, status: 'warning' },
    { id: 'dn', name: 'Trạm Đồng Nai', location: 'TP Thủ Đức', currentLevel: 1.8, warningLevel: 2.5, status: 'normal' },
    { id: 'vc', name: 'Trạm Vàm Cỏ', location: 'Long An', currentLevel: 3.2, warningLevel: 2.5, status: 'danger' }
  ],
  evacuationPoints: [
    { id: 'ep1', name: 'Trường THCS Nguyễn Du', type: 'shelter', location: 'Quận 1', capacity: 500, current: 320, status: 'available', facilities: ['water', 'electricity', 'medical'] },
    { id: 'ep2', name: 'Công viên Lê Văn Tám', type: 'assembly', location: 'Quận 1', capacity: 1000, current: 850, status: 'warning', facilities: ['water', 'sanitation'] },
    { id: 'ep3', name: 'Sân vận động Thống Nhất', type: 'shelter', location: 'Quận 3', capacity: 2000, current: 2000, status: 'full', facilities: ['water', 'electricity', 'medical', 'sanitation'] },
    { id: 'ep4', name: 'Trường THPT Ngô Gia Tự', type: 'shelter', location: 'Quận 5', capacity: 400, current: 150, status: 'available', facilities: ['water', 'electricity'] }
  ],
  evacuationRoutes: [
    { id: 'r1', from: 'Khu dân cư A', to: 'Trường THCS Nguyễn Du', vehicleType: 'pedestrian', status: 'safe' },
    { id: 'r2', from: 'Khu dân cư B', to: 'Công viên Lê Văn Tám', vehicleType: 'rescue', status: 'safe' },
    { id: 'r3', from: 'Khu dân cư C', to: 'Trường THPT Ngô Gia Tự', vehicleType: 'rescue', status: 'warning' }
  ],
  families: [
    { id: 'h1', name: 'Hộ Nguyễn Văn A', people: 4, specialGroups: ['elderly', 'children'], point: 'Trường THCS Nguyễn Du', status: 'pending' },
    { id: 'h2', name: 'Hộ Trần Thị B', people: 3, specialGroups: ['pregnant'], point: 'Công viên Lê Văn Tám', status: 'arrived' },
    { id: 'h3', name: 'Hộ Lê Văn C', people: 5, specialGroups: ['disabled'], point: 'Trường THPT Ngô Gia Tự', status: 'pending' }
  ],
  pickupRequests: []
};

var floodRiskMap = null;
var evacuationMap = null;

function initializeFloodEvacuationSystem() {
  var savedFloodData = localStorage.getItem('sosmap_flood_data');
  if (savedFloodData) {
    floodData = JSON.parse(savedFloodData);
  }

  updateFloodPanel();

  document.getElementById('floodMapBtn').addEventListener('click', function() {
    document.getElementById('floodMapModal').style.display = 'block';
    initializeFloodRiskMap();
  });

  document.getElementById('evacuationPlanBtn').addEventListener('click', function() {
    document.getElementById('evacuationPlanModal').style.display = 'block';
    initializeEvacuationMap();
  });

  document.getElementById('closeFloodMapModal').addEventListener('click', function() {
    document.getElementById('floodMapModal').style.display = 'none';
  });

  document.getElementById('closeEvacuationPlanModal').addEventListener('click', function() {
    document.getElementById('evacuationPlanModal').style.display = 'none';
  });
}

function updateFloodPanel() {
  var statusDiv = document.getElementById('floodStatus');
  if (statusDiv) {
    var avgLevel = floodData.waterLevels.reduce(function(sum, s) { return sum + s.currentLevel; }, 0) / floodData.waterLevels.length;
    var totalEvacuated = floodData.families.filter(function(f) { return f.status === 'arrived'; }).reduce(function(sum, f) { return sum + f.people; }, 0);
    
    statusDiv.innerHTML = `
      <div class="status-item">
        <span class="status-label">Mực nước:</span>
        <span class="status-value ${avgLevel > 2.5 ? 'danger' : avgLevel > 2.0 ? 'warning' : 'success'}">${avgLevel.toFixed(1)}m (${avgLevel > 2.5 ? 'Nguy hiểm' : avgLevel > 2.0 ? 'Cảnh báo' : 'Bình thường'})</span>
      </div>
      <div class="status-item">
        <span class="status-label">Điểm trú an:</span>
        <span class="status-value">${floodData.evacuationPoints.length} điểm</span>
      </div>
      <div class="status-item">
        <span class="status-label">Người sơ tán:</span>
        <span class="status-value">${totalEvacuated}</span>
      </div>
    `;
  }
}

function initializeFloodRiskMap() {
  if (floodRiskMap) {
    floodRiskMap.remove();
  }

  floodRiskMap = L.map('floodRiskMap').setView([10.7769, 106.7009], 12);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(floodRiskMap);

  // Add flood zones (demo polygons)
  var floodZones = [
    { coords: [[10.77, 106.69], [10.78, 106.69], [10.78, 106.71], [10.77, 106.71]], level: 'high', color: '#e74c3c' },
    { coords: [[10.78, 106.70], [10.79, 106.70], [10.79, 106.72], [10.78, 106.72]], level: 'medium', color: '#f39c12' },
    { coords: [[10.76, 106.68], [10.77, 106.68], [10.77, 106.70], [10.76, 106.70]], level: 'low', color: '#f1c40f' }
  ];

  floodZones.forEach(function(zone) {
    L.polygon(zone.coords, {
      color: zone.color,
      fillColor: zone.color,
      fillOpacity: 0.3
    }).addTo(floodRiskMap).bindPopup('Vùng ngập: ' + zone.level);
  });

  // Add flow direction arrows (demo)
  var flowDirections = [
    { coords: [[10.775, 106.695], [10.778, 106.700]], label: 'Hướng dòng chảy' }
  ];

  flowDirections.forEach(function(flow) {
    L.polyline(flow.coords, {
      color: '#3498db',
      weight: 3,
      dashArray: '10, 10'
    }).addTo(floodRiskMap).bindPopup(flow.label);
  });

  // Add safe zones
  var safeZones = [
    { coords: [[10.79, 106.71], [10.80, 106.71], [10.80, 106.73], [10.79, 106.73]], label: 'Vùng an toàn' }
  ];

  safeZones.forEach(function(zone) {
    L.polygon(zone.coords, {
      color: '#2ecc71',
      fillColor: '#2ecc71',
      fillOpacity: 0.2
    }).addTo(floodRiskMap).bindPopup(zone.label);
  });
}

function initializeEvacuationMap() {
  if (evacuationMap) {
    evacuationMap.remove();
  }

  evacuationMap = L.map('evacuationMap').setView([10.7769, 106.7009], 13);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(evacuationMap);

  // Add evacuation points
  floodData.evacuationPoints.forEach(function(point) {
    var marker = L.marker([10.7769 + Math.random() * 0.01, 106.7009 + Math.random() * 0.01])
      .addTo(evacuationMap)
      .bindPopup('<b>' + point.name + '</b><br>' + point.type + '<br>Sức chứa: ' + point.current + '/' + point.capacity);
  });

  // Add evacuation routes
  floodData.evacuationRoutes.forEach(function(route) {
    L.polyline([
      [10.7769 + Math.random() * 0.01, 106.7009 + Math.random() * 0.01],
      [10.7769 + Math.random() * 0.01, 106.7009 + Math.random() * 0.01]
    ], {
      color: route.status === 'safe' ? '#2ecc71' : '#f39c12',
      weight: 4
    }).addTo(evacuationMap).bindPopup(route.from + ' → ' + route.to);
  });
}

function confirmEvacuation(familyId) {
  var family = floodData.families.find(function(f) { return f.id === familyId; });
  if (family) {
    family.status = 'arrived';
    saveFloodData();
    updateFloodPanel();
    alert('Đã xác nhận: ' + family.name + ' đã đến điểm sơ tán');
    logActivity('evacuation_confirm', 'Xác nhận sơ tán: ' + family.name);
  }
}

function submitPickupRequest() {
  var family = document.getElementById('pickupFamily').value;
  var people = parseInt(document.getElementById('pickupPeople').value);
  var address = document.getElementById('pickupAddress').value;
  var note = document.getElementById('pickupNote').value;

  if (!family || !people || !address) {
    alert('Vui lòng điền đầy đủ các trường bắt buộc');
    return;
  }

  var request = {
    id: 'PU-' + Date.now(),
    family: family,
    people: people,
    address: address,
    note: note,
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  floodData.pickupRequests.push(request);
  saveFloodData();
  alert('Đã đăng ký yêu cầu đưa đón! Mã: ' + request.id);
  logActivity('pickup_request', 'Đăng ký đưa đón: ' + family);

  document.getElementById('pickupFamily').value = '';
  document.getElementById('pickupPeople').value = '';
  document.getElementById('pickupAddress').value = '';
  document.getElementById('pickupNote').value = '';
}

function saveFloodData() {
  localStorage.setItem('sosmap_flood_data', JSON.stringify(floodData));
}

// Emergency Integrations System
var integrationsData = {
  integrations: [
    { id: 'hotline', name: 'Tổng đài khẩn cấp', type: 'phone', status: 'active', contact: '113/114/115', lastUpdate: '2026-10-03 10:30' },
    { id: 'weather', name: 'Khí tượng thủy văn', type: 'api', status: 'active', endpoint: 'https://weather-api.gov.vn', lastUpdate: '2026-10-03 10:25' },
    { id: 'health', name: 'Cơ sở y tế', type: 'api', status: 'active', endpoint: 'https://health-api.gov.vn', lastUpdate: '2026-10-03 10:20' },
    { id: 'fire', name: 'PCCC', type: 'api', status: 'active', endpoint: 'https://fire-api.gov.vn', lastUpdate: 'temp' },
    { id: 'sms', name: 'SMS Gateway', type: 'gateway', status: 'active', endpoint: 'sms://gateway.vn', lastUpdate: 'temp' },
    { id: 'email', name: 'Email Gateway', type: 'gateway', status: 'active', endpoint: 'smtp://email.vn', lastUpdate: 'temp' },
    { id: 'map', name: 'Bản đồ địa chính', type: 'api', status: 'active', endpoint: 'https://map-api.gov.vn', lastUpdate: 'temp' },
    { id: 'payment', name: 'Thanh toán', type: 'gateway', status: 'active', endpoint: 'https://payment.vn', lastUpdate: 'temp' },
    { id: 'iot', name: 'IoT Sensors', type: 'iot', status: 'active', endpoint: 'mqtt://iot.vn', lastUpdate: 'temp' }
  ],
  apiKeys: [],
  apiUsage: []
};

function initializeEmergencyIntegrationsSystem() {
  var savedIntegrations = localStorage.getItem('sosmap_integrations');
  if (savedIntegrations) {
    integrationsData = JSON.parse(savedIntegrations);
  }

  updateIntegrationsPanel();

  document.getElementById('manageIntegrationsBtn').addEventListener('click', function() {
    document.getElementById('manageIntegrationsModal').style.display = 'block';
  });

  document.getElementById('apiManagementBtn').addEventListener('click', function() {
    document.getElementById('apiManagementModal').style.display = 'block';
  });

  document.getElementById('closeManageIntegrationsModal').addEventListener('click', function() {
    document.getElementById('manageIntegrationsModal').style.display = 'none';
  });

  document.getElementById('closeApiManagementModal').addEventListener('click', function() {
    document.getElementById('apiManagementModal').style.display = 'none';
  });
}

function updateIntegrationsPanel() {
  var statusDiv = document.getElementById('integrationsStatus');
  if (statusDiv) {
    statusDiv.innerHTML = '';
    integrationsData.integrations.forEach(function(integration) {
      var icon = getIntegrationIcon(integration.type);
      var statusClass = integration.status === 'active' ? 'active' : 'inactive';
      statusDiv.innerHTML += `
        <div class="integration-item ${statusClass}">
          <span class="integration-icon">${icon}</span>
          <span class="integration-name">${integration.name}</span>
          <span class="integration-status">${integration.status === 'active' ? 'Đang hoạt động' : 'Ngừng hoạt động'}</span>
        </div>
      `;
    });
  }
}

function getIntegrationIcon(type) {
  var icons = {
    phone: '📞',
    api: '🔌',
    gateway: '📡',
    iot: '📡'
  };
  return icons[type] || '🔗';
}

function saveIntegrationsData() {
  localStorage.setItem('sosmap_integrations', JSON.stringify(integrationsData));
}

function testIntegration(id) {
  var integration = integrationsData.integrations.find(function(i) { return i.id === id; });
  if (integration) {
    alert('Kiểm tra kết nối: ' + integration.name + ' (' + integration.endpoint + ')');
    logActivity('integration_test', 'Kiểm tra tích hợp: ' + integration.name);
  }
}

function toggleIntegrationStatus(id) {
  var integration = integrationsData.integrations.find(function(i) { return i.id === id; });
  if (integration) {
    integration.status = integration.status === 'active' ? 'inactive' : 'active';
    saveIntegrationsData();
    updateIntegrationsPanel();
    alert('Đã thay đổi trạng thái: ' + integration.name);
    logActivity('integration_toggle', 'Thay đổi trạng thái: ' + integration.name);
  }
}

function addApiKey() {
  var name = document.getElementById('apiKeyName').value;
  var key = document.getElementById('apiKeyValue').value;
  var endpoint = document.getElementById('apiKeyEndpoint').value;

  if (!name || !key) {
    alert('Vui lòng nhập tên và key!');
    return;
  }

  integrationsData.apiKeys.push({
    id: 'key_' + Date.now(),
    name: name,
    key: key,
    endpoint: endpoint,
    createdAt: new Date().toLocaleString('vi-VN')
  });

  saveIntegrationsData();
  alert('Đã thêm API key!');
  logActivity('api_key_add', 'Thêm API key: ' + name);

  document.getElementById('apiKeyName').value = '';
  document.getElementById('apiKeyValue').value = '';
  document.getElementById('apiKeyEndpoint').value = '';
}

function viewApiUsage() {
  alert('Xem thống kê sử dụng API (demo)');
  logActivity('api_usage_view', 'Xem thống kê sử dụng API');
}

function revokeApiKey(id) {
  integrationsData.apiKeys = integrationsData.apiKeys.filter(function(k) { return k.id !== id; });
  saveIntegrationsData();
  alert('Đã thu hồi API key!');
  logActivity('api_key_revoke', 'Thu hồi API key');
}

// Relief & Logistics System
var reliefData = {
  pendingNeeds: 8,
  inventoryLevel: 72,
  donationAmount: '5.2 tỷ',
  needs: [
    { type: 'food', quantity: 100, unit: 'kg', assignTo: 'Điểm trú A', status: 'pending' },
    { type: 'water', quantity: 50, unit: 'chai', assignTo: 'Hộ B', status: 'completed' }
  ],
  warehouses: [
    { name: 'Kho A', itemType: 'Lương thực', stock: 85, expiry: 'OK', status: 'active' },
    { name: 'Kho B', itemType: 'Thuốc', stock: 25, expiry: '1 tháng', status: 'warning' }
  ]
};

function initializeReliefLogisticsSystem() {
  var savedRelief = localStorage.getItem('sosmap_relief');
  if (savedRelief) {
    reliefData = JSON.parse(savedRelief);
  }

  updateReliefPanel();

  document.getElementById('needsRequestBtn').addEventListener('click', function() {
    document.getElementById('needsRequestModal').style.display = 'block';
  });

  document.getElementById('warehouseBtn').addEventListener('click', function() {
    document.getElementById('warehouseModal').style.display = 'block';
  });

  document.getElementById('donationBtn').addEventListener('click', function() {
    document.getElementById('donationModal').style.display = 'block';
  });

  document.getElementById('distributionBtn').addEventListener('click', function() {
    document.getElementById('distributionModal').style.display = 'block';
  });

  document.getElementById('closeNeedsRequestModal').addEventListener('click', function() {
    document.getElementById('needsRequestModal').style.display = 'none';
  });

  document.getElementById('closeWarehouseModal').addEventListener('click', function() {
    document.getElementById('warehouseModal').style.display = 'none';
  });

  document.getElementById('closeDonationModal').addEventListener('click', function() {
    document.getElementById('donationModal').style.display = 'none';
  });

  document.getElementById('closeDistributionModal').addEventListener('click', function() {
    document.getElementById('distributionModal').style.display = 'none';
  });
}

function updateReliefPanel() {
  document.getElementById('pendingNeeds').textContent = reliefData.pendingNeeds;
  document.getElementById('inventoryLevel').textContent = reliefData.inventoryLevel + '%';
  document.getElementById('donationAmount').textContent = reliefData.donationAmount;
}

function saveReliefData() {
  localStorage.setItem('sosmap_relief', JSON.stringify(reliefData));
}

function submitNeedRequest() {
  var type = document.getElementById('needType').value;
  var quantity = document.getElementById('needQuantity').value;
  var unit = document.getElementById('needUnit').value;
  var deadline = document.getElementById('needDeadline').value;
  var assignTo = document.getElementById('needAssignTo').value;
  var assignName = document.getElementById('needAssignName').value;
  var description = document.getElementById('needDescription').value;

  if (!quantity || !assignName) {
    alert('Vui lòng nhập số lượng và tên!');
    return;
  }

  reliefData.needs.push({
    type: type,
    quantity: quantity,
    unit: unit,
    deadline: deadline,
    assignTo: assignTo,
    assignName: assignName,
    description: description,
    status: 'pending',
    timestamp: new Date().toLocaleString('vi-VN')
  });

  reliefData.pendingNeeds++;
  saveReliefData();
  updateReliefPanel();

  alert('Đã gửi nhu cầu cứu trợ!');
  logActivity('need_request_submit', 'Gửi nhu cầu: ' + type + ' cho ' + assignName);

  document.getElementById('needQuantity').value = '';
  document.getElementById('needUnit').value = '';
  document.getElementById('needDeadline').value = '';
  document.getElementById('needAssignName').value = '';
  document.getElementById('needDescription').value = '';
}

function addReceipt() {
  alert('Thêm phiếu nhập (demo)');
  logActivity('receipt_add', 'Thêm phiếu nhập kho');
}

function addIssue() {
  alert('Thêm phiếu xuất (demo)');
  logActivity('issue_add', 'Thêm phiếu xuất kho');
}

function reportLoss() {
  alert('Ghi nhận mất mát/hỏng (demo)');
  logActivity('loss_report', 'Ghi nhận mất mát/hỏng');
}

function lowStockAlert() {
  alert('Cảnh báo tồn kho thấp (demo)');
  logActivity('low_stock_alert', 'Cảnh báo tồn kho thấp');
}

// Public Health System
var publicHealthData = {
  infectedCases: 45,
  quarantineCount: 12,
  alertLevel: 'Trung bình',
  quarantineList: [
    { name: 'Nguyễn Văn A', type: 'home', startDate: '25/09/2026', endDate: '08/10/2026', status: 'quarantining' },
    { name: 'Trần Thị B', type: 'center', startDate: '26/09/2026', endDate: '09/10/2026', status: 'quarantining' }
  ]
};

function initializePublicHealthSystem() {
  var savedPublicHealth = localStorage.getItem('sosmap_public_health');
  if (savedPublicHealth) {
    publicHealthData = JSON.parse(savedPublicHealth);
  }

  updatePublicHealthPanel();

  document.getElementById('healthInfoBtn').addEventListener('click', function() {
    document.getElementById('healthInfoModal').style.display = 'block';
  });

  document.getElementById('medicalRequestBtn').addEventListener('click', function() {
    document.getElementById('medicalRequestModal').style.display = 'block';
  });

  document.getElementById('quarantineBtn').addEventListener('click', function() {
    document.getElementById('quarantineModal').style.display = 'block';
  });

  document.getElementById('healthDataBtn').addEventListener('click', function() {
    document.getElementById('healthDataModal').style.display = 'block';
  });

  document.getElementById('closeHealthInfoModal').addEventListener('click', function() {
    document.getElementById('healthInfoModal').style.display = 'none';
  });

  document.getElementById('closeMedicalRequestModal').addEventListener('click', function() {
    document.getElementById('medicalRequestModal').style.display = 'none';
  });

  document.getElementById('closeQuarantineModal').addEventListener('click', function() {
    document.getElementById('quarantineModal').style.display = 'none';
  });

  document.getElementById('closeHealthDataModal').addEventListener('click', function() {
    document.getElementById('healthDataModal').style.display = 'none';
  });
}

function updatePublicHealthPanel() {
  document.getElementById('infectedCases').textContent = publicHealthData.infectedCases;
  document.getElementById('quarantineCount').textContent = publicHealthData.quarantineCount;
  document.getElementById('alertLevel').textContent = publicHealthData.alertLevel;
}

function savePublicHealthData() {
  localStorage.setItem('sosmap_public_health', JSON.stringify(publicHealthData));
}

function submitMedicalRequest() {
  var type = document.getElementById('medicalRequestType').value;
  var name = document.getElementById('medicalRequestName').value;
  var symptoms = document.getElementById('medicalRequestSymptoms').value;
  var householdSize = document.getElementById('householdSize').value;
  var closeContacts = document.getElementById('closeContacts').value;

  if (!name || !symptoms) {
    alert('Vui lòng nhập họ tên và triệu chứng!');
    return;
  }

  alert('Đã gửi yêu cầu y tế!');
  logActivity('medical_request_submit', 'Yêu cầu y tế: ' + type + ' cho ' + name);

  document.getElementById('medicalRequestName').value = '';
  document.getElementById('medicalRequestSymptoms').value = '';
  document.getElementById('householdSize').value = '';
  document.getElementById('closeContacts').value = '';
}

function updateBodyTemperature() {
  alert('Cập nhật thân nhiệt (demo)');
  logActivity('body_temp_update', 'Cập nhật thân nhiệt');
}

function requestMedicationDelivery() {
  alert('Yêu cầu giao thuốc (demo)');
  logActivity('medication_delivery', 'Yêu cầu giao thuốc');
}

function requestFoodDelivery() {
  alert('Yêu cầu giao lương thực (demo)');
  logActivity('food_delivery', 'Yêu cầu giao lương thực');
}

function reportEmergency() {
  alert('Báo cáo khẩn cấp (demo)');
  logActivity('quarantine_emergency', 'Báo cáo khẩn cấp trong cách ly');
}

function viewDataHistory() {
  alert('Xem lịch sử sử dụng dữ liệu (demo)');
  logActivity('data_history_view', 'Xem lịch sử dữ liệu sức khỏe');
}

function withdrawHealthConsent() {
  if (confirm('Bạn có chắc muốn rút lại đồng ý sử dụng dữ liệu sức khỏe?')) {
    alert('Đã rút lại đồng ý!');
    logActivity('health_consent_withdraw', 'Rút lại đồng ý dữ liệu sức khỏe');
  }
}

// Emergency Care System
var emergencyCareData = {
  medicalFacilities: 8,
  vulnerablePeople: 12,
  medicationPoints: 5,
  specialNeeds: [
    { name: 'Nguyễn Văn A', type: 'chronic', location: 'Quận 1', status: 'supporting' },
    { name: 'Trần Thị B', type: 'pregnant', location: 'Quận 3', status: 'completed' }
  ],
  priorityList: [
    { name: 'Lê Văn C', type: 'medical_equipment', location: 'Quận 1', status: 'critical' },
    { name: 'Phạm Thị D', type: 'elderly', location: 'Quận 3', status: 'waiting' },
    { name: 'Hoàng Văn E', type: 'disability', location: 'Quận 5', status: 'waiting' }
  ]
};

function initializeEmergencyCareSystem() {
  var savedEmergencyCare = localStorage.getItem('sosmap_emergency_care');
  if (savedEmergencyCare) {
    emergencyCareData = JSON.parse(savedEmergencyCare);
  }

  updateEmergencyCarePanel();

  document.getElementById('medicalFacilitiesBtn').addEventListener('click', function() {
    document.getElementById('medicalFacilitiesModal').style.display = 'block';
  });

  document.getElementById('specialNeedsBtn').addEventListener('click', function() {
    document.getElementById('specialNeedsModal').style.display = 'block';
  });

  document.getElementById('medicationBtn').addEventListener('click', function() {
    document.getElementById('medicationModal').style.display = 'block';
  });

  document.getElementById('priorityListBtn').addEventListener('click', function() {
    document.getElementById('priorityListModal').style.display = 'block';
  });

  document.getElementById('closeMedicalFacilitiesModal').addEventListener('click', function() {
    document.getElementById('medicalFacilitiesModal').style.display = 'none';
  });

  document.getElementById('closeSpecialNeedsModal').addEventListener('click', function() {
    document.getElementById('specialNeedsModal').style.display = 'none';
  });

  document.getElementById('closeMedicationModal').addEventListener('click', function() {
    document.getElementById('medicationModal').style.display = 'none';
  });

  document.getElementById('closePriorityListModal').addEventListener('click', function() {
    document.getElementById('priorityListModal').style.display = 'none';
  });
}

function updateEmergencyCarePanel() {
  document.getElementById('medicalFacilities').textContent = emergencyCareData.medicalFacilities;
  document.getElementById('vulnerablePeople').textContent = emergencyCareData.vulnerablePeople;
  document.getElementById('medicationPoints').textContent = emergencyCareData.medicationPoints;
}

function saveEmergencyCareData() {
  localStorage.setItem('sosmap_emergency_care', JSON.stringify(emergencyCareData));
}

function submitSpecialNeed() {
  var type = document.getElementById('specialNeedType').value;
  var name = document.getElementById('specialName').value;
  var location = document.getElementById('specialLocation').value;
  var description = document.getElementById('specialDescription').value;
  var contact = document.getElementById('specialContact').value;
  var needsInterpreter = document.getElementById('needsInterpreter').checked;

  if (!name || !location) {
    alert('Vui lòng nhập họ tên và vị trí!');
    return;
  }

  emergencyCareData.specialNeeds.push({
    name: name,
    type: type,
    location: location,
    description: description,
    contact: contact,
    needsInterpreter: needsInterpreter,
    status: 'pending',
    timestamp: new Date().toLocaleString('vi-VN')
  });

  emergencyCareData.vulnerablePeople++;
  saveEmergencyCareData();
  updateEmergencyCarePanel();

  alert('Đã đăng ký nhu cầu đặc thù!');
  logActivity('special_need_register', 'Đăng ký nhu cầu: ' + type + ' cho ' + name);

  document.getElementById('specialName').value = '';
  document.getElementById('specialLocation').value = '';
  document.getElementById('specialDescription').value = '';
  document.getElementById('specialContact').value = '';
  document.getElementById('needsInterpreter').checked = false;
}

function requestMedication() {
  var type = document.getElementById('medicationType').value;
  var quantity = document.getElementById('medicationQuantity').value;
  var point = document.getElementById('medicationPoint').value;

  if (!quantity) {
    alert('Vui lòng nhập số lượng!');
    return;
  }

  alert('Đã yêu cầu cấp phát thuốc tại điểm ' + point + '!');
  logActivity('medication_request', 'Yêu cầu thuốc: ' + type + ' - ' + quantity);

  document.getElementById('medicationQuantity').value = '';
}

// Fire & Infrastructure System
var fireInfraData = {
  fireIncidents: 2,
  infraIncidents: 3,
  activeFireInfra: 5,
  fireReports: [
    { id: 'FIRE-001', type: 'fire', location: 'Quận 1', trapped: 0, status: 'dousing' },
    { id: 'FIRE-002', type: 'smoke', location: 'Quận 3', trapped: 2, status: 'rescue' }
  ],
  infraReports: [
    { type: 'power', location: 'Quận 1', agency: 'EVN', status: 'processing', eta: '30 phút' },
    { type: 'water', location: 'Quận 3', agency: 'Tân Hòa', status: 'processing', eta: '45 phút' },
    { type: 'pole', location: 'Quận 5', agency: 'EVN', status: 'completed', eta: '60 phút' }
  ],
  agencyAssignments: []
};

function initializeFireInfrastructureSystem() {
  var savedFireInfra = localStorage.getItem('sosmap_fire_infra');
  if (savedFireInfra) {
    fireInfraData = JSON.parse(savedFireInfra);
  }

  updateFirePanel();

  document.getElementById('fireReportBtn').addEventListener('click', function() {
    document.getElementById('fireReportModal').style.display = 'block';
  });

  document.getElementById('infraReportBtn').addEventListener('click', function() {
    document.getElementById('infraReportModal').style.display = 'block';
  });

  document.getElementById('fireStatusBtn').addEventListener('click', function() {
    document.getElementById('fireStatusModal').style.display = 'block';
  });

  document.getElementById('fireAgencyBtn').addEventListener('click', function() {
    document.getElementById('fireAgencyModal').style.display = 'block';
  });

  document.getElementById('closeFireReportModal').addEventListener('click', function() {
    document.getElementById('fireReportModal').style.display = 'none';
  });

  document.getElementById('closeInfraReportModal').addEventListener('click', function() {
    document.getElementById('infraReportModal').style.display = 'none';
  });

  document.getElementById('closeFireStatusModal').addEventListener('click', function() {
    document.getElementById('fireStatusModal').style.display = 'none';
  });

  document.getElementById('closeFireAgencyModal').addEventListener('click', function() {
    document.getElementById('fireAgencyModal').style.display = 'none';
  });
}

function updateFirePanel() {
  document.getElementById('fireIncidents').textContent = fireInfraData.fireIncidents;
  document.getElementById('infraIncidents').textContent = fireInfraData.infraIncidents;
  document.getElementById('activeFireInfra').textContent = fireInfraData.activeFireInfra;
}

function saveFireInfraData() {
  localStorage.setItem('sosmap_fire_infra', JSON.stringify(fireInfraData));
}

function submitFireReport() {
  var type = document.getElementById('fireType').value;
  var buildingType = document.getElementById('buildingType').value;
  var dangerLevel = document.getElementById('dangerLevel').value;
  var location = document.getElementById('fireLocation').value;
  var trappedPeople = document.getElementById('trappedPeople').value;
  var accessRoute = document.getElementById('accessRoute').value;

  if (!location) {
    alert('Vui lòng nhập vị trí!');
    return;
  }

  fireInfraData.fireReports.push({
    id: 'FIRE-' + (fireInfraData.fireReports.length + 1).toString().padStart(3, '0'),
    type: type,
    buildingType: buildingType,
    dangerLevel: dangerLevel,
    location: location,
    trappedPeople: trappedPeople,
    accessRoute: accessRoute,
    status: 'pending',
    timestamp: new Date().toLocaleString('vi-VN')
  });

  fireInfraData.fireIncidents++;
  fireInfraData.activeFireInfra++;
  saveFireInfraData();
  updateFirePanel();

  alert('Đã báo cáo cháy nổ khẩn cấp! Vị trí đã gửi trực tiếp cho lực lượng PCCC.');
  logActivity('fire_report_submit', 'Báo cáo cháy nổ: ' + type + ' tại ' + location);

  document.getElementById('fireLocation').value = '';
  document.getElementById('trappedPeople').value = '';
  document.getElementById('accessRoute').value = '';
  document.getElementById('firePhoto').value = '';
}

function submitInfraReport() {
  var type = document.getElementById('infraType').value;
  var location = document.getElementById('infraLocation').value;
  var description = document.getElementById('infraDescription').value;
  var agency = document.getElementById('infraAgency').value;

  if (!location || !description) {
    alert('Vui lòng nhập đầy đủ thông tin!');
    return;
  }

  fireInfraData.infraReports.push({
    type: type,
    location: location,
    description: description,
    agency: agency,
    status: 'pending',
    timestamp: new Date().toLocaleString('vi-VN')
  });

  fireInfraData.infraIncidents++;
  fireInfraData.activeFireInfra++;
  saveFireInfraData();
  updateFirePanel();

  alert('Đã báo cáo sự cố hạ tầng!');
  logActivity('infra_report_submit', 'Báo cáo sự cố hạ tầng: ' + type + ' tại ' + location);

  document.getElementById('infraLocation').value = '';
  document.getElementById('infraDescription').value = '';
  document.getElementById('infraAgency').value = '';
}

function assignAgency() {
  var type = document.getElementById('infraTypeAssign').value;
  var agencyName = document.getElementById('agencyName').value;
  var contact = document.getElementById('agencyContact').value;

  if (!agencyName || !contact) {
    alert('Vui lòng nhập đầy đủ thông tin!');
    return;
  }

  fireInfraData.agencyAssignments.push({
    type: type,
    agency: agencyName,
    contact: contact,
    timestamp: new Date().toLocaleString('vi-VN')
  });

  saveFireInfraData();
  alert('Đã phân công đơn vị quản lý!');
  logActivity('agency_assign', 'Phân công đơn vị: ' + agencyName + ' cho ' + type);

  document.getElementById('agencyName').value = '';
  document.getElementById('agencyContact').value = '';
}

// Public Safety System
var publicSafetyData = {
  blockedRoads: 5,
  airQuality: 'Tốt',
  envAlerts: 2,
  trafficRestrictions: [
    { road: 'Đường Nguyễn Văn Linh', type: 'Đường một chiều', reason: 'Sơ tán', status: 'active' },
    { road: 'Đường 3/2', type: 'Điểm chặn', reason: 'Tai nạn', status: 'active' }
  ],
  priorityRoutes: [
    { id: 1, route: 'Quận 1 → Bệnh viện Chợ Rẫy', type: 'xe_cuu_thuong' },
    { id: 2, route: 'Quận 3 → Bệnh viện Nhân dân 115', type: 'xe_cuu_hoa' }
  ],
  envIncidents: []
};

function initializePublicSafetySystem() {
  var savedSafety = localStorage.getItem('sosmap_safety');
  if (savedSafety) {
    publicSafetyData = JSON.parse(savedSafety);
  }

  updatePublicSafetyPanel();

  document.getElementById('trafficBtn').addEventListener('click', function() {
    document.getElementById('trafficModal').style.display = 'block';
  });

  document.getElementById('environmentBtn').addEventListener('click', function() {
    document.getElementById('environmentModal').style.display = 'block';
  });

  document.getElementById('infrastructureBtn').addEventListener('click', function() {
    document.getElementById('infrastructureModal').style.display = 'block';
  });

  document.getElementById('safetyGuideBtn').addEventListener('click', function() {
    document.getElementById('safetyGuideModal').style.display = 'block';
  });

  document.getElementById('closeTrafficModal').addEventListener('click', function() {
    document.getElementById('trafficModal').style.display = 'none';
  });

  document.getElementById('closeEnvironmentModal').addEventListener('click', function() {
    document.getElementById('environmentModal').style.display = 'none';
  });

  document.getElementById('closeInfrastructureModal').addEventListener('click', function() {
    document.getElementById('infrastructureModal').style.display = 'none';
  });

  document.getElementById('closeSafetyGuideModal').addEventListener('click', function() {
    document.getElementById('safetyGuideModal').style.display = 'none';
  });
}

function updatePublicSafetyPanel() {
  document.getElementById('blockedRoads').textContent = publicSafetyData.blockedRoads;
  document.getElementById('airQuality').textContent = publicSafetyData.airQuality;
  document.getElementById('envAlerts').textContent = publicSafetyData.envAlerts;
}

function savePublicSafetyData() {
  localStorage.setItem('sosmap_safety', JSON.stringify(publicSafetyData));
}

function addPriorityRoute() {
  alert('Thêm tuyến ưu tiên (demo)');
  logActivity('priority_route_add', 'Thêm tuyến ưu tiên');
}

function addEvacuationPoint() {
  alert('Thêm điểm kết xe (demo)');
  logActivity('evacuation_point_add', 'Thêm điểm kết xe');
}

function submitEnvReport() {
  var type = document.getElementById('envIncidentType').value;
  var location = document.getElementById('envLocation').value;
  var description = document.getElementById('envDescription').value;

  if (!location || !description) {
    alert('Vui lòng nhập đầy đủ thông tin!');
    return;
  }

  publicSafetyData.envIncidents.push({
    type: type,
    location: location,
    description: description,
    timestamp: new Date().toLocaleString('vi-VN')
  });

  publicSafetyData.envAlerts++;
  savePublicSafetyData();
  updatePublicSafetyPanel();

  alert('Đã báo cáo sự cố môi trường!');
  logActivity('env_report_submit', 'Báo cáo sự cố môi trường: ' + type);

  document.getElementById('envLocation').value = '';
  document.getElementById('envDescription').value = '';
}

function submitInfraReport() {
  var type = document.getElementById('infraType').value;
  var location = document.getElementById('infraLocation').value;
  var description = document.getElementById('infraDescription').value;
  var agency = document.getElementById('infraAgency').value;

  if (!location || !description) {
    alert('Vui lòng nhập đầy đủ thông tin!');
    return;
  }

  alert('Đã báo cáo sự cố hạ tầng!');
  logActivity('infra_report_submit', 'Báo cáo sự cố hạ tầng: ' + type);

  document.getElementById('infraLocation').value = '';
  document.getElementById('infraDescription').value = '';
  document.getElementById('infraAgency').value = '';
}

function viewSafePoints() {
  alert('Xem bản đồ điểm an toàn (demo)');
  logActivity('safe_points_view', 'Xem bản đồ điểm an toàn');
}

// Missing Persons System
var missingPersonsData = {
  missingCount: 3,
  foundCount: 15,
  pendingVerification: 2,
  missingPersons: [
    { id: 'MISS-001', name: 'Nguyễn Văn A', age: 25, description: 'Cao 1m75, mặc áo trắng', lastSeen: 'Quận 1', lastSeenTime: '2026-10-02T10:00', priority: 'high', healthRisk: 'medium', status: 'missing', isVulnerable: false, contact: '0901234567' },
    { id: 'MISS-002', name: 'Trần Thị B', age: 12, description: 'Cao 1m50, mặc đồ hồng', lastSeen: 'Quận 3', lastSeenTime: '2026-10-01T15:00', priority: 'critical', healthRisk: 'high', status: 'found', isVulnerable: true, contact: '0902345678' }
  ],
  sightings: [],
  updateHistory: []
};

function initializeMissingPersonsSystem() {
  // Load missing persons data from localStorage
  var savedMissing = localStorage.getItem('sosmap_missing');
  if (savedMissing) {
    missingPersonsData = JSON.parse(savedMissing);
  }

  // Update missing persons panel
  updateMissingPersonsPanel();

  // Initialize missing persons buttons
  document.getElementById('createMissingBtn').addEventListener('click', function() {
    document.getElementById('createMissingModal').style.display = 'block';
  });

  document.getElementById('missingListBtn').addEventListener('click', function() {
    document.getElementById('missingListModal').style.display = 'block';
  });

  document.getElementById('sightingBtn').addEventListener('click', function() {
    document.getElementById('sightingModal').style.display = 'block';
  });

  document.getElementById('familyConnectBtn').addEventListener('click', function() {
    document.getElementById('familyConnectModal').style.display = 'block';
  });

  // Close modals
  document.getElementById('closeCreateMissingModal').addEventListener('click', function() {
    document.getElementById('createMissingModal').style.display = 'none';
  });

  document.getElementById('closeMissingListModal').addEventListener('click', function() {
    document.getElementById('missingListModal').style.display = 'none';
  });

  document.getElementById('closeSightingModal').addEventListener('click', function() {
    document.getElementById('sightingModal').style.display = 'none';
  });

  document.getElementById('closeFamilyConnectModal').addEventListener('click', function() {
    document.getElementById('familyConnectModal').style.display = 'none';
  });
}

function updateMissingPersonsPanel() {
  document.getElementById('missingCount').textContent = missingPersonsData.missingCount;
  document.getElementById('foundCount').textContent = missingPersonsData.foundCount;
  document.getElementById('pendingVerification').textContent = missingPersonsData.pendingVerification;
}

function saveMissingPersonsData() {
  localStorage.setItem('sosmap_missing', JSON.stringify(missingPersonsData));
}

// Create Missing Alert Functions
function createMissingAlert() {
  var name = document.getElementById('missingName').value;
  var age = document.getElementById('missingAge').value;
  var description = document.getElementById('missingDescription').value;
  var lastSeenLocation = document.getElementById('lastSeenLocation').value;
  var lastSeenTime = document.getElementById('lastSeenTime').value;
  var priority = document.getElementById('missingPriority').value;
  var healthRisk = document.getElementById('healthRisk').value;
  var contactPerson = document.getElementById('contactPerson').value;
  var contactPhone = document.getElementById('contactPhone').value;
  var isVulnerable = document.getElementById('isVulnerable').checked;

  if (!name || !lastSeenLocation) {
    alert('Vui lòng nhập họ tên và vị trí!');
    return;
  }

  var missingPerson = {
    id: 'MISS-' + (missingPersonsData.missingPersons.length + 1).toString().padStart(3, '0'),
    name: name,
    age: age,
    description: description,
    lastSeen: lastSeenLocation,
    lastSeenTime: lastSeenTime,
    priority: priority,
    healthRisk: healthRisk,
    status: 'missing',
    isVulnerable: isVulnerable,
    contact: contactPhone,
    contactPerson: contactPerson,
    createdAt: new Date().toLocaleString('vi-VN')
  };

  missingPersonsData.missingPersons.push(missingPerson);
  missingPersonsData.missingCount++;
  missingPersonsData.pendingVerification++;
  saveMissingPersonsData();
  updateMissingPersonsPanel();

  alert('Đã tạo thông báo tìm người mất tích!');
  logActivity('missing_alert_create', 'Tạo thông báo tìm người: ' + name);

  // Clear form
  document.getElementById('missingName').value = '';
  document.getElementById('missingAge').value = '';
  document.getElementById('missingDescription').value = '';
  document.getElementById('lastSeenLocation').value = '';
  document.getElementById('lastSeenTime').value = '';
  document.getElementById('contactPerson').value = '';
  document.getElementById('contactPhone').value = '';
  document.getElementById('isVulnerable').checked = false;
}

// Missing List Functions
function viewMissingDetail(id) {
  var person = missingPersonsData.missingPersons.find(function(p) { return p.id === id; });
  if (person) {
    alert('Chi tiết người mất tích: ' + person.name + '\n' + 
          'Vị trí cuối: ' + person.lastSeen + '\n' +
          'Trạng thái: ' + (person.status === 'missing' ? 'Đang tìm' : 'Đã tìm'));
    logActivity('missing_detail_view', 'Xem chi tiết: ' + id);
  }
}

// Sighting Functions
function submitSighting() {
  var sightingId = document.getElementById('sightingId').value;
  var location = document.getElementById('sightingLocation').value;
  var time = document.getElementById('sightingTime').value;
  var description = document.getElementById('sightingDescription').value;
  var anonymous = document.getElementById('anonymousSighting').checked;

  if (!sightingId || !location) {
    alert('Vui lòng nhập mã và vị trí!');
    return;
  }

  var sighting = {
    missingId: sightingId,
    location: location,
    time: time,
    description: description,
    anonymous: anonymous,
    timestamp: new Date().toLocaleString('vi-VN')
  };

  missingPersonsData.sightings.push(sighting);
  saveMissingPersonsData();

  alert('Đã gửi báo cáo nhìn thấy!');
  logActivity('sighting_submit', 'Báo cáo nhìn thấy: ' + sightingId);

  document.getElementById('sightingId').value = '';
  document.getElementById('sightingLocation').value = '';
  document.getElementById('sightingTime').value = '';
  document.getElementById('sightingDescription').value = '';
  document.getElementById('anonymousSighting').checked = false;
}

// Family Connect Functions
function searchFamily() {
  var search = document.getElementById('familySearch').value;
  alert('Tìm kiếm người thân: ' + search + ' (demo)');
  logActivity('family_search', 'Tìm kiếm người thân: ' + search);
}

function connectFamily(id) {
  alert('Đã kết nối gia đình cho ' + id + '!');
  logActivity('family_connect', 'Kết nối gia đình: ' + id);
}

// Community System
var communityData = {
  newReports: 5,
  unverifiedReports: 12,
  corrections: 2,
  reports: [
    { id: 'RPT-001', content: 'Ngập lụt đường Nguyễn Văn Linh', sender: 'Ẩn danh', status: 'unverified', priority: 'high' },
    { id: 'RPT-002', content: 'Cây đổ trên đường 3/2', sender: 'Nguyễn Văn A', status: 'unverified', priority: 'medium' }
  ],
  channels: [
    { type: 'web', name: 'Web/App', status: 'active', language: 'Tiếng Việt có dấu' },
    { type: 'sms', name: 'SMS', status: 'active', number: '1900 xxxx' },
    { type: 'zalo', name: 'Zalo OA', status: 'active', oa: 'SOSMAP Official' },
    { type: 'hotline', name: 'Tổng đài', status: 'active', number: '1900 xxxx' }
  ],
  correctionHistory: [
    { reportId: 'RPT-001', date: '01/10/2026', content: 'Đã xác minh: Không ngập lụt' },
    { reportId: 'RPT-003', date: '30/09/2026', content: 'Đã xác minh: Cây đã được dọn' }
  ]
};

function initializeCommunitySystem() {
  // Load community data from localStorage
  var savedCommunity = localStorage.getItem('sosmap_community');
  if (savedCommunity) {
    communityData = JSON.parse(savedCommunity);
  }

  // Update community panel
  updateCommunityPanel();

  // Initialize community buttons
  document.getElementById('quickReportBtn').addEventListener('click', function() {
    document.getElementById('quickReportModal').style.display = 'block';
  });

  document.getElementById('verificationBtn').addEventListener('click', function() {
    document.getElementById('verificationModal').style.display = 'block';
  });

  document.getElementById('correctionBtn').addEventListener('click', function() {
    document.getElementById('correctionModal').style.display = 'block';
  });

  document.getElementById('channelBtn').addEventListener('click', function() {
    document.getElementById('channelModal').style.display = 'block';
  });

  // Close modals
  document.getElementById('closeQuickReportModal').addEventListener('click', function() {
    document.getElementById('quickReportModal').style.display = 'none';
  });

  document.getElementById('closeVerificationModal').addEventListener('click', function() {
    document.getElementById('verificationModal').style.display = 'none';
  });

  document.getElementById('closeCorrectionModal').addEventListener('click', function() {
    document.getElementById('correctionModal').style.display = 'none';
  });

  document.getElementById('closeChannelModal').addEventListener('click', function() {
    document.getElementById('channelModal').style.display = 'none';
  });
}

function updateCommunityPanel() {
  document.getElementById('newReports').textContent = communityData.newReports;
  document.getElementById('unverifiedReports').textContent = communityData.unverifiedReports;
  document.getElementById('corrections').textContent = communityData.corrections;
}

function saveCommunityData() {
  localStorage.setItem('sosmap_community', JSON.stringify(communityData));
}

// Quick Report Functions
function submitQuickReport() {
  var type = document.getElementById('reportType').value;
  var priority = document.getElementById('reportPriority').value;
  var content = document.getElementById('reportContent').value;
  var anonymous = document.getElementById('anonymousReport').checked;

  if (!content) {
    alert('Vui lòng nhập nội dung phản ánh!');
    return;
  }

  var report = {
    id: 'RPT-' + (communityData.reports.length + 1).toString().padStart(3, '0'),
    type: type,
    priority: priority,
    content: content,
    sender: anonymous ? 'Ẩn danh' : 'Người dùng',
    status: 'unverified',
    timestamp: new Date().toLocaleString('vi-VN')
  };

  communityData.reports.push(report);
  communityData.newReports++;
  communityData.unverifiedReports++;
  saveCommunityData();
  updateCommunityPanel();

  alert('Đã gửi phản ánh thành công!');
  logActivity('quick_report_submit', 'Gửi phản ánh nhanh: ' + type);

  document.getElementById('reportContent').value = '';
  document.getElementById('reportAttachment').value = '';
  document.getElementById('anonymousReport').checked = false;
}

// Verification Functions
function verifyReport(reportId) {
  var report = communityData.reports.find(function(r) { return r.id === reportId; });
  if (report) {
    report.status = 'verified';
    communityData.unverifiedReports--;
    saveCommunityData();
    updateCommunityPanel();
    alert('Đã xác minh phản ánh ' + reportId);
    logActivity('report_verify', 'Xác minh phản ánh: ' + reportId);
  }
}

function checkDuplicate() {
  alert('Kiểm tra trùng lặp (demo)');
  logActivity('duplicate_check', 'Kiểm tra phản ánh trùng lặp');
}

function checkOldMedia() {
  alert('Kiểm tra ảnh/video cũ (demo)');
  logActivity('old_media_check', 'Kiểm tra ảnh/video cũ');
}

function requestMultipleSources() {
  alert('Yêu cầu nhiều nguồn xác nhận (demo)');
  logActivity('multiple_sources_request', 'Yêu cầu nhiều nguồn xác nhận');
}

// Correction Functions
function submitCorrection() {
  var reportId = document.getElementById('correctionReportId').value;
  var content = document.getElementById('correctionContent').value;

  if (!reportId || !content) {
    alert('Vui lòng nhập đầy đủ thông tin!');
    return;
  }

  communityData.correctionHistory.push({
    reportId: reportId,
    date: new Date().toLocaleDateString('vi-VN'),
    content: content
  });

  communityData.corrections++;
  saveCommunityData();
  updateCommunityPanel();

  alert('Đã gửi đính chính!');
  logActivity('correction_submit', 'Gửi đính chính: ' + reportId);

  document.getElementById('correctionReportId').value = '';
  document.getElementById('correctionContent').value = '';
  document.getElementById('correctionEvidence').value = '';
}

// Channel Functions
function addChannel() {
  alert('Thêm kênh (demo)');
  logActivity('channel_add', 'Thêm kênh tiếp nhận');
}

// Governance System
var governanceData = {
  currentArea: 'TP. Hồ Chí Minh',
  transferredIncidents: 0,
  interAgencyTasks: 3,
  administrativeAreas: [
    { level: 'tinh', name: 'TP. Hồ Chí Minh', children: [
      { level: 'huyen', name: 'Quận 1', children: [
        { level: 'xa', name: 'Phường Bến Nghé' },
        { level: 'xa', name: 'Phường Bến Thành' }
      ]},
      { level: 'huyen', name: 'Quận 3', children: [
        { level: 'xa', name: 'Phường 1' },
        { level: 'xa', name: 'Phường 2' }
      ]}
    ]}
  ],
  agencyAssignments: [
    { incidentType: 'traffic', leadAgency: 'police', shift: 'morning', contact: '0901234567' },
    { incidentType: 'fire', leadAgency: 'fire', shift: 'morning', contact: '0902345678' }
  ],
  interAgencyTasks: [
    { id: 1, name: 'Phối hợp cứu hộ Q1', agencies: 'Cảnh sát, Cứu hỏa', status: 'pending' },
    { id: 2, name: 'Điều phối y tế khu vực', agencies: 'Y tế', status: 'completed' }
  ],
  drillMode: false
};

function initializeGovernanceSystem() {
  // Load governance data from localStorage
  var savedGovernance = localStorage.getItem('sosmap_governance');
  if (savedGovernance) {
    governanceData = JSON.parse(savedGovernance);
  }

  // Update governance panel
  updateGovernancePanel();

  // Initialize governance buttons
  document.getElementById('areaManagementBtn').addEventListener('click', function() {
    document.getElementById('areaManagementModal').style.display = 'block';
  });

  document.getElementById('agencyAssignmentBtn').addEventListener('click', function() {
    document.getElementById('agencyAssignmentModal').style.display = 'block';
  });

  document.getElementById('taskManagementBtn').addEventListener('click', function() {
    document.getElementById('taskManagementModal').style.display = 'block';
  });

  document.getElementById('dashboardBtn').addEventListener('click', function() {
    document.getElementById('governanceDashboardModal').style.display = 'block';
  });

  // Close modals
  document.getElementById('closeAreaManagementModal').addEventListener('click', function() {
    document.getElementById('areaManagementModal').style.display = 'none';
  });

  document.getElementById('closeAgencyAssignmentModal').addEventListener('click', function() {
    document.getElementById('agencyAssignmentModal').style.display = 'none';
  });

  document.getElementById('closeTaskManagementModal').addEventListener('click', function() {
    document.getElementById('taskManagementModal').style.display = 'none';
  });

  document.getElementById('closeGovernanceDashboardModal').addEventListener('click', function() {
    document.getElementById('governanceDashboardModal').style.display = 'none';
  });
}

function updateGovernancePanel() {
  document.getElementById('currentArea').textContent = governanceData.currentArea;
  document.getElementById('transferredIncidents').textContent = governanceData.transferredIncidents;
  document.getElementById('interAgencyTasks').textContent = governanceData.interAgencyTasks.length;
}

function saveGovernanceData() {
  localStorage.setItem('sosmap_governance', JSON.stringify(governanceData));
}

// Area Management Functions
function addArea() {
  alert('Thêm địa bàn (demo)');
  logActivity('area_add', 'Thêm địa bàn mới');
}

function editAreaBounds() {
  alert('Sửa ranh giới (demo)');
  logActivity('area_bounds_edit', 'Sửa ranh giới hành chính');
}

function viewAreaMap() {
  alert('Xem bản đồ ranh giới (demo)');
  logActivity('area_map_view', 'Xem bản đồ ranh giới');
}

// Agency Assignment Functions
function saveAssignment() {
  var incidentType = document.getElementById('incidentType').value;
  var leadAgency = document.getElementById('leadAgency').value;
  var shift = document.getElementById('shift').value;
  var contact = document.getElementById('emergencyContact').value;

  governanceData.agencyAssignments.push({
    incidentType: incidentType,
    leadAgency: leadAgency,
    shift: shift,
    contact: contact
  });

  saveGovernanceData();
  alert('Đã lưu gán cơ quan!');
  logActivity('agency_assignment_save', 'Gán cơ quan: ' + leadAgency + ' cho ' + incidentType);
}

function viewAssignments() {
  alert('Xem danh sách gán (demo)');
  logActivity('agency_assignments_view', 'Xem danh sách gán cơ quan');
}

// Task Management Functions
function createTask() {
  var name = document.getElementById('taskName').value;
  var agencies = document.getElementById('taskAgencies').value;

  if (!name || !agencies) {
    alert('Vui lòng nhập đầy đủ thông tin!');
    return;
  }

  governanceData.interAgencyTasks.push({
    id: governanceData.interAgencyTasks.length + 1,
    name: name,
    agencies: agencies,
    status: 'pending'
  });

  saveGovernanceData();
  updateGovernancePanel();
  alert('Đã tạo nhiệm vụ!');
  logActivity('task_create', 'Tạo nhiệm vụ liên cơ quan: ' + name);

  document.getElementById('taskName').value = '';
  document.getElementById('taskAgencies').value = '';
}

// Transfer Functions
function transferIncident() {
  var incidentId = document.getElementById('incidentId').value;
  var currentLevel = document.getElementById('currentLevel').value;
  var targetLevel = document.getElementById('targetLevel').value;
  var reason = document.getElementById('transferReason').value;

  if (!incidentId || !currentLevel || !reason) {
    alert('Vui lòng nhập đầy đủ thông tin!');
    return;
  }

  governanceData.transferredIncidents++;
  saveGovernanceData();
  updateGovernancePanel();
  alert('Đã chuyển giao sự cố!');
  logActivity('incident_transfer', 'Chuyển giao sự cố ' + incidentId + ' từ ' + currentLevel + ' đến ' + targetLevel);
}

// Dashboard Functions
function switchTab(tab) {
  var tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(function(t) {
    t.classList.remove('active');
  });
  event.target.classList.add('active');

  alert('Chuyển tab: ' + tab + ' (demo)');
  logActivity('dashboard_tab_switch', 'Chuyển tab dashboard: ' + tab);
}

function exportDashboard() {
  alert('Xuất báo cáo dashboard (demo)');
  logActivity('dashboard_export', 'Xuất báo cáo dashboard địa phương');
}

function toggleDrillMode() {
  governanceData.drillMode = !governanceData.drillMode;
  saveGovernanceData();
  alert('Đã chuyển sang chế độ ' + (governanceData.drillMode ? 'diễn tập' : 'thực tế') + '!');
  logActivity('drill_mode_toggle', 'Chuyển chế độ: ' + (governanceData.drillMode ? 'diễn tập' : 'thực tế'));
}

// Planning & Drills System
var planningData = {
  activeScenario: null,
  readinessScore: 85,
  drillMode: 'Thực tế',
  scenarios: [
    { id: 1, type: 'typhoon', name: 'Bão lũ miền Nam', area: 'TP. Hồ Chí Minh', time: '2026-10-15T08:00', forces: 'Cảnh sát, Cứu hỏa, Cấp cứu' }
  ],
  tasks: [],
  responseTimes: {
    police: null,
    fire: null,
    medical: null
  },
  scores: {
    response: 90,
    evacuation: 85,
    coordination: 80
  },
  versions: [
    { version: 'v2.1.0', date: '01/10/2026', author: 'Nguyễn Văn A', changes: 'Cập nhật kịch bản bão lũ' },
    { version: 'v2.0.0', date: '15/09/2026', author: 'Trần Thị B', changes: 'Thêm kịch bản dịch bệnh' },
    { version: 'v1.0.0', date: '01/08/2026', author: 'Lê Văn C', changes: 'Bản phát hành đầu tiên' }
  ]
};

function initializePlanningSystem() {
  // Load planning data from localStorage
  var savedPlanning = localStorage.getItem('sosmap_planning');
  if (savedPlanning) {
    planningData = JSON.parse(savedPlanning);
  }

  // Update planning panel
  updatePlanningPanel();

  // Initialize planning buttons
  document.getElementById('scenarioBtn').addEventListener('click', function() {
    document.getElementById('scenarioModal').style.display = 'block';
  });

  document.getElementById('simulationBtn').addEventListener('click', function() {
    document.getElementById('simulationModal').style.display = 'block';
  });

  document.getElementById('reportBtn').addEventListener('click', function() {
    document.getElementById('reportModal').style.display = 'block';
  });

  document.getElementById('versionBtn').addEventListener('click', function() {
    document.getElementById('versionModal').style.display = 'block';
  });

  // Close modals
  document.getElementById('closeScenarioModal').addEventListener('click', function() {
    document.getElementById('scenarioModal').style.display = 'none';
  });

  document.getElementById('closeSimulationModal').addEventListener('click', function() {
    document.getElementById('simulationModal').style.display = 'none';
  });

  document.getElementById('closeReportModal').addEventListener('click', function() {
    document.getElementById('reportModal').style.display = 'none';
  });

  document.getElementById('closeVersionModal').addEventListener('click', function() {
    document.getElementById('versionModal').style.display = 'none';
  });
}

function updatePlanningPanel() {
  document.getElementById('activeScenario').textContent = planningData.activeScenario ? planningData.activeScenario : 'Không';
  document.getElementById('readinessScore').textContent = planningData.readinessScore + '%';
  document.getElementById('drillMode').textContent = planningData.drillMode;
}

function savePlanningData() {
  localStorage.setItem('sosmap_planning', JSON.stringify(planningData));
}

// Scenario Functions
function addTask() {
  var taskList = document.getElementById('taskList');
  var taskCount = taskList.children.length + 1;
  var taskItem = document.createElement('div');
  taskItem.className = 'task-item';
  taskItem.innerHTML = '<input type="text" placeholder="Nhiệm vụ ' + taskCount + '" style="width: 70%; padding: 8px; margin-right: 10px; border: 1px solid #ddd; border-radius: 4px;"><button class="btn btn-sm" onclick="addTask()">Thêm</button>';
  taskList.appendChild(taskItem);
}

function saveScenario() {
  var type = document.getElementById('scenarioType').value;
  var name = document.getElementById('scenarioName').value;
  var area = document.getElementById('scenarioArea').value;
  var time = document.getElementById('scenarioTime').value;
  var forces = document.getElementById('scenarioForces').value;

  if (!name || !area || !time) {
    alert('Vui lòng nhập đầy đủ thông tin!');
    return;
  }

  var scenario = {
    id: planningData.scenarios.length + 1,
    type: type,
    name: name,
    area: area,
    time: time,
    forces: forces
  };

  planningData.scenarios.push(scenario);
  savePlanningData();
  alert('Đã lưu kịch bản!');
  logActivity('scenario_save', 'Lưu kịch bản: ' + name);
}

function loadScenario() {
  alert('Tải kịch bản (demo)');
  logActivity('scenario_load', 'Tải kịch bản');
}

// Simulation Functions
function simulateWarning() {
  var level = document.getElementById('warningLevel').value;
  var content = document.getElementById('warningContent').value;

  alert('Đang phát cảnh báo cấp ' + level + '... (demo)');
  logActivity('warning_simulate', 'Mô phỏng cảnh báo cấp ' + level);
}

function simulateEvacuation() {
  var count = document.getElementById('evacuationCount').value;
  var point = document.getElementById('evacuationPoint').value;

  alert('Đang bắt đầu sơ tán ' + count + ' người đến ' + point + '... (demo)');
  logActivity('evacuation_simulate', 'Mô phỏng sơ tán: ' + count + ' người');
}

function startSimulation() {
  planningData.drillMode = 'Diễn tập';
  planningData.activeScenario = 'Đang diễn tập';
  savePlanningData();
  updatePlanningPanel();

  // Simulate response times
  setTimeout(function() {
    planningData.responseTimes.police = '5 phút';
    updateResponseTime('Cảnh sát', '5 phút', 'completed');
  }, 2000);

  setTimeout(function() {
    planningData.responseTimes.fire = '7 phút';
    updateResponseTime('Cứu hỏa', '7 phút', 'completed');
  }, 3000);

  setTimeout(function() {
    planningData.responseTimes.medical = '4 phút';
    updateResponseTime('Cấp cứu', '4 phút', 'completed');
  }, 4000);

  alert('Đã bắt đầu diễn tập!');
  logActivity('simulation_start', 'Bắt đầu diễn tập');
}

function stopSimulation() {
  planningData.drillMode = 'Thực tế';
  planningData.activeScenario = null;
  planningData.responseTimes = { police: null, fire: null, medical: null };
  savePlanningData();
  updatePlanningPanel();

  alert('Đã dừng diễn tập!');
  logActivity('simulation_stop', 'Dừng diễn tập');
}

function updateResponseTime(unit, time, status) {
  var rows = document.getElementById('responseTimesBody').rows;
  for (var i = 0; i < rows.length; i++) {
    if (rows[i].cells[0].textContent === unit) {
      rows[i].cells[1].textContent = time;
      rows[i].cells[2].innerHTML = '<span class="status-badge ' + status + '">' + (status === 'completed' ? 'Đã phản hồi' : 'Chờ') + '</span>';
      break;
    }
  }
}

// Report Functions
function saveReport() {
  var lessons = document.getElementById('lessonsLearned').value;
  var recommendations = document.getElementById('recommendations').value;

  alert('Đã lưu báo cáo rút kinh nghiệm!');
  logActivity('report_save', 'Lưu báo cáo rút kinh nghiệm');
}

function exportReport() {
  alert('Xuất báo cáo (demo)');
  logActivity('report_export', 'Xuất báo cáo rút kinh nghiệm');
}

// Version Functions
function createNewVersion() {
  var newVersion = prompt('Nhập phiên bản mới:', 'v2.2.0');
  if (newVersion) {
    planningData.versions.unshift({
      version: newVersion,
      date: new Date().toLocaleDateString('vi-VN'),
      author: 'Người dùng hiện tại',
      changes: 'Cập nhật mới'
    });
    savePlanningData();
    alert('Đã tạo phiên bản mới!');
    logActivity('version_create', 'Tạo phiên bản: ' + newVersion);
  }
}

function rollbackVersion() {
  if (!confirm('Bạn có chắc muốn rollback đến phiên bản trước?')) {
    return;
  }

  alert('Đã rollback thành công!');
  logActivity('version_rollback', 'Rollback phiên bản');
}

// Offline & Resilient Access System
var offlineData = {
  isOnline: true,
  offlineQueue: [],
  downloadedMaps: [
    { area: 'TP. Hồ Chí Minh', size: '45.2 MB', updated: '01/10/2026' }
  ],
  emergencyContacts: [
    { name: 'Cảnh sát (113)', phone: '113' },
    { name: 'Cứu hỏa (114)', phone: '114' },
    { name: 'Cấp cứu (115)', phone: '115' },
    { name: 'Tổng đài khẩn cấp (112)', phone: '112' }
  ],
  syncHistory: [
    { time: '02/10/2026 10:30', action: 'Đã đồng bộ 2 phản ánh' },
    { time: '02/10/2026 09:15', action: 'Đã đồng bộ 1 yêu cầu cứu hộ' },
    { time: '01/10/2026 23:45', action: 'Tự động đồng bộ' }
  ],
  serverStatus: {
    primary: 'Online',
    backup: 'Online',
    crossRegionBackup: 'Đã hoàn thành'
  }
};

function initializeOfflineSystem() {
  // Load offline data from localStorage
  var savedOffline = localStorage.getItem('sosmap_offline');
  if (savedOffline) {
    offlineData = JSON.parse(savedOffline);
  }

  // Update offline panel
  updateOfflinePanel();

  // Monitor online/offline status
  window.addEventListener('online', function() {
    offlineData.isOnline = true;
    updateOfflinePanel();
    alert('Đã kết nối lại internet!');
    logActivity('connection_online', 'Kết nối lại internet');
  });

  window.addEventListener('offline', function() {
    offlineData.isOnline = false;
    updateOfflinePanel();
    alert('Đã mất kết nối internet. Chuyển sang chế độ offline.');
    logActivity('connection_offline', 'Mất kết nối internet');
  });

  // Initialize offline buttons
  document.getElementById('offlineDataBtn').addEventListener('click', function() {
    document.getElementById('offlineDataModal').style.display = 'block';
  });

  document.getElementById('emergencyContactsBtn').addEventListener('click', function() {
    document.getElementById('emergencyContactsModal').style.display = 'block';
  });

  document.getElementById('offlineGuideBtn').addEventListener('click', function() {
    document.getElementById('offlineGuideModal').style.display = 'block';
  });

  document.getElementById('syncBtn').addEventListener('click', function() {
    document.getElementById('syncStatusModal').style.display = 'block';
  });

  // Close modals
  document.getElementById('closeOfflineDataModal').addEventListener('click', function() {
    document.getElementById('offlineDataModal').style.display = 'none';
  });

  document.getElementById('closeEmergencyContactsModal').addEventListener('click', function() {
    document.getElementById('emergencyContactsModal').style.display = 'none';
  });

  document.getElementById('closeOfflineGuideModal').addEventListener('click', function() {
    document.getElementById('offlineGuideModal').style.display = 'none';
  });

  document.getElementById('closeSyncStatusModal').addEventListener('click', function() {
    document.getElementById('syncStatusModal').style.display = 'none';
  });

  // Auto-sync when online
  setInterval(autoSync, 60000); // Check every minute
}

function updateOfflinePanel() {
  var connectionStatus = document.getElementById('connectionStatus');
  if (connectionStatus) {
    connectionStatus.textContent = offlineData.isOnline ? 'Đang online' : 'Đang offline';
    connectionStatus.className = 'status-value ' + (offlineData.isOnline ? 'success' : 'error');
  }

  var offlineDataCount = document.getElementById('offlineDataCount');
  if (offlineDataCount) {
    offlineDataCount.textContent = offlineData.offlineQueue.length;
  }

  var syncStatus = document.getElementById('syncStatus');
  if (syncStatus) {
    syncStatus.textContent = offlineData.offlineQueue.length === 0 ? 'Đã đồng bộ' : 'Chờ đồng bộ';
    syncStatus.className = 'status-value ' + (offlineData.offlineQueue.length === 0 ? 'success' : 'warning');
  }
}

function saveOfflineData() {
  localStorage.setItem('sosmap_offline', JSON.stringify(offlineData));
}

function autoSync() {
  if (offlineData.isOnline && offlineData.offlineQueue.length > 0) {
    syncOfflineData();
  }
}

// Offline Data Functions
function downloadMap() {
  alert('Đang tải bản đồ mới... (demo)');
  setTimeout(function() {
    alert('Đã tải bản đồ thành công!');
    logActivity('map_download', 'Tải bản đồ offline');
  }, 2000);
}

function syncOfflineData() {
  if (!offlineData.isOnline) {
    alert('Không thể đồng bộ khi offline!');
    return;
  }

  if (offlineData.offlineQueue.length === 0) {
    alert('Không có dữ liệu để đồng bộ!');
    return;
  }

  alert('Đang đồng bộ ' + offlineData.offlineQueue.length + ' mục dữ liệu...');
  setTimeout(function() {
    offlineData.offlineQueue = [];
    saveOfflineData();
    updateOfflinePanel();
    alert('Đã đồng bộ thành công!');
    logActivity('data_sync', 'Đồng bộ dữ liệu offline');
  }, 2000);
}

function clearOfflineData() {
  if (!confirm('Bạn có chắc muốn xóa tất cả dữ liệu offline?')) {
    return;
  }

  offlineData.offlineQueue = [];
  saveOfflineData();
  updateOfflinePanel();
  alert('Đã xóa dữ liệu offline!');
  logActivity('offline_data_clear', 'Xóa dữ liệu offline');
}

// Emergency Contacts Functions
function callEmergency(number) {
  alert('Đang gọi ' + number + '... (demo)');
  logActivity('emergency_call', 'Gọi số khẩn cấp: ' + number);
}

function addEmergencyContact() {
  var name = document.getElementById('newContactName').value;
  var phone = document.getElementById('newContactPhone').value;

  if (!name || !phone) {
    alert('Vui lòng nhập tên và số điện thoại!');
    return;
  }

  offlineData.emergencyContacts.push({ name: name, phone: phone });
  saveOfflineData();
  alert('Đã thêm số liên lạc!');
  logActivity('emergency_contact_add', 'Thêm số liên lạc: ' + name);

  document.getElementById('newContactName').value = '';
  document.getElementById('newContactPhone').value = '';
}

function sendEmergencySMS() {
  if (!offlineData.isOnline) {
    alert('Không thể gửi SMS khi không có kết nối mạng!');
    return;
  }

  alert('Đang gửi SMS khẩn cấp... (demo)');
  setTimeout(function() {
    alert('Đã gửi SMS thành công!');
    logActivity('emergency_sms', 'Gửi SMS khẩn cấp');
  }, 2000);
}

// Offline Guide Functions
function viewShelterMap() {
  alert('Xem bản đồ điểm trú an (demo)');
  logActivity('shelter_map_view', 'Xem bản đồ điểm trú an');
}

function downloadGuide() {
  alert('Đang tải hướng dẫn mới... (demo)');
  setTimeout(function() {
    alert('Đã tải hướng dẫn thành công!');
    logActivity('guide_download', 'Tải hướng dẫn offline');
  }, 2000);
}

function printGuide() {
  alert('In hướng dẫn (demo)');
  logActivity('guide_print', 'In hướng dẫn offline');
}

// Sync Status Functions
function forceSync() {
  if (!offlineData.isOnline) {
    alert('Không thể đồng bộ khi offline!');
    return;
  }

  alert('Đang đồng bộ...');
  setTimeout(function() {
    var now = new Date();
    var timeStr = now.toLocaleString('vi-VN');
    offlineData.syncHistory.unshift({ time: timeStr, action: 'Đồng bộ thủ công' });
    saveOfflineData();
    alert('Đã đồng bộ thành công!');
    logActivity('sync_force', 'Đồng bộ thủ công');
  }, 2000);
}

function viewSyncLog() {
  alert('Xem log đồng bộ (demo)');
  logActivity('sync_log_view', 'Xem log đồng bộ');
}

// Privacy & Safety System
var privacyData = {
  encryptionEnabled: true,
  storageEncryptionEnabled: true,
  mfaEnabled: false,
  biometricEnabled: false,
  locationPrivacyEnabled: true,
  healthPrivacyEnabled: true,
  quarantinePrivacyEnabled: true,
  locationConsent: false,
  healthConsent: false,
  identityConsent: false,
  accessLevel: 'Cơ bản',
  consentStatus: 'Chưa đồng ý',
  lastPenetrationTest: '01/10/2026',
  nextPenetrationTest: '01/01/2027',
  lastDisasterTest: '15/09/2026'
};

function initializePrivacySystem() {
  // Load privacy data from localStorage
  var savedPrivacy = localStorage.getItem('sosmap_privacy');
  if (savedPrivacy) {
    privacyData = JSON.parse(savedPrivacy);
  }

  // Update privacy panel
  updatePrivacyPanel();

  // Initialize privacy buttons
  document.getElementById('privacySettingsBtn').addEventListener('click', function() {
    document.getElementById('privacySettingsModal').style.display = 'block';
  });

  document.getElementById('consentBtn').addEventListener('click', function() {
    document.getElementById('consentModal').style.display = 'block';
  });

  document.getElementById('dataDeletionBtn').addEventListener('click', function() {
    document.getElementById('dataDeletionModal').style.display = 'block';
  });

  document.getElementById('securityAuditBtn').addEventListener('click', function() {
    document.getElementById('securityAuditModal').style.display = 'block';
  });

  // Close modals
  document.getElementById('closePrivacySettingsModal').addEventListener('click', function() {
    document.getElementById('privacySettingsModal').style.display = 'none';
  });

  document.getElementById('closeConsentModal').addEventListener('click', function() {
    document.getElementById('consentModal').style.display = 'none';
  });

  document.getElementById('closeDataDeletionModal').addEventListener('click', function() {
    document.getElementById('dataDeletionModal').style.display = 'none';
  });

  document.getElementById('closeSecurityAuditModal').addEventListener('click', function() {
    document.getElementById('securityAuditModal').style.display = 'none';
  });

  // Load saved settings into checkboxes
  loadPrivacySettings();
}

function updatePrivacyPanel() {
  document.getElementById('accessLevel').textContent = privacyData.accessLevel;
  document.getElementById('consentStatus').textContent = privacyData.consentStatus;
}

function savePrivacyData() {
  localStorage.setItem('sosmap_privacy', JSON.stringify(privacyData));
}

function loadPrivacySettings() {
  document.getElementById('encryptionEnabled').checked = privacyData.encryptionEnabled;
  document.getElementById('storageEncryptionEnabled').checked = privacyData.storageEncryptionEnabled;
  document.getElementById('mfaEnabled').checked = privacyData.mfaEnabled;
  document.getElementById('biometricEnabled').checked = privacyData.biometricEnabled;
  document.getElementById('locationPrivacyEnabled').checked = privacyData.locationPrivacyEnabled;
  document.getElementById('healthPrivacyEnabled').checked = privacyData.healthPrivacyEnabled;
  document.getElementById('quarantinePrivacyEnabled').checked = privacyData.quarantinePrivacyEnabled;
  document.getElementById('locationConsent').checked = privacyData.locationConsent;
  document.getElementById('healthConsent').checked = privacyData.healthConsent;
  document.getElementById('identityConsent').checked = privacyData.identityConsent;
}

// Privacy Settings Functions
function savePrivacySettings() {
  privacyData.encryptionEnabled = document.getElementById('encryptionEnabled').checked;
  privacyData.storageEncryptionEnabled = document.getElementById('storageEncryptionEnabled').checked;
  privacyData.mfaEnabled = document.getElementById('mfaEnabled').checked;
  privacyData.biometricEnabled = document.getElementById('biometricEnabled').checked;
  privacyData.locationPrivacyEnabled = document.getElementById('locationPrivacyEnabled').checked;
  privacyData.healthPrivacyEnabled = document.getElementById('healthPrivacyEnabled').checked;
  privacyData.quarantinePrivacyEnabled = document.getElementById('quarantinePrivacyEnabled').checked;

  savePrivacyData();
  alert('Đã lưu cài đặt bảo mật!');
  logActivity('privacy_settings_save', 'Lưu cài đặt bảo mật');
}

function resetPrivacySettings() {
  if (!confirm('Bạn có chắc muốn đặt lại cài đặt về mặc định?')) {
    return;
  }

  privacyData = {
    encryptionEnabled: true,
    storageEncryptionEnabled: true,
    mfaEnabled: false,
    biometricEnabled: false,
    locationPrivacyEnabled: true,
    healthPrivacyEnabled: true,
    quarantinePrivacyEnabled: true,
    locationConsent: false,
    healthConsent: false,
    identityConsent: false,
    accessLevel: 'Cơ bản',
    consentStatus: 'Chưa đồng ý',
    lastPenetrationTest: '01/10/2026',
    nextPenetrationTest: '01/01/2027',
    lastDisasterTest: '15/09/2026'
  };

  loadPrivacySettings();
  savePrivacyData();
  alert('Đã đặt lại cài đặt về mặc định!');
  logActivity('privacy_settings_reset', 'Đặt lại cài đặt bảo mật');
}

// Consent Functions
function saveConsent() {
  privacyData.locationConsent = document.getElementById('locationConsent').checked;
  privacyData.healthConsent = document.getElementById('healthConsent').checked;
  privacyData.identityConsent = document.getElementById('identityConsent').checked;

  // Update consent status
  if (privacyData.locationConsent || privacyData.healthConsent || privacyData.identityConsent) {
    privacyData.consentStatus = 'Đã đồng ý';
  } else {
    privacyData.consentStatus = 'Chưa đồng ý';
  }

  savePrivacyData();
  updatePrivacyPanel();
  alert('Đã lưu đồng ý dữ liệu!');
  logActivity('consent_save', 'Lưu đồng ý dữ liệu');
}

function withdrawConsent() {
  if (!confirm('Bạn có chắc muốn rút lại đồng ý? Dữ liệu của bạn sẽ được xóa.')) {
    return;
  }

  privacyData.locationConsent = false;
  privacyData.healthConsent = false;
  privacyData.identityConsent = false;
  privacyData.consentStatus = 'Đã rút lại';

  loadPrivacySettings();
  savePrivacyData();
  updatePrivacyPanel();
  alert('Đã rút lại đồng ý. Dữ liệu của bạn sẽ được xóa trong vòng 30 ngày.');
  logActivity('consent_withdraw', 'Rút lại đồng ý dữ liệu');
}

// Data Deletion Functions
function confirmDataDeletion() {
  var deleteLocation = document.getElementById('deleteLocationData').checked;
  var deleteHealth = document.getElementById('deleteHealthData').checked;
  var deleteActivity = document.getElementById('deleteActivityLog').checked;
  var deleteAll = document.getElementById('deleteAllData').checked;

  if (!deleteLocation && !deleteHealth && !deleteActivity && !deleteAll) {
    alert('Vui lòng chọn ít nhất một loại dữ liệu để xóa.');
    return;
  }

  if (!confirm('Bạn có chắc muốn xóa dữ liệu đã chọn? Hành động này không thể hoàn tác!')) {
    return;
  }

  alert('Đã xóa dữ liệu thành công!');
  logActivity('data_deletion', 'Xóa dữ liệu: location=' + deleteLocation + ', health=' + deleteHealth + ', activity=' + deleteActivity + ', all=' + deleteAll);
}

function requestDeletion() {
  alert('Yêu cầu xóa dữ liệu đã được gửi. Chúng tôi sẽ xử lý trong vòng 30 ngày theo quy định pháp luật.');
  logActivity('data_deletion_request', 'Gửi yêu cầu xóa dữ liệu');
}

// Security Audit Functions
function runPenetrationTest() {
  alert('Đang chạy kiểm thử xâm nhập... (demo)');
  setTimeout(function() {
    alert('Kiểm thử xâm nhập hoàn thành: Không phát hiện lỗ hổng bảo mật nghiêm trọng.');
    privacyData.lastPenetrationTest = new Date().toLocaleDateString('vi-VN');
    savePrivacyData();
    logActivity('penetration_test', 'Chạy kiểm thử xâm nhập');
  }, 2000);
}

function runDisasterTest() {
  alert('Đang chạy kiểm thử tai nạn... (demo)');
  setTimeout(function() {
    alert('Kiểm thử tai nạn hoàn thành: Dữ liệu đã khôi phục thành công từ bản sao lưu.');
    privacyData.lastDisasterTest = new Date().toLocaleDateString('vi-VN');
    savePrivacyData();
    logActivity('disaster_test', 'Chạy kiểm thử tai nạn');
  }, 2000);
}

function exportSecurityLog() {
  alert('Xuất log bảo mật (demo)');
  logActivity('security_log_export', 'Xuất log bảo mật');
}

function reportSecurityIssue() {
  alert('Tính năng báo cáo lỗ hổng bảo mật (demo)');
  logActivity('security_issue_report', 'Báo cáo lỗ hổng bảo mật');
}

// Reporting System
var reportingData = {
  totalIncidents: 156,
  totalRescued: 2345,
  totalRelief: 89,
  incidentsByType: {
    traffic: 45,
    flood: 38,
    fire: 22,
    health: 51
  },
  incidentsByArea: {
    q1: 35,
    q3: 28,
    q7: 42,
    q12: 51
  },
  rescueStats: {
    total: 2345,
    completed: 2100,
    pending: 245,
    byType: {
      medical: 890,
      water: 567,
      mountain: 234,
      fire: 654
    }
  },
  healthStats: {
    totalCases: 45,
    quarantine: 12,
    recovered: 30,
    treating: 15
  }
};

function initializeReportingSystem() {
  // Load reporting data from localStorage
  var savedReport = localStorage.getItem('sosmap_reporting');
  if (savedReport) {
    reportingData = JSON.parse(savedReport);
  }

  // Update reporting panel
  updateReportingPanel();

  // Initialize reporting buttons
  document.getElementById('incidentsReportBtn').addEventListener('click', function() {
    document.getElementById('incidentsReportModal').style.display = 'block';
  });

  document.getElementById('rescueReportBtn').addEventListener('click', function() {
    document.getElementById('rescueReportModal').style.display = 'block';
  });

  document.getElementById('healthReportBtn').addEventListener('click', function() {
    document.getElementById('healthReportModal').style.display = 'block';
  });

  document.getElementById('dashboardBtn').addEventListener('click', function() {
    document.getElementById('dashboardModal').style.display = 'block';
  });

  // Close modals
  document.getElementById('closeIncidentsReportModal').addEventListener('click', function() {
    document.getElementById('incidentsReportModal').style.display = 'none';
  });

  document.getElementById('closeRescueReportModal').addEventListener('click', function() {
    document.getElementById('rescueReportModal').style.display = 'none';
  });

  document.getElementById('closeHealthReportModal').addEventListener('click', function() {
    document.getElementById('healthReportModal').style.display = 'none';
  });

  document.getElementById('closeDashboardModal').addEventListener('click', function() {
    document.getElementById('dashboardModal').style.display = 'none';
  });
}

function updateReportingPanel() {
  document.getElementById('totalIncidents').textContent = reportingData.totalIncidents;
  document.getElementById('totalRescued').textContent = reportingData.totalRescued.toLocaleString();
  document.getElementById('totalRelief').textContent = reportingData.totalRelief + '%';
}

function saveReportingData() {
  localStorage.setItem('sosmap_reporting', JSON.stringify(reportingData));
}

// Incident Report Functions
function generateIncidentReport() {
  var type = document.getElementById('incidentTypeFilter').value;
  var area = document.getElementById('areaFilter').value;

  // Simulate generating report
  var total = reportingData.totalIncidents;
  var resolved = Math.floor(total * 0.7);
  var pending = total - resolved;

  document.getElementById('reportTotalIncidents').textContent = total;
  document.getElementById('reportResolvedIncidents').textContent = resolved;
  document.getElementById('reportPendingIncidents').textContent = pending;

  document.getElementById('incidentReportResults').style.display = 'block';

  alert('Đã tạo báo cáo sự cố!');
  logActivity('incident_report', 'Tạo báo cáo sự cố: ' + type + ', ' + area);
}

function exportIncidentCSV() {
  alert('Xuất báo cáo sự cố CSV (demo)');
  logActivity('incident_export_csv', 'Xuất báo cáo sự cố CSV');
}

function exportIncidentExcel() {
  alert('Xuất báo cáo sự cố Excel (demo)');
  logActivity('incident_export_excel', 'Xuất báo cáo sự cố Excel');
}

function exportIncidentPDF() {
  alert('Xuất báo cáo sự cố PDF (demo)');
  logActivity('incident_export_pdf', 'Xuất báo cáo sự cố PDF');
}

// Rescue Report Functions
function generateRescueReport() {
  var type = document.getElementById('rescueTypeFilter').value;

  // Simulate generating report
  var total = reportingData.rescueStats.total;
  var completed = reportingData.rescueStats.completed;
  var pending = reportingData.rescueStats.pending;
  var rescued = reportingData.totalRescued;

  document.getElementById('reportTotalRescues').textContent = total;
  document.getElementById('reportCompletedRescues').textContent = completed;
  document.getElementById('reportPendingRescues').textContent = pending;
  document.getElementById('reportTotalRescued').textContent = rescued.toLocaleString();

  document.getElementById('rescueReportResults').style.display = 'block';

  alert('Đã tạo báo cáo cứu hộ!');
  logActivity('rescue_report', 'Tạo báo cáo cứu hộ: ' + type);
}

function exportRescueCSV() {
  alert('Xuất báo cáo cứu hộ CSV (demo)');
  logActivity('rescue_export_csv', 'Xuất báo cáo cứu hộ CSV');
}

function exportRescueExcel() {
  alert('Xuất báo cáo cứu hộ Excel (demo)');
  logActivity('rescue_export_excel', 'Xuất báo cáo cứu hộ Excel');
}

function exportRescuePDF() {
  alert('Xuất báo cáo cứu hộ PDF (demo)');
  logActivity('rescue_export_pdf', 'Xuất báo cáo cứu hộ PDF');
}

// Health Report Functions
function generateHealthReport() {
  var type = document.getElementById('healthTypeFilter').value;

  // Simulate generating report
  var totalCases = reportingData.healthStats.totalCases;
  var quarantine = reportingData.healthStats.quarantine;
  var recovered = reportingData.healthStats.recovered;
  var treating = reportingData.healthStats.treating;

  document.getElementById('reportTotalCases').textContent = totalCases;
  document.getElementById('reportTotalQuarantine').textContent = quarantine;
  document.getElementById('reportRecovered').textContent = recovered;
  document.getElementById('reportTreating').textContent = treating;

  document.getElementById('healthReportResults').style.display = 'block';

  alert('Đã tạo báo cáo sức khỏe!');
  logActivity('health_report', 'Tạo báo cáo sức khỏe: ' + type);
}

function exportHealthCSV() {
  alert('Xuất báo cáo sức khỏe CSV (demo)');
  logActivity('health_export_csv', 'Xuất báo cáo sức khỏe CSV');
}

function exportHealthExcel() {
  alert('Xuất báo cáo sức khỏe Excel (demo)');
  logActivity('health_export_excel', 'Xuất báo cáo sức khỏe Excel');
}

function exportHealthPDF() {
  alert('Xuất báo cáo sức khỏe PDF (demo)');
  logActivity('health_export_pdf', 'Xuất báo cáo sức khỏe PDF');
}

// Dashboard Functions
function refreshDashboard() {
  // Simulate refreshing dashboard
  document.getElementById('dashIncidents').textContent = reportingData.totalIncidents;
  document.getElementById('dashRescues').textContent = reportingData.totalRescued.toLocaleString();
  document.getElementById('dashRelief').textContent = reportingData.totalRelief + '%';
  document.getElementById('dashHealth').textContent = reportingData.healthStats.totalCases;

  alert('Đã làm mới dashboard!');
  logActivity('dashboard_refresh', 'Làm mới dashboard');
}

function exportDashboard() {
  alert('Xuất báo cáo dashboard (demo)');
  logActivity('dashboard_export', 'Xuất báo cáo dashboard');
}

// Operations System
var operationsData = {
  systemStatus: 'online',
  pendingRequests: 0,
  overdueAlerts: 0,
  serverStatus: {
    cpu: 45,
    memory: 65,
    disk: 78,
    network: 12,
    apiResponse: 45,
    activeConnections: 234
  },
  shiftSchedule: [
    { id: 1, shift: 'Ca sáng', time: '6:00 - 14:00', staff: 'Nguyễn Văn A, Trần Thị B', status: 'active', contact: '0901234567' },
    { id: 2, shift: 'Ca chiều', time: '14:00 - 22:00', staff: 'Lê Văn C, Phạm Thị D', status: 'upcoming', contact: '0902345678' },
    { id: 3, shift: 'Ca đêm', time: '22:00 - 6:00', staff: 'Hoàng Văn E, Nguyễn Thị F', status: 'completed', contact: '0903456789' }
  ],
  lastBackup: null,
  backupSize: 0,
  versionHistory: [
    { version: 'v1.0.0', date: '01/10/2026', changes: 'Bản phát hành đầu tiên' }
  ]
};

function initializeOperationsSystem() {
  // Load operations data from localStorage
  var savedOps = localStorage.getItem('sosmap_operations');
  if (savedOps) {
    operationsData = JSON.parse(savedOps);
  }

  // Update operations panel
  updateOperationsPanel();

  // Initialize operations buttons
  document.getElementById('shiftScheduleBtn').addEventListener('click', function() {
    document.getElementById('shiftScheduleModal').style.display = 'block';
  });

  document.getElementById('serverStatusBtn').addEventListener('click', function() {
    document.getElementById('serverStatusModal').style.display = 'block';
  });

  document.getElementById('backupBtn').addEventListener('click', function() {
    document.getElementById('backupModal').style.display = 'block';
  });

  document.getElementById('loadTestBtn').addEventListener('click', function() {
    document.getElementById('loadTestModal').style.display = 'block';
  });

  // Close modals
  document.getElementById('closeShiftScheduleModal').addEventListener('click', function() {
    document.getElementById('shiftScheduleModal').style.display = 'none';
  });

  document.getElementById('closeServerStatusModal').addEventListener('click', function() {
    document.getElementById('serverStatusModal').style.display = 'none';
  });

  document.getElementById('closeBackupModal').addEventListener('click', function() {
    document.getElementById('backupModal').style.display = 'none';
  });

  document.getElementById('closeLoadTestModal').addEventListener('click', function() {
    document.getElementById('loadTestModal').style.display = 'none';
  });

  // Auto-update pending requests and overdue alerts
  setInterval(updateOperationsPanel, 30000); // Update every 30 seconds
}

function updateOperationsPanel() {
  // Update system status
  var systemStatus = document.getElementById('systemStatus');
  if (systemStatus) {
    systemStatus.textContent = operationsData.systemStatus === 'online' ? 'Đang hoạt động' : 'Ngắt kết nối';
    systemStatus.className = 'status-value ' + (operationsData.systemStatus === 'online' ? 'success' : 'error');
  }

  // Update pending requests
  var pendingRequests = document.getElementById('pendingRequests');
  if (pendingRequests) {
    pendingRequests.textContent = operationsData.pendingRequests;
    if (operationsData.pendingRequests > 50) {
      pendingRequests.className = 'status-value warning';
    } else if (operationsData.pendingRequests > 100) {
      pendingRequests.className = 'status-value error';
    }
  }

  // Update overdue alerts
  var overdueAlerts = document.getElementById('overdueAlerts');
  if (overdueAlerts) {
    overdueAlerts.textContent = operationsData.overdueAlerts;
    if (operationsData.overdueAlerts > 0) {
      overdueAlerts.className = 'status-value error';
    }
  }

  // Simulate updates
  operationsData.pendingRequests = Math.floor(Math.random() * 20) + 5;
  operationsData.overdueAlerts = Math.floor(Math.random() * 3);

  saveOperationsData();
}

function saveOperationsData() {
  localStorage.setItem('sosmap_operations', JSON.stringify(operationsData));
}

// Shift Schedule Functions
function addShift() {
  alert('Tính năng thêm ca trực (demo)');
  logActivity('shift_add', 'Thêm ca trực mới');
}

function editShift() {
  alert('Tính năng sửa lịch trực (demo)');
  logActivity('shift_edit', 'Sửa lịch trực');
}

// Server Status Functions
function refreshServerStatus() {
  // Simulate refreshing server status
  operationsData.serverStatus.cpu = Math.floor(Math.random() * 30) + 30;
  operationsData.serverStatus.memory = Math.floor(Math.random() * 30) + 50;
  operationsData.serverStatus.disk = Math.floor(Math.random() * 20) + 70;
  operationsData.serverStatus.network = Math.floor(Math.random() * 20) + 5;
  operationsData.serverStatus.apiResponse = Math.floor(Math.random() * 30) + 30;
  operationsData.serverStatus.activeConnections = Math.floor(Math.random() * 100) + 150;

  alert('Đã làm mới trạng thái máy chủ');
  logActivity('server_status_refresh', 'Làm mới trạng thái máy chủ');
}

function viewServerLogs() {
  alert('Tính năng xem logs máy chủ (demo)');
  logActivity('server_logs_view', 'Xem logs máy chủ');
}

// Backup Functions
function createBackup() {
  var now = new Date();
  operationsData.lastBackup = now.toLocaleString('vi-VN');
  operationsData.backupSize = (Math.random() * 100 + 50).toFixed(2) + ' MB';

  document.getElementById('lastBackupTime').textContent = operationsData.lastBackup;
  document.getElementById('backupSize').textContent = operationsData.backupSize;

  alert('Đã tạo bản sao lưu thành công!');
  logActivity('backup_create', 'Tạo bản sao lưu');
  saveOperationsData();
}

function restoreBackup() {
  if (!confirm('Bạn có chắc muốn khôi phục từ bản sao lưu gần nhất?')) {
    return;
  }

  alert('Đã khôi phục dữ liệu từ bản sao lưu!');
  logActivity('backup_restore', 'Khôi phục từ bản sao lưu');
}

function configureBackup() {
  alert('Tính năng cấu hình lịch sao lưu (demo)');
  logActivity('backup_configure', 'Cấu hình lịch sao lưu');
}

// Load Test Functions
function runLoadTest() {
  var requests = parseInt(document.getElementById('loadTestRequests').value);
  var users = parseInt(document.getElementById('loadTestUsers').value);

  if (!requests || !users) {
    alert('Vui lòng nhập số liệu hợp lệ');
    return;
  }

  document.getElementById('loadTestResults').style.display = 'block';

  // Simulate load test
  var rps = Math.floor(requests / 10);
  var avgResponse = Math.floor(Math.random() * 50) + 30;
  var errorRate = (Math.random() * 5).toFixed(2);
  var memoryUsage = Math.floor(Math.random() * 30) + 40;

  document.getElementById('rpsValue').textContent = rps;
  document.getElementById('rpsProgress').style.width = Math.min(rps / 10, 100) + '%';
  document.getElementById('avgResponseValue').textContent = avgResponse + 'ms';
  document.getElementById('errorRateValue').textContent = errorRate + '%';
  document.getElementById('memoryUsageValue').textContent = memoryUsage + '%';

  // Color coding
  if (errorRate > 3) {
    document.getElementById('errorRateValue').className = 'load-test-value error';
  } else if (errorRate > 1) {
    document.getElementById('errorRateValue').className = 'load-test-value warning';
  }

  if (memoryUsage > 80) {
    document.getElementById('memoryUsageValue').className = 'load-test-value error';
  } else if (memoryUsage > 60) {
    document.getElementById('memoryUsageValue').className = 'load-test-value warning';
  }

  alert('Kiểm thử sức chịu tải hoàn thành!');
  logActivity('load_test_run', 'Chạy kiểm thử sức chịu tải: ' + requests + ' requests, ' + users + ' users');
}

// Version Management Functions
function createNewVersion() {
  alert('Tính năng tạo phiên bản mới (demo)');
  logActivity('version_create', 'Tạo phiên bản mới');
}

function rollbackVersion() {
  if (!confirm('Bạn có chắc muốn rollback đến phiên bản trước?')) {
    return;
  }

  alert('Đã rollback thành công!');
  logActivity('version_rollback', 'Rollback phiên bản');
}

// Training Functions
function assignTraining() {
  alert('Tính năng phân công đào tạo (demo)');
  logActivity('training_assign', 'Phân công đào tạo');
}

function viewTrainingProgress() {
  alert('Tính năng xem tiến độ đào tạo (demo)');
  logActivity('training_progress_view', 'Xem tiến độ đào tạo');
}

// Documents Functions
function uploadDocument() {
  alert('Tính năng tải tài liệu lên (demo)');
  logActivity('document_upload', 'Tải tài liệu lên');
}

function addContact() {
  alert('Tính năng thêm liên lạc (demo)');
  logActivity('contact_add', 'Thêm liên lạc khẩn cấp');
}

// Mobile Menu Functionality
function initializeMobileMenu() {
  var mobileMenuToggle = document.getElementById('mobileMenuToggle');
  var mobileMenu = document.getElementById('mobileMenu');
  var mobileMenuClose = document.getElementById('mobileMenuClose');
  var mobileNavLinks = document.querySelectorAll('.mobile-nav-link');

  // Toggle mobile menu
  if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', function() {
      mobileMenu.classList.toggle('active');
    });
  }

  // Close mobile menu
  if (mobileMenuClose) {
    mobileMenuClose.addEventListener('click', function() {
      mobileMenu.classList.remove('active');
    });
  }

  // Close menu when clicking outside
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.mobile-menu') && !e.target.closest('.mobile-menu-toggle')) {
      mobileMenu.classList.remove('active');
    }
  });

  // Handle mobile nav link clicks
  mobileNavLinks.forEach(function(link) {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      var section = this.getAttribute('data-section');
      
      // Hide all sections
      document.querySelectorAll('.content-section').forEach(function(sec) {
        sec.style.display = 'none';
      });
      
      // Show selected section
      var targetSection = document.getElementById(section);
      if (targetSection) {
        targetSection.style.display = 'block';
      }
      
      // Update active state
      mobileNavLinks.forEach(function(l) {
        l.classList.remove('active');
      });
      this.classList.add('active');
      
      // Close mobile menu
      mobileMenu.classList.remove('active');
      
      // Log activity
      logActivity('navigation', 'Navigate to section: ' + section);
    });
  });
}

// Navigation Active State
function initializeNavigationActiveState() {
  var navLinks = document.querySelectorAll('.navbar-nav .nav-link');
  var mobileNavLinks = document.querySelectorAll('.mobile-nav-link');
  
  function setActiveLink(link) {
    navLinks.forEach(function(l) {
      l.classList.remove('active');
    });
    mobileNavLinks.forEach(function(l) {
      l.classList.remove('active');
    });
    
    var section = link.getAttribute('data-section');
    
    navLinks.forEach(function(l) {
      if (l.getAttribute('data-section') === section) {
        l.classList.add('active');
      }
    });
    
    mobileNavLinks.forEach(function(l) {
      if (l.getAttribute('data-section') === section) {
        l.classList.add('active');
      }
    });
  }
  
  // Desktop nav clicks
  navLinks.forEach(function(link) {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      var section = this.getAttribute('data-section');
      
      // Hide all sections
      document.querySelectorAll('.content-section').forEach(function(sec) {
        sec.style.display = 'none';
      });
      
      // Show selected section
      var targetSection = document.getElementById(section);
      if (targetSection) {
        targetSection.style.display = 'block';
      }
      
      // Update active state
      setActiveLink(this);
      
      // Log activity
      logActivity('navigation', 'Navigate to section: ' + section);
    });
  });
}

// Sidebar Toggle for Mobile
var sidebarToggle = document.getElementById('sidebarToggle');
var sidebar = document.getElementById('sidebar');

if (sidebarToggle && sidebar) {
  sidebarToggle.addEventListener('click', function() {
    sidebar.classList.toggle('active');
  });
}

// Fullscreen Mode
var fullscreenBtn = document.getElementById('fullscreenBtn');
if (fullscreenBtn) {
  fullscreenBtn.addEventListener('click', function() {
    toggleFullscreen();
  });
}

// Sidebar Toggle Button
var sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
if (sidebarToggleBtn && sidebar) {
  sidebarToggleBtn.addEventListener('click', function() {
    sidebar.classList.toggle('fullscreen');
    logActivity('sidebar_toggle', 'Toggle sidebar fullscreen');
  });
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(function(err) {
      console.log('Error attempting to enable fullscreen:', err);
    });
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
  logActivity('fullscreen', 'Toggle fullscreen mode');
}

// Draggable Sidebar (Enhanced)
var resizeHandle = document.getElementById('resizeHandle');
var isResizing = false;

if (resizeHandle) {
  resizeHandle.addEventListener('mousedown', function(e) {
    isResizing = true;
    document.body.style.cursor = 'col-resize';
  });
}

document.addEventListener('mousemove', function(e) {
  if (isResizing && sidebar) {
    var newWidth = window.innerWidth - e.clientX;
    if (newWidth >= 300 && newWidth <= 600) {
      sidebar.style.width = newWidth + 'px';
    }
  }
});

document.addEventListener('mouseup', function() {
  if (isResizing) {
    isResizing = false;
    document.body.style.cursor = 'default';
    logActivity('sidebar_resize', 'Sidebar resized to: ' + sidebar.style.width);
  }
});

// Touch-optimized Sidebar for Mobile
if (window.innerWidth <= 768) {
  if (sidebar) {
    sidebar.style.position = 'fixed';
    sidebar.style.right = '-320px';
    sidebar.style.transition = 'right 0.3s ease';
  }
}

// Active Section on Load
window.addEventListener('load', function() {
  var currentSection = window.location.hash.replace('#', '') || 'map-section';
  var targetSection = document.getElementById(currentSection);
  
  if (targetSection) {
    document.querySelectorAll('.content-section').forEach(function(sec) {
      sec.style.display = 'none';
    });
    targetSection.style.display = 'block';
    
    // Update active nav links
    document.querySelectorAll('.navbar-nav .nav-link').forEach(function(link) {
      if (link.getAttribute('data-section') === currentSection) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
    
    document.querySelectorAll('.mobile-nav-link').forEach(function(link) {
      if (link.getAttribute('data-section') === currentSection) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }
});

// Interactive Map Controls
var mapControls = {
  currentLayer: 'street',
  markerFilters: {
    accident: true,
    congestion: true,
    flood: true,
    obstacle: true,
    fire: true,
    health: true
  },
  isMeasuring: false,
  measurePoints: []
};

// Layer switching
document.querySelectorAll('.layer-option').forEach(function(option) {
  option.addEventListener('click', function() {
    var layer = this.getAttribute('data-layer');
    switchMapLayer(layer);
  });
});

function switchMapLayer(layer) {
  if (!map) return;

  // Remove existing layers
  map.eachLayer(function(layerObj) {
    if (layerObj instanceof L.TileLayer) {
      map.removeLayer(layerObj);
    }
  });

  // Add new layer based on selection
  var tileLayer;
  switch(layer) {
    case 'street':
      tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      });
      break;
    case 'satellite':
      tileLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri'
      });
      break;
    case 'terrain':
      tileLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenTopoMap'
      });
      break;
    case 'dark':
      tileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© CartoDB'
      });
      break;
    default:
      tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      });
  }

  tileLayer.addTo(map);
  mapControls.currentLayer = layer;

  // Update active state
  document.querySelectorAll('.layer-option').forEach(function(opt) {
    opt.classList.remove('active');
    if (opt.getAttribute('data-layer') === layer) {
      opt.classList.add('active');
    }
  });

  logActivity('map_layer_changed', 'Chuyển đổi lớp bản đồ: ' + layer);
}

// Map search
document.getElementById('mapSearchBtn').addEventListener('click', function() {
  var searchTerm = document.getElementById('mapSearchInput').value;
  if (searchTerm) {
    searchLocation(searchTerm);
  }
});

document.getElementById('mapSearchInput').addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    var searchTerm = this.value;
    if (searchTerm) {
      searchLocation(searchTerm);
    }
  }
});

document.getElementById('mapSearchInput').addEventListener('focus', function() {
  document.getElementById('searchResults').style.display = 'block';
});

document.addEventListener('click', function(e) {
  if (!e.target.closest('.map-search')) {
    document.getElementById('searchResults').style.display = 'none';
  }
});

document.querySelectorAll('.search-result-item').forEach(function(item) {
  item.addEventListener('click', function() {
    var lat = parseFloat(this.getAttribute('data-lat'));
    var lng = parseFloat(this.getAttribute('data-lng'));
    map.setView([lat, lng], 14);
    document.getElementById('searchResults').style.display = 'none';
    document.getElementById('mapSearchInput').value = this.querySelector('.result-name').textContent;
  });
});

function searchLocation(term) {
  // Simulate search - in production, use geocoding API
  alert('Tìm kiếm: ' + term + ' (tính năng demo)');
  logActivity('map_search', 'Tìm kiếm địa điểm: ' + term);
}

// Map controls
document.getElementById('zoomInBtn').addEventListener('click', function() {
  if (map) map.zoomIn();
});

document.getElementById('zoomOutBtn').addEventListener('click', function() {
  if (map) map.zoomOut();
});

document.getElementById('locateBtn').addEventListener('click', function() {
  if (navigator.geolocation && map) {
    navigator.geolocation.getCurrentPosition(function(position) {
      var lat = position.coords.latitude;
      var lng = position.coords.longitude;
      map.setView([lat, lng], 15);
      
      // Add user location marker
      L.marker([lat, lng], {
        icon: L.divIcon({
          className: 'user-location-marker',
          html: '<div style="background: #005BAC; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        })
      }).addTo(map);
    }, function(error) {
      alert('Không thể lấy vị trí: ' + error.message);
    });
  }
});

document.getElementById('fitBoundsBtn').addEventListener('click', function() {
  if (map && incidentData.length > 0) {
    var bounds = L.latLngBounds();
    incidentData.forEach(function(incident) {
      bounds.extend([incident.lat, incident.lng]);
    });
    map.fitBounds(bounds);
  }
});

document.getElementById('measureBtn').addEventListener('click', function() {
  document.getElementById('measurementPanel').style.display = 'block';
});

document.getElementById('filterBtn').addEventListener('click', function() {
  document.getElementById('markerFilterPanel').style.display = 'block';
});

document.getElementById('legendBtn').addEventListener('click', function() {
  document.getElementById('mapLegend').style.display = 'block';
});

// Close panels
document.getElementById('filterClose').addEventListener('click', function() {
  document.getElementById('markerFilterPanel').style.display = 'none';
});

document.getElementById('legendClose').addEventListener('click', function() {
  document.getElementById('mapLegend').style.display = 'none';
});

document.getElementById('measurementClose').addEventListener('click', function() {
  document.getElementById('measurementPanel').style.display = 'none';
  mapControls.isMeasuring = false;
  mapControls.measurePoints = [];
});

// Apply marker filter
document.getElementById('applyFilterBtn').addEventListener('click', function() {
  mapControls.markerFilters.accident = document.getElementById('filterAccident').checked;
  mapControls.markerFilters.congestion = document.getElementById('filterCongestion').checked;
  mapControls.markerFilters.flood = document.getElementById('filterFlood').checked;
  mapControls.markerFilters.obstacle = document.getElementById('filterObstacle').checked;
  mapControls.markerFilters.fire = document.getElementById('filterFire').checked;
  mapControls.markerFilters.health = document.getElementById('filterHealth').checked;

  applyMarkerFilters();
  document.getElementById('markerFilterPanel').style.display = 'none';

  logActivity('marker_filter_applied', 'Áp dụng bộ lọc marker');
});

function applyMarkerFilters() {
  if (!map) return;

  // Remove all markers
  map.eachLayer(function(layer) {
    if (layer instanceof L.Marker) {
      map.removeLayer(layer);
    }
  });

  // Re-add markers based on filters
  incidentData.forEach(function(incident) {
    var shouldShow = false;
    
    if (incident.type === 'accident' && mapControls.markerFilters.accident) shouldShow = true;
    if (incident.type === 'congestion' && mapControls.markerFilters.congestion) shouldShow = true;
    if (incident.type === 'flood' && mapControls.markerFilters.flood) shouldShow = true;
    if (incident.type === 'obstacle' && mapControls.markerFilters.obstacle) shouldShow = true;
    if (incident.type === 'fire' && mapControls.markerFilters.fire) shouldShow = true;
    if (incident.type === 'health' && mapControls.markerFilters.health) shouldShow = true;

    if (shouldShow) {
      addMarker(incident);
    }
  });
}

// Distance measurement
document.getElementById('startMeasureBtn').addEventListener('click', function() {
  mapControls.isMeasuring = true;
  mapControls.measurePoints = [];
  alert('Click trên bản đồ để chọn điểm bắt đầu đo');
  logActivity('measurement_started', 'Bắt đầu đo khoảng cách');
});

document.getElementById('clearMeasureBtn').addEventListener('click', function() {
  mapControls.isMeasuring = false;
  mapControls.measurePoints = [];
  document.getElementById('distanceValue').textContent = '0';
  
  // Remove measurement lines
  map.eachLayer(function(layer) {
    if (layer instanceof L.Polyline) {
      map.removeLayer(layer);
    }
  });
  
  logActivity('measurement_cleared', 'Xóa đo khoảng cách');
});

// Map click handler for measurement
if (map) {
  map.on('click', function(e) {
    if (mapControls.isMeasuring) {
      mapControls.measurePoints.push(e.latlng);
      
      if (mapControls.measurePoints.length > 1) {
        // Draw line between points
        var polyline = L.polyline(mapControls.measurePoints, {
          color: '#005BAC',
          weight: 3,
          opacity: 0.7
        }).addTo(map);
        
        // Calculate distance
        var totalDistance = 0;
        for (var i = 1; i < mapControls.measurePoints.length; i++) {
          totalDistance += mapControls.measurePoints[i-1].distanceTo(mapControls.measurePoints[i]);
        }
        
        document.getElementById('distanceValue').textContent = (totalDistance / 1000).toFixed(2);
      }
      
      // Add marker for the point
      L.circleMarker(e.latlng, {
        radius: 5,
        color: '#005BAC',
        fillColor: '#005BAC',
        fillOpacity: 1
      }).addTo(map);
    }
  });
}

// Marker colors by type
function getMarkerColor(type) {
  var colors = {
    accident: '#e74c3c',
    congestion: '#f39c12',
    flood: '#3498db',
    obstacle: '#2ecc71',
    fire: '#9b59b6',
    health: '#e67e22'
  };
  return colors[type] || '#333';
}

// Add marker with color
function addMarker(incident) {
  if (!map) return;

  var markerColor = getMarkerColor(incident.type);
  
  var marker = L.circleMarker([incident.lat, incident.lng], {
    radius: 8,
    color: markerColor,
    fillColor: markerColor,
    fillOpacity: 0.7,
    weight: 2
  }).addTo(map);

  var popupContent = `
    <div style="min-width: 200px;">
      <h4 style="margin: 0 0 10px 0; color: #333;">${incident.title}</h4>
      <p style="margin: 0 0 5px 0; color: #666; font-size: 13px;">${incident.description}</p>
      <p style="margin: 0; color: #999; font-size: 11px;">${incident.time}</p>
    </div>
  `;

  marker.bindPopup(popupContent);
}

// Initialize map controls on page load
document.addEventListener('DOMContentLoaded', function() {
  // Add initial markers
  if (map && incidentData) {
    incidentData.forEach(function(incident) {
      addMarker(incident);
    });
  }
});

// Initialize incident admin on page load
document.addEventListener('DOMContentLoaded', function() {
  initializeIncidentAdmin();
});

// High contrast mode toggle
var highContrastMode = false;
function toggleHighContrast() {
  highContrastMode = !highContrastMode;
  document.body.classList.toggle('high-contrast', highContrastMode);

  if (highContrastMode) {
    announceToScreenReader('High contrast mode enabled');
  } else {
    announceToScreenReader('High contrast mode disabled');
  }
}

// Add high contrast button to accessibility controls
var highContrastBtn = document.createElement('button');
highContrastBtn.className = 'font-size-btn';
highContrastBtn.setAttribute('aria-label', 'Toggle high contrast mode');
highContrastBtn.setAttribute('title', 'High contrast');
highContrastBtn.innerHTML = '◐';
highContrastBtn.addEventListener('click', toggleHighContrast);
document.getElementById('fontSizeControls').appendChild(highContrastBtn);

// Touch-friendly improvements for mobile
function optimizeForTouch() {
  // Increase tap targets on mobile
  if ('ontouchstart' in window) {
    document.body.classList.add('touch-device');

    // Prevent double-tap zoom on buttons
    document.querySelectorAll('button, a').forEach(function(element) {
      element.addEventListener('touchstart', function() {}, { passive: true });
    });
  }
}

// Initialize touch optimization
optimizeForTouch();

// Add swipe gesture support for mobile panels
function addSwipeGestures() {
  var sidebar = document.querySelector('.sidebar');
  if (!sidebar) return;

  var touchStartX = 0;
  var touchEndX = 0;

  sidebar.addEventListener('touchstart', function(e) {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  sidebar.addEventListener('touchend', function(e) {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
  }, { passive: true });

  function handleSwipe() {
    var swipeThreshold = 50;
    var diff = touchStartX - touchEndX;

    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        // Swipe left - close sidebar on mobile
        if (window.innerWidth <= 768) {
          sidebar.classList.add('hidden');
          announceToScreenReader('Sidebar closed');
        }
      } else {
        // Swipe right - open sidebar on mobile
        if (window.innerWidth <= 768) {
          sidebar.classList.remove('hidden');
          announceToScreenReader('Sidebar opened');
        }
      }
    }
  }
}

// Initialize swipe gestures
addSwipeGestures();

// Add haptic feedback for mobile devices
function hapticFeedback() {
  if ('vibrate' in navigator) {
    navigator.vibrate(10);
  }
}

// Add haptic feedback to important buttons
document.querySelectorAll('.btn-primary, .map-control-btn').forEach(function(btn) {
  btn.addEventListener('click', hapticFeedback);
});

// Screen reader announcements for dynamic content
function announceIncidentUpdate(incidentId, action) {
  var message = 'Incident ' + incidentId + ' has been ' + action;
  announceToScreenReader(message);
}

// Add loading state announcements
function announceLoadingState(isLoading, message) {
  if (isLoading) {
    announceToScreenReader(message || 'Loading content');
  }
}

// Error announcement for screen readers
function announceError(errorMessage) {
  announceToScreenReader('Error: ' + errorMessage);
}

// Save accessibility preferences to localStorage
function saveAccessibilityPreferences() {
  var preferences = {
    fontSize: document.documentElement.className,
    highContrast: highContrastMode
  };
  localStorage.setItem('accessibilityPreferences', JSON.stringify(preferences));
}

// Load accessibility preferences from localStorage
function loadAccessibilityPreferences() {
  var saved = localStorage.getItem('accessibilityPreferences');
  if (saved) {
    var preferences = JSON.parse(saved);
    if (preferences.fontSize) {
      document.documentElement.className = preferences.fontSize;
    }
    if (preferences.highContrast) {
      highContrastMode = true;
      document.body.classList.add('high-contrast');
    }
  }
}

// Save preferences when changed
document.getElementById('fontSmall').addEventListener('click', saveAccessibilityPreferences);
document.getElementById('fontMedium').addEventListener('click', saveAccessibilityPreferences);
document.getElementById('fontLarge').addEventListener('click', saveAccessibilityPreferences);
document.getElementById('fontXLarge').addEventListener('click', saveAccessibilityPreferences);

// Load preferences on page load
loadAccessibilityPreferences();

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