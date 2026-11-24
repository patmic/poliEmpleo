# Guía del proyecto · Talento EPN

Esta guía explica **qué hace el sitio**, **cómo está organizado el código** y **de dónde viene cada función** (qué se tomó de cada demo).

---

## 1. Qué se tomó de cada demo

| Aspecto funcional | PolibolsaEPN (Flask) | PoliConnect EPN (Next.js) | Talento EPN (este proyecto) |
| --- | --- | --- | --- |
| Roles | Estudiante, Empresa | Admin, Estudiante EPN, Externo | **Postulante** (condición: estudiante o graduado, EPN o externo), **Empresa**, **Administración** |
| Quién publica vacantes | Empresas | Solo el administrador | **Empresas** (el admin puede pausar/cerrar) |
| Etiquetas (tags) | Perfil, empresa y vacante | Intereses y vacante | Perfil, empresa y vacante, con etiquetas propias creables |
| Afinidad estudiante–vacante | No | Sí (porcentaje por etiquetas) | **Sí**, también cuenta carrera afín y texto del CV |
| CV | Editor tipo Excel + vista Harvard + Word/Excel/PDF | Subida de PDF + lectura con IA (DeepSeek) | **Editor Harvard con vista previa en vivo + Word + imprimir PDF + subida de PDF** (lector local, IA opcional) |
| Buscador | Texto + ventana de filtros/etiquetas (OR/AND) | Filtros en panel admin | **Barra superior + ventana de filtros con etiquetas OR/AND** |
| Seguimiento de postulación | Estado simple | En revisión → Entrevistado → Seleccionado/Rechazado + notificaciones | **4 estados, historial, valoración, notas internas y notificaciones** |
| Recordatorio de CV | No | Mensual | **Sí** (aviso si pasaron más de 30 días) |
| Analítica | No | Gráficos de postulaciones, origen, etiquetas | **Panel de administración** con KPIs y barras |
| Verificación de empresas | No | No | **Nuevo**: sello «Empresa verificada» por la coordinación |

---

## 2. Cómo está organizado el proyecto

```text
talento-epn/
├── Dockerfile                  Imagen de producción (3 etapas: dependencias → build → ejecución)
├── docker-compose.yml          Servicio web + volumen persistente «talento-data»
├── .env.example                Variables de entorno disponibles
├── README.md                   Cómo levantarlo
├── GUIA_PROYECTO.md            Este documento
├── docs/cv_ejemplo.pdf         CV de prueba para probar la lectura de PDF
├── package.json                Dependencias (Next.js 14, React 18, Tailwind 4, docx, pdf-parse)
├── next.config.mjs             Salida «standalone» (imagen pequeña)
└── src/
    ├── app/                    Páginas y rutas (Next.js App Router)
    │   ├── layout.tsx          Estructura común: barra superior, mensajes, pie
    │   ├── globals.css         Tokens del sistema de diseño Talento + hoja Harvard
    │   ├── actions.ts          TODAS las escrituras (formularios): login, registro, postular, etc.
    │   ├── page.tsx            Portada (si hay sesión, redirige al panel del rol)
    │   ├── login/  registro/   Ingreso (con accesos de demo) y registro
    │   ├── empleos/            Lista con filtros y detalle de una vacante
    │   ├── empresas/[id]/      Perfil público de una empresa y sus vacantes
    │   ├── buscar/             Resultados del buscador global
    │   ├── notificaciones/     Bandeja de notificaciones
    │   ├── estudiante/         Inicio, perfil, CV (editor) y mis postulaciones
    │   ├── empresa/            Panel, perfil, publicar/editar vacante y tablero de postulantes
    │   ├── candidatos/[id]/    Expediente del candidato (CV Harvard + gestión de la postulación)
    │   ├── admin/              Analítica, usuarios, moderación de vacantes
    │   └── api/
    │       ├── cv/parse/       Recibe un PDF y devuelve los datos detectados
    │       ├── cv/docx/        Genera el CV en Word (.docx)
    │       ├── files/[name]/   Sirve el PDF original con control de permisos
    │       └── health/         Comprobación de salud (usada por Docker)
    ├── components/             Piezas de interfaz reutilizables
    │   ├── ui.tsx              Botón, insignia, tarjeta, campos, ScoreBadge, Stepper, barras…
    │   ├── Navbar.tsx          Barra superior según el rol
    │   ├── SearchBar.tsx       Buscador + ventana emergente de filtros y etiquetas
    │   ├── TagPicker.tsx       Selector de etiquetas (catálogo + crear nuevas)
    │   ├── JobCard.tsx  JobForm.tsx  HarvardSheet.tsx  Flash.tsx  SubmitButton.tsx
    └── lib/                    Lógica sin interfaz
        ├── db.ts               SQLite (esquema, conexión, utilidades de etiquetas y notificaciones)
        ├── seed.ts             Datos de demostración (primer arranque)
        ├── auth.ts             Sesiones por cookie y control de acceso por rol
        ├── passwords.ts        Contraseñas con scrypt + sal
        ├── data.ts             Consultas de lectura, buscador y estadísticas
        ├── match.ts            Cálculo del porcentaje de afinidad
        ├── cv.ts               Estructura del CV Harvard
        ├── cvparse.ts          Lectura de PDF (local + IA opcional)
        └── catalog.ts          Carreras, modalidades, estados y catálogo de etiquetas
```

