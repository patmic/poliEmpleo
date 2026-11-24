#!/usr/bin/env python3
"""Descarga los logos listados en empresas.json y crea empresas_logos.zip.

Uso (en tu computador, en la misma carpeta que empresas.json):
    python3 descargar_logos.py
"""
import json
import os
import urllib.request
import zipfile

CARPETA = "logos"
ZIP_SALIDA = "empresas_logos.zip"
HEADERS = {"User-Agent": "Mozilla/5.0"}

with open("empresas.json", encoding="utf-8") as f:
    datos = json.load(f)

os.makedirs(CARPETA, exist_ok=True)
fallidos = []

for emp in datos["empresas"]:
    destino = os.path.join(CARPETA, emp["logo_archivo"])
    try:
        req = urllib.request.Request(emp["logo_url"], headers=HEADERS)
        with urllib.request.urlopen(req, timeout=30) as resp, open(destino, "wb") as out:
            out.write(resp.read())
        print("OK   ", destino)
    except Exception as e:  # registrar y seguir con la siguiente empresa
        fallidos.append((emp["nombre"], str(e)))
        print("ERROR", emp["nombre"], e)

with zipfile.ZipFile(ZIP_SALIDA, "w", zipfile.ZIP_DEFLATED) as z:
    for nombre in sorted(os.listdir(CARPETA)):
        z.write(os.path.join(CARPETA, nombre), arcname=nombre)

print(f"\nZIP creado: {ZIP_SALIDA}")
if fallidos:
    print("Sin descargar:", len(fallidos))
    for nombre, err in fallidos:
        print(" -", nombre, "->", err)
