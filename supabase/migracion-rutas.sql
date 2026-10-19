-- ============================================================
-- MIGRACIÓN: Modelo de Rutas Lineales — ECO INCLUSIVO
-- Estado 2026-10-12: NO APLICADA. Verificado contra la BD con el workflow
-- "Diagnóstico de esquema": actividades.orden → AUSENTE,
-- asignaciones.etapa_id → AUSENTE. (El proyecto sí responde; el DNS cayó
-- mientras estuvo pausado en septiembre, pero ésa ya no es la razón.)
-- Aplicar en Supabase SQL Editor antes que sembrar-contenido.sql.
--
-- Modelo nuevo:
--   actividades.etapa_id = NULL  → plantilla del Banco de Actividades
--   actividades.etapa_id + orden → paso de una ruta (secuencia lineal)
--   asignaciones apunta a ETAPAS (rutas), no a actividades sueltas
--
-- Todo va en una transacción: si algo falla, la BD queda como estaba. Sin
-- esto, un fallo en el índice único dejaría las columnas añadidas y el
-- sembrado siguiente rebotaría — estado parcial, difícil de deshacer a mano.
-- ============================================================

BEGIN;

-- 1. Orden de los pasos dentro de cada ruta
ALTER TABLE actividades ADD COLUMN IF NOT EXISTS orden integer;

-- Numerar los pasos existentes por etapa según su fecha de creación
WITH numerados AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY etapa_id ORDER BY creado_en ASC) AS nuevo_orden
  FROM actividades
  WHERE etapa_id IS NOT NULL
)
UPDATE actividades a SET orden = n.nuevo_orden
FROM numerados n WHERE a.id = n.id;

-- Índice para leer rutas ordenadas rápido
CREATE INDEX IF NOT EXISTS idx_actividades_etapa_orden
  ON actividades (etapa_id, orden);

-- 2. Columnas del modelo que la BD nunca tuvo.
-- Verificado contra la BD el 2026-10-12: actividades tiene exactamente 7
-- columnas (id, profesor_id, etapa_id, tipo, titulo, configuracion, creado_en),
-- pero la interfaz Actividad de src/types/actividad.ts declara once. Las tres
-- que faltaban son imagen_url, video_url y atelier.
--
-- Esto no es preparación del sembrado: es un fallo en producción HOY.
-- db.guardarActividad() hace supabase.from('actividades').insert(actividad)
-- con el objeto entero, sin recortar claves. Si el profesor dibuja una portada
-- o una ficha, PostgREST responde PGRST204 (column does not exist), el .insert
-- devuelve error y la función hace throw → el guardado se corta. Se añaden las
-- columnas y deja de estar roto.
ALTER TABLE actividades ADD COLUMN IF NOT EXISTS imagen_url text;
ALTER TABLE actividades ADD COLUMN IF NOT EXISTS video_url  text;
ALTER TABLE actividades ADD COLUMN IF NOT EXISTS atelier    jsonb;

-- Las imágenes del enunciado NO viven aquí: viven dentro de configuracion
-- (jsonb), en preguntas[].imagenUrl. Por eso las 54 imágenes locales del seed
-- se persisten aunque imagen_url sea sólo la portada del listado.

-- 3. Asignaciones por RUTA (no por actividad suelta)
ALTER TABLE asignaciones ADD COLUMN IF NOT EXISTS etapa_id uuid REFERENCES etapas(id);
ALTER TABLE asignaciones ALTER COLUMN actividad_id DROP NOT NULL;

-- Migrar asignaciones antiguas: deducir la etapa desde la actividad asignada
UPDATE asignaciones a
SET etapa_id = act.etapa_id
FROM actividades act
WHERE a.actividad_id = act.id AND a.etapa_id IS NULL;

-- Eliminar duplicados (mismo estudiante + misma etapa, conservar el más reciente).
-- Se rankhea en vez de comparar creado_en directamente: con la comparación
-- original, dos filas con la MISMA marca de tiempo no se borraban ninguna y el
-- índice único del paso 4 fallaba. NULLS LAST + ctid como desempate garantizan
-- que de cada grupo quede exactamente una.
WITH d AS (
  SELECT ctid,
         ROW_NUMBER() OVER (
           PARTITION BY estudiante_id, etapa_id
           ORDER BY creado_en DESC NULLS LAST, ctid DESC
         ) AS n
  FROM asignaciones
  WHERE etapa_id IS NOT NULL
)
DELETE FROM asignaciones a
USING d
WHERE a.ctid = d.ctid AND d.n > 1;

-- 4. Constraint de unicidad: un estudiante no recibe la misma ruta dos veces
CREATE UNIQUE INDEX IF NOT EXISTS idx_asignaciones_estudiante_etapa
  ON asignaciones (estudiante_id, etapa_id)
  WHERE etapa_id IS NOT NULL;

-- 5. (Opcional, tras validar la app con el modelo nuevo)
--    Borrar la asignación de actividades sueltas:
-- ALTER TABLE asignaciones DROP COLUMN IF EXISTS actividad_id;

-- 6. RLS de referencia para las tablas tocadas (ajustar al patrón existente)
--    Las rutas se leen por asignación del estudiante o propiedad del profesor.

-- 7. Autoverificación antes de confirmar: si algo no quedó como debe, el
--    RAISE EXCEPTION deshace todo el BEGIN y la BD vuelve a su estado original.
DO $$
DECLARE
  n_cols   integer;
  n_dupes  integer;
  sin_orden integer;
BEGIN
  -- Se filtra por table_schema: information_schema.columns incluye todos los
  -- schemas, y una tabla homónima en otro schema inflaría el conteo.
  SELECT count(*) INTO n_cols
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND ((table_name = 'actividades'   AND column_name IN ('orden','imagen_url','video_url','atelier'))
      OR (table_name = 'asignaciones' AND column_name = 'etapa_id'));
  IF n_cols <> 5 THEN
    RAISE EXCEPTION 'migración incompleta: sólo % de las 5 columnas nuevas existen', n_cols;
  END IF;

  SELECT count(*) INTO n_dupes FROM (
    SELECT estudiante_id, etapa_id
    FROM asignaciones
    WHERE etapa_id IS NOT NULL
    GROUP BY estudiante_id, etapa_id
    HAVING count(*) > 1
  ) g;
  IF n_dupes > 0 THEN
    RAISE EXCEPTION 'quedan % grupos de asignaciones duplicadas por etapa', n_dupes;
  END IF;

  -- Las actividades dentro de una ruta deben tener orden; las del Banco no.
  SELECT count(*) INTO sin_orden
  FROM actividades
  WHERE etapa_id IS NOT NULL AND orden IS NULL;
  IF sin_orden > 0 THEN
    RAISE EXCEPTION '% actividades en ruta siguen sin orden asignado', sin_orden;
  END IF;

  RAISE NOTICE 'migración verificada: columnas OK, 0 duplicados, 0 pasos sin orden';
END $$;

COMMIT;

-- Tras el COMMIT, confirmar a ojo:
--   SELECT count(*) FILTER (WHERE etapa_id IS NULL)      AS plantillas_banco,
--          count(*) FILTER (WHERE etapa_id IS NOT NULL)  AS pasos_de_ruta,
--          count(*) FILTER (WHERE orden IS NULL)         AS sin_orden
--   FROM actividades;
--   SELECT indexname FROM pg_indexes
--   WHERE tablename IN ('actividades','asignaciones')
--     AND indexname LIKE 'idx_%etapa%';
