// Khởi tạo bản đồ
var map = L.map('map').setView([10.7769, 106.7009], 13); // HCM center

// Nền bản đồ (OpenStreetMap)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Hàm cập nhật giờ
function updateTime() {
  let now = new Date();
  document.getElementById("time").innerText = now.toLocaleString("vi-VN");
}
setInterval(updateTime, 1000);
updateTime();

// Thêm marker mẫu (ổ gà / chướng ngại vật)
L.marker([10.7769, 106.7009]).addTo(map)
  .bindPopup("⚠️ Ổ gà được báo cáo ở đây!");

