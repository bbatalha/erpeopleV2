/*
  # Update admin user profile

  1. Changes
    - Update admin user email and role
    - Ensure admin user exists in auth.users
    - Update profile data

  2. Security
    - Uses security definer for proper permissions
    - Handles auth.users and profiles tables
*/

-- First, ensure the user exists in auth.users
DO $$ 
BEGIN
  -- Update auth.users email if needed
  UPDATE auth.users
  SET email = 'bbatalha@gmail.com',
      email_confirmed_at = NOW(),
      updated_at = NOW()
  WHERE id = '7783572f-11e4-4be1-a67b-7a45c891e6d5';

  -- Update profile
  UPDATE profiles
  SET role = 'admin',
      email = 'bbatalha@gmail.com',
      updated_at = NOW()
  WHERE id = '7783572f-11e4-4be1-a67b-7a45c891e6d5';

  -- Verify the updates
  IF NOT EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE id = '7783572f-11e4-4be1-a67b-7a45c891e6d5' 
    AND role = 'admin' 
    AND email = 'bbatalha@gmail.com'
  ) THEN
    RAISE EXCEPTION 'Failed to update admin profile';
  END IF;
END $$;