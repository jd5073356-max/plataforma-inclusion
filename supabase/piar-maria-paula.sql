-- ============================================================
-- CONFIGURACIÓN PIAR MARÍA PAULA PEÑUELA (GRADO 901 - BIOLOGÍA)
-- Docente: Rafael Suárez Martínez
-- Ruta: "Nuestros Sentidos y los Paisajes del Mundo" (Julio - Noviembre)
-- Idempotente: se puede ejecutar múltiples veces sin duplicar datos.
-- ============================================================

BEGIN;

-- 1. Actualizar título oficial de la ruta de María Paula Peñuela en etapas
UPDATE public.etapas
SET nombre = 'Guía María Paula Peñuela — Grado 901 · Biología: Nuestros Sentidos y los Paisajes del Mundo'
WHERE id = '00000000-0000-0000-0000-000000000204';

-- 2. Corregir cuenta existente de María Paula Peñuela (creada desde el login como 02829e93-4fbf-4c68-bd29-cf6bf6e9db02)
UPDATE auth.users
SET
  email = 'maria-paula.901@inclusion.local',
  encrypted_password = extensions.crypt('123456', extensions.gen_salt('bf')),
  email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
  raw_app_meta_data = '{"provider":"email","providers":["email"]}'::jsonb,
  raw_user_meta_data = jsonb_build_object(
    'sub', id::text,
    'email', 'maria-paula.901@inclusion.local',
    'nombre', 'María Paula Peñuela',
    'rol', 'estudiante',
    'curso', '901',
    'email_verified', true,
    'phone_verified', false
  ),
  updated_at = NOW()
WHERE id = '02829e93-4fbf-4c68-bd29-cf6bf6e9db02';

INSERT INTO public.perfiles (id, rol, nombre, curso, profesor_id)
VALUES (
  '02829e93-4fbf-4c68-bd29-cf6bf6e9db02',
  'estudiante',
  'María Paula Peñuela',
  '901',
  'a8ea2006-d62d-4bc9-a7fb-9b6e8e240551'
)
ON CONFLICT (id) DO UPDATE SET
  rol = 'estudiante',
  nombre = 'María Paula Peñuela',
  curso = '901',
  profesor_id = 'a8ea2006-d62d-4bc9-a7fb-9b6e8e240551';

-- 3. Crear/actualizar cuenta del docente Rafael Suárez Martínez (rafael.suarez@inclusion.com / 123456)
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change,
  email_change_token_current,
  email_change_confirm_status,
  phone_change,
  phone_change_token,
  reauthentication_token,
  is_sso_user,
  is_anonymous
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000105',
  'authenticated',
  'authenticated',
  'rafael.suarez@inclusion.com',
  extensions.crypt('123456', extensions.gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"sub":"00000000-0000-0000-0000-000000000105","email":"rafael.suarez@inclusion.com","nombre":"Rafael Suárez Martínez","rol":"profesor","email_verified":true,"phone_verified":false}'::jsonb,
  NOW(),
  NOW(),
  '', '', '', '', '', 0, '', '', '', false, false
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  encrypted_password = EXCLUDED.encrypted_password,
  email_confirmed_at = COALESCE(auth.users.email_confirmed_at, NOW()),
  raw_app_meta_data = EXCLUDED.raw_app_meta_data,
  raw_user_meta_data = EXCLUDED.raw_user_meta_data,
  updated_at = NOW();

INSERT INTO public.perfiles (id, rol, nombre, curso, profesor_id)
VALUES (
  '00000000-0000-0000-0000-000000000105',
  'profesor',
  'Rafael Suárez Martínez',
  'Biología 901',
  NULL
)
ON CONFLICT (id) DO UPDATE SET
  rol = 'profesor',
  nombre = 'Rafael Suárez Martínez',
  curso = 'Biología 901';

-- 4. Asegurar contraseña conocida (123456) y metadatos GoTrue en todas las cuentas existentes
UPDATE auth.users
SET
  encrypted_password = extensions.crypt('123456', extensions.gen_salt('bf')),
  email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
  updated_at = NOW()
WHERE email IN ('profesor@inclusion.com', 'admin@inclusion.com', 'maria-paula.901@inclusion.local', 'rafael.suarez@inclusion.com');

