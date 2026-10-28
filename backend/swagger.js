const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SOSMAP API',
      version: '1.0.0',
      description: 'API documentation for SOSMAP - Emergency Response System',
      contact: {
        name: 'SOSMAP Team',
        email: 'support@sosmap.vn'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      },
      {
        url: 'https://api.sosmap.vn',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            email: { type: 'string' },
            name: { type: 'string' },
            phone: { type: 'string' },
            role: { type: 'string', enum: ['user', 'moderator', 'admin'] }
          }
        },
        Incident: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            user_id: { type: 'integer' },
            type: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            latitude: { type: 'number' },
            longitude: { type: 'number' },
            severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
            status: { type: 'string', enum: ['pending', 'verified', 'in_progress', 'resolved', 'rejected'] },
            images: { type: 'array', items: { type: 'string' } },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                message: { type: 'string' },
                status: { type: 'integer' }
              }
            }
          }
        }
      }
    }
  },
  apis: ['./routes/*.js']
};

const specs = swaggerJsdoc(options);

module.exports = specs;
