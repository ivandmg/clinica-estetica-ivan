-- =============================================================================
-- Clínica Estética · Esquema principal
-- Tablas, tipos, índices y la restricción que impide dobles reservas.
-- =============================================================================

create schema if not exists extensions;
create extension if not exists btree_gist with schema extensions;

-- -----------------------------------------------------------------------------
-- Tipos
-- -----------------------------------------------------------------------------
create type public.booking_status as enum ('confirmed', 'cancelled', 'completed', 'no_show');
create type public.booking_source as enum ('web', 'manual');
create type public.email_status as enum ('pending', 'sent', 'failed');

-- -----------------------------------------------------------------------------
-- Utilidades
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- Administradores (el manager). Solo los usuarios de esta tabla pueden
-- administrar; tener una cuenta en Supabase Auth NO alcanza.
-- -----------------------------------------------------------------------------
create table public.admin_users (
  user_id uuid primary key,
  email text not null,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Configuración del negocio (una sola fila, id = 1)
--   business: nombre, contacto, redes, dirección, mapa, horarios mostrados…
--   content:  textos editables de la landing
-- La forma de estos JSON se valida con Zod en src/lib/validation/settings.ts
-- -----------------------------------------------------------------------------
create table public.settings (
  id smallint primary key default 1 check (id = 1),
  business jsonb not null default '{}'::jsonb,
  content jsonb not null default '{}'::jsonb,
  -- Reglas de reserva
  min_advance_minutes integer not null default 120 check (min_advance_minutes between 0 and 10080),
  max_advance_days integer not null default 60 check (max_advance_days between 1 and 365),
  buffer_minutes integer not null default 15 check (buffer_minutes between 0 and 120),
  slot_interval_minutes integer not null default 30 check (slot_interval_minutes in (10, 15, 20, 30, 60)),
  cancellation_hours integer not null default 24 check (cancellation_hours between 0 and 168),
  max_daily_bookings_per_contact integer not null default 3 check (max_daily_bookings_per_contact between 1 and 50),
  updated_at timestamptz not null default now()
);

create trigger settings_updated_at before update on public.settings
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Catálogo
-- -----------------------------------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text,
  sort_order integer not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger categories_updated_at before update on public.categories
  for each row execute function public.set_updated_at();

create table public.treatments (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories (id) on delete restrict,
  name text not null check (char_length(name) between 1 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  short_description text not null default '',
  description text not null default '',
  benefits text[] not null default '{}',
  recommended_sessions text not null default '',
  aftercare text not null default '',
  duration_minutes integer not null check (duration_minutes between 5 and 480),
  -- null = "Consultar precio"
  price numeric(10, 2) check (price is null or price >= 0),
  image_url text,
  is_featured boolean not null default false,
  is_visible boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index treatments_category_idx on public.treatments (category_id, sort_order);

create trigger treatments_updated_at before update on public.treatments
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Profesionales
-- -----------------------------------------------------------------------------
create table public.professionals (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null default '',
  bio text not null default '',
  photo_url text,
  -- Color en el calendario del panel
  color text not null default '#3479C2' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger professionals_updated_at before update on public.professionals
  for each row execute function public.set_updated_at();

create table public.treatment_professionals (
  treatment_id uuid not null references public.treatments (id) on delete cascade,
  professional_id uuid not null references public.professionals (id) on delete cascade,
  primary key (treatment_id, professional_id)
);

create index treatment_professionals_professional_idx
  on public.treatment_professionals (professional_id);

-- -----------------------------------------------------------------------------
-- Disponibilidad
--   availability_rules:  horario semanal recurrente (varios bloques por día).
--                        weekday: 0 = domingo … 6 = sábado. Horas en hora local.
--   availability_blocks: bloqueos puntuales (feriados, vacaciones, almuerzo).
--                        professional_id null = bloquea a todos.
-- -----------------------------------------------------------------------------
create table public.availability_rules (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professionals (id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default now(),
  constraint availability_rules_valid_range check (end_time > start_time),
  -- Los bloques de un mismo día no se pueden superponer
  constraint availability_rules_no_overlap exclude using gist (
    professional_id with =,
    weekday with =,
    tsrange('2000-01-01'::date + start_time, '2000-01-01'::date + end_time, '[)') with &&
  )
);

create index availability_rules_professional_idx
  on public.availability_rules (professional_id, weekday);

create table public.availability_blocks (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid references public.professionals (id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text not null default '',
  created_at timestamptz not null default now(),
  constraint availability_blocks_valid_range check (ends_at > starts_at)
);

create index availability_blocks_range_idx on public.availability_blocks (starts_at, ends_at);

-- -----------------------------------------------------------------------------
-- Reservas
-- -----------------------------------------------------------------------------
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  -- Código corto para mostrar al cliente (ej.: "K7M2QX")
  code text not null unique,
  treatment_id uuid not null references public.treatments (id) on delete restrict,
  professional_id uuid not null references public.professionals (id) on delete restrict,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  -- Fin de la cita + intervalo entre citas. Es lo que se usa para evitar choques.
  blocked_until timestamptz not null,
  status public.booking_status not null default 'confirmed',
  -- Copia de los datos al momento de reservar (por si luego cambia el catálogo)
  treatment_name text not null,
  duration_minutes integer not null,
  price numeric(10, 2),
  -- Cliente
  customer_name text not null check (char_length(customer_name) between 2 and 120),
  customer_phone text not null check (customer_phone ~ '^\+[0-9]{8,15}$'),
  customer_email text not null check (customer_email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  customer_note text check (customer_note is null or char_length(customer_note) <= 1000),
  -- Hash SHA-256 del token del link /mi-reserva/[token] (el token no se guarda)
  token_hash text not null unique,
  source public.booking_source not null default 'web',
  ip_hash text,
  internal_note text,
  cancelled_at timestamptz,
  cancelled_by text check (cancelled_by in ('customer', 'manager')),
  cancellation_reason text,
  reminder_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bookings_valid_range check (ends_at > starts_at and blocked_until >= ends_at),
  -- ⭐ EVITA DOBLES RESERVAS: un mismo profesional no puede tener dos citas
  -- activas cuyo rango [inicio, fin + intervalo) se superponga. Postgres lo
  -- garantiza aun con pedidos simultáneos (error 23P01 para el que pierde).
  constraint bookings_no_overlap exclude using gist (
    professional_id with =,
    tstzrange(starts_at, blocked_until, '[)') with &&
  ) where (status <> 'cancelled')
);

create index bookings_starts_at_idx on public.bookings (starts_at);
create index bookings_status_starts_at_idx on public.bookings (status, starts_at);
create index bookings_customer_phone_idx on public.bookings (customer_phone, created_at);
create index bookings_customer_email_idx on public.bookings (lower(customer_email), created_at);

create trigger bookings_updated_at before update on public.bookings
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Contenido editable de la landing
-- -----------------------------------------------------------------------------
create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  author_name text not null,
  author_detail text not null default '',
  content text not null,
  rating smallint not null default 5 check (rating between 1 and 5),
  is_visible boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  is_visible boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Registro de correos (para ver errores y reintentar desde el panel)
-- -----------------------------------------------------------------------------
create table public.email_logs (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings (id) on delete set null,
  type text not null check (type in (
    'booking_confirmed_customer',
    'booking_confirmed_manager',
    'booking_cancelled_customer',
    'booking_cancelled_manager',
    'booking_rescheduled_customer',
    'booking_reminder_customer',
    'test'
  )),
  recipient text not null,
  subject text not null,
  status public.email_status not null default 'pending',
  error text,
  attempts integer not null default 0,
  -- Datos necesarios para volver a generar el correo
  payload jsonb not null default '{}'::jsonb,
  last_attempt_at timestamptz,
  created_at timestamptz not null default now()
);

create index email_logs_created_at_idx on public.email_logs (created_at desc);
create index email_logs_status_idx on public.email_logs (status);

-- -----------------------------------------------------------------------------
-- Rate limit (anti-spam) sin servicios externos
-- -----------------------------------------------------------------------------
create table public.rate_limits (
  key text not null,
  window_start timestamptz not null,
  count integer not null default 0,
  primary key (key, window_start)
);

/**
 * Suma 1 al contador de `p_key` en la ventana actual y devuelve true si
 * todavía está dentro del límite. Es atómico (sirve con pedidos simultáneos).
 */
create or replace function public.hit_rate_limit(
  p_key text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_window timestamptz := to_timestamp(
    floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds
  );
  v_count integer;
begin
  insert into public.rate_limits as r (key, window_start, count)
  values (p_key, v_window, 1)
  on conflict (key, window_start) do update set count = r.count + 1
  returning r.count into v_count;

  -- Limpieza ocasional de ventanas viejas
  if random() < 0.02 then
    delete from public.rate_limits where window_start < now() - interval '2 days';
  end if;

  return v_count <= p_limit;
end;
$$;
