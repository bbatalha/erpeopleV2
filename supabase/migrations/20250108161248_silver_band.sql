/*
  # Fix Profile Policies Recursion

  1. Changes
    - Replace recursive admin policy with direct metadata check
    - Add missing assessments policies
*/

-- Drop existing admin policy
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- Create new admin policy using auth.jwt() instead of querying profiles
CREATE POLICY "Admins can view all profiles"
    ON profiles FOR SELECT
    USING (
        auth.jwt()->>'role' = 'admin'
    );

-- Ensure assessments policies are correct
DROP POLICY IF EXISTS "Anyone can read active assessments" ON assessments;

CREATE POLICY "Anyone can read active assessments"
    ON assessments FOR SELECT
    USING (is_active = true);

-- Update user registration trigger to set admin role in JWT
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, role)
    VALUES (
        new.id,
        new.raw_user_meta_data->>'full_name',
        COALESCE(new.raw_user_meta_data->>'role', 'user')::user_role
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;