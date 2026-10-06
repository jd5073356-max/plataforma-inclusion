#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Vuelca el estado de la BD de Supabase para decidir el sembrado: perfiles,
profesor_id en uso, y actividades con tipos que ya no tienen renderer.

Uso:
    python3 scripts/estado_bd.py perfiles.json actividades.json
"""
import json
import collections
import sys


def cargar(ruta):
    with open(ruta, encoding="utf-8") as f:
        datos = json.load(f)
    if isinstance(datos, dict):
        print(f"  ⚠ {ruta} trae error: {datos}")
        return []
    return datos


def main():
    if len(sys.argv) != 4:
        print(__doc__)
        return 2

    perfiles = cargar(sys.argv[1])
    acts = cargar(sys.argv[2])
    etapas = cargar(sys.argv[3])

    print("── perfiles en la BD ──")
    for p in perfiles:
        print(f"  {p.get('id')}  {str(p.get('rol')):11s} {str(p.get('nombre'))[:30]}")

    print()
    print("── profesor_id distintos en actividades ──")
    c = collections.Counter(a.get("profesor_id") for a in acts)
    for k, v in c.most_common():
        print(f"  {k}  →  {v} actividades")

    print()
    print("── actividades con tipo sin renderer (explorador_3d) ──")
    huerfanas = [a for a in acts if a.get("tipo") == "explorador_3d"]
    for a in huerfanas:
        print(f"  {a.get('id')}  {str(a.get('titulo'))[:36]:36s} "
              f"etapa={str(a.get('etapa_id'))[:8]}")
    print(f"  total: {len(huerfanas)}")

    print()
    print("── reparto de actividades por etapa ──")
    por_etapa = collections.Counter(a.get("etapa_id") for a in acts)
    for k, v in sorted(por_etapa.items(), key=lambda x: (x[0] is None, str(x[0]))):
        print(f"  {k}  →  {v}")

    print()
    print("── etapas en la BD ──")
    for e in etapas:
        print(f"  {str(e.get('id'))[:8]}…  {str(e.get('nombre'))[:38]:38s} "
              f"orden={e.get('orden')}  prof={str(e.get('profesor_id'))[:8]}…")

    print()
    print("── profesor_id distintos en las etapas ──")
    c = collections.Counter(e.get("profesor_id") for e in etapas)
    for k, v in c.most_common():
        print(f"  {k}  →  {v} etapas")

    print()
    print("── tipos en la BD ──")
    for k, v in collections.Counter(a.get("tipo") for a in acts).most_common():
        marca = " ← SIN RENDERER" if k == "explorador_3d" else ""
        print(f"  {str(k):22s} {v}{marca}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
