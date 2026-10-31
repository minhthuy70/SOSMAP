-- Add reputation columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS reputation_points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS reputation_level VARCHAR(50) DEFAULT 'bronze' CHECK (reputation_level IN ('bronze', 'silver', 'gold', 'platinum', 'diamond'));

-- Create index for reputation queries
CREATE INDEX IF NOT EXISTS idx_users_reputation_points ON users(reputation_points);
CREATE INDEX IF NOT EXISTS idx_users_reputation_level ON users(reputation_level);
