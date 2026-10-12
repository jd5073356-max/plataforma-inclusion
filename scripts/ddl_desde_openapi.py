#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Convierte el spec OpenAPI de PostgREST en DDL de PostgreSQL.

Sirve para levantar en local un esquema equivalente al de producción y poder
ejecutar supabase/sembrar-contenido.sql contra él antes de correrlo en el
proyecto real. PostgREST expone el esquema en la raíz de /rest/v1 con la
apikey, así que no hacen falta permisos de administración.

Limitaciones honestas: OpenAPI describe tablas y columnas con su tipo, pero NO
las restricciones (CHECK, DEFAULT, índices, triggers, RLS, ni el cascade de las
FK). El DDL resultante reproduce la forma de los datos, no todas las reglas.
Por eso el paso de validación local detecta errores de sintaxis, columnas que
no existen, tipos incompatibles y FK rotas — no sustituye a la transacción
BEGIN/ROLLBACK del propio archivo.

Uso:
    python3 scripts/ddl_desde_openapi.py openapi.json > esquema.sql
"""
import json
import re
import sys

# PostgREST mapea cada ruta a una tabla por el sufijo del tag / $ref.
RE_TIPO = re.compile(r"^[a-z_]+(\[\])?$")


def tipo_sql(deff):
    """Deduce el tipo SQL de un $ref/definition de OpenAPI."""
    ref = deff.get("$ref", "")
    nombre = ref.rsplit("/", 1)[-1] if ref else ""
    # PostgREST llama "<schema><tabla>" a la definición de cada fila
    return nombre


def main():
    if len(sys.argv) != 2:
        print(__doc__)
        return 2

    with open(sys.argv[1], encoding="utf-8") as f:
        spec = json.load(f)

    defs = spec.get("definitions", {})
    paths = spec.get("paths", {})

    print("-- DDL derivado del spec OpenAPI de PostgREST")
    print("-- NO es el esquema original: carece de CHECK, DEFAULT, triggers,")
    print("-- índices y RLS. Solo la forma de las tablas.")
    print()

    tablas = {}
    for ruta, ops in paths.items():
        # /actividades → tabla "actividades"; /actividades/{id} igual
        limpio = ruta.strip("/").split("{")[0].strip("/")
        if not limpio or "/" in limpio:
            continue
        definicion = (ops.get("get") or {}).get("responses", {}).get("200", {})
        schema = definicion.get("schema", {})
        items = schema.get("items", {}) if isinstance(schema, dict) else {}
        ref = items.get("$ref", "") if isinstance(items, dict) else ""
        nombre_def = ref.rsplit("/", 1)[-1] if ref else ""
        if nombre_def and nombre_def in defs:
            tablas[limpio] = nombre_def

    if not tablas:
        print("-- (no se pudieron relacionar rutas con definiciones)")
        return 1

    for tabla, def_nombre in sorted(tablas.items()):
        props = defs[def_nombre].get("properties", {})
        columnas = []
        for col, meta in props.items():
            t = str(meta.get("type", "text"))
            fmt = meta.get("format", "")
            # PostgREST usa type=string con format para uuid/date/timestamp
            if t == "string":
                sql_t = {"uuid": "uuid", "date": "date",
                         "date-time": "timestamptz"}.get(fmt, "text")
            elif t == "integer":
                sql_t = "bigint" if fmt == "int64" else "integer"
            elif t == "number":
                sql_t = "numeric"
            elif t == "boolean":
                sql_t = "boolean"
            elif t == "object":
                sql_t = "jsonb"
            elif t == "array":
                sql_t = "jsonb"
            else:
                sql_t = "text"
            nulo = "" if meta.get("readOnly") else " NULL"
            columnas.append(f"  {col:<22s} {sql_t}{nulo}")

        print(f"CREATE TABLE IF NOT EXISTS public.{tabla} (")
        print(",\n".join(columnas))
        print(");")
        print()

    print("-- Relaciones declaradas en el spec (para reconstruir FKs a mano):")
    for tabla, def_nombre in sorted(tablas.items()):
        rels = defs[def_nombre].get("relationships", {})
        for r, info in rels.items():
            print(f"--   {tabla}.{r} → {info}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
