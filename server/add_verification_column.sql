-- Add isVerified column to users table
ALTER TABLE users
ADD COLUMN isVerified BOOLEAN DEFAULT FALSE;

-- Update existing admin users to be verified
UPDATE users SET isVerified = TRUE WHERE role = 'admin'; 