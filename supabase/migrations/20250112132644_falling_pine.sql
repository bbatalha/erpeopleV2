/*
  # Set Admin Role
  
  1. Changes
    - Updates the role to 'admin' for the authenticated user
  
  2. Notes
    - Uses auth.uid() to get the current user's ID
    - Only updates if the user exists in profiles table
*/

-- Update user role to admin
UPDATE profiles
SET role = 'admin'
WHERE id = auth.uid();