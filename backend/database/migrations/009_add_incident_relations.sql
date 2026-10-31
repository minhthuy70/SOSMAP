-- Create incident relations table
CREATE TABLE IF NOT EXISTS incident_relations (
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

-- Create indexes for incident relations
CREATE INDEX IF NOT EXISTS idx_incident_relations_incident_id ON incident_relations(incident_id);
CREATE INDEX IF NOT EXISTS idx_incident_relations_related_incident_id ON incident_relations(related_incident_id);
CREATE INDEX IF NOT EXISTS idx_incident_relations_type ON incident_relations(relation_type);
