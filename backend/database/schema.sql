-- SOSMAP Database Schema
-- PostgreSQL

-- Drop existing tables if they exist
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS map_layers CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS incident_comments CASCADE;
DROP TABLE IF EXISTS incidents CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
  is_active BOOLEAN DEFAULT true,
  push_subscription JSONB,
  last_latitude DECIMAL(10, 8),
  last_longitude DECIMAL(11, 8),
  last_location_accuracy DECIMAL(10, 2),
  last_location_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_phone ON users(phone);

-- Incidents table
CREATE TABLE incidents (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  type VARCHAR(100) NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'in_progress', 'resolved', 'rejected')),
  images JSONB DEFAULT '[]',
  verified_by INTEGER REFERENCES users(id),
  verified_at TIMESTAMP,
  assigned_to INTEGER REFERENCES users(id),
  assigned_at TIMESTAMP,
  assigned_by INTEGER REFERENCES users(id),
  notes TEXT,
  escalation_level INTEGER DEFAULT 0,
  escalated_at TIMESTAMP,
  escalated_by INTEGER REFERENCES users(id),
  auto_escalate_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for incidents
CREATE INDEX idx_incidents_user_id ON incidents(user_id);
CREATE INDEX idx_incidents_type ON incidents(type);
CREATE INDEX idx_incidents_severity ON incidents(severity);
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_created_at ON incidents(created_at);
CREATE INDEX idx_incidents_location ON incidents(latitude, longitude);
CREATE INDEX idx_incidents_type_status ON incidents(type, status);
CREATE INDEX idx_incidents_severity_status ON incidents(severity, status);
CREATE INDEX idx_incidents_user_created ON incidents(user_id, created_at);
CREATE INDEX idx_incidents_verified ON incidents(verified_by) WHERE verified_by IS NOT NULL;
CREATE INDEX idx_incidents_pending ON incidents(status) WHERE status = 'pending';

-- Incident comments table
CREATE TABLE incident_comments (
  id SERIAL PRIMARY KEY,
  incident_id INTEGER NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  comment TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for incident comments
CREATE INDEX idx_incident_comments_incident_id ON incident_comments(incident_id);
CREATE INDEX idx_incident_comments_user_id ON incident_comments(user_id);
CREATE INDEX idx_incident_comments_created_at ON incident_comments(created_at);

-- Incident ratings table
CREATE TABLE incident_ratings (
  id SERIAL PRIMARY KEY,
  incident_id INTEGER NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(incident_id, user_id)
);

-- Indexes for incident ratings
CREATE INDEX idx_incident_ratings_incident_id ON incident_ratings(incident_id);
CREATE INDEX idx_incident_ratings_user_id ON incident_ratings(user_id);
CREATE INDEX idx_incident_ratings_rating ON incident_ratings(rating);

-- Incident related incidents (linking) table
CREATE TABLE incident_relations (
  id SERIAL PRIMARY KEY,
  incident_id INTEGER NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  related_incident_id INTEGER NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  relation_type VARCHAR(50) NOT NULL CHECK (relation_type IN ('duplicate', 'follow_up', 'related', 'caused_by', 'causing')),
  notes TEXT,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(incident_id, related_incident_id),
  CHECK (incident_id != related_incident_id)
);

-- Indexes for incident relations
CREATE INDEX idx_incident_relations_incident_id ON incident_relations(incident_id);
CREATE INDEX idx_incident_relations_related_incident_id ON incident_relations(related_incident_id);
CREATE INDEX idx_incident_relations_type ON incident_relations(relation_type);

-- Notifications table
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(100) NOT NULL,
  title VARCHAR(500) NOT NULL,
  message TEXT,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, read);
CREATE INDEX idx_notifications_unread ON notifications(user_id) WHERE read = false;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_incidents_updated_at BEFORE UPDATE ON incidents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_incident_comments_updated_at BEFORE UPDATE ON incident_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_incident_ratings_updated_at BEFORE UPDATE ON incident_ratings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Map Layers table
CREATE TABLE map_layers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  url VARCHAR(500) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('tile', 'wms', 'geojson', 'vector')),
  attribution TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  options JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for map_layers
CREATE INDEX idx_map_layers_type ON map_layers(type);
CREATE INDEX idx_map_layers_active ON map_layers(is_active);
CREATE INDEX idx_map_layers_display_order ON map_layers(display_order);
CREATE INDEX idx_map_layers_active_type ON map_layers(is_active, type);

-- Trigger for map_layers updated_at
CREATE TRIGGER update_map_layers_updated_at BEFORE UPDATE ON map_layers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default map layers
INSERT INTO map_layers (name, url, type, attribution, display_order, options) VALUES
('OpenStreetMap', 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', 'tile', '&copy; OpenStreetMap contributors', 1, '{"maxZoom": 19}'),
('Satellite', 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', 'tile', 'Tiles &copy; Esri', 2, '{"maxZoom": 17}'),
('Terrain', 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', 'tile', 'Map data: &copy; OpenStreetMap, SRTM | Map style: &copy; OpenTopoMap', 3, '{"maxZoom": 17}');

-- Audit Logs table
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100),
  entity_id INTEGER,
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for audit_logs
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_user_created ON audit_logs(user_id, created_at);
CREATE INDEX idx_audit_logs_ip_address ON audit_logs(ip_address);

-- Insert sample admin user (password: admin123)
INSERT INTO users (email, password, name, role) VALUES
('admin@sosmap.vn', '$2a$10$rOZ7J5W5vX3Z3Z3Z3Z3Z3eXyZ3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3', 'Admin User', 'admin');
