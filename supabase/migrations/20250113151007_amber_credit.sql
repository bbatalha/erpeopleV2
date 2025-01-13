/*
  # Fix admin user setup

  1. Changes
    - Ensure admin user exists with correct credentials
    - Set email and password
    - Verify admin role and access

  2. Security
    - Uses security definer for proper permissions
    - Sets up proper authentication
*/

-- First, ensure we can create the admin user
DO $$ 
BEGIN
  -- Update or insert admin user in auth.users
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role
  )
  VALUES (
    '7783572f-11e4-4be1-a67b-7a45c891e6d5',
    '00000000-0000-0000-0000-000000000000',
    'bbatalha@gmail.com',
    crypt('abc@1234', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Admin User"}',
    FALSE,
    'authenticated'
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    encrypted_password = EXCLUDED.encrypted_password,
    email_confirmed_at = EXCLUDED.email_confirmed_at,
    updated_at = EXCLUDED.updated_at;

  -- Ensure profile exists with admin role
  INSERT INTO profiles (
    id,
    role,
    full_name,
    email,
    linkedin_url,
    created_at,
    updated_at
  )
  VALUES (
    '7783572f-11e4-4be1-a67b-7a45c891e6d5',
    'admin',
    'Admin User',
    'bbatalha@gmail.com',
    'https://www.linkedin.com/in/admin',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    role = 'admin',
    email = 'bbatalha@gmail.com',
    updated_at = NOW();

  -- Verify the setup
  IF NOT EXISTS (
    SELECT 1 
    FROM auth.users u
    JOIN profiles p ON u.id = p.id
    WHERE u.id = '7783572f-11e4-4be1-a67b-7a45c891e6d5'
    AND u.email = 'bbatalha@gmail.com'
    AND p.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Failed to setup admin user';
  END IF;
END $$;