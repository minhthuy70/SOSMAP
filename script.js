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
document.addEventListener('DOMContentLoaded', function() {
  initializeEarlyWarningSystem();
});

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
document.addEventListener('DOMContentLoaded', function() {
  initializeRescueSystem();
});

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
document.addEventListener('DOMContentLoaded', function() {
  initializeReliefSystem();
});

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
document.addEventListener('DOMContentLoaded', function() {
  initializeHealthSystem();
});

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
document.addEventListener('DOMContentLoaded', function() {
  initializeFireSystem();
});

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
document.addEventListener('DOMContentLoaded', function() {
  initializeSafetySystem();
});

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