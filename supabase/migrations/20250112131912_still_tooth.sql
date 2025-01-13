/*
  # Add Admin Role
  
  1. Changes
    - Updates specified user's role to admin
  
  2. Notes
    - Only updates role for specified user
    - Maintains existing user data
*/

-- Update user role to admin
UPDATE profiles
SET role = 'admin'
WHERE email = current_user;