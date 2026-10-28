# SOSMAP Backend API

Backend API cho hệ thống SOSMAP - Hệ thống bản đồ tiếp nhận và hiển thị phản ánh sự cố giao thông.

## Tech Stack

- Node.js
- Express.js
- PostgreSQL
- JWT Authentication
- Bcrypt for password hashing

## Features

- Authentication (Register, Login, Logout)
- Incident Management (CRUD)
- User Profile Management
- Notifications
- Analytics and Reporting
- Locations API (Vietnamese administrative units)
- Rate Limiting
- CORS Support
- Security Headers (Helmet)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` file with your configuration:
```
PORT=3000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sosmap
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d
CORS_ORIGIN=http://localhost:3000
```

3. Set up PostgreSQL database:
```bash
# Create database
createdb sosmap

# Run schema migration
psql -d sosmap -f database/schema.sql
```

## Running the Server

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Incidents

- `GET /api/incidents` - Get all incidents (with filters)
- `GET /api/incidents/:id` - Get single incident
- `POST /api/incidents` - Create new incident (requires auth)
- `PUT /api/incidents/:id` - Update incident (requires auth)
- `DELETE /api/incidents/:id` - Delete incident (requires auth)

### Users

- `GET /api/users/profile` - Get user profile (requires auth)
- `PUT /api/users/profile` - Update user profile (requires auth)
- `PUT /api/users/password` - Change password (requires auth)

### Notifications

- `GET /api/notifications` - Get user notifications (requires auth)
- `PUT /api/notifications/:id/read` - Mark notification as read (requires auth)
- `PUT /api/notifications/read-all` - Mark all notifications as read (requires auth)

### Analytics

- `GET /api/analytics/incidents` - Get incident statistics (requires auth)
- `GET /api/analytics/users` - Get user statistics (requires auth)
- `GET /api/analytics/trends` - Get incident trends (requires auth)

### Locations

- `GET /api/locations/provinces` - Get all provinces
- `GET /api/locations/wards/:provinceCode` - Get wards by province
- `GET /api/locations/reverse-geocode` - Reverse geocode coordinates

## Database Schema

### Users Table
- `id` - Primary key
- `email` - User email (unique)
- `password` - Hashed password
- `name` - User name
- `phone` - Phone number
- `role` - User role (user, admin, moderator)
- `created_at` - Timestamp
- `updated_at` - Timestamp

### Incidents Table
- `id` - Primary key
- `user_id` - Foreign key to users
- `type` - Incident type
- `title` - Incident title
- `description` - Incident description
- `latitude` - Latitude coordinate
- `longitude` - Longitude coordinate
- `severity` - Severity level (low, medium, high, critical)
- `status` - Status (pending, verified, in_progress, resolved, rejected)
- `images` - JSON array of image URLs
- `verified_by` - Foreign key to users (admin who verified)
- `verified_at` - Verification timestamp
- `created_at` - Timestamp
- `updated_at` - Timestamp

### Notifications Table
- `id` - Primary key
- `user_id` - Foreign key to users
- `type` - Notification type
- `title` - Notification title
- `message` - Notification message
- `data` - JSON data
- `read` - Read status
- `read_at` - Read timestamp
- `created_at` - Timestamp

## Security

- Password hashing with bcrypt
- JWT token authentication
- Rate limiting
- CORS configuration
- Helmet security headers
- Input validation with express-validator

## Default Admin User

Email: `admin@sosmap.vn`
Password: `admin123`

**Important:** Change the default admin password after first login!

## Development

The server automatically restarts on file changes when using `npm run dev`.

## Testing

```bash
npm test
```

## License

MIT
