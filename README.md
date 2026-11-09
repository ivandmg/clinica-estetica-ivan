# Clínica Estética Ivan · Plantilla web

Sitio web + sistema de reservas + panel de administración para una clínica estética.
Construido como **plantilla reutilizable**: ver [PERSONALIZAR.md](./PERSONALIZAR.md) (se completa en la fase final).

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui · Supabase (Postgres, Auth, Storage) · Nodemailer (Gmail) · Netlify · GitHub Actions.

**Todo funciona con planes gratuitos** que permiten uso comercial: GitHub, Supabase Free, Gmail, Netlify Free y GitHub Actions.

---

## Índice

1. [Requisitos](#1-requisitos)
2. [Crear las cuentas](#2-crear-las-cuentas)
3. [Configurar Supabase (base de datos)](#3-configurar-supabase-base-de-datos)
4. [Correr el proyecto en tu computadora](#4-correr-el-proyecto-en-tu-computadora)
5. [Crear el usuario manager](#5-crear-el-usuario-manager)
6. [Tests](#6-tests)
7. [Estructura del proyecto](#7-estructura-del-proyecto)

> Las secciones de **correo (Gmail)**, **recordatorios con GitHub Actions** y **publicación en Netlify** se agregan en las fases 4 y 6.

---

## 1. Requisitos

- **Node.js 20.9 o superior** (recomendado 22 LTS): <https://nodejs.org> → descargá la versión "LTS".
  Verificá en una terminal: `node -v`
- **Git**: <https://git-scm.com/downloads>
- Un editor de código, por ejemplo **VS Code**: <https://code.visualstudio.com>

## 2. Crear las cuentas

Todas tienen plan gratuito suficiente para empezar.

| Servicio | Para qué | Enlace |
|---|---|---|
| GitHub | Guardar el código | <https://github.com/signup> |
| Supabase | Base de datos, login del manager, fotos | <https://supabase.com/dashboard/sign-up> (podés entrar con GitHub) |
| Netlify | Publicar el sitio (gratis, uso comercial permitido) | <https://app.netlify.com/signup> (entrá con GitHub) |
| Google (Gmail) | Enviar correos | Tu cuenta de Gmail con verificación en 2 pasos |

## 3. Configurar Supabase (base de datos)

### 3.1 Crear el proyecto

1. Entrá a <https://supabase.com/dashboard> → **New project**.
2. **Name:** `clinica-estetica-ivan` · **Database Password:** generá una y guardala · **Region:** `South America (São Paulo)` (la más cercana a Bolivia).
3. Esperá 1–2 minutos a que termine de crearse.

### 3.2 Crear las tablas y cargar los datos de ejemplo

1. En el menú izquierdo: **SQL Editor** → **New query**.
2. Abrí el archivo [`supabase/setup-completo.sql`](./supabase/setup-completo.sql) de este proyecto, copiá **todo** su contenido y pegalo en el editor.
3. Tocá **Run**. Debe decir *Success. No rows returned*.
4. Verificá en **Table Editor**: deben aparecer las tablas `treatments` (15 filas), `professionals` (2), `categories` (3), etc.

> `setup-completo.sql` junta las migraciones de `supabase/migrations/` y el `supabase/seed.sql`.
> Si cambiás alguno, regeneralo con `npm run db:bundle`.
> ⚠️ Correlo **solo una vez en una base nueva**. Si lo corrés de nuevo va a fallar porque las tablas ya existen.

### 3.3 Seguridad de Auth (importante)

1. **Authentication → Sign In / Providers** (o *Providers → Email*): **desactivá "Allow new users to sign up"**. Así nadie puede registrarse; el único usuario será el manager creado con el script.
2. **Authentication → URL Configuration**:
   - **Site URL:** `http://localhost:3000` (cuando publiques, cambiala por tu URL de Netlify).
   - **Redirect URLs:** agregá `http://localhost:3000/**` (y luego `https://clinica-estetica-ivan.netlify.app/**`).

### 3.4 Copiar las claves

En **Project Settings → API Keys** (o **Data API**) vas a encontrar:

| Dato en Supabase | Variable en `.env.local` |
|---|---|
| Project URL (`https://xxxx.supabase.co`) | `NEXT_PUBLIC_SUPABASE_URL` |
| `anon` `public` / *Publishable key* | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `service_role` / *Secret key* ⚠️ | `SUPABASE_SERVICE_ROLE_KEY` |

> ⚠️ La **service_role / secret key** salta toda la seguridad de la base. Nunca la pongas en código del navegador, ni la compartas, ni la subas a GitHub. `.env.local` ya está ignorado por git.

## 4. Correr el proyecto en tu computadora

```bash
git clone https://github.com/ivandmg/clinica-estetica-ivan.git
cd clinica-estetica-ivan
npm install
cp .env.example .env.local     # en Windows (PowerShell): copy .env.example .env.local
```

Abrí `.env.local` y completá al menos las 3 variables de Supabase. Luego:

```bash
npm run dev
```

Abrí <http://localhost:3000>.

## 5. Crear el usuario manager

Con `.env.local` completo:

```bash
npm run manager:create -- ivandmg150@gmail.com "UnaContraseñaSegura123"
```

Para verificar que la conexión y la seguridad funcionan:

```bash
npm run db:check
```

El script `manager:create` crea el usuario en Supabase Auth (o le cambia la contraseña si ya existe) y le da permisos de administrador (tabla `admin_users`). Tener cuenta en Auth **no alcanza**: solo los usuarios de `admin_users` pueden administrar.

## 6. Tests

```bash
npm test          # tests unitarios (cálculo de horarios, etc.)
npm run test:db   # tests contra un Postgres LOCAL (RLS, dobles reservas, rate limit)
```

`test:db` necesita un Postgres local (no el de producción) y la variable
`TEST_DATABASE_URL=postgres://postgres:postgres@localhost:5432/postgres`.
Crea una base temporal, aplica las migraciones y el seed, corre los tests y la borra.

## 7. Estructura del proyecto

```
src/
  app/                  Páginas (App Router)
    marca/              Página interna con la identidad visual
  components/
    ui/                 Componentes base (shadcn/ui)
    brand/              Logo
  lib/
    config/site.ts      ⭐ Datos de la marca y valores por defecto
    format.ts           Formato de precios (Bs 1.800), fechas y teléfonos
    utils.ts
supabase/
  migrations/           Esquema SQL, RLS, Storage
  seed.sql              Datos iniciales (catálogo, profesionales, textos)
  setup-completo.sql    Todo junto, para pegar en el SQL Editor (generado)
scripts/
  create-manager.ts     Crea el usuario manager
  bundle-sql.mjs        Genera setup-completo.sql
tests/                  Tests (Vitest)
public/brand/           Logos SVG
```

### Modelo de datos (resumen)

| Tabla | Contenido |
|---|---|
| `settings` | Una fila: datos del negocio, redes, textos de la landing, reglas de reserva |
| `categories`, `treatments` | Catálogo |
| `professionals`, `treatment_professionals` | Equipo y qué tratamientos hace cada uno |
| `availability_rules` | Horario semanal por profesional (varios bloques por día) |
| `availability_blocks` | Feriados, vacaciones, almuerzos (por profesional o para todos) |
| `bookings` | Reservas. Una *exclusion constraint* impide citas superpuestas del mismo profesional |
| `testimonials`, `faqs` | Contenido editable |
| `email_logs` | Registro de correos enviados/fallidos (para reintentar) |
| `rate_limits` | Anti-spam por IP/contacto |
| `admin_users` | Quién es manager |
