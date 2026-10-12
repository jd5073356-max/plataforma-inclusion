#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Deduce el esquema de producción a partir de MUESTRAS de filas servidas por
PostgREST, y emite el DDL más un precargado mínimo para montar una réplica en
local contra la que ejecutar supabase/sembrar-contenido.sql.

Por qué muestras y no el spec OpenAPI: PostgREST de este proyecto devuelve un
error (101 bytes, sin spec) al pedir el OpenAPI, pero sí sirve filas con la
anon key. De los nombres de columna y sus tipos se infiere la forma de la tabla.

Qué NO hace: no vuelca datos personales. De 'perfiles' se espera una proyección
recortada (id, rol) sin nombres; los nombres de estudiantes no deben acabar en
un artefacto de GitHub. Las tablas que el SQL de sembrado no toca (asignaciones,
progreso) no se reconstruyen: se declara lo que hace falta para la prueba.

Uso:
    python3 scripts/esquema_desde_muestra.py actividades.json etapas.json > replica.sql
"""
import json
import sys

# Columnas de perfiles que el sembrado necesita. No se infieren de la muestra
# para no obligar a volcar nombres reales de estudiantes al artefacto.
PERFIL_MINIMO = [("id", "uuid"), ("rol", "text"), ("nombre", "text")]


def cargar(ruta):
    with open(ruta, encoding="utf-8") as f:
        datos = json.load(f)
    if isinstance(datos, dict):
        raise SystemExit(f"✗ {ruta} trae error, no lista: {datos}")
    return datos


def inferir(filas):
    """Devuelve {columna: tipo_sql} usando el primer valor no-null por columna."""
    tipos = {}
    orden = []
    for fila in filas:
        for col, val in fila.items():
            if col not in tipos:
                orden.append(col)
            if val is None and col in tipos:
                continue
            tipos[col] = tipo_de(val)
    return [(c, tipos.get(c, "text")) for c in orden]


def tipo_de(val):
    if isinstance(val, bool):
        return "boolean"
    if isinstance(val, int):
        return "bigint" if abs(val) > 2**31 else "integer"
    if isinstance(val, float):
        return "double precision"
    if isinstance(val, dict) or isinstance(val, list):
        return "jsonb"
    if isinstance(val, str):
        import re
        if re.fullmatch(r"[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-"
                        r"[0-9a-fA-F]{4}-[0-9a-fA-F]{12}", val):
            return "uuid"
        if re.fullmatch(r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}(:?\d{2})?)?", val):
            return "timestamptz"
        if re.fullmatch(r"\d{4}-\d{2}-\d{2}", val):
            return "date"
        return "text"
    return "text"


def create(nombre, columnas, pk=None):
    out = [f"CREATE TABLE public.{nombre} ("]
    filas = [f"  {c:<20s} {t}" for c, t in columnas]
    if pk:
        filas.append(f"  PRIMARY KEY ({pk})")
    out.append(",\n".join(filas))
    out.append(");")
    return "\n".join(out)


def main():
    if len(sys.argv) != 3:
        print(__doc__)
        return 2

    acts = cargar(sys.argv[1])
    etapas = cargar(sys.argv[2])

    if not acts:
        raise SystemExit("✗ la muestra de actividades viene vacía; no infiero el esquema")

    print("-- Réplica mínima del esquema de producción.")
    print("-- Generado de scripts/esquema_desde_muestra.py a partir de muestras")
    print("-- servidas por PostgREST. NO incluye CHECK, DEFAULT, triggers,")
    print("-- índices, RLS ni ON DELETE de las FK reales: el spec no los expone")
    print("-- y las muestras no permiten inferirlos. Sirve para detectar errores")
    print("-- de sintaxis, columnas inexistentes, tipos incompatibles y FK rotas.")
    print()
    print("BEGIN;")
    print()
    print(create("perfiles", PERFIL_MINIMO, pk="id"))
    print("--   (perfiles real tiene más columnas; se recorta a lo que usa el sembrado")
    print("--    para no volcar datos de estudiantes a este archivo)")
    print()

    cols_etapas = inferir(etapas)
    print(create("etapas", cols_etapas, pk="id"))
    print()

    cols_acts = inferir(acts)
    print(create("actividades", cols_acts, pk="id"))
    print()

    print("-- FK reales: actividades.profesor_id → perfiles, actividades.etapa_id → etapas.")
    print("-- Se declaran para que el test detecte una FK rota en el sembrado.")
    print("ALTER TABLE actividades")
    print("  ADD CONSTRAINT fk_act_prof FOREIGN KEY (profesor_id) REFERENCES perfiles(id),")
    print("  ADD CONSTRAINT fk_act_etapa FOREIGN KEY (etapa_id) REFERENCES etapas(id);")
    print()

    print("-- Precargado: las etapas reales (contenido pedagógico, sin datos personales).")
    print("-- Los ids de perfiles se crean solo como blancos de FK.")
    profesores = sorted({e.get("profesor_id") for e in etapas if e.get("profesor_id")})
    for p in profesores:
        print(f"INSERT INTO perfiles (id, rol, nombre) VALUES ('{p}', 'profesor', 'x')")
        print("ON CONFLICT (id) DO NOTHING;")
    print()
    cols = [c for c, _ in cols_etapas]
    print("INSERT INTO etapas (" + ", ".join(cols) + ") VALUES")
    filas = []
    for e in etapas:
        vals = []
        for c in cols:
            v = e.get(c)
            if v is None:
                vals.append("NULL")
            elif isinstance(v, (dict, list)):
                vals.append("'" + json.dumps(v, ensure_ascii=False).replace("'", "''") + "::jsonb")
            elif isinstance(v, (int, float)):
                vals.append(str(v))
            else:
                vals.append("'" + str(v).replace("'", "''") + "'")
        filas.append("  (" + ", ".join(vals) + ")")
    print(",\n".join(filas))
    print("ON CONFLICT (id) DO NOTHING;")
    print()
    print("COMMIT;")
    return 0


if __name__ == "__main__":
    sys.exit(main())
