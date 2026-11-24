# poliEmpleo · Bolsa de empleo y pasantías

Plataforma web que conecta **estudiantes y graduados** (EPN y externos) con **empresas**, con una **coordinación** que verifica empresas y mide la demanda de habilidades. Une lo mejor de dos demos:

- **PolibolsaEPN** (Flask): empresas que publican vacantes, CV en formato Harvard (editor + Word), buscador con filtros y etiquetas.
- **PoliConnect EPN** (Next.js): porcentaje de afinidad por etiquetas, seguimiento de postulaciones con notificaciones, lectura de CV en PDF, panel de administración con analítica.

Diseño visual: sistema **Talento** (teal `#145962`, Google Sans).

> La explicación de la estructura y de cada función está en **[GUIA_PROYECTO.md](./GUIA_PROYECTO.md)**.

## Levantarlo con Docker (recomendado)

Requisitos: Docker con Compose v2.

```bash
docker compose up --build -d
```

Abre **http://localhost:3000**. En el primer arranque se crea la base de datos con datos de demostración.

```bash
docker compose logs -f        # ver registros
docker compose down           # detener (los datos se conservan)
docker compose down -v        # detener y BORRAR la base de datos y los PDFs
```

Opciones (archivo `.env` junto al `docker-compose.yml`, ver `.env.example`):

| Variable | Valor por defecto | Para qué sirve |
| --- | --- | --- |
| `PORT` | `3000` | Puerto del sitio en tu máquina |
| `SEED_DEMO` | `true` | `false` = empezar sin datos (define `ADMIN_EMAIL` y `ADMIN_PASSWORD` para crear el primer administrador) |
| `COOKIE_SECURE` | `false` | Pon `true` solo si lo publicas detrás de HTTPS |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | vacío | Crea un administrador inicial si no existe ninguno (mín. 6 caracteres) |
| `AI_API_KEY` | vacío | Opcional: lectura de CV con IA (API compatible con OpenAI/DeepSeek). Sin clave se usa el lector local |

## Cuentas de demostración (contraseña `123456`)

| Rol | Correo |
| --- | --- |
| Postulante (EPN) | `estudiante@demo.com` |
| Postulante (externo) | `andrea.salazar@demo.com` |
| Empresa | `empresa@demo.com` |
| Administración | `admin@demo.com` |

La pantalla de ingreso tiene botones de acceso rápido. Hay un PDF para probar la lectura de CV en `docs/cv_ejemplo.pdf`.

## Sin Docker (desarrollo)

Requiere **Node.js 22.5 o superior** (usa el SQLite incluido en Node).

```bash
npm install
npm run dev        # http://localhost:3000
# o producción:
npm run build && node .next/standalone/server.js
```

Los datos se guardan en `./data` (variable `DATA_DIR` para cambiarlo).

## Antes de publicarlo en internet

Es un proyecto de demostración. Antes de exponerlo públicamente:

1. Cambia o elimina las cuentas demo (`SEED_DEMO=false`) y sirve el sitio con **HTTPS** (`COOKIE_SECURE=true`).
2. Actualiza **Next.js**: la última 14.x (14.2.35) tiene avisos de seguridad de denegación de servicio (`npm audit`) que solo se corrigen pasando a una versión mayor.
3. Añade límite de intentos de ingreso y verificación de correo (no incluidos).


docker compose stop web
mkdir -p backup
MSYS_NO_PATHCONV=1 docker run --rm -v poliempleo_talento-data:/data -v "$PWD/backup:/bk" alpine sh -c "cp /data/poliEmpleo.db* /bk/"
MSYS_NO_PATHCONV=1 docker run --rm -v poliempleo_talento-data:/data -v "$PWD/data/import:/src:ro" talento-epn:latest node /src/aplicar_logos.js
docker compose start web

docker compose up -d --build
