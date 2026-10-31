const { body, query, param, validationResult } = require('express-validator');

// Validation middleware factory
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  const formattedErrors = errors.array().map(err => ({
    field: err.param,
    message: err.msg,
    value: err.value
  }));

  return res.status(400).json({
    success: false,
    errors: formattedErrors
  });
};

// Common validation rules
const validationRules = {
  // User validation
  user: {
    register: [
      body('email').isEmail().normalizeEmail().withMessage('Email không hợp lệ'),
      body('password').isLength({ min: 6 }).withMessage('Mật khẩu phải có ít nhất 6 ký tự'),
      body('name').trim().notEmpty().withMessage('Tên là bắt buộc'),
      body('phone').optional().trim().isMobilePhone('vi-VN').withMessage('Số điện thoại không hợp lệ')
    ],
    login: [
      body('email').isEmail().normalizeEmail().withMessage('Email không hợp lệ'),
      body('password').notEmpty().withMessage('Mật khẩu là bắt buộc')
    ],
    updateProfile: [
      body('name').optional().trim().notEmpty().withMessage('Tên không được để trống'),
      body('phone').optional().trim().isMobilePhone('vi-VN').withMessage('Số điện thoại không hợp lệ'),
      body('email').optional().isEmail().normalizeEmail().withMessage('Email không hợp lệ')
    ]
  },

  // Incident validation
  incident: {
    create: [
      body('type').trim().notEmpty().withMessage('Loại sự cố là bắt buộc'),
      body('title').trim().notEmpty().isLength({ max: 500 }).withMessage('Tiêu đề là bắt buộc và tối đa 500 ký tự'),
      body('description').trim().notEmpty().withMessage('Mô tả là bắt buộc'),
      body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Vĩ độ phải nằm giữa -90 và 90'),
      body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Kinh độ phải nằm giữa -180 và 180'),
      body('severity').isIn(['low', 'medium', 'high', 'critical']).withMessage('Mức độ không hợp lệ'),
      body('images').optional().isArray().withMessage('Images phải là mảng')
    ],
    update: [
      body('title').optional().trim().notEmpty().isLength({ max: 500 }).withMessage('Tiêu đề tối đa 500 ký tự'),
      body('description').optional().trim().notEmpty().withMessage('Mô tả không được để trống'),
      body('severity').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Mức độ không hợp lệ'),
      body('status').optional().isIn(['pending', 'verified', 'in_progress', 'resolved', 'rejected']).withMessage('Trạng thái không hợp lệ')
    ],
    assign: [
      body('assigned_to').isInt().withMessage('assigned_to phải là số nguyên'),
      body('notes').optional().trim().isLength({ max: 1000 }).withMessage('Ghi chú tối đa 1000 ký tự')
    ],
    escalate: [
      body('escalation_level').isInt({ min: 1, max: 5 }).withMessage('Cấp độ phải từ 1 đến 5'),
      body('reason').optional().trim().isLength({ max: 500 }).withMessage('Lý do tối đa 500 ký tự'),
      body('auto_escalate_hours').optional().isInt({ min: 1 }).withMessage('Thời gian tự động nâng cấp phải là số nguyên dương')
    ]
  },

  // Pagination validation
  pagination: [
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit phải từ 1 đến 100'),
    query('offset').optional().isInt({ min: 0 }).withMessage('Offset phải là số không âm')
  ],

  // Date validation
  dateRange: [
    query('start_date').optional().isISO8601().withMessage('Ngày bắt đầu không hợp lệ'),
    query('end_date').optional().isISO8601().withMessage('Ngày kết thúc không hợp lệ')
  ],

  // Search validation
  search: [
    query('search').optional().trim().isLength({ max: 200 }).withMessage('Từ khóa tìm kiếm tối đa 200 ký tự')
  ]
};

// Sanitization helper
const sanitizeInput = (req, res, next) => {
  // Remove potential XSS from string inputs
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    return str.replace(/[<>]/g, '');
  };

  const sanitizeObject = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    const sanitized = {};
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        sanitized[key] = sanitizeString(obj[key]);
      } else if (typeof obj[key] === 'object') {
        sanitized[key] = sanitizeObject(obj[key]);
      } else {
        sanitized[key] = obj[key];
      }
    }
    return sanitized;
  };

  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  if (req.params) {
    req.params = sanitizeObject(req.params);
  }

  next();
};

module.exports = {
  validate,
  validationRules,
  sanitizeInput
};
