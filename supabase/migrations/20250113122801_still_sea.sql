/*
  # Fix Admin RLS Policies

  1. Changes
    - Drop existing admin policy
    - Create new admin policy with proper access control
    - Add policy for admin to manage all profiles
*/

-- Drop existing admin policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- Create new admin policies
CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can update all profiles"
ON profiles FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can delete profiles"
ON profiles FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);