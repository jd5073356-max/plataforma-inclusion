-- Reiniciar progreso de María Paula Peñuela en su ruta de Biología
DELETE FROM public.progreso
WHERE estudiante_id = '02829e93-4fbf-4c68-bd29-cf6bf6e9db02';

-- Función RPC para reiniciar las actividades de una ruta para cualquier estudiante
CREATE OR REPLACE FUNCTION public.reiniciar_progreso_ruta(p_estudiante_id uuid, p_etapa_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.progreso
  WHERE estudiante_id = p_estudiante_id
    AND actividad_id IN (
      SELECT id FROM public.actividades WHERE etapa_id = p_etapa_id
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.reiniciar_progreso_ruta(uuid, uuid) TO anon, authenticated;
