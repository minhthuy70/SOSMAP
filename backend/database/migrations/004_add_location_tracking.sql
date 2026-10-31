-- Add location tracking columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS last_latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS last_longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS last_location_accuracy DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS last_location_at TIMESTAMP;

-- Create index for location queries
CREATE INDEX IF NOT EXISTS idx_users_location ON users(last_latitude, last_longitude) WHERE last_latitude IS NOT NULL;
