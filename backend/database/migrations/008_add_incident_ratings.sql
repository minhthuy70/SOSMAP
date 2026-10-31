-- Create incident ratings table
CREATE TABLE IF NOT EXISTS incident_ratings (
  id SERIAL PRIMARY KEY,
  incident_id INTEGER NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(incident_id, user_id)
);

-- Create indexes for incident ratings
CREATE INDEX IF NOT EXISTS idx_incident_ratings_incident_id ON incident_ratings(incident_id);
CREATE INDEX IF NOT EXISTS idx_incident_ratings_user_id ON incident_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_incident_ratings_rating ON incident_ratings(rating);
