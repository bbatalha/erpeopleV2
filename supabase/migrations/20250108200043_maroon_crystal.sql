/*
  # Add HEXACO Assessment

  1. New Data
    - Adds HEXACO assessment record to assessments table
*/

INSERT INTO assessments (type, title, description, estimated_time_minutes, question_count, is_active)
SELECT 
    'hexaco',
    'Avaliação HEXACO',
    'Explore suas dimensões de personalidade incluindo Honestidade-Humildade, Emocionalidade, Extroversão, Afabilidade, Conscienciosidade e Abertura à Experiência.',
    30,
    60,
    true
WHERE NOT EXISTS (
    SELECT 1 FROM assessments WHERE type = 'hexaco'
);