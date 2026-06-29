-- ============================================
-- MIGRACIÓN: Crear usuario admin
-- Ejecutar esto en el SQL Editor de Supabase
-- IMPORTANTE: Cambiar el email y contraseña antes de ejecutar
-- ============================================

-- Crear usuario admin en auth.users
-- IMPORTANTE: Cambiar 'admin@fullshine.com' y 'TU_CONTRASENA_SEGURA' antes de ejecutar
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_token,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change_token_new,
  email_change
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@fullshine.com',  -- CAMBIAR POR TU EMAIL
  crypt('TU_CONTRASENA_SEGURA', gen_salt('bf')),  -- CAMBIAR POR TU CONTRASEÑA
  NOW(),
  '',
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{}',
  NOW(),
  NOW(),
  '',
  '',
  ''
);

-- Dar permisos de admin al usuario creado
-- Reemplazar el UUID por el ID del usuario creado arriba
-- Puedes obtener el ID con: SELECT id FROM auth.users WHERE email = 'admin@fullshine.com';
