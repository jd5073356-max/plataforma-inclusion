-- ============================================================
-- FIX: activar RLS en las tablas que lo tienen apagado — ECO INCLUSIVO
--
-- La brecha (verificada 2026-10-12 con el MCP de Supabase):
--   · actividades, etapas y perfiles tienen POLICIES escritas pero
--     RLS DESACTIVADO → las políticas son decorativas.
--   · anon tiene SELECT/INSERT/UPDATE/DELETE/TRUNCATE sobre las 6 tablas.
--   · la anon key es pública (viaja en el bundle JS, por diseño).
--   → combinado: cualquiera con la anon key puede leer y borrar toda
--     la BD, incluidos los perfiles de menores. Probado: SELECT sobre
--     perfiles devuelve 8 filas con la key extraída del bundle público,
--     y un DELETE (con WHERE falso: 0 filas borradas) es aceptado
--     con HTTP 204. Los advisors de Supabase lo reportan como ERROR
--     nivel EXTERNAL: policy_exists_rls_disabled y rls_disabled_in_public.
--
-- Este archivo NO rediseña las policies: las existentes ya están bien
-- escritas (todas acotadas por auth.uid()). Solo enciende RLS y añade
-- lo mínimo para que encenderlo no rompa la app:
--   1. El estudiante lee etapas (getRutasAsignadas hace select('*')).
--   2. El estudiante lee actividades por etapa (modelo de rutas).
--   3. Las funciones SECURITY DEFINER dejan de ser RPC públicos.
--
-- Requiere: migracion-rutas.sql aplicada ANTES (la policy de actividades
-- referencia asignaciones.etapa_id, que esa migración crea).
-- Ejecutar ANTES que sembrar-contenido.sql.
--
-- Todo en una transacción con verificación: si algo falla, no queda nada
-- a medias.
-- ============================================================

BEGIN;

-- 1. Encender RLS donde hay policies escritas pero apagado
ALTER TABLE public.actividades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.etapas      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfiles    ENABLE ROW LEVEL SECURITY;

-- 2. etapas: el estudiante necesita ver las rutas que le asignaron.
--    Sin esta policy, activar RLS dejaría a todo estudiante sin NINGUNA
--    ruta visible (getRutasAsignadas hace select('*') de etapas y luego
--    etapas.find(e => e.id === asig.etapa_id) → find sobre lista vacía).
CREATE POLICY "estudiante ve etapas asignadas" ON public.etapas
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM asignaciones a
      WHERE a.estudiante_id = auth.uid()
        AND a.etapa_id = etapas.id
    )
  );

-- 3. actividades: la policy existente solo cubre el modelo VIEJO
--    (asignaciones por actividad suelta, a.actividad_id). El modelo de
--    rutas asigna por etapa y el estudiante lee los pasos con
--    getPasosDeEtapa → .eq('etapa_id', etapaId). Se reemplaza cubriendo
--    AMBOS caminos: las asignaciones viejas siguen funcionando y las
--    nuevas por ruta también.
DROP POLICY "estudiante ve actividades asignadas" ON public.actividades;
CREATE POLICY "estudiante ve actividades asignadas" ON public.actividades
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM asignaciones a
      WHERE a.actividad_id = actividades.id
        AND a.estudiante_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM asignaciones a
      WHERE a.etapa_id = actividades.etapa_id
        AND a.estudiante_id = auth.uid()
    )
  );

-- 4. Funciones SECURITY DEFINER: dejar de exponerlas como RPC públicos.
--    El ACL real (verificado contra la BD) tiene EXECUTE explícito para anon
--    y authenticated, no solo el default de PUBLIC — el SQL original de la
--    tabla lo otorgó a mano. Se revoca a PUBLIC Y a anon (authenticated se
--    conserva donde hace falta, abajo):
--      · handle_new_user: es trigger de auth.users (la invoca el sistema
--        al crear usuarios, no por RPC). Nadie necesita ejecutarla.
--      · is_admin: la evalúa la policy "admin ve todos" cuando consulta
--        un usuario con sesión → authenticated la conserva.
--      · crear_estudiante: tiene guard interno (solo rol profesor),
--        pero anon no debe siquiera poder llamarla: recibe un password
--        como parámetro. authenticated la conserva para los profesores.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.crear_estudiante(text, text, text, text, uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.crear_estudiante(text, text, text, text, uuid) TO authenticated;

-- 5. Con is_admin revocada a anon, la policy "admin ve todos" ya no
--    puede evaluarse para anon (daría permission denied en vez de lista
--    vacía). Los admins siempre van con sesión: se restringe a
--    authenticated. (También deja de usar el patrón deprecado TO public.)
DROP POLICY "admin ve todos" ON public.perfiles;
CREATE POLICY "admin ve todos" ON public.perfiles
  FOR SELECT TO authenticated
  USING (public.is_admin());

-- 6. Verificación antes de confirmar: si algo no quedó como debe, el
--    RAISE EXCEPTION hace rollback de todo.
DO $$
DECLARE
  rls_off text;
  sin_policy integer;
BEGIN
  SELECT string_agg(t, ', ') INTO rls_off
  FROM unnest(ARRAY['actividades','etapas','perfiles']) AS t
  WHERE NOT (SELECT relrowsecurity FROM pg_class
             WHERE oid = ('public.' || t)::regclass);
  IF rls_off IS NOT NULL THEN
    RAISE EXCEPTION 'RLS sigue apagado en: %', rls_off;
  END IF;

  SELECT count(*) INTO sin_policy FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'etapas'
    AND policyname = 'estudiante ve etapas asignadas';
  IF sin_policy = 0 THEN
    RAISE EXCEPTION 'no existe la policy de estudiante en etapas';
  END IF;

  IF has_function_privilege('anon', 'public.is_admin()', 'EXECUTE')
     OR has_function_privilege('anon', 'public.handle_new_user()', 'EXECUTE')
     OR has_function_privilege('anon', 'public.crear_estudiante(text, text, text, text, uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'anon conserva EXECUTE en alguna función SECURITY DEFINER';
  END IF;

  IF NOT has_function_privilege('authenticated', 'public.is_admin()', 'EXECUTE') THEN
    RAISE EXCEPTION 'authenticated perdió is_admin (la policy "admin ve todos" la necesita)';
  END IF;

  RAISE NOTICE 'fix verificado: RLS activo en 3 tablas, policy estudiante OK, funciones RPC cerradas';
END $$;

COMMIT;

-- Tras el COMMIT, la prueba real contra producción:
--   curl -s "https://fmpubxikjdbdfvanfcok.supabase.co/rest/v1/perfiles?select=id&limit=1" \
--        -H "apikey: <anon key>"
--   debe devolver [] (lista vacía). Antes devolvía las 8 cuentas.
--
-- Nota para el modo diagnóstico: los workflows que leen filas con la
-- anon key (keep-alive incluido) seguirán en verde — comprueban HTTP 2xx,
-- no el contenido. El diagnóstico de esquema mostrará 0 filas por tabla:
-- es el efecto esperado de RLS, no una regresión.
