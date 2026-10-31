-- Add incident assignment columns
ALTER TABLE incidents
ADD COLUMN IF NOT EXISTS assigned_to INTEGER REFERENCES users(id),
ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS assigned_by INTEGER REFERENCES users(id),
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create index for assigned incidents
CREATE INDEX IF NOT EXISTS idx_incidents_assigned_to ON incidents(assigned_to) WHERE assigned_to IS NOT NULL;
