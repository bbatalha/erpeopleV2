/*
  # Add OpenAI analysis storage to assessment_results

  1. Changes
     - Add jsonb column 'ai_analysis' to assessment_results table
     - This column will store the OpenAI-generated analysis response

  2. Notes
     - Compatible with existing data
     - No migration of existing data required
*/

-- Add the ai_analysis column to store OpenAI analysis results
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'assessment_results' AND column_name = 'ai_analysis'
  ) THEN
    ALTER TABLE assessment_results ADD COLUMN ai_analysis JSONB DEFAULT NULL;
  END IF;
END $$;

-- Add indexes to improve query performance
CREATE INDEX IF NOT EXISTS idx_assessment_results_ai_analysis ON assessment_results USING GIN (ai_analysis);