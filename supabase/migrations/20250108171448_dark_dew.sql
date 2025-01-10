/*
  # Create assessment results tables and policies

  1. New Tables
    - assessment_responses
    - assessment_results
  2. Security
    - Enable RLS
    - Add policies for user access
*/

-- Create assessment responses table
CREATE TABLE IF NOT EXISTS assessment_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  assessment_id uuid REFERENCES assessments(id) ON DELETE CASCADE,
  status text DEFAULT 'in_progress',
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  responses jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create assessment results table
CREATE TABLE IF NOT EXISTS assessment_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id uuid REFERENCES assessment_responses(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  assessment_id uuid REFERENCES assessments(id) ON DELETE CASCADE,
  results jsonb DEFAULT '{}',
  pdf_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE assessment_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_results ENABLE ROW LEVEL SECURITY;

-- Policies for assessment_responses
CREATE POLICY "Users can view own responses"
  ON assessment_responses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create responses"
  ON assessment_responses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own responses"
  ON assessment_responses FOR UPDATE
  USING (auth.uid() = user_id);

-- Policies for assessment_results
CREATE POLICY "Users can view own results"
  ON assessment_results FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create results"
  ON assessment_results FOR INSERT
  WITH CHECK (auth.uid() = user_id);