UPDATE auth.users
SET
  confirmation_token = COALESCE(confirmation_token, ''),
  recovery_token = COALESCE(recovery_token, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change = COALESCE(email_change, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  email_change_confirm_status = COALESCE(email_change_confirm_status, 0),
  phone_change = COALESCE(phone_change, ''),
  phone_change_token = COALESCE(phone_change_token, ''),
  reauthentication_token = COALESCE(reauthentication_token, ''),
  is_sso_user = COALESCE(is_sso_user, false),
  is_anonymous = COALESCE(is_anonymous, false),
  raw_app_meta_data = COALESCE(raw_app_meta_data, '{"provider":"email","providers":["email"]}'::jsonb);

-- Asegurar fila en auth.identities para cada usuario de auth.users
INSERT INTO auth.identities (
  id,
  user_id,
  provider_id,
  provider,
  identity_data,
  last_sign_in_at,
  created_at,
  updated_at
)
SELECT
  u.id,
  u.id,
  u.id::text,
  'email',
  jsonb_build_object(
    'sub', u.id::text,
    'email', u.email,
    'email_verified', true,
    'phone_verified', false
  ),
  NOW(),
  COALESCE(u.created_at, NOW()),
  NOW()
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM auth.identities i WHERE i.user_id = u.id AND i.provider = 'email'
);

-- 5. Asignar la ruta de Biología PIAR (00000000-0000-0000-0000-000000000204) a María Paula Peñuela con ajuste 'motriz'
ALTER TABLE public.asignaciones ALTER COLUMN actividad_id DROP NOT NULL;

DELETE FROM public.asignaciones
WHERE estudiante_id = '02829e93-4fbf-4c68-bd29-cf6bf6e9db02'
  AND etapa_id = '00000000-0000-0000-0000-000000000204';

INSERT INTO public.asignaciones (id, estudiante_id, etapa_id, ajuste, creado_en)
VALUES (
  '00000000-0000-0000-0000-000000000306',
  '02829e93-4fbf-4c68-bd29-cf6bf6e9db02',
  '00000000-0000-0000-0000-000000000204',
  'motriz',
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  estudiante_id = EXCLUDED.estudiante_id,
  etapa_id = EXCLUDED.etapa_id,
  ajuste = EXCLUDED.ajuste;

-- 6. Actualizar RPC crear_estudiante para que funcione con el trigger on_auth_user_created y GoTrue
CREATE OR REPLACE FUNCTION public.crear_estudiante(
  p_nombre text,
  p_curso text,
  p_email text,
  p_password text,
  p_profesor_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = lower(trim(p_email)) LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := extensions.gen_random_uuid();

    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, email_change_confirm_status,
      phone_change, phone_change_token, reauthentication_token, is_sso_user, is_anonymous
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
      lower(trim(p_email)), extensions.crypt(p_password, extensions.gen_salt('bf')), NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('sub', v_user_id::text, 'email', lower(trim(p_email)), 'nombre', p_nombre, 'rol', 'estudiante', 'curso', p_curso, 'email_verified', true, 'phone_verified', false),
      NOW(), NOW(),
      '', '', '', '', '', 0, '', '', '', false, false
    );

    INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
    VALUES (
      v_user_id, v_user_id, v_user_id::text, 'email',
      jsonb_build_object('sub', v_user_id::text, 'email', lower(trim(p_email)), 'email_verified', true, 'phone_verified', false),
      NOW(), NOW(), NOW()
    )
    ON CONFLICT DO NOTHING;
  END IF;

  INSERT INTO public.perfiles (id, rol, nombre, curso, profesor_id)
  VALUES (v_user_id, 'estudiante', p_nombre, p_curso, p_profesor_id)
  ON CONFLICT (id) DO UPDATE SET
    rol = 'estudiante',
    nombre = EXCLUDED.nombre,
    curso = EXCLUDED.curso,
    profesor_id = EXCLUDED.profesor_id;

  RETURN v_user_id;
END;
$$;

-- 7. Ampliar políticas RLS para que cualquier docente autenticado (ej. Rafael Suárez o Profesor Demo) pueda gestionar rutas, actividades, estudiantes y asignaciones
DROP POLICY IF EXISTS "Profesores gestionan sus etapas" ON public.etapas;
CREATE POLICY "Profesores gestionan sus etapas" ON public.etapas
  FOR ALL
  USING (
    auth.uid() = profesor_id
    OR EXISTS (SELECT 1 FROM public.perfiles p WHERE p.id = auth.uid() AND p.rol IN ('profesor', 'admin'))
  )
  WITH CHECK (
    auth.uid() = profesor_id
    OR EXISTS (SELECT 1 FROM public.perfiles p WHERE p.id = auth.uid() AND p.rol IN ('profesor', 'admin'))
  );

DROP POLICY IF EXISTS "Profesores gestionan sus actividades" ON public.actividades;
CREATE POLICY "Profesores gestionan sus actividades" ON public.actividades
  FOR ALL
  USING (
    auth.uid() = profesor_id
    OR EXISTS (SELECT 1 FROM public.perfiles p WHERE p.id = auth.uid() AND p.rol IN ('profesor', 'admin'))
  )
  WITH CHECK (
    auth.uid() = profesor_id
    OR EXISTS (SELECT 1 FROM public.perfiles p WHERE p.id = auth.uid() AND p.rol IN ('profesor', 'admin'))
  );

DROP POLICY IF EXISTS "Profesores gestionan asignaciones de sus estudiantes" ON public.asignaciones;
CREATE POLICY "Profesores gestionan asignaciones de sus estudiantes" ON public.asignaciones
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.perfiles p WHERE p.id = auth.uid() AND p.rol IN ('profesor', 'admin'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.perfiles p WHERE p.id = auth.uid() AND p.rol IN ('profesor', 'admin'))
  );

DROP POLICY IF EXISTS "Profesores ven progreso de sus estudiantes" ON public.progreso;
CREATE POLICY "Profesores ven progreso de sus estudiantes" ON public.progreso
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.perfiles p WHERE p.id = auth.uid() AND p.rol IN ('profesor', 'admin'))
  );

DROP POLICY IF EXISTS "Actualizar propio perfil" ON public.perfiles;
CREATE POLICY "Actualizar propio perfil" ON public.perfiles
  FOR UPDATE
  USING (
    auth.uid() = id
    OR EXISTS (SELECT 1 FROM public.perfiles p WHERE p.id = auth.uid() AND p.rol IN ('profesor', 'admin'))
  );

COMMIT;
