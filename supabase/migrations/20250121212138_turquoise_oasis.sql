/*
  # Add LinkedIn Profile Fields

  1. New Columns
    - `headline` (text): Professional headline/title
    - `location` (text): User's location
    - `about` (text): About/bio text
    - `profile_image_url` (text): URL to profile image
    - `experiences` (jsonb): Array of work experiences
    - `education` (jsonb): Array of education entries
    - `skills` (text[]): Array of skills
    - `updated_at` (timestamptz): Last update timestamp

  2. Changes
    - Add check constraint for profile_image_url format
    - Add trigger to automatically update updated_at
*/

-- Add new columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS headline text,
ADD COLUMN IF NOT EXISTS location text,
ADD COLUMN IF NOT EXISTS about text,
ADD COLUMN IF NOT EXISTS profile_image_url text,
ADD COLUMN IF NOT EXISTS experiences jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS education jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS skills text[] DEFAULT '{}';

-- Add check constraint for profile_image_url
ALTER TABLE profiles
ADD CONSTRAINT profile_image_url_check
CHECK (
  profile_image_url IS NULL OR 
  profile_image_url ~ '^https?://.+\..+'
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();