**Tecnología:** Next.js 14 (páginas de servidor + acciones de servidor), SQLite incluido en Node 22 (`node:sqlite`, sin base de datos externa), Tailwind 4. Sin servicios externos obligatorios.

### Base de datos (SQLite, archivo `talento.db`)

| Tabla | Contenido |
| --- | --- |
| `users` | Cuenta: correo, contraseña (hash), rol (`student` / `company` / `admin`), activa o no |
| `sessions` | Sesiones abiertas (token aleatorio, vence a los 7 días) |
| `student_profiles` | Origen (EPN / externo), institución, carrera, promedio, titular, modalidad preferida, **CV en JSON**, PDF subido |
| `company_profiles` | RUC, sector, tamaño, descripción, **verificada** |
| `tags`, `user_tags`, `job_tags` | Etiquetas y su relación con personas/empresas y vacantes |
| `jobs` | Vacante: modalidad, tipo, cupos, remuneración, carreras afines, fecha límite, estado (activa / pausada / cerrada) |
| `applications` | Postulación: estado, afinidad, valoración (1–5), nota interna |
| `application_events` | Historial de cambios de estado |
| `notifications` | Avisos por usuario (leída o no, con enlace) |

Los archivos (base y PDFs) viven en el volumen Docker `/data`, así que sobreviven a reinicios y reconstrucciones.

---

## 3. Qué hace el sitio, por rol

### 3.1 Visitante (sin cuenta)
- Ve la **portada** con indicadores generales y vacantes recientes.
- Puede **explorar vacantes** (`/empleos`), ver su detalle y los **perfiles públicos de empresas**.
- Para postular debe ingresar o crear cuenta. Los perfiles de estudiantes **no son públicos**.

### 3.2 Estudiante o graduado
1. **Registro:** elige «Soy estudiante / graduado», indica si es **EPN o externo** (con su institución) y su carrera.
2. **Inicio** (`/estudiante`): indicadores de sus postulaciones, avance del perfil, vacantes **recomendadas ordenadas por afinidad**, y el **recordatorio mensual** si su CV tiene más de 30 días.
3. **Perfil** (`/estudiante/perfil`): datos académicos, titular, «sobre mí», modalidad preferida y **etiquetas** de habilidades (se pueden crear nuevas).
4. **CV** (`/estudiante/cv`):
   - Editor por secciones: datos personales, educación, experiencia, proyectos/liderazgo y habilidades (con botones para agregar/eliminar filas).
   - **Vista previa en vivo en formato Harvard** al lado derecho; cada letra que escribes se refleja al instante.
   - **Subir CV en PDF:** se lee el texto, se detectan datos y etiquetas y se muestra una propuesta. **Solo completa campos vacíos**: nunca reemplaza lo que ya escribiste, y las etiquetas sugeridas las aceptas una por una.
   - **Descargar Word (.docx)** en formato Harvard, e **Imprimir / guardar como PDF**.
5. **Vacantes** (`/empleos`): filtros por palabra, modalidad, tipo y carrera; ordenar por **afinidad** o fecha. En el detalle ve su porcentaje, las etiquetas que **coinciden** (verde) y las que **le faltan**.
6. **Postular:** un clic con mensaje opcional. La empresa recibe su perfil y su CV Harvard. No se puede postular dos veces ni a vacantes pausadas/cerradas.
7. **Mis postulaciones:** estado actual con pasos (**En revisión → Entrevista → Seleccionado**, o **Rechazado**), historial, filtro por estado y opción de **retirar** mientras esté en revisión.
8. **Notificaciones:** campana en la barra superior; cada cambio de estado llega con el mensaje que escriba la empresa.

