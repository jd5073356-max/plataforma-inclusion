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

-- 2. Asignaciones por RUTA (no por actividad suelta)
ALTER TABLE asignaciones ADD COLUMN IF NOT EXISTS etapa_id uuid REFERENCES etapas(id);

-- Migrar asignaciones antiguas: deducir la etapa desde la actividad asignada
UPDATE asignaciones a
SET etapa_id = act.etapa_id
FROM actividades act
WHERE a.actividad_id = act.id AND a.etapa_id IS NULL;

-- Eliminar duplicados (mismo estudiante + misma etapa, conservar el más reciente).
-- Se rankhea en vez de comparar creado_en directamente: con la comparación
-- original, dos filas con la MISMA marca de tiempo no se borraban ninguna y el
-- índice único de paso 3 fallaba. NULLS LAST + ctid como desempate garantizan
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

-- 3. Constraint de unicidad: un estudiante no recibe la misma ruta dos veces
CREATE UNIQUE INDEX IF NOT EXISTS idx_asignaciones_estudiante_etapa
  ON asignaciones (estudiante_id, etapa_id)
  WHERE etapa_id IS NOT NULL;

-- 4. (Opcional, tras validar la app con el modelo nuevo)
--    Borrar la asignación de actividades sueltas:
-- ALTER TABLE asignaciones DROP COLUMN IF EXISTS actividad_id;

-- 5. RLS de referencia para las tablas tocadas (ajustar al patrón existente)
--    Las rutas se leen por asignación del estudiante o propiedad del profesor.

-- 6. Autoverificación antes de confirmar: si algo no quedó como debe, el
--    RAISE EXCEPTION deshace todo el BEGIN y la BD vuelve a su estado original.
DO $$
DECLARE
  n_cols   integer;
  n_dupes  integer;
  sin_orden integer;
BEGIN
  SELECT count(*) INTO n_cols
  FROM information_schema.columns
  WHERE (table_name = 'actividades' AND column_name = 'orden')
     OR (table_name = 'asignaciones' AND column_name = 'etapa_id');
  IF n_cols <> 2 THEN
    RAISE EXCEPTION 'migración incompleta: sólo % de las 2 columnas nuevas existen', n_cols;
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
