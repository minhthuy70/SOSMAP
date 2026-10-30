# SOSMAP Backend

Backend API server for SOSMAP Emergency Response System.

## Directory Structure

```
backend/
├── config/           # Configuration files
│   └── database.js   # Database connection configuration
├── database/          # Database related files
│   ├── schema.sql      # Database schema
│   ├── migrations/     # Database migration scripts
│   └── migrate.js      # Migration runner
├── middleware/         # Express middleware
│   ├── auth.js         # Authentication middleware
│   ├── audit.js        # Audit logging middleware
│   ├── rateLimiter.js  # Rate limiting middleware
│   └── upload.js       # File upload validation
├── routes/             # API route handlers
│   ├── auth.js         # Authentication endpoints
│   ├── incidents.js    # Incident management endpoints
│   ├── users.js        # User management endpoints
│   ├── notifications.js # Notification endpoints
│   ├── analytics.js    # Analytics endpoints
│   ├── locations.js    # Geocoding endpoints
│   ├── layers.js       # Map layer endpoints
│   ├── roles.js        # Role management endpoints
│   ├── audit.js        # Audit log endpoints
│   ├── telemetry.js    # Telemetry tracking endpoints
│   └── monitoring.js   # System monitoring endpoints
├── services/           # Business logic services
│   ├── email.js        # Email service
│   ├── geocoding.js    # Geocoding service
│   ├── pdf.js          # PDF generation service
│   └── websocket.js    # WebSocket service
├── tests/              # Test files
│   ├── api.test.js     # API integration tests
│   ├── email.test.js   # Email service tests
│   └── utils.test.js   # Utility function tests
├── utils/              # Utility functions
│   ├── logger.js       # Logging utility
│   └── validateEnv.js  # Environment validation
├── uploads/            # Upload directory (created at runtime)
├── exports/            # Export directory (created at runtime)
├── logs/               # Log files (created at runtime)
├── .env.example        # Environment variables template
├── Dockerfile          # Docker configuration
├── dockerignore        # Docker ignore file
├── package.json        # Node.js dependencies
├── server.js           # Main server entry point
├── swagger.js          # Swagger API documentation
└── README.md           # This file
```

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. Run database migrations:
   ```bash
   node database/migrate.js
   ```

4. Start the server:
   ```bash
   npm start
   ```

## API Documentation

Swagger documentation is available at: `http://localhost:3000/api-docs`

## Environment Variables

See `.env.example` for required environment variables.

## Testing

Run tests with:
```bash
npm test
```

## Docker

Build and run with Docker:
```bash
docker-compose up
```
