#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Valida los SQL de supabase/ sin necesidad de un servidor PostgreSQL.

Dos niveles:

1. Sintaxis con el parser oficial (libpg_query, vía pglast). Es el mismo
   analizador que usa el servidor, así que un error aquí es un error allá.

2. Contracto de datos, que el parser no puede ver: que las columnas que se
   inserten existan realmente en la BD de producción, y que cada fila del
   VALUES tenga tantos valores como columnas declaradas. El esquema conocido
   se hardcodea abajo porque PostgREST de este proyecto no sirve el spec con
   la anon key y no hay servidor local; está verificado contra la BD el
   2026-10-12 con el workflow "Diagnóstico de esquema".

Uso:
    /tmp/vsql/bin/python scripts/valida_sql.py supabase/migracion-rutas.sql \
        supabase/sembrar-contenido.sql
"""
import re
import sys

try:
    import pglast
except ImportError:
    sys.exit("✗ falta pglast. Instálalo en un venv: python3 -m venv /tmp/vsql && /tmp/vsql/bin/pip install pglast")

# Esquema REAL verificado contra la BD (2026-10-12), más lo que aporta la
# migración. Si la BD cambia, actualizar aquí y volver a correr el diagnóstico.
BD_ANT_MIGRACION = {
    "actividades": {"id", "profesor_id", "etapa_id", "tipo", "titulo",
                    "configuracion", "creado_en"},
    "etapas": {"id", "nombre", "orden", "profesor_id", "creado_en"},
    "asignaciones": {"id", "estudiante_id", "actividad_id", "ajuste", "creado_en"},
    "perfiles": {"id", "rol", "nombre"},
}
AÑADE_MIGRACION = {
    "actividades": {"orden", "imagen_url", "video_url", "atelier"},
    "asignaciones": {"etapa_id"},
}
BD_POST_MIGRACION = {
    t: cols | AÑADE_MIGRACION.get(t, set()) for t, cols in BD_ANT_MIGRACION.items()
}


def valida_sintaxis(ruta):
    """Devuelve la lista de errores de parser (vacía = bien)."""
    sql = open(ruta, encoding="utf-8").read()
    try:
        arbol = pglast.parse_sql(sql)
        return [], len(arbol)
    except pglast.parser.ParseError as exc:
        return [f"{ruta}: {exc}"], 0


def extrae_inserts(sql):
    """[(tabla, [columnas], [n_valores_por_fila])] de los INSERT simples."""
    sale = []
    for m in re.finditer(
        r"INSERT\s+INTO\s+([a-z_][a-z0-9_]*)\s*\(([^)]*)\)\s*VALUES(.*?)(?=ON\s+CONFLICT|;)",
        sql, re.S | re.I,
    ):
        tabla = m.group(1)
        cols = [c.strip() for c in m.group(2).split(",") if c.strip()]
        cuerpo = m.group(3)
        filas = contar_tuplas(cuerpo)
        sale.append((tabla, cols, filas))
    return sale


def contar_tuplas(cuerpo):
    """Número de valores por tupla, respetando comillas y corchetes jsonb."""
    filas = []
    profundidad = 0
    actual = []
    dentro = False
    i = 0
    while i < len(cuerpo):
        ch = cuerpo[i]
        if ch == "'":
            if dentro and i + 1 < len(cuerpo) and cuerpo[i + 1] == "'":
                actual.append("''")
                i += 2
                continue
            dentro = not dentro
            actual.append(ch)
        elif not dentro and ch == "(":
            profundidad += 1
            if profundidad == 1:
                actual = []
            else:
                actual.append(ch)
        elif not dentro and ch == ")":
            profundidad -= 1
            if profundidad == 0:
                filas.append(contar_comas("".join(actual)))
            else:
                actual.append(ch)
        elif not dentro and ch == "[":
            # array jsonb: no afecta el conteo de comas de nivel 0
            j = cuerpo.find("]", i)
            if j == -1:
                break
            if profundidad <= 1:
                actual.append(cuerpo[i:j + 1])
            i = j
        elif profundidad >= 1:
            actual.append(ch)
        i += 1
    return filas


def contar_comas(s):
    """Comas de nivel 0 + 1, ignorando las que estén dentro de literales."""
    nivel = 0
    comas = 0
    dentro = False
    i = 0
    while i < len(s):
        ch = s[i]
        if ch == "'":
            if dentro and i + 1 < len(s) and s[i + 1] == "'":
                i += 2
                continue
            dentro = not dentro
        elif not dentro:
            if ch in "([":
                nivel += 1
            elif ch in ")]":
                nivel -= 1
            elif ch == "," and nivel == 0:
                comas += 1
        i += 1
    return comas + 1


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return 2

    fallos = 0
    for ruta in sys.argv[1:]:
        print(f"═══ {ruta}")
        errs, n_stmts = valida_sintaxis(ruta)
        if errs:
            for e in errs:
                print(f"  ✗ SINTAXIS: {e}")
            fallos += 1
            continue
        print(f"  ✓ sintaxis: {n_stmts} sentencias parseadas por libpg_query")

        sql = open(ruta, encoding="utf-8").read()
        for tabla, cols, filas in extrae_inserts(sql):
            conocidas = BD_POST_MIGRACION.get(tabla)
            print(f"  INSERT INTO {tabla}: {len(cols)} columnas, {len(filas)} filas")
            if conocidas is None:
                print(f"    ⚠ tabla no catalogada; no se pueden verificar columnas")
                continue
            raras = [c for c in cols if c not in conocidas]
            if raras:
                print(f"    ✗ columnas que NO existen en la BD post-migración: {raras}")
                print(f"      existentes: {sorted(conocidas)}")
                fallos += 1
            else:
                print(f"    ✓ todas las columnas existen en el esquema post-migración")
            if filas:
                malos = [f for f in filas if f != len(cols)]
                if malos:
                    print(f"    ✗ {len(malos)} filas con número de valores distinto de "
                          f"{len(cols)}: {sorted(set(malos))}")
                    fallos += 1
                else:
                    print(f"    ✓ arity consistente: las {len(filas)} filas traen {len(cols)} valores")
        print()

    if fallos:
        print(f"✗ {fallos} problema(s)")
        return 1
    print("✓ sin problemas")
    return 0


if __name__ == "__main__":
    sys.exit(main())
