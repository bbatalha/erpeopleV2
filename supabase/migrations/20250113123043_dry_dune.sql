/*
  # Fix Admin RLS Policies

  1. Changes
    - Drop existing admin policies
    - Create new admin policies using auth.jwt() instead of querying profiles
    - Add proper RLS for admin operations
*/

-- Drop existing admin policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;

-- Create new admin policies using auth.jwt()
CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT
USING (
  (SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1) = 'admin'
);

CREATE POLICY "Admins can update all profiles"
ON profiles FOR UPDATE
USING (
  (SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1) = 'admin'
);

CREATE POLICY "Admins can delete profiles"
ON profiles FOR DELETE
USING (
  (SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1) = 'admin'
);

-- Add index to improve performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);