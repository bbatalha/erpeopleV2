/*
  # Add Email Field to Profiles
  
  1. Changes
    - Add email column to profiles table
    - Create unique index for email lookups
    - Add validation constraint for email format
    - Update trigger to sync email from auth.users
  
  2. Security
    - Email is required and must be unique
    - Format validation using regex pattern
    - Synchronized with auth.users email
*/

-- Add email column with validation
ALTER TABLE profiles
ADD COLUMN email VARCHAR(255) NOT NULL,
ADD CONSTRAINT profiles_email_check 
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Create unique index for email
CREATE UNIQUE INDEX idx_profiles_email ON profiles(email);

-- Update existing profiles with email from auth.users
UPDATE profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id;

-- Update profile creation trigger to include email
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, linkedin_url, email)
    VALUES (
        new.id,
        new.raw_user_meta_data->>'full_name',
        new.raw_user_meta_data->>'linkedin_url',
        new.email
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;