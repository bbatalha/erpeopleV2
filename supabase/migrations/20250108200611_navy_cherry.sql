/*
  # Add behavior assessment type
  
  1. Changes
    - Create behavior assessment type
    - Add behavior assessment record
  
  2. Notes
    - Uses transaction to ensure enum value is committed before use
    - Safely adds new assessment type
*/

BEGIN;

-- Create new enum type with all values
DO $$ BEGIN
    DROP TYPE IF EXISTS assessment_type_new CASCADE;
    CREATE TYPE assessment_type_new AS ENUM ('disc', 'hexaco', 'behavior');
END $$;

-- Update existing enum
ALTER TABLE assessments 
    ALTER COLUMN type TYPE assessment_type_new 
    USING type::text::assessment_type_new;

-- Drop old enum and rename new one
DROP TYPE assessment_type;
ALTER TYPE assessment_type_new RENAME TO assessment_type;

-- Insert behavior assessment
INSERT INTO assessments (type, title, description, estimated_time_minutes, question_count, is_active)
SELECT 
    'behavior',
    'Traços Comportamentais',
    'Explore seus traços comportamentais e descubra como eles influenciam seu estilo de trabalho, tomada de decisão e relacionamentos profissionais.',
    25,
    40,
    true
WHERE NOT EXISTS (
    SELECT 1 FROM assessments WHERE type = 'behavior'
);

COMMIT;