### 3.3 Empresa
1. **Registro:** nombre, RUC y sector. Queda **pendiente de verificación**; puede publicar mientras tanto.
2. **Perfil** (`/empresa/perfil`): datos corporativos, descripción y **etiquetas** (tecnologías, áreas, sector).
3. **Publicar vacante:** título, descripción, responsabilidades, requisitos, modalidad, tipo (tiempo completo, pasantía, prácticas, proyecto de titulación…), cupos, remuneración, fecha límite, **etiquetas** y **carreras afines**.
4. **Panel** (`/empresa`): indicadores y tabla de vacantes con **pausar / activar**, edición y eliminación.
5. **Tablero de postulantes** (`/empresa/vacantes/:id`): cuatro columnas (En revisión, Entrevista, Seleccionado, Rechazado), tarjetas **ordenadas por afinidad**, filtro EPN/externos y botones para mover de etapa con un clic.
6. **Expediente del candidato:** CV Harvard completo, PDF original, descarga en Word, y un formulario para **cambiar estado + mensaje al candidato + valoración interna (1–5 estrellas) + nota interna** (la nota solo la ve la empresa).
7. **Privacidad:** una empresa solo ve el CV y los datos de contacto de quien **se postuló a una de sus vacantes**. En el buscador puede encontrar perfiles (carrera, etiquetas) sin ver el contacto.

### 3.4 Administración (coordinación)
- **Analítica** (`/admin`): vacantes activas, postulaciones, postulantes (EPN vs. externos), empresas; postulaciones por estado y por carrera; **habilidades más demandadas vs. disponibles** (vacantes que la piden / estudiantes que la tienen); vacantes por modalidad.
- **Usuarios:** lista con filtro por rol y búsqueda; **verificar empresas** (RUC) y **activar/desactivar cuentas** (cierra sus sesiones).
- **Vacantes:** moderación; al pausar o cerrar, la empresa recibe una notificación.

### 3.5 Buscador global (todos los roles)
En la barra superior: cuadro de texto + botón **Filtros** que abre una **ventana emergente**:
- **Buscar en:** todo, vacantes, empresas o estudiantes (estudiantes solo visible para empresas y administración).
- **Modalidad** y **carrera**.
- **Etiquetas múltiples** con modo **Alguna (OR)** o **Todas (AND)**.

El texto busca en títulos, descripciones, empresas, etiquetas y, para estudiantes, también **dentro del contenido del CV**. Los resultados se agrupan en vacantes, empresas y estudiantes.

---

## 4. Reglas de negocio importantes

**Afinidad (`src/lib/match.ts`)** — número entre 35 y 99:

```
afinidad = 35 + 55 × (etiquetas de la vacante que tiene el estudiante ÷ etiquetas de la vacante) + 10 si su carrera es afín
```

- Una etiqueta cuenta si está en el perfil **o aparece en el texto del CV**.
- Si la vacante no tiene etiquetas, esa parte vale la mitad; si no define carreras, todas las carreras suman los 10 puntos.
- Colores: **70+ verde**, **40–69 ámbar**, **menos de 40 rojo**. Se recalcula al postular y se guarda en la postulación.

**Estados de una postulación:** En revisión → Entrevista → Seleccionado; «Rechazado» puede ocurrir en cualquier etapa y se puede revertir a «En revisión». Cada cambio queda en el historial y notifica al estudiante.

**Lectura de PDF (`src/lib/cvparse.ts`):**
- **Lector local (por defecto):** extrae el texto, reconoce secciones (Perfil, Educación, Experiencia, Habilidades, Idiomas…), correo, teléfono, LinkedIn/GitHub, rangos de fechas y detecta etiquetas del catálogo.
- **Con IA (opcional):** si defines `AI_API_KEY`, el texto se envía a la API configurada (por defecto DeepSeek, compatible con OpenAI) y se pide un JSON; si falla, se usa el lector local. **Sin clave, ningún dato sale del servidor.**
- Funciona con PDFs con texto; un PDF escaneado como imagen se guarda pero no se puede leer.

**Seguridad:**
- Contraseñas con **scrypt + sal**; sesiones con token aleatorio en cookie `HttpOnly`, `SameSite=Lax`.
- Cada página y cada acción comprueba **sesión y rol** en el servidor; las empresas solo pueden modificar **sus** vacantes y postulaciones.
- Los PDFs se sirven solo al dueño, al admin o a la empresa con una postulación de esa persona; los nombres de archivo se validan.
- Las consultas SQL usan parámetros (no se arma SQL con texto del usuario).

