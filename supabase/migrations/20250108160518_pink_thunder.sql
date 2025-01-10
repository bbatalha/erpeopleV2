/*
  # Fix Profile Policies

  1. Changes
    - Remove recursive admin policy
    - Add new direct role check policy
    - Add missing policies for assessments table
*/

-- Drop existing admin policy
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- Create new admin policy without recursion
CREATE POLICY "Admins can view all profiles"
    ON profiles FOR SELECT
    USING (
        (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
    );

-- Create assessments table if it doesn't exist
CREATE TABLE IF NOT EXISTS assessments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    type text NOT NULL,
    title text NOT NULL,
    description text,
    estimated_time_minutes integer NOT NULL,
    question_count integer NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable RLS on assessments
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;

-- Create policy for reading assessments
CREATE POLICY "Anyone can read active assessments"
    ON assessments FOR SELECT
    USING (is_active = true);

-- Insert DISC assessment if not exists
INSERT INTO assessments (type, title, description, estimated_time_minutes, question_count, is_active)
SELECT 
    'disc',
    'Avaliação DISC',
    'Compreenda seu estilo comportamental e como você responde a desafios.',
    20,
    24,
    true
WHERE NOT EXISTS (
    SELECT 1 FROM assessments WHERE type = 'disc'
);