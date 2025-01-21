/*
  # Fix Admin Access to Reports

  1. Changes
    - Safely drop and recreate policies for admin access
    - Use is_admin() function for consistent admin checks
    - Ensure proper cascading access for related tables

  2. Security
    - Maintains existing user access restrictions
    - Only adds admin view permissions
    - Uses secure admin role checking
*/

-- Safely drop existing policies
DO $$ BEGIN
    DROP POLICY IF EXISTS "Admins can view all responses" ON assessment_responses;
    DROP POLICY IF EXISTS "Admins can view all results" ON assessment_results;
    DROP POLICY IF EXISTS "Admins can view all assessments" ON assessments;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

-- Recreate policies with proper admin access
CREATE POLICY "Admins can view all responses"
ON assessment_responses FOR SELECT
USING (
  is_admin() OR user_id = auth.uid()
);

CREATE POLICY "Admins can view all results"
ON assessment_results FOR SELECT
USING (
  is_admin() OR user_id = auth.uid()
);

CREATE POLICY "Admins can view all assessments"
ON assessments FOR SELECT
USING (
  is_admin() OR is_active = true
);

-- Verify policies were created
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'assessment_responses' 
        AND policyname = 'Admins can view all responses'
    ) THEN
        RAISE EXCEPTION 'Failed to create assessment_responses policy';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'assessment_results' 
        AND policyname = 'Admins can view all results'
    ) THEN
        RAISE EXCEPTION 'Failed to create assessment_results policy';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'assessments' 
        AND policyname = 'Admins can view all assessments'
    ) THEN
        RAISE EXCEPTION 'Failed to create assessments policy';
    END IF;
END $$;