/*
  # Make LinkedIn URL Required
  
  1. Changes
    - Make linkedin_url column NOT NULL
    - Add default value for existing records
  
  2. Notes
    - Updates existing NULL values to empty string
    - Enforces NOT NULL constraint for new records
*/

-- Update existing NULL values
UPDATE profiles 
SET linkedin_url = '' 
WHERE linkedin_url IS NULL;

-- Make column required
ALTER TABLE profiles 
ALTER COLUMN linkedin_url SET NOT NULL,
ALTER COLUMN linkedin_url SET DEFAULT '';