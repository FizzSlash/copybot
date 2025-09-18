-- Insert development user for local testing
-- This allows foreign key constraints to work without authentication

INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  role,
  aud,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
) VALUES (
  'dev-user-123',
  '00000000-0000-0000-0000-000000000000',
  'dev@copybot.local',
  '$2a$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', -- Dummy hash
  NOW(),
  NOW(),
  NOW(),
  'authenticated',
  'authenticated',
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- Insert corresponding auth.identities record
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  'dev-user-123',
  'dev-user-123',
  '{"sub": "dev-user-123", "email": "dev@copybot.local"}',
  'email',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;