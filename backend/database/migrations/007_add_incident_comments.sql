-- Create incident comments table
CREATE TABLE IF NOT EXISTS incident_comments (
  id SERIAL PRIMARY KEY,
  incident_id INTEGER NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  comment TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for incident comments
CREATE INDEX IF NOT EXISTS idx_incident_comments_incident_id ON incident_comments(incident_id);
CREATE INDEX IF NOT EXISTS idx_incident_comments_user_id ON incident_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_incident_comments_created_at ON incident_comments(created_at);
