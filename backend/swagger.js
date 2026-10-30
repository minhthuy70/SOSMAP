const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SOSMAP API',
      version: '1.0.0',
      description: `
        API documentation for SOSMAP - Emergency Response System
        
        SOSMAP là hệ thống bản đồ tương tác cho phép người dùng báo cáo, theo dõi và quản lý các sự cố giao thông và tình huống khẩn cấp theo thời gian thực.
        
        ## Authentication
        
        Hầu hết các API endpoint yêu cầu JWT token trong header Authorization:
        
        \`Authorization: Bearer <token>\`
        
        ## Rate Limiting
        
        API có giới hạn tốc độ:
        - 100 requests mỗi 15 phút (IP-based)
        - 10 requests mỗi phút cho các thao tác nhạy cảm
        - 5 uploads mỗi giờ
        
        ## Error Responses
        
        Các lỗi API trả về với format:
        
        \`\`\`json
        {
          "error": {
            "message": "Error message",
            "status": 400
          }
        }
        \`\`\`
      `,
      contact: {
        name: 'SOSMAP Team',
        email: 'support@sosmap.vn',
        url: 'https://sosmap.vn'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
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
    tags: [
      {
        name: 'Authentication',
        description: 'Xác thực và quản lý người dùng'
      },
      {
        name: 'Incidents',
        description: 'Quản lý sự cố'
      },
      {
        name: 'Users',
        description: 'Quản lý thông tin người dùng'
      },
      {
        name: 'Notifications',
        description: 'Quản lý thông báo'
      },
      {
        name: 'Analytics',
        description: 'Thống kê và báo cáo'
      },
      {
        name: 'Locations',
        description: 'Tìm kiếm địa điểm và geocoding'
      },
      {
        name: 'Layers',
        description: 'Quản lý các lớp bản đồ'
      },
      {
        name: 'Roles',
        description: 'Quản lý vai trò và quyền'
      },
      {
        name: 'Audit',
        description: 'Nhật ký kiểm tra'
      },
      {
        name: 'Telemetry',
        description: 'Theo dõi và phân tích'
      },
      {
        name: 'Health',
        description: 'Kiểm tra sức khỏe hệ thống'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtained from /api/auth/login'
        }
      },
      schemas: {
        User: {
          type: 'object',
          required: ['email', 'password', 'name'],
          properties: {
            id: { type: 'integer', description: 'ID người dùng' },
            email: { type: 'string', format: 'email', description: 'Email người dùng' },
            password: { type: 'string', format: 'password', description: 'Mật khẩu (chỉ khi tạo mới)' },
            name: { type: 'string', description: 'Họ tên' },
            phone: { type: 'string', description: 'Số điện thoại' },
            role: { type: 'string', enum: ['user', 'moderator', 'admin'], description: 'Vai trò người dùng' },
            is_active: { type: 'boolean', description: 'Trạng thái hoạt động' },
            created_at: { type: 'string', format: 'date-time', description: 'Thời gian tạo' },
            updated_at: { type: 'string', format: 'date-time', description: 'Thời gian cập nhật' }
          }
        },
        Incident: {
          type: 'object',
          required: ['type', 'title', 'latitude', 'longitude', 'severity'],
          properties: {
            id: { type: 'integer', description: 'ID sự cố' },
            user_id: { type: 'integer', description: 'ID người dùng tạo' },
            type: { 
              type: 'string', 
              enum: ['traffic', 'flood', 'fire', 'health', 'infrastructure', 'public_safety', 'other'],
              description: 'Loại sự cố'
            },
            title: { type: 'string', maxLength: 500, description: 'Tiêu đề sự cố' },
            description: { type: 'string', description: 'Mô tả chi tiết' },
            latitude: { type: 'number', minimum: -90, maximum: 90, description: 'Vĩ độ' },
            longitude: { type: 'number', minimum: -180, maximum: 180, description: 'Kinh độ' },
            severity: { 
              type: 'string', 
              enum: ['low', 'medium', 'high', 'critical'],
              description: 'Mức độ nghiêm trọng'
            },
            status: { 
              type: 'string', 
              enum: ['pending', 'verified', 'in_progress', 'resolved', 'rejected'],
              default: 'pending',
              description: 'Trạng thái xử lý'
            },
            images: { 
              type: 'array', 
              items: { type: 'string' },
              description: 'Danh sách URL hình ảnh'
            },
            verified_by: { type: 'integer', description: 'ID người dùng xác minh' },
            verified_at: { type: 'string', format: 'date-time', description: 'Thời gian xác minh' },
            created_at: { type: 'string', format: 'date-time', description: 'Thời gian tạo' },
            updated_at: { type: 'string', format: 'date-time', description: 'Thời gian cập nhật' }
          }
        },
        Notification: {
          type: 'object',
          required: ['type', 'title'],
          properties: {
            id: { type: 'integer', description: 'ID thông báo' },
            user_id: { type: 'integer', description: 'ID người dùng nhận' },
            type: { type: 'string', description: 'Loại thông báo' },
            title: { type: 'string', description: 'Tiêu đề thông báo' },
            message: { type: 'string', description: 'Nội dung thông báo' },
            data: { type: 'object', description: 'Dữ liệu bổ sung' },
            read: { type: 'boolean', default: false, description: 'Đã đọc hay chưa' },
            read_at: { type: 'string', format: 'date-time', description: 'Thời gian đọc' },
            created_at: { type: 'string', format: 'date-time', description: 'Thời gian tạo' }
          }
        },
        MapLayer: {
          type: 'object',
          required: ['name', 'url', 'type'],
          properties: {
            id: { type: 'integer', description: 'ID lớp bản đồ' },
            name: { type: 'string', description: 'Tên lớp bản đồ' },
            url: { type: 'string', description: 'URL tile layer' },
            type: { 
              type: 'string', 
              enum: ['tile', 'wms', 'geojson', 'vector'],
              description: 'Loại layer'
            },
            attribution: { type: 'string', description: 'Thông tin bản quyền' },
            is_active: { type: 'boolean', default: true, description: 'Đang hoạt động' },
            display_order: { type: 'integer', default: 0, description: 'Thứ tự hiển thị' },
            options: { type: 'object', description: 'Tùy chọn bổ sung' },
            created_at: { type: 'string', format: 'date-time', description: 'Thời gian tạo' },
            updated_at: { type: 'string', format: 'date-time', description: 'Thời gian cập nhật' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                message: { type: 'string', description: 'Thông báo lỗi' },
                status: { type: 'integer', description: 'HTTP status code' },
                details: { type: 'object', description: 'Chi tiết lỗi bổ sung' }
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
