-- Migration 003: Add Roles and Permissions Table
-- Version: 1.1.0
-- Description: Add roles table for better permission management

CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  permissions JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);

-- Insert default roles
INSERT INTO roles (name, description, permissions) VALUES
('admin', 'Full system access', '["*"]'),
('moderator', 'Can manage incidents and users', '["incidents:*", "users:read", "users:update"]'),
('user', 'Can create and view incidents', '["incidents:create", "incidents:read"]'),
('viewer', 'Read-only access', '["incidents:read", "map:view"]')
ON CONFLICT (name) DO NOTHING;

-- Add role_id to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS role_id INTEGER REFERENCES roles(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);