---

## 5. Cómo probar el recorrido completo (5 minutos)

1. `docker compose up --build -d` y abre http://localhost:3000.
2. **Estudiante:** en Ingresar pulsa «Postulante». Mira «Recomendadas para ti», abre una vacante y mira tu afinidad, postula. Ve a **Mi CV** y sube `docs/cv_ejemplo.pdf` (verás las propuestas) o edita algo y mira la vista previa.
3. Cierra sesión y entra como **Empresa**. Abre una vacante, mueve a la postulante a **Entrevista**, escribe un mensaje y valora con estrellas.
4. Vuelve como **Estudiante**: en la campana verás la notificación y en «Mis postulaciones» el nuevo estado.
5. Entra como **Administración**: revisa la analítica y verifica la empresa pendiente («Logística Pichincha»).
6. En cualquier cuenta usa **Filtros** en la barra superior: elige etiquetas y alterna **Alguna / Todas**.

---

## 6. Qué NO incluye (límites conocidos)

- **Correo electrónico:** no se envían correos; los avisos son internos (campana). No hay verificación de correo ni recuperación de contraseña.
- **Límite de intentos de ingreso** y protección contra bots: no incluidos.
- **El editor «tipo Excel» y la exportación a Excel** de PolibolsaEPN **no se portaron**: se reemplazaron por un editor por secciones (más simple de usar en móvil) con exportación a Word y PDF.
- **Subida de CV en Word/Excel:** solo PDF.
- **Mensajería** entre empresa y estudiante: no hay chat (solo el mensaje al cambiar de estado).
- **Idioma:** interfaz solo en español.
- **Seguridad de dependencias:** Next.js 14 (última 14.x) tiene avisos de denegación de servicio; antes de publicarlo en internet conviene migrar a una versión mayor (ver README).
- **Escala:** SQLite en un solo servidor es adecuado para una demo o una facultad; para miles de usuarios simultáneos conviene PostgreSQL.

---

## 7. Cómo extenderlo

| Quiero… | Dónde |
| --- | --- |
| Añadir carreras, modalidades o etiquetas | `src/lib/catalog.ts` |
| Cambiar la fórmula de afinidad | `src/lib/match.ts` |
| Cambiar colores/tipografía | `src/app/globals.css` (tokens `--theme-color`, etc.) |
| Añadir un campo a la vacante | esquema en `src/lib/db.ts` → `src/lib/data.ts` → `JobForm.tsx` → `saveJobAction` en `actions.ts` |
| Añadir un estado de postulación | `APP_STATUSES` en `catalog.ts` y la restricción `CHECK` en `db.ts` |
| Nueva pantalla protegida | crear `src/app/<ruta>/page.tsx` y llamar `requireUser("rol")` al inicio |
| Respaldar los datos | copiar el volumen `talento-data` (contiene `talento.db` y `uploads/`) |

## Reportes del Administrador (Observatorio y Consultorio)

Con el rol **Administrador** el menú incluye estas secciones, que alimentan los reportes de los documentos del Observatorio, el Consultorio Tecnológico Express y la capacidad TIC 2026-A:

| Sección | Para qué sirve |
|---|---|
| **Reportes** | KPIs del Anexo 4 con metas de 48 h y 30 días, pertinencia por línea técnica, flujo del Consultorio, vinculación y matriz de aliados. Cada tabla se descarga en CSV (Excel en español). |
| **Datos** | Importa señales laborales y componentes TIC 2026-A desde CSV, o registra señales una a una. |
| **Retos** | Banco de retos con prioridad, estado del piloto y docente focal. |
| **Aliados** | Aliados potenciales y clasificación de empresas registradas por tipo de actor y estado de convenio. |
| **Consultorio** | Casos atendidos: estado, estudiantes, horas, evidencia y si el caso es escalable. |
| **Postulaciones** | Tipo de vinculación (práctica, pasantía, consultorio, proyecto de aula, reto…), rol, horas y línea técnica de cada postulación. |

Las líneas técnicas son: Datos / BI, Soporte TI / infraestructura, Ciberseguridad, Gobierno de datos, Software / LMS / UX, IA / automatización, LegalTech / compliance, IoT / FabLab y Computación emergente. Al publicar una vacante o postularse, la línea se asigna automáticamente a partir del texto.

**Formato CSV de importación TIC:** `periodo;docente;titulo;linea_proyecto;estado;fecha_aprobacion;componente;estudiante;carrera;linea_componente`. Una fila por componente; las filas con el mismo título forman un proyecto.
