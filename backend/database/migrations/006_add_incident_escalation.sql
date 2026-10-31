-- Add incident escalation columns
ALTER TABLE incidents
ADD COLUMN IF NOT EXISTS escalation_level INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS escalated_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS escalated_by INTEGER REFERENCES users(id),
ADD COLUMN IF NOT EXISTS auto_escalate_at TIMESTAMP;

-- Create index for escalation queries
CREATE INDEX IF NOT EXISTS idx_incidents_escalation_level ON incidents(escalation_level);
CREATE INDEX IF NOT EXISTS idx_incidents_auto_escalate ON incidents(auto_escalate_at) WHERE auto_escalate_at IS NOT NULL;
