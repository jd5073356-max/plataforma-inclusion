-- ============================================================
-- MIGRACIÓN: Modelo de Rutas Lineales — ECO INCLUSIVO
-- Estado 2026-09-08: NO APLICADA (proyecto Supabase no responde,
-- DNS de fmpubxikjdbdfvanfcok.supabase.co no resuelve).
-- Aplicar en Supabase SQL Editor cuando el proyecto esté activo.
--
-- Modelo nuevo:
--   actividades.etapa_id = NULL  → plantilla del Banco de Actividades
--   actividades.etapa_id + orden → paso de una ruta (secuencia lineal)
--   asignaciones apunta a ETAPAS (rutas), no a actividades sueltas
-- ============================================================

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

-- Eliminar duplicados (mismo estudiante + misma etapa, conservar el más reciente)
DELETE FROM asignaciones a
USING asignaciones b
WHERE a.etapa_id = b.etapa_id
  AND a.estudiante_id = b.estudiante_id
  AND a.etapa_id IS NOT NULL
  AND a.creado_en < b.creado_en;

-- 3. Constraint de unicidad: un estudiante no recibe la misma ruta dos veces
CREATE UNIQUE INDEX IF NOT EXISTS idx_asignaciones_estudiante_etapa
  ON asignaciones (estudiante_id, etapa_id)
  WHERE etapa_id IS NOT NULL;

-- 4. (Opcional, tras validar la app con el modelo nuevo)
--    Borrar la asignación de actividades sueltas:
-- ALTER TABLE asignaciones DROP COLUMN IF EXISTS actividad_id;

-- 5. RLS de referencia para las tablas tocadas (ajustar al patrón existente)
--    Las rutas se leen por asignación del estudiante o propiedad del profesor.
