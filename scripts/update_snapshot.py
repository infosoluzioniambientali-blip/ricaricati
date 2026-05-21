#!/usr/bin/env python3
"""Aggiorna lo snapshot Drizzle 0030 per includere le colonne già presenti nel DB."""
import json, copy

with open('drizzle/meta/0029_snapshot.json', 'r') as f:
    snap = json.load(f)

# Aggiorna la versione dello snapshot
snap['version'] = '5'
snap['id'] = '0030_promo_sync'

# Ottieni la tabella promo_installatore
tbl = snap['tables']['promo_installatore']

# Aggiungi le colonne mancanti che esistono già nel DB
new_columns = {
    "pratiche_res": {
        "name": "pratiche_res",
        "type": "int",
        "primaryKey": False,
        "notNull": True,
        "autoincrement": False,
        "default": "0"
    },
    "pratiche_bus": {
        "name": "pratiche_bus",
        "type": "int",
        "primaryKey": False,
        "notNull": True,
        "autoincrement": False,
        "default": "0"
    },
    "prezzo_res": {
        "name": "prezzo_res",
        "type": "decimal(10,2)",
        "primaryKey": False,
        "notNull": False,
        "autoincrement": False,
        "default": None
    },
    "prezzo_bus": {
        "name": "prezzo_bus",
        "type": "decimal(10,2)",
        "primaryKey": False,
        "notNull": False,
        "autoincrement": False,
        "default": None
    },
    "mostra_in_home": {
        "name": "mostra_in_home",
        "type": "boolean",
        "primaryKey": False,
        "notNull": True,
        "autoincrement": False,
        "default": False
    },
    "visibilita": {
        "name": "visibilita",
        "type": "enum('singolo','tutti','home')",
        "primaryKey": False,
        "notNull": True,
        "autoincrement": False,
        "default": "'singolo'"
    }
}

for col_name, col_def in new_columns.items():
    if col_name not in tbl['columns']:
        tbl['columns'][col_name] = col_def
        print(f"Aggiunta colonna: {col_name}")
    else:
        print(f"Colonna già presente: {col_name}")

# Salva lo snapshot 0030
with open('drizzle/meta/0030_snapshot.json', 'w') as f:
    json.dump(snap, f, indent=2)

print("Snapshot 0030 aggiornato con successo!")
print("Colonne finali:", list(tbl['columns'].keys()))
