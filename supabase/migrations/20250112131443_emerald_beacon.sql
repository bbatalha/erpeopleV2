/*
  # Add LinkedIn URL to profiles
  
  1. Changes
    - Add linkedin_url column to profiles table
    - Add URL format validation
  
  2. Notes
    - Column is nullable to support existing users
    - Includes URL format check constraint
*/

ALTER TABLE profiles
ADD COLUMN linkedin_url VARCHAR(255) CHECK (
  linkedin_url IS NULL OR 
  linkedin_url ~ '^https://www\.linkedin\.com/.*[^/\s]$'
);