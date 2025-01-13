/*
  # Set Admin Role for User
  
  1. Changes
    - Update specific user's role to admin in profiles table
    
  2. Security
    - Direct update to profiles table
    - Specific user ID targeting
*/

-- Update user role to admin for specific user
UPDATE profiles
SET role = 'admin'
WHERE id = '7783572f-11e4-4be1-a67b-7a45c891e6d5';

-- Verify the update
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = '7783572f-11e4-4be1-a67b-7a45c891e6d5' 
        AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Failed to set admin role';
    END IF;
END $$;