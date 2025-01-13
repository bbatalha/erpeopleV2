/*
  # Make LinkedIn URL Required
  
  1. Changes
    - Add linkedin_url column if not exists
    - Update existing NULL values with valid LinkedIn URL
    - Add URL format check constraint
    - Make column NOT NULL
  
  2. Notes
    - Ensures all existing records have valid LinkedIn URLs
    - Enforces URL format and NOT NULL constraints
*/

-- First ensure the column exists with correct check constraint
DO $$ BEGIN
    ALTER TABLE profiles
    ADD COLUMN linkedin_url VARCHAR(255);
EXCEPTION
    WHEN duplicate_column THEN NULL;
END $$;

-- Update existing NULL values with a placeholder URL
UPDATE profiles 
SET linkedin_url = 'https://www.linkedin.com/in/user-' || id
WHERE linkedin_url IS NULL OR linkedin_url = '';

-- Add check constraint for URL format
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS profiles_linkedin_url_check;

ALTER TABLE profiles
ADD CONSTRAINT profiles_linkedin_url_check 
CHECK (linkedin_url ~ '^https://www\.linkedin\.com/.*[^/\s]$');

-- Make column required
ALTER TABLE profiles 
ALTER COLUMN linkedin_url SET NOT NULL;