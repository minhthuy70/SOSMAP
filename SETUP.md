# SOSMAP - Cài đặt và Hướng dẫn sử dụng

## Tổng quan

SOSMAP là hệ thống bản đồ tiếp nhận và hiển thị phản ánh sự cố giao thông và thiên tai, được xây dựng với kiến trúc full-stack bao gồm Frontend (HTML/CSS/JS), Backend (Node.js/Express), và Database (PostgreSQL).

## Kiến trúc hệ thống

```
SOSMAP/
├── index.html              # Frontend - Main HTML file
├── script.js               # Frontend - JavaScript logic
├── style.css               # Frontend - Styles
├── service-worker.js       # Frontend - PWA service worker
├── manifest.json           # Frontend - PWA manifest
├── config.js               # Frontend - Configuration
├── backend/                # Backend API
│   ├── server.js          # Express server
│   ├── config/            # Database and app config
│   ├── routes/            # API endpoints
│   ├── middleware/        # Express middleware
│   ├── services/          # Business logic services
│   ├── database/          # Database schema
│   ├── tests/             # Unit and integration tests
│   ├── Dockerfile         # Docker container config
│   └── package.json       # Node.js dependencies
├── docker-compose.yml     # Docker orchestration
├── .env.example          # Environment variables template
└── postgresql/           # Vietnamese administrative units data
```

## Yêu cầu hệ thống

### Frontend
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection

### Backend
- Node.js 18+
- PostgreSQL 15+
- Redis 7+ (optional, for caching)

### Development Tools
- Git
- Docker & Docker Compose (optional)

## Cài đặt

### 1. Clone repository

```bash
git clone <repository-url>
cd SOSMAP
```

### 2. Cài đặt Backend

```bash
cd backend
npm install
```

### 3. Cấu hình Environment Variables

Copy file `.env.example` sang `.env`:

```bash
cp .env.example .env
cp backend/.env.example backend/.env
```

Chỉnh sửa các biến môi trường trong file `.env`:

```env
# Backend Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sosmap
DB_USER=postgres
DB_PASSWORD=your_password

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_change_this_in_production
JWT_EXPIRE=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Email Configuration (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=noreply@sosmap.vn

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

### 4. Cài đặt Database

#### Option A: Sử dụng Docker Compose (Khuyên dùng)

```bash
# Tại thư mục gốc
docker-compose up -d postgres redis
```

#### Option B: Cài đặt PostgreSQL cục bộ

```bash
# Tạo database
createdb sosmap

# Chạy schema migration
psql -d sosmap -f backend/database/schema.sql
```

### 5. Khởi động Backend

```bash
cd backend
npm run dev
```

Backend sẽ chạy tại `http://localhost:3000`

### 6. Mở Frontend

Mở file `index.html` trực tiếp trong trình duyệt hoặc sử dụng một web server:

```bash
# Sử dụng Python
python -m http.server 8000

# Hoặc sử dụng Node.js http-server
npx http-server -p 8000
```

Frontend sẽ chạy tại `http://localhost:8000`

## Sử dụng Docker

### Build và chạy tất cả services

```bash
docker-compose up -d
```

### Chỉ chạy backend với Docker

```bash
cd backend
docker build -t sosmap-backend .
docker run -p 3000:3000 --env-file .env sosmap-backend
```

### Xem logs

```bash
docker-compose logs -f backend
```

### Dừng services

```bash
docker-compose down
```

## API Documentation

Sau khi khởi động backend, truy cập Swagger UI tại:

```
http://localhost:3000/api-docs
```

## Tính năng chính

### Frontend
- Bản đồ tương tác với Leaflet
- Hiển thị sự cố theo thời gian thực
- Gửi phản ánh sự cố
- Xem thống kê và báo cáo
- Hỗ trợ PWA (Progressive Web App)
- Responsive design

### Backend
- Authentication với JWT
- Incident Management API
- User Management API
- Notifications API
- Analytics & Reporting API
- File Upload (images/videos)
- Geocoding Service
- Email Notifications
- WebSocket cho real-time updates
- PDF Export
- Audit Logging

## Testing

### Chạy unit tests

```bash
cd backend
npm test
```

### Chạy tests với coverage

```bash
npm test -- --coverage
```

## Triển khai

### Production Environment Variables

Đảm bảo các biến môi trường sau được cấu hình cho production:

- `NODE_ENV=production`
- `JWT_SECRET` - Strong secret key
- `DB_PASSWORD` - Strong database password
- `EMAIL_PASS` - SMTP password
- `CORS_ORIGIN` - Frontend URL

### Deploy với Docker

```bash
docker-compose -f docker-compose.yml --profile production up -d
```

### Deploy thủ công

1. Build backend:
```bash
cd backend
npm install --production
```

2. Setup database production
3. Chạy schema migration
4. Start server:
```bash
npm start
```

## Xử lý sự cố

### Database connection failed
- Kiểm tra PostgreSQL đang chạy
- Kiểm tra thông tin kết nối trong `.env`
- Đảm bảo database đã được tạo

### Port already in use
- Thay đổi PORT trong `.env`
- Hoặc dừng process đang sử dụng port 3000

### WebSocket không hoạt động
- Kiểm tra CORS configuration
- Đảm bảo frontend URL đúng trong `CORS_ORIGIN`

## Tài liệu tham khảo

- [Backend README](backend/README.md)
- [Database Schema](backend/database/schema.sql)
- [API Documentation](http://localhost:3000/api-docs)
- [Vietnamese Administrative Units](README_vi.md)

## Hỗ trợ

Nếu gặp vấn đề, vui lòng:
1. Kiểm tra logs của backend
2. Kiểm tra console của trình duyệt
3. Review error messages
4. Mở issue trên GitHub repository

## License

MIT License - Xem file LICENSE để biết chi tiết
