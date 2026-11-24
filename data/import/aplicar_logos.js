// Agrega la columna logo (si falta) y asigna los logos a las empresas, sin borrar ningún otro dato.
// Se ejecuta dentro del contenedor, con la base viva en /data.
const { DatabaseSync } = require("node:sqlite");
const fs = require("node:fs");
const db = new DatabaseSync("/data/poliEmpleo.db");
const cols = db.prepare("PRAGMA table_info(company_profiles)").all().map((c) => c.name);
if (!cols.includes("logo")) db.exec("ALTER TABLE company_profiles ADD COLUMN logo TEXT NOT NULL DEFAULT ''");
const json = JSON.parse(fs.readFileSync("/src/empresas.json", "utf8"));
const up = db.prepare("UPDATE company_profiles SET logo = ? WHERE user_id = (SELECT id FROM users WHERE name = ? AND role = 'company')");
let n = 0;
for (const e of json.empresas) n += Number(up.run("/empresas/logos/" + e.logo_archivo, e.nombre).changes);
console.log("Logos asignados:", n);
db.close();
