/*
  # Update LinkedIn URL validation

  1. Changes
    - Make LinkedIn URL validation more flexible
    - Support various LinkedIn URL formats (profile, company, etc.)
    - Maintain basic URL structure requirements
    - Prevent common URL issues

  2. Security
    - Maintains URL format validation
    - Prevents SQL injection through URL field
*/

-- Drop existing constraint
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS profiles_linkedin_url_check;

-- Add new constraint with more flexible validation
ALTER TABLE profiles
ADD CONSTRAINT profiles_linkedin_url_check 
CHECK (
  linkedin_url ~ '^https://(www\.)?linkedin\.com/[a-zA-Z0-9\-/_%+]+$'
);

-- Clean up any existing URLs
UPDATE profiles 
SET linkedin_url = REGEXP_REPLACE(
  linkedin_url,
  '/+$',
  ''
)
WHERE linkedin_url LIKE '%/';