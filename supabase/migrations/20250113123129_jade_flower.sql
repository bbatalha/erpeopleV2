/*
  # Fix Admin RLS Policies - Final Version

  1. Changes
    - Drop existing admin policies
    - Create new admin policies using a materialized admin role check
    - Add function to check admin status efficiently
    - Add proper indexes for performance
*/

-- Create admin check function
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'::user_role 
    LIMIT 1
  );
$$;

-- Drop existing admin policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;

-- Create new admin policies using the function
CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT
USING (
  is_admin() OR id = auth.uid()
);

CREATE POLICY "Admins can update all profiles"
ON profiles FOR UPDATE
USING (
  is_admin() OR id = auth.uid()
);

CREATE POLICY "Admins can delete profiles"
ON profiles FOR DELETE
USING (
  is_admin() AND id != auth.uid()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_role_id ON profiles(role, id);

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION is_admin TO authenticated;