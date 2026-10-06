#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Genera supabase/sembrar-contenido.sql desde src/lib/seed-activities.json,
apuntando a los ids de etapa REALES de la BD de Supabase.

Por qué hace falta: el seed del código usa ids de texto ('etapa-andres') que solo
existen en modo mock. La BD usa UUIDs sintéticos (...-000000000201…205). Mientras
el seed no se traduzca a esos UUIDs y se escriba en la BD, el contenido reescrito
no llega a producción: getRutasAsignadas descarta las asignaciones cuya etapa no
está en la tabla etapas, y getActividades fusiona el seed con la BD sin filtrar
por etapa, mezclando 34 actividades de texto con las 35 viejas.

Idempotencia: los ids se derivan por hash determinista del id del seed, así que
el script se puede volver a correr y hace UPSERT en vez de duplicar.

Uso:
    python3 scripts/gen_sembrar_sql.py [--dry-run]
"""
import json
import hashlib
import os
import sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SEED = os.path.join(RAIZ, "src/lib/seed-activities.json")
SALIDA = os.path.join(RAIZ, "supabase/sembrar-contenido.sql")

# Mapeo seed → etapa real en la BD. Verificado contra
# https://fmpubxikjdbdfvanfcok.supabase.co/rest/v1/etapas (2026-10-04).
ETAPAS_BD = {
    "etapa-andres":    "00000000-0000-0000-0000-000000000201",  # Guía Andrés · Tangram y dinero
    "etapa-david":     "00000000-0000-0000-0000-000000000202",  # Guía David · Números enteros
    "etapa-yessica":   "00000000-0000-0000-0000-000000000203",  # Guía Yessica · La casa EN/ES
    "etapa-maria":     "00000000-0000-0000-0000-000000000204",  # Guía María Paula · Biología
    "etapa-emociones": "00000000-0000-0000-0000-000000000205",  # Guía Convivencia · Emociones
}

# profesor_id sintético ya usado en el seed y en las etapas de la BD.
PROFESOR = "00000000-0000-0000-0000-000000000001"

# Namespace para derivar UUIDs deterministas (UUIDv5-style sobre md5).
NS = "eco-inclusivo:seed:"


def uuid_de(id_seed: str) -> str:
    """UUID determinista a partir del id de texto del seed."""
    h = hashlib.md5((NS + id_seed).encode("utf-8")).hexdigest()
    return f"{h[0:8]}-{h[8:12]}-{h[12:16]}-{h[16:20]}-{h[20:32]}"


def lit(valor) -> str:
    """Literal SQL con escapado de comillas simples."""
    return "'" + str(valor).replace("'", "''") + "'"


def jsonb(obj) -> str:
    """jsonb como literal de texto escapado."""
    return lit(json.dumps(obj, ensure_ascii=False, separators=(",", ":")))


def main():
    dry = "--dry-run" in sys.argv
    actividades = json.load(open(SEED, encoding="utf-8"))

    # Sanidad antes de emitir nada
    errores = []
    for a in actividades:
        et = a.get("etapa_id")
        if et is not None and et not in ETAPAS_BD:
            errores.append(f"{a['id']}: etapa_id desconocido {et}")
        if not a.get("tipo"):
            errores.append(f"{a['id']}: sin tipo")
        if not a.get("configuracion", {}).get("preguntas"):
            errores.append(f"{a['id']}: sin preguntas")
    if errores:
        print("✗ el seed no es consistente, no genero SQL:")
        for e in errores:
            print("   ", e)
        return 1

    lineas = []
    W = lineas.append

    W("-- ============================================================")
    W("-- SEMBRAR CONTENIDO — ECO INCLUSIVO")
    W("-- Generado por scripts/gen_sembrar_sql.py. NO EDITAR A MANO.")
    W("--")
    W("-- Escribe las 34 actividades del seed en la BD real, traduciendo los")
    W("-- ids de etapa de texto ('etapa-andres') a los UUIDs sintéticos que usa")
    W("-- la BD (...-000000000201…205).")
    W("--")
    W("-- Idempotente: los ids se derivan por hash del id del seed, y se hace")
    W("-- UPSERT sobre la clave primaria. Se puede volver a ejecutar.")
    W("--")
    W("-- Requiere: supabase/migracion-rutas.sql ya aplicada (columnas")
    W("--   actividades.orden y asignaciones.etapa_id).")
    W("--")
    W("-- Ejecutar en: Supabase dashboard → SQL Editor del proyecto")
    W("--   fmpubxikjdbdfvanfcok. Necesita permisos de escritura (service_role")
    W("--   o el editor del dashboard); la anon key con RLS no basta.")
    W("-- ============================================================")
    W("")
    W("BEGIN;")
    W("")
    W("-- 0. Precondición: la migración de rutas aplicada. Si falla, aborta sin tocar datos.")
    W("DO $$")
    W("BEGIN")
    W("  IF NOT EXISTS (")
    W("    SELECT 1 FROM information_schema.columns")
    W("    WHERE table_name = 'actividades' AND column_name = 'orden'")
    W("  ) THEN")
    W("    RAISE EXCEPTION 'falta actividades.orden: aplica supabase/migracion-rutas.sql primero';")
    W("  END IF;")
    W("  IF NOT EXISTS (")
    W("    SELECT 1 FROM information_schema.columns")
    W("    WHERE table_name = 'asignaciones' AND column_name = 'etapa_id'")
    W("  ) THEN")
    W("    RAISE EXCEPTION 'falta asignaciones.etapa_id: aplica supabase/migracion-rutas.sql primero';")
    W("  END IF;")
    W("END $$;")
    W("")
    W(f"-- El profesor sintético debe existir (las etapas de la BD ya lo usan).")
    W(f"-- Si falta, se inserta para que la FK de actividades no reviente.")
    W("INSERT INTO perfiles (id, rol, nombre)")
    W(f"VALUES ({lit(PROFESOR)}, 'profesor', 'Profesora Guía')")
    W("ON CONFLICT (id) DO NOTHING;")
    W("")
    W("-- 1. Las 5 rutas ya existen en la BD con estos ids (verificado 2026-10-04);")
    W("--    no se insertan. Si alguna faltara, el INSERT de paso 3 fallaría por FK")
    W("--    y el ROLLBACK deja la BD intacta.")
    W("")
    W("-- 2. Retira el contenido viejo del profesor de las guías.")
    W("--    Se borra porque el contenido nuevo lo reemplaza por completo: las")
    W("--    filas viejas incluyen tipos sin renderer (explorador_3d) y medios")
    W("--    que contradicen el enunciado.")
    W("--    Acotado por profesor_id: NO toca rutas ni plantillas de otros profesores.")
    W("DELETE FROM actividades")
    W(f"WHERE profesor_id = {lit(PROFESOR)}")
    W("  AND (")
    W("    etapa_id IN (")
    for uid in list(ETAPAS_BD.values())[:-1]:
        W(f"      {lit(uid)},")
    W(f"      {lit(list(ETAPAS_BD.values())[-1])}")
    W("    )")
    W("    OR etapa_id IS NULL")
    W("  );")
    W("")

    # 3. Insertar
    W("-- 3. Siembra las actividades nuevas.")
    W("INSERT INTO actividades")
    W("  (id, profesor_id, etapa_id, orden, tipo, titulo, imagen_url, configuracion, atelier, creado_en)")
    W("VALUES")
    filas = []
    for a in actividades:
        et = a.get("etapa_id")
        uid_et = ETAPAS_BD[et] if et else "NULL"
        orden = a.get("orden")
        uid_act = uuid_de(a["id"])
        vals = ", ".join([
            lit(uid_act),
            lit(PROFESOR),
            uid_et,
            str(orden) if orden is not None else "NULL",
            lit(a["tipo"]),
            lit(a["titulo"]),
            lit(a["imagen_url"]) if a.get("imagen_url") else "NULL",
            jsonb(a["configuracion"]) + "::jsonb",
            jsonb(a["atelier"]) + "::jsonb" if a.get("atelier") else "NULL",
            "NOW()",
        ])
        filas.append(f"  ({vals})")
    W(",\n".join(filas))
    W("ON CONFLICT (id) DO UPDATE SET")
    W("  profesor_id   = EXCLUDED.profesor_id,")
    W("  etapa_id      = EXCLUDED.etapa_id,")
    W("  orden         = EXCLUDED.orden,")
    W("  tipo          = EXCLUDED.tipo,")
    W("  titulo        = EXCLUDED.titulo,")
    W("  imagen_url    = EXCLUDED.imagen_url,")
    W("  configuracion = EXCLUDED.configuracion,")
    W("  atelier       = EXCLUDED.atelier;")
    W("")

    # 4. Verificación
    W("-- 4. Resumen para confirmar tras el COMMIT:")
    W("--   SELECT etapa_id, count(*), min(orden), max(orden) FROM actividades")
    W("--   WHERE profesor_id = " + lit(PROFESOR) + " GROUP BY etapa_id ORDER BY etapa_id;")
    W("")
    W("COMMIT;")

    sql = "\n".join(lineas) + "\n"

    print(f"actividades: {len(actividades)}")
    print(f"  en rutas  : {sum(1 for a in actividades if a.get('etapa_id'))}")
    print(f"  en banco  : {sum(1 for a in actividades if not a.get('etapa_id'))}")
    print(f"  tamañosql : {len(sql):,} caracteres")
    print()
    print("primeros ids generados (deterministas):")
    for a in actividades[:4]:
        print(f"  {a['id']:18s} → {uuid_de(a['id'])}")
    print()

    if dry:
        print("--dry-run: no escribo el archivo. Primeros 40:")
        print("\n".join(sql.split("\n")[:40]))
        return 0

    with open(SALIDA, "w", encoding="utf-8") as f:
        f.write(sql)
    print(f"✓ escrito: {SALIDA}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
