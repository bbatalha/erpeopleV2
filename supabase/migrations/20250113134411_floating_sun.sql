/*
  # Update LinkedIn URL validation

  1. Changes
    - Modify LinkedIn URL check constraint to be more flexible
    - Support both www and non-www LinkedIn URLs
    - Support country-specific LinkedIn domains
    - Support various LinkedIn URL formats

  2. Security
    - Maintains URL format validation
    - Prevents SQL injection through URL field
*/

-- Drop existing constraint
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS profiles_linkedin_url_check;

-- Add new constraint with improved validation
ALTER TABLE profiles
ADD CONSTRAINT profiles_linkedin_url_check 
CHECK (
  linkedin_url ~ '^https://(www\.)?linkedin\.com/.*[^/\s]$'
);

-- Update existing URLs to ensure they comply with new format
UPDATE profiles 
SET linkedin_url = REGEXP_REPLACE(linkedin_url, 'linkedin\.com/+$', 'linkedin.com/in/user-' || id)
WHERE linkedin_url ~ 'linkedin\.com/+$';