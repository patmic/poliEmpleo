// Exporta todas las tablas de la base viva a un JSON. Solo lee; no modifica la base.
// Las contraseñas (hash) se omiten a propósito.
const { DatabaseSync } = require("node:sqlite");
const fs = require("node:fs");
const db = new DatabaseSync("/data/poliEmpleo.db");
const tablas = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map((t) => t.name);
const salida = { exportado: new Date().toISOString(), tablas: {} };
for (const t of tablas) {
  let filas = db.prepare(`SELECT * FROM "${t}"`).all().map((f) => ({ ...f }));
  if (t === "users") filas = filas.map((f) => ({ ...f, password_hash: "[omitido]" }));
  salida.tablas[t] = filas;
}
const nombre = `poliEmpleo-export-${new Date().toISOString().slice(0, 10)}.json`;
fs.writeFileSync(`/out/${nombre}`, JSON.stringify(salida, null, 2), "utf8");
console.log("Archivo:", nombre);
console.log(tablas.map((t) => `${t}: ${salida.tablas[t].length}`).join("\n"));
db.close();
