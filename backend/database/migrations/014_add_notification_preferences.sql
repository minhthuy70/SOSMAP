-- Migration 014: User Notification Preferences
-- Version: 1.0.0
-- Description: Add user notification preferences table

CREATE TABLE IF NOT EXISTS user_notification_preferences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT false,
  in_app_notifications BOOLEAN DEFAULT true,
  notify_on_new_incident BOOLEAN DEFAULT true,
  notify_on_assigned_incident BOOLEAN DEFAULT true,
  notify_on_incident_update BOOLEAN DEFAULT true,
  notify_on_comment_reply BOOLEAN DEFAULT true,
  notify_on_escalation BOOLEAN DEFAULT true,
  notify_on_nearby_incident BOOLEAN DEFAULT true,
  nearby_radius_km INTEGER DEFAULT 5,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  notification_frequency VARCHAR(20) DEFAULT 'realtime',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON user_notification_preferences(user_id);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_notification_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_notification_preferences_updated_at
  BEFORE UPDATE ON user_notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_preferences_updated_at();
