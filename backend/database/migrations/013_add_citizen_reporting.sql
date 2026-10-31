-- Add citizen reporting support
ALTER TABLE users
ADD COLUMN IF NOT EXISTS allow_anonymous_reporting BOOLEAN DEFAULT true;

-- Create index for anonymous reporting preference
CREATE INDEX IF NOT EXISTS idx_users_anonymous_reporting ON users(allow_anonymous_reporting);
