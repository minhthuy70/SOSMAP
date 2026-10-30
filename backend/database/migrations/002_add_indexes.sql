-- Migration 002: Add Performance Indexes
-- Version: 1.0.1
-- Description: Add composite and partial indexes for better query performance

-- Composite indexes for incidents
CREATE INDEX IF NOT EXISTS idx_incidents_type_status ON incidents(type, status);
CREATE INDEX IF NOT EXISTS idx_incidents_severity_status ON incidents(severity, status);
CREATE INDEX IF NOT EXISTS idx_incidents_user_created ON incidents(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_incidents_verified ON incidents(verified_by) WHERE verified_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_incidents_pending ON incidents(status) WHERE status = 'pending';

-- Composite indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id) WHERE read = false;

-- Composite indexes for map_layers
CREATE INDEX IF NOT EXISTS idx_map_layers_display_order ON map_layers(display_order);
CREATE INDEX IF NOT EXISTS idx_map_layers_active_type ON map_layers(is_active, type);

-- Composite indexes for audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created ON audit_logs(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_ip_address ON audit_logs(ip_address);

-- Additional indexes for users
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
