const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const pool = require('../config/database');

// Get all report templates
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM incident_report_templates ORDER BY is_default DESC, created_at DESC'
    );

    res.json({ templates: result.rows });
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

// Get default template
router.get('/default', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM incident_report_templates WHERE is_default = true LIMIT 1'
    );

    if (result.rows.length === 0) {
      // Return a default template if none exists
      return res.json({
        template: {
          id: 0,
          name: 'Mặc định',
          description: 'Mẫu báo cáo mặc định',
          template_fields: [
            { name: 'type', label: 'Loại sự cố', type: 'select', required: true, options: ['traffic', 'accident', 'flood', 'fire', 'other'] },
            { name: 'title', label: 'Tiêu đề', type: 'text', required: true },
            { name: 'description', label: 'Mô tả', type: 'textarea', required: true },
            { name: 'latitude', label: 'Vĩ độ', type: 'number', required: true },
            { name: 'longitude', label: 'Kinh độ', type: 'number', required: true },
            { name: 'severity', label: 'Mức độ', type: 'select', required: true, options: ['low', 'medium', 'high', 'critical'] }
          ]
        }
      });
    }

    res.json({ template: result.rows[0] });
  } catch (error) {
    console.error('Get default template error:', error);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

// Get single template
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM incident_report_templates WHERE id = $1',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Template not found', status: 404 } });
    }

    res.json({ template: result.rows[0] });
  } catch (error) {
    console.error('Get template error:', error);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

// Create new template (admin only)
router.post('/', auth, [
  body('name').trim().notEmpty(),
  body('description').optional().trim(),
  body('template_fields').isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Only admins can create templates
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: { message: 'Unauthorized to create templates', status: 403 } });
    }

    const { name, description, template_fields, is_default } = req.body;

    // If setting as default, remove default from other templates
    if (is_default) {
      await pool.query(
        'UPDATE incident_report_templates SET is_default = false WHERE is_default = true'
      );
    }

    const result = await pool.query(
      `INSERT INTO incident_report_templates (name, description, template_fields, is_default, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, description, JSON.stringify(template_fields), is_default || false, req.user.id]
    );

    res.status(201).json({ message: 'Template created successfully', template: result.rows[0] });
  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

// Update template (admin only)
router.put('/:id', auth, [
  body('name').optional().trim().notEmpty(),
  body('description').optional().trim(),
  body('template_fields').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Only admins can update templates
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: { message: 'Unauthorized to update templates', status: 403 } });
    }

    const { name, description, template_fields, is_default } = req.body;

    // If setting as default, remove default from other templates
    if (is_default) {
      await pool.query(
        'UPDATE incident_report_templates SET is_default = false WHERE is_default = true AND id != $1',
        [req.params.id]
      );
    }

    const result = await pool.query(
      `UPDATE incident_report_templates
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           template_fields = COALESCE($3, template_fields::jsonb),
           is_default = COALESCE($4, is_default),
           updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [name, description, template_fields ? JSON.stringify(template_fields) : null, is_default, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Template not found', status: 404 } });
    }

    res.json({ message: 'Template updated successfully', template: result.rows[0] });
  } catch (error) {
    console.error('Update template error:', error);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

// Delete template (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    // Only admins can delete templates
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: { message: 'Unauthorized to delete templates', status: 403 } });
    }

    // Check if template is default
    const templateResult = await pool.query(
      'SELECT is_default FROM incident_report_templates WHERE id = $1',
      [req.params.id]
    );

    if (templateResult.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Template not found', status: 404 } });
    }

    if (templateResult.rows[0].is_default) {
      return res.status(400).json({ error: { message: 'Cannot delete default template', status: 400 } });
    }

    await pool.query(
      'DELETE FROM incident_report_templates WHERE id = $1',
      [req.params.id]
    );

    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({ error: { message: 'Internal server error', status: 500 } });
  }
});

module.exports = router;
