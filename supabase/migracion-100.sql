-- ============================================================
-- MIGRACIÓN 100% — ECO INCLUSIVO
-- Completa las capacidades de BD para el 100% de la plataforma:
--   1. Columna nota_familiar en public.progreso (Bitácora hogar/acudiente)
--   2. RPC public.crear_profesor (crea docente sin cerrar sesión del Admin)
--   3. RPC public.eliminar_usuario (elimina estudiante o profesor limpiamente)
--   4. Políticas RLS en storage.objects para buckets 'imagenes' y 'audios'
--      (grabadora de voz del profesor y subida de imágenes)
-- ============================================================

BEGIN;

-- 1. Bitácora familiar en progreso
ALTER TABLE public.progreso
  ADD COLUMN IF NOT EXISTS nota_familiar text;

-- 2. RPC crear_profesor (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.crear_profesor(
  p_nombre text,
  p_email text,
  p_password text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $function$
DECLARE
  v_user_id uuid;
  v_email text := lower(trim(p_email));
  v_pass text := COALESCE(NULLIF(trim(p_password), ''), '123456');
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = v_email LIMIT 1;

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
      v_email, extensions.crypt(v_pass, extensions.gen_salt('bf')), NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object(
        'sub', v_user_id::text,
        'email', v_email,
        'nombre', trim(p_nombre),
        'rol', 'profesor',
        'email_verified', true,
        'phone_verified', false
      ),
      NOW(), NOW(),
      '', '', '', '', '', 0, '', '', '', false, false
    );

    INSERT INTO auth.identities (
      id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_user_id, v_user_id, v_user_id::text, 'email',
      jsonb_build_object(
        'sub', v_user_id::text,
        'email', v_email,
        'email_verified', true,
        'phone_verified', false
      ),
      NOW(), NOW(), NOW()
    )
    ON CONFLICT DO NOTHING;
  ELSE
    UPDATE auth.users
    SET encrypted_password = extensions.crypt(v_pass, extensions.gen_salt('bf')),
        updated_at = NOW()
    WHERE id = v_user_id;
  END IF;

  INSERT INTO public.perfiles (id, rol, nombre)
  VALUES (v_user_id, 'profesor', trim(p_nombre))
  ON CONFLICT (id) DO UPDATE SET
    rol = 'profesor',
    nombre = EXCLUDED.nombre;

  RETURN v_user_id;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.crear_profesor(text, text, text) TO anon, authenticated, service_role;

-- 3. RPC eliminar_usuario (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.eliminar_usuario(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $function$
DECLARE
  v_fallback_prof uuid;
BEGIN
  -- Limpiar datos dependientes de estudiante
  DELETE FROM public.progreso WHERE estudiante_id = p_user_id;
  DELETE FROM public.asignaciones WHERE estudiante_id = p_user_id;
  UPDATE public.perfiles SET profesor_id = NULL WHERE profesor_id = p_user_id;

  -- Si era profesor con etapas/actividades/recursos, reasignar al profesor guía o eliminar recursos propios
  SELECT id INTO v_fallback_prof
  FROM public.perfiles
  WHERE rol = 'profesor' AND id <> p_user_id
  ORDER BY creado_en ASC NULLS LAST
  LIMIT 1;

  IF v_fallback_prof IS NOT NULL THEN
    UPDATE public.etapas SET profesor_id = v_fallback_prof WHERE profesor_id = p_user_id;
    UPDATE public.actividades SET profesor_id = v_fallback_prof WHERE profesor_id = p_user_id;
  END IF;

  DELETE FROM public.recursos WHERE profesor_id = p_user_id;
  DELETE FROM public.perfiles WHERE id = p_user_id;
  DELETE FROM auth.identities WHERE user_id = p_user_id;
  DELETE FROM auth.users WHERE id = p_user_id;

  RETURN true;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.eliminar_usuario(uuid) TO anon, authenticated, service_role;

-- 4. Asegurar buckets públicos y políticas RLS para grabación de voz e imágenes
INSERT INTO storage.buckets (id, name, public)
VALUES ('imagenes', 'imagenes', true),
       ('audios', 'audios', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Acceso publico lectura multimedia" ON storage.objects;
CREATE POLICY "Acceso publico lectura multimedia"
  ON storage.objects FOR SELECT
  USING (bucket_id IN ('imagenes', 'audios'));

DROP POLICY IF EXISTS "Subida multimedia autenticados" ON storage.objects;
CREATE POLICY "Subida multimedia autenticados"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id IN ('imagenes', 'audios'));

DROP POLICY IF EXISTS "Actualizacion multimedia autenticados" ON storage.objects;
CREATE POLICY "Actualizacion multimedia autenticados"
  ON storage.objects FOR UPDATE
  USING (bucket_id IN ('imagenes', 'audios'));

DROP POLICY IF EXISTS "Borrado multimedia autenticados" ON storage.objects;
CREATE POLICY "Borrado multimedia autenticados"
  ON storage.objects FOR DELETE
  USING (bucket_id IN ('imagenes', 'audios'));

COMMIT;
