#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Comprueba si el seed de actividades del repositorio choca con lo que hay en la
BD de Supabase. Se ejecuta desde el workflow de diagnóstico, que descarga las
etapas y actividades de la BD a JSON y los pasa por aquí.

No toca credenciales: recibe los cuerpos ya obtenidos por curl.

Uso:
    python3 scripts/checa_seed_vs_bd.py etapas_bd.json actividades_bd.json seed.json
"""
import json
import sys


def cargar(ruta):
    with open(ruta, encoding="utf-8") as f:
        datos = json.load(f)
    if isinstance(datos, dict):
        # PostgREST devuelve un objeto cuando hay error
        print(f"  ⚠ {ruta} trae error, no lista: {datos}")
        return []
    return datos


def main():
    if len(sys.argv) != 4:
        print(__doc__)
        return 2

    etapas_bd = cargar(sys.argv[1])
    acts_bd = cargar(sys.argv[2])
    seed = cargar(sys.argv[3])

    bd_ids = {e["id"] for e in etapas_bd}
    seed_etapas = {a.get("etapa_id") for a in seed if a.get("etapa_id")}
    seed_sin_etapa = sum(1 for a in seed if not a.get("etapa_id"))

    print("── etapas en la BD ──")
    for e in etapas_bd:
        print(f"  {e['id']}  |  {str(e.get('nombre'))[:46]}  | orden={e.get('orden')}")

    print()
    print("── etapa_id que usa el seed ──")
    print(f"  {sorted(seed_etapas)}")
    print(f"  sin etapa_id (plantillas del Banco): {seed_sin_etapa}")

    print()
    print("── ids de actividades en la BD (muestra) ──")
    for a in acts_bd[:8]:
        print(f"  {str(a.get('id'))[:8]}  {str(a.get('tipo')):20s} "
              f"{str(a.get('titulo'))[:32]:32s} etapa={str(a.get('etapa_id'))[:8]}")
    print(f"  ... {len(acts_bd)} en total")

    print()
    print("── VEREDICTO ──")
    ids_seed = {a["id"] for a in seed}
    ids_bd = {a["id"] for a in acts_bd}
    colision_ids = ids_seed & ids_bd
    interseccion_etapas = seed_etapas & bd_ids

    if colision_ids:
        print(f"  ids duplicados entre seed y BD: {sorted(colision_ids)[:5]}")
        print("  → getActividades() los deduplicaría por id. Raro: el BD usa UUID.")

    if not interseccion_etapas:
        print("  ✗ EL SEED NO ENCAJA CON LA BD.")
        print("    El seed referencia etapas ('etapa-andres', …) que no existen en la BD,")
        print("    que usa UUIDs. Consecuencias con Supabase vivo:")
        print("      · getRutasAsignadas() hace etapas.find(e => e.id === asig.etapa_id)")
        print("        y descarta lo que no encuentra → las rutas del seed no se ven.")
        print("      · getActividades() sí concatena seed + BD sin filtrar por etapa,")
        print(f"        así que las {len(seed)} actividades del seed se mezclarían con")
        print(f"        las {len(acts_bd)} de la BD en cualquier listado del profesor.")
        print()
        print("  El seed solo surte efecto pleno en modo mock (localStorage), donde las")
        print("  etapas también vienen de plantillas.ts con esos mismos ids de texto.")
        return 1

    print(f"  ✓ intersección de etapas: {sorted(interseccion_etapas)}")
    if len(interseccion_etapas) < len(seed_etapas):
        faltan = sorted(seed_etapas - bd_ids)
        print(f"  ⚠ el seed usa etapas ausentes en la BD: {faltan}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
