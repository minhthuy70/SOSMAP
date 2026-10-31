-- Create incident report templates table
CREATE TABLE IF NOT EXISTS incident_report_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  template_fields JSONB NOT NULL DEFAULT '[]',
  is_default BOOLEAN DEFAULT false,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for report templates
CREATE INDEX IF NOT EXISTS idx_report_templates_is_default ON incident_report_templates(is_default);
CREATE INDEX IF NOT EXISTS idx_report_templates_created_by ON incident_report_templates(created_by);
