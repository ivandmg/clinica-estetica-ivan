-- =============================================================================
-- ARCHIVO GENERADO con "npm run db:bundle". No lo edites a mano.
-- Pegalo completo en Supabase → SQL Editor → New query → Run (solo en una base NUEVA).
-- =============================================================================

-- >>> supabase/migrations/20261109000001_schema.sql
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


-- >>> supabase/migrations/20261109000002_security.sql
-- =============================================================================
-- Seguridad: Row Level Security (RLS)
--
--   · Público (rol anon): solo LEE el catálogo, profesionales, horarios y
--     contenido VISIBLE. No puede leer ni escribir reservas: las reservas se
--     crean desde la API del servidor (con la service_role key, que nunca llega
--     al navegador).
--   · Manager (usuario de Supabase Auth que además está en admin_users): todo.
-- =============================================================================

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_users where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated, service_role;

revoke all on function public.hit_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.hit_rate_limit(text, integer, integer) to service_role;

-- Activar RLS en todas las tablas
alter table public.admin_users enable row level security;
alter table public.settings enable row level security;
alter table public.categories enable row level security;
alter table public.treatments enable row level security;
alter table public.professionals enable row level security;
alter table public.treatment_professionals enable row level security;
alter table public.availability_rules enable row level security;
alter table public.availability_blocks enable row level security;
alter table public.bookings enable row level security;
alter table public.testimonials enable row level security;
alter table public.faqs enable row level security;
alter table public.email_logs enable row level security;
alter table public.rate_limits enable row level security;

-- -----------------------------------------------------------------------------
-- Lectura pública (solo lo visible)
-- -----------------------------------------------------------------------------
create policy "Público lee la configuración" on public.settings
  for select to anon, authenticated using (true);

create policy "Público lee categorías visibles" on public.categories
  for select to anon, authenticated using (is_visible);

create policy "Público lee tratamientos visibles" on public.treatments
  for select to anon, authenticated using (
    is_visible and exists (
      select 1 from public.categories c where c.id = category_id and c.is_visible
    )
  );

create policy "Público lee profesionales activos" on public.professionals
  for select to anon, authenticated using (is_active);

create policy "Público lee asignaciones visibles" on public.treatment_professionals
  for select to anon, authenticated using (
    exists (select 1 from public.treatments t where t.id = treatment_id and t.is_visible)
    and exists (select 1 from public.professionals p where p.id = professional_id and p.is_active)
  );

create policy "Público lee horarios de profesionales activos" on public.availability_rules
  for select to anon, authenticated using (
    exists (select 1 from public.professionals p where p.id = professional_id and p.is_active)
  );

create policy "Público lee testimonios visibles" on public.testimonials
  for select to anon, authenticated using (is_visible);

create policy "Público lee preguntas visibles" on public.faqs
  for select to anon, authenticated using (is_visible);

-- -----------------------------------------------------------------------------
-- Manager: acceso total
-- -----------------------------------------------------------------------------
create policy "Manager administra admin_users (lectura)" on public.admin_users
  for select to authenticated using ((select public.is_admin()));

create policy "Manager administra settings" on public.settings
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Manager administra categorías" on public.categories
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Manager administra tratamientos" on public.treatments
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Manager administra profesionales" on public.professionals
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Manager administra asignaciones" on public.treatment_professionals
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Manager administra horarios" on public.availability_rules
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Manager administra bloqueos" on public.availability_blocks
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Manager administra reservas" on public.bookings
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Manager administra testimonios" on public.testimonials
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Manager administra preguntas" on public.faqs
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Manager lee correos" on public.email_logs
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- rate_limits: sin políticas → solo la service_role (servidor) puede usarla.

-- -----------------------------------------------------------------------------
-- Storage: bucket público "images" para fotos de tratamientos y profesionales.
-- Cualquiera puede VER las imágenes; solo el manager puede subir/cambiar/borrar.
-- -----------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from information_schema.schemata where schema_name = 'storage') then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('images', 'images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
    on conflict (id) do update set public = true;

    execute $p$
      create policy "Manager sube imágenes" on storage.objects
        for insert to authenticated
        with check (bucket_id = 'images' and (select public.is_admin()))
    $p$;
    execute $p$
      create policy "Manager actualiza imágenes" on storage.objects
        for update to authenticated
        using (bucket_id = 'images' and (select public.is_admin()))
    $p$;
    execute $p$
      create policy "Manager borra imágenes" on storage.objects
        for delete to authenticated
        using (bucket_id = 'images' and (select public.is_admin()))
    $p$;
  end if;
end;
$$;


-- >>> supabase/seed.sql
-- =============================================================================
-- Datos iniciales (seed) · Clínica Estética Ivan
-- Se puede volver a correr: borra el catálogo/contenido y lo vuelve a crear.
-- ⚠️ NO borra reservas, pero si ya hay reservas, el borrado de tratamientos
--    fallará (protección). Usalo solo en una base nueva.
-- Todo lo de aquí es editable luego desde el panel /admin.
-- =============================================================================

begin;

delete from public.treatment_professionals;
delete from public.availability_rules;
delete from public.availability_blocks;
delete from public.treatments;
delete from public.categories;
delete from public.professionals;
delete from public.testimonials;
delete from public.faqs;

-- -----------------------------------------------------------------------------
-- Configuración del negocio
-- -----------------------------------------------------------------------------
insert into public.settings (
  id, business, content,
  min_advance_minutes, max_advance_days, buffer_minutes,
  slot_interval_minutes, cancellation_hours, max_daily_bookings_per_contact
) values (
  1,
  $json${
    "name": "Clínica Estética Ivan",
    "tagline": "Medicina estética con resultados naturales",
    "description": "Clínica de medicina estética en Santa Cruz de la Sierra dirigida por el Dr. Ivan Melgar. Tratamientos faciales, corporales e inyectables con resultados naturales, seguridad y atención personalizada.",
    "phone": "+59165060795",
    "whatsapp": "59165060795",
    "email": "ivandmg150@gmail.com",
    "address": "Av. San Martín 155, Barrio Equipetrol",
    "city": "Santa Cruz de la Sierra, Bolivia",
    "maps_url": "https://maps.app.goo.gl/zEm4KWFLZx6XcpDo7",
    "maps_embed_url": "https://www.google.com/maps?q=Equipetrol%2C%20Santa%20Cruz%20de%20la%20Sierra%2C%20Bolivia&z=15&output=embed",
    "geo": { "lat": -17.7676, "lng": -63.1966 },
    "social": {
      "instagram": "https://www.instagram.com/ivanmelgarg",
      "tiktok": "https://www.tiktok.com/@ivandanielmelgar",
      "facebook": "https://www.facebook.com/share/1CHAAA9P35/"
    },
    "opening_hours": [
      { "label": "Lunes a viernes", "value": "9:00 – 19:00" },
      { "label": "Sábado", "value": "9:00 – 13:00" },
      { "label": "Domingo", "value": "Cerrado" }
    ]
  }$json$::jsonb,
  $json${
    "hero": {
      "eyebrow": "Medicina estética en Santa Cruz",
      "title": "Realzá tu belleza natural, con respaldo médico",
      "subtitle": "Tratamientos faciales, corporales e inyectables diseñados para vos por el Dr. Ivan Melgar y su equipo. Resultados naturales, protocolos seguros y atención personalizada.",
      "image_url": "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1920&q=80"
    },
    "about": {
      "eyebrow": "Sobre nosotros",
      "title": "Una clínica donde la medicina y la estética van de la mano",
      "body": "En Clínica Estética Ivan creemos que la mejor versión de vos es la más natural. Por eso cada tratamiento empieza con una valoración médica, escuchando lo que buscás y analizando tu piel, tus rasgos y tu historia clínica.\n\nEl Dr. Ivan Melgar, médico estético con más de 10 años de experiencia, lidera un equipo que combina técnicas actualizadas, productos certificados y un trato cercano. Trabajamos con protocolos de bioseguridad estrictos y te acompañamos antes, durante y después de cada sesión.",
      "image_url": "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1200&q=80",
      "highlights": [
        { "value": "+10", "label": "años de experiencia" },
        { "value": "+5.000", "label": "pacientes atendidos" },
        { "value": "100%", "label": "productos certificados" }
      ]
    },
    "treatments": {
      "eyebrow": "Tratamientos",
      "title": "Tratamientos destacados",
      "subtitle": "Una selección de nuestros procedimientos más solicitados. Todos comienzan con una valoración personalizada."
    },
    "team": {
      "eyebrow": "Nuestro equipo",
      "title": "Profesionales que te cuidan",
      "subtitle": "Formación médica y estética al servicio de resultados seguros y naturales."
    },
    "why_us": {
      "eyebrow": "Por qué elegirnos",
      "title": "Tu piel en manos expertas",
      "items": [
        { "icon": "stethoscope", "title": "Dirección médica", "text": "Cada tratamiento es indicado y supervisado por un médico estético con más de 10 años de experiencia." },
        { "icon": "sparkles", "title": "Resultados naturales", "text": "Buscamos armonía: realzar tus rasgos sin cambiar quién sos. Menos es más." },
        { "icon": "shield-check", "title": "Seguridad primero", "text": "Productos con registro sanitario, material descartable y protocolos de bioseguridad en cada sesión." },
        { "icon": "heart-handshake", "title": "Atención personalizada", "text": "Planes a tu medida y seguimiento por WhatsApp después de cada tratamiento." }
      ]
    },
    "how_to_book": {
      "eyebrow": "Cómo reservar",
      "title": "Reservá tu cita en 3 simples pasos",
      "steps": [
        { "title": "Elegí tu tratamiento", "text": "Explorá el catálogo o empezá con una consulta de valoración si no sabés por dónde comenzar." },
        { "title": "Elegí día y horario", "text": "Mirá los horarios libres en tiempo real y elegí el profesional que prefieras." },
        { "title": "Confirmación al instante", "text": "Recibís la confirmación por correo con todos los detalles y un recordatorio el día anterior." }
      ]
    },
    "testimonials": {
      "eyebrow": "Testimonios",
      "title": "Lo que dicen nuestros pacientes"
    },
    "faq": {
      "eyebrow": "Preguntas frecuentes",
      "title": "Resolvemos tus dudas"
    },
    "location": {
      "eyebrow": "Ubicación",
      "title": "Te esperamos en Santa Cruz",
      "subtitle": "Estacionamiento cercano y fácil acceso. Si tenés dudas para llegar, escribinos por WhatsApp."
    },
    "cta": {
      "title": "¿Empezamos con tu primera consulta?",
      "text": "Agendá tu valoración y diseñemos juntos el plan ideal para vos."
    },
    "booking": {
      "cancellation_policy": "Podés cancelar tu cita sin costo desde el link que te enviamos por correo hasta 24 horas antes del horario reservado. Pasado ese plazo, para cambios o cancelaciones escribinos por WhatsApp. Te pedimos llegar 10 minutos antes de tu cita.",
      "confirmation_note": "Te enviamos un correo con todos los detalles. Si no lo ves, revisá la carpeta de spam o promociones."
    },
    "legal": {
      "privacy": "## Responsable\nClínica Estética Ivan, con domicilio en Santa Cruz de la Sierra, Bolivia, es responsable del tratamiento de los datos personales que nos proporcionás.\n\n## Qué datos recopilamos\nAl reservar una cita te pedimos nombre completo, número de celular/WhatsApp, correo electrónico y, opcionalmente, una nota. No solicitamos datos de pago en este sitio.\n\n## Para qué los usamos\n- Gestionar, confirmar, recordarte y, si corresponde, reprogramar o cancelar tu cita.\n- Comunicarnos con vos por correo o WhatsApp en relación con tu atención.\n\nNo usamos tus datos para publicidad de terceros ni los vendemos o compartimos con terceros, salvo los proveedores tecnológicos necesarios para operar el sitio (alojamiento, base de datos y envío de correos), que los tratan solo por nuestra cuenta.\n\n## Conservación y seguridad\nGuardamos tus datos mientras sean necesarios para tu atención y obligaciones legales. Aplicamos medidas técnicas razonables para protegerlos (acceso restringido, conexiones cifradas).\n\n## Tus derechos\nPodés solicitar en cualquier momento el acceso, la corrección o la eliminación de tus datos escribiéndonos a nuestro correo o WhatsApp.\n\n## Cambios\nPodemos actualizar esta política. La versión vigente siempre estará publicada en esta página.",
      "terms": "## Uso del sitio\nEste sitio permite conocer nuestros tratamientos y reservar citas. La información publicada es orientativa y no reemplaza una consulta médica.\n\n## Reservas\n- La reserva queda confirmada cuando recibís la confirmación en pantalla y por correo.\n- Te pedimos datos reales de contacto; podemos cancelar reservas con datos falsos.\n- Los precios son referenciales y pueden variar según la valoración médica.\n\n## Cancelaciones\nPodés cancelar desde el link de tu reserva hasta 24 horas antes. Pasado ese plazo, comunicate por WhatsApp.\n\n## Resultados\nLos resultados de los tratamientos estéticos varían de persona a persona. El profesional te explicará beneficios, riesgos y cuidados antes de cada procedimiento.\n\n## Contacto\nPara cualquier consulta, escribinos por WhatsApp o correo."
    }
  }$json$::jsonb,
  120, 60, 15, 30, 24, 3
)
on conflict (id) do update set
  business = excluded.business,
  content = excluded.content,
  min_advance_minutes = excluded.min_advance_minutes,
  max_advance_days = excluded.max_advance_days,
  buffer_minutes = excluded.buffer_minutes,
  slot_interval_minutes = excluded.slot_interval_minutes,
  cancellation_hours = excluded.cancellation_hours,
  max_daily_bookings_per_contact = excluded.max_daily_bookings_per_contact;

-- -----------------------------------------------------------------------------
-- Profesionales
-- -----------------------------------------------------------------------------
insert into public.professionals (name, slug, title, bio, photo_url, color, sort_order) values
(
  'Dr. Ivan Melgar',
  'ivan-melgar',
  'Médico Estético · Director',
  'Médico cirujano con especialización en medicina estética y más de 10 años de experiencia. Se dedica a tratamientos faciales e inyectables —toxina botulínica, ácido hialurónico, bioestimuladores y PRP— con un enfoque en resultados naturales, armonía facial y seguridad del paciente. Se capacita de forma continua en congresos nacionales e internacionales.',
  'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=800&q=80',
  '#1D4E87',
  1
),
(
  'Lic. Carolina Santistevan',
  'carolina-santistevan',
  'Cosmetóloga · Esteticista',
  'Licenciada en cosmetología y estética integral. Especialista en tratamientos faciales y corporales no invasivos: limpiezas profundas, peelings, hidrafacial, microneedling, depilación láser, radiofrecuencia y drenaje linfático. Destaca por su trato cálido y por diseñar rutinas de cuidado en casa para potenciar cada resultado.',
  'https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&w=800&q=80',
  '#3BA3A8',
  2
);

-- Horario semanal inicial (igual para ambos): L–V 9:00–19:00, sábado 9:00–13:00
insert into public.availability_rules (professional_id, weekday, start_time, end_time)
select p.id, d.weekday, d.start_time, d.end_time
from public.professionals p
cross join (values
  (1, '09:00'::time, '19:00'::time),
  (2, '09:00', '19:00'),
  (3, '09:00', '19:00'),
  (4, '09:00', '19:00'),
  (5, '09:00', '19:00'),
  (6, '09:00', '13:00')
) as d(weekday, start_time, end_time);

-- -----------------------------------------------------------------------------
-- Categorías
-- -----------------------------------------------------------------------------
insert into public.categories (name, slug, description, sort_order) values
  ('Consulta', 'consulta', 'Evaluación médica personalizada para diseñar tu plan de tratamiento.', 1),
  ('Facial', 'facial', 'Tratamientos para rejuvenecer, hidratar y equilibrar la piel del rostro.', 2),
  ('Corporal', 'corporal', 'Tratamientos para tonificar, modelar y cuidar la piel del cuerpo.', 3);

-- -----------------------------------------------------------------------------
-- Tratamientos
-- -----------------------------------------------------------------------------
insert into public.treatments (
  category_id, name, slug, short_description, description, benefits,
  recommended_sessions, aftercare, duration_minutes, price, image_url,
  is_featured, sort_order
)
select c.id, t.name, t.slug, t.short_description, t.description, t.benefits,
       t.recommended_sessions, t.aftercare, t.duration_minutes, t.price, t.image_url,
       t.is_featured, t.sort_order
from (values
  -- CONSULTA ------------------------------------------------------------------
  ('consulta', 'Consulta de valoración', 'consulta-de-valoracion',
   'Evaluación médica de tu piel y tus objetivos para diseñar un plan a tu medida.',
   'Es el punto de partida ideal. El Dr. Ivan Melgar analiza tu piel, tus rasgos y tu historia clínica, escucha lo que querés lograr y te propone un plan de tratamiento realista, con opciones, tiempos y presupuesto claros. Si en la misma consulta decidís iniciar un tratamiento, el valor de la consulta se descuenta.',
   array['Diagnóstico profesional de tu tipo de piel', 'Plan personalizado con prioridades y presupuesto', 'Resolución de todas tus dudas antes de decidir'],
   'Una consulta. Se recomienda un control cada 6 a 12 meses.',
   'No requiere cuidados especiales. Traé fotos o la lista de productos que usás si lo deseás.',
   30, 100, 'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?auto=format&fit=crop&w=1200&q=80',
   true, 1),

  -- FACIAL --------------------------------------------------------------------
  ('facial', 'Limpieza facial profunda', 'limpieza-facial-profunda',
   'Remueve impurezas, puntos negros y células muertas para una piel limpia y luminosa.',
   'Protocolo completo de higiene facial: doble limpieza, exfoliación, vapor, extracción manual de comedones, alta frecuencia, mascarilla según tu tipo de piel e hidratación final con protector solar. Ideal para mantener la salud de la piel y prepararla para otros tratamientos.',
   array['Piel más limpia, suave y luminosa', 'Reduce puntos negros y brotes', 'Mejora la absorción de tus productos'],
   'Una sesión mensual para mantenimiento.',
   'Evitá maquillaje por 12 horas, no expongas la piel al sol y usá protector solar FPS 50.',
   60, 180, 'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?auto=format&fit=crop&w=1200&q=80',
   false, 1),

  ('facial', 'Hidrafacial', 'hidrafacial',
   'Limpieza, exfoliación e hidratación profunda en un solo tratamiento, sin tiempo de recuperación.',
   'Tecnología de hidrodermoabrasión que limpia, exfolia, extrae impurezas e infunde sueros con antioxidantes y ácido hialurónico. El resultado es inmediato: piel hidratada, uniforme y con brillo saludable. Apto para todo tipo de piel.',
   array['Resultado visible desde la primera sesión', 'Hidratación profunda y efecto glow', 'Sin dolor ni tiempo de recuperación'],
   'Una sesión cada 3 a 4 semanas; ideal un ciclo de 4 a 6 sesiones.',
   'Usá protector solar, evitá exfoliantes y retinoides por 48 horas.',
   60, 350, 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?auto=format&fit=crop&w=1200&q=80',
   true, 2),

  ('facial', 'Peeling químico', 'peeling-quimico',
   'Renueva la piel y mejora manchas, textura y marcas de acné.',
   'Aplicación controlada de ácidos (glicólico, mandélico, salicílico u otros, según tu piel) que estimulan la renovación celular. Mejora manchas, poros dilatados, textura irregular y marcas de acné. El tipo y la intensidad se definen en la valoración.',
   array['Unifica el tono y aclara manchas', 'Afina la textura y reduce poros', 'Estimula la producción de colágeno'],
   'Ciclo de 4 a 6 sesiones, cada 15 a 21 días.',
   'Puede haber descamación leve por 3 a 5 días. Protector solar estricto, sin exfoliar ni depilar la zona por una semana.',
   45, 300, 'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&w=1200&q=80',
   false, 3),

  ('facial', 'Microneedling (Dermapen)', 'microneedling-dermapen',
   'Microperforaciones controladas que estimulan colágeno y mejoran cicatrices y poros.',
   'Con un dispositivo de microagujas se crean microcanales en la piel que activan la regeneración natural y la producción de colágeno y elastina, a la vez que permiten una mejor penetración de activos. Muy eficaz en cicatrices de acné, poros, líneas finas y textura.',
   array['Mejora cicatrices de acné y poros dilatados', 'Estimula colágeno: piel más firme', 'Potencia la absorción de activos'],
   'Ciclo de 3 a 4 sesiones, una por mes.',
   'Enrojecimiento por 24 a 48 horas. Sin maquillaje por 24 horas, protector solar y evitar sol, piscina y ejercicio intenso por 48 horas.',
   60, 450, 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=1200&q=80',
   false, 4),

  ('facial', 'Mesoterapia facial / Skinbooster', 'mesoterapia-facial-skinbooster',
   'Microinyecciones de vitaminas y ácido hialurónico para una piel hidratada y luminosa.',
   'Aplicación de microinyecciones superficiales con cócteles de vitaminas, aminoácidos, antioxidantes y ácido hialurónico no reticulado. Mejora la hidratación profunda, la luminosidad y la calidad de la piel. Realizado exclusivamente por el médico.',
   array['Hidratación profunda de larga duración', 'Piel más luminosa y elástica', 'Atenúa líneas finas'],
   'Ciclo de 3 sesiones, cada 3 a 4 semanas; mantenimiento cada 4 a 6 meses.',
   'Pueden aparecer pequeñas pápulas o hematomas que desaparecen en pocos días. Evitar maquillaje por 12 horas y sol directo.',
   45, 600, 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?auto=format&fit=crop&w=1200&q=80',
   false, 5),

  ('facial', 'Plasma rico en plaquetas (PRP) facial', 'prp-facial',
   'Regeneración con factores de crecimiento de tu propia sangre.',
   'Se extrae una pequeña cantidad de tu sangre, se procesa para concentrar las plaquetas y se aplica en la piel. Los factores de crecimiento estimulan la regeneración, mejoran la textura, la firmeza y las ojeras. Es un tratamiento 100% autólogo y biocompatible.',
   array['Rejuvenecimiento natural con tu propio plasma', 'Mejora textura, firmeza y luminosidad', 'Bajo riesgo de reacciones'],
   'Ciclo de 3 sesiones, una por mes; mantenimiento cada 6 meses.',
   'No lavar el rostro por 6 horas, evitar maquillaje por 24 horas, sol y ejercicio intenso por 48 horas.',
   60, 700, 'https://images.unsplash.com/photo-1614859324967-bdf461a1ce4d?auto=format&fit=crop&w=1200&q=80',
   false, 6),

  ('facial', 'Toxina botulínica (3 zonas)', 'toxina-botulinica-3-zonas',
   'Suaviza arrugas de frente, entrecejo y patas de gallo con un resultado natural.',
   'Aplicación de toxina botulínica tipo A para relajar los músculos responsables de las arrugas de expresión en frente, entrecejo y patas de gallo. Dosificamos con precisión para conservar tu expresividad: descansada, nunca congelada. Incluye control a los 15 días.',
   array['Suaviza arrugas de expresión', 'Previene la formación de nuevas líneas', 'Resultado natural y sin tiempo de recuperación'],
   'Efecto de 4 a 6 meses. Se recomienda repetir 2 veces al año.',
   'No acostarse por 4 horas, no masajear la zona ni hacer ejercicio por 24 horas. Control a los 15 días incluido.',
   30, 1800, 'https://images.unsplash.com/photo-1607779097040-26e80aa78e66?auto=format&fit=crop&w=1200&q=80',
   true, 7),

  ('facial', 'Ácido hialurónico en labios (1 ml)', 'acido-hialuronico-labios',
   'Hidratación, definición y volumen armónico para tus labios.',
   'Aplicación de ácido hialurónico reticulado de alta calidad para hidratar, definir el contorno y aportar volumen de forma proporcional a tu rostro. Trabajamos con técnica cuidadosa y anestesia tópica para tu comodidad.',
   array['Labios hidratados y definidos', 'Volumen armónico y natural', 'Resultado inmediato y reversible'],
   'Duración de 6 a 12 meses según el metabolismo.',
   'Puede haber inflamación y pequeños hematomas por 2 a 5 días. Aplicar frío, evitar besos intensos, calor y ejercicio por 48 horas.',
   45, 2000, 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=1200&q=80',
   true, 8),

  ('facial', 'Bioestimulador de colágeno', 'bioestimulador-de-colageno',
   'Estimula tu propio colágeno para recuperar firmeza y calidad de piel.',
   'Inyección de sustancias biocompatibles (como hidroxiapatita de calcio o ácido poliláctico) que estimulan de forma progresiva la producción de colágeno. Mejora la flacidez, la firmeza y la calidad de la piel con un resultado gradual y muy natural.',
   array['Mejora la flacidez y la firmeza', 'Resultado progresivo y natural', 'Efecto duradero (hasta 18-24 meses)'],
   '1 a 2 sesiones según el caso, separadas por 2 a 3 meses.',
   'Masajear la zona según indicación médica, evitar sol, calor y ejercicio intenso por 48 horas.',
   45, 2800, 'https://images.unsplash.com/photo-1552693673-1bf958298935?auto=format&fit=crop&w=1200&q=80',
   false, 9),

  -- CORPORAL ------------------------------------------------------------------
  ('corporal', 'Depilación láser axilas', 'depilacion-laser-axilas',
   'Eliminación progresiva del vello con láser de última generación.',
   'Tecnología láser que actúa sobre el folículo piloso para reducir el vello de forma progresiva y duradera. Rápido, seguro y prácticamente indoloro gracias al sistema de enfriamiento.',
   array['Reducción de hasta 90% del vello', 'Adiós a la irritación y los vellos encarnados', 'Sesiones rápidas'],
   'Entre 6 y 8 sesiones, cada 4 a 6 semanas.',
   'Rasurar la zona 24 horas antes. Después, evitar sol, desodorante con alcohol y calor por 48 horas.',
   20, 150, 'https://images.unsplash.com/photo-1519415387722-a1c3bbef716c?auto=format&fit=crop&w=1200&q=80',
   false, 1),

  ('corporal', 'Depilación láser piernas completas', 'depilacion-laser-piernas',
   'Piernas suaves y sin vello con resultados duraderos.',
   'Tratamiento láser para piernas completas que reduce el vello de forma progresiva y duradera. Ajustamos los parámetros a tu tipo de piel y vello para máxima eficacia y seguridad.',
   array['Piel suave por más tiempo', 'Menos vellos encarnados y manchas', 'Ahorro de tiempo en tu rutina'],
   'Entre 6 y 8 sesiones, cada 6 a 8 semanas.',
   'Rasurar la zona 24 horas antes. Evitar sol, cremas irritantes y depilación con cera entre sesiones.',
   60, 600, 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=1200&q=80',
   false, 2),

  ('corporal', 'Radiofrecuencia corporal', 'radiofrecuencia-corporal',
   'Reafirma la piel y mejora la flacidez y la celulitis.',
   'La radiofrecuencia calienta de forma controlada las capas profundas de la piel, contrae las fibras de colágeno y estimula su producción. Mejora la flacidez, la celulitis y el contorno corporal. Sesión cómoda y sin tiempo de recuperación.',
   array['Piel más firme y tonificada', 'Mejora la apariencia de la celulitis', 'Sin dolor ni recuperación'],
   'Ciclo de 8 a 10 sesiones, 1 a 2 por semana.',
   'Hidratate bien, tomá abundante agua y combiná con actividad física para mejores resultados.',
   45, 250, 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
   false, 3),

  ('corporal', 'Drenaje linfático / masaje reductor', 'drenaje-linfatico-masaje-reductor',
   'Reduce la retención de líquidos y modela la figura.',
   'Técnica manual que estimula el sistema linfático para eliminar líquidos retenidos y toxinas, combinada con maniobras reductoras para modelar la figura. Ideal también en posoperatorios (con indicación médica) y para piernas cansadas.',
   array['Disminuye la hinchazón y la retención de líquidos', 'Mejora la circulación', 'Sensación de ligereza y bienestar'],
   'Ciclo de 10 sesiones, 2 a 3 por semana.',
   'Tomá abundante agua, evitá comidas muy saladas y alcohol el día de la sesión.',
   60, 200, 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=1200&q=80',
   true, 4),

  ('corporal', 'Mesoterapia corporal (lipoenzimas)', 'mesoterapia-corporal-lipoenzimas',
   'Microinyecciones que ayudan a reducir grasa localizada.',
   'Aplicación médica de lipoenzimas y activos lipolíticos en zonas de grasa localizada (abdomen, flancos, muslos, papada). Ayuda a reducir medidas y mejorar el contorno, complementando una alimentación saludable y actividad física.',
   array['Reduce grasa localizada', 'Mejora el contorno corporal', 'Procedimiento ambulatorio'],
   'Ciclo de 6 a 8 sesiones, una por semana.',
   'Puede haber sensibilidad y pequeños hematomas. Caminar 30 minutos después de la sesión y mantener buena hidratación.',
   30, 350, 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1200&q=80',
   false, 5)
) as t(category_slug, name, slug, short_description, description, benefits,
       recommended_sessions, aftercare, duration_minutes, price, image_url,
       is_featured, sort_order)
join public.categories c on c.slug = t.category_slug;

-- -----------------------------------------------------------------------------
-- Quién realiza cada tratamiento
-- -----------------------------------------------------------------------------
-- El Dr. Ivan realiza TODOS los tratamientos
insert into public.treatment_professionals (treatment_id, professional_id)
select t.id, p.id
from public.treatments t
cross join public.professionals p
where p.slug = 'ivan-melgar';

-- La Lic. Carolina realiza los no invasivos (sin inyectables)
insert into public.treatment_professionals (treatment_id, professional_id)
select t.id, p.id
from public.treatments t
cross join public.professionals p
where p.slug = 'carolina-santistevan'
  and t.slug in (
    'limpieza-facial-profunda',
    'hidrafacial',
    'peeling-quimico',
    'microneedling-dermapen',
    'depilacion-laser-axilas',
    'depilacion-laser-piernas',
    'radiofrecuencia-corporal',
    'drenaje-linfatico-masaje-reductor'
  );

-- -----------------------------------------------------------------------------
-- Testimonios (ejemplo)
-- -----------------------------------------------------------------------------
insert into public.testimonials (author_name, author_detail, content, rating, sort_order) values
  ('Mariana R.', 'Paciente de toxina botulínica',
   'Tenía miedo de quedar con la cara "congelada" y fue todo lo contrario. El Dr. Ivan me explicó cada paso y el resultado es súper natural: me veo descansada. ¡Ya agendé mi control!', 5, 1),
  ('Daniela S.', 'Paciente de hidrafacial',
   'Carolina es un amor, muy detallista y profesional. Después del hidrafacial mi piel quedó luminosa al instante. El lugar es impecable y te atienden puntual.', 5, 2),
  ('Jorge M.', 'Paciente de depilación láser',
   'Reservé por la web en dos minutos y me llegó la confirmación al correo. Muy buena atención, precios claros y resultados desde las primeras sesiones.', 5, 3);

-- -----------------------------------------------------------------------------
-- Preguntas frecuentes (ejemplo)
-- -----------------------------------------------------------------------------
insert into public.faqs (question, answer, sort_order) values
  ('¿Necesito una consulta antes de realizarme un tratamiento?',
   'Para tratamientos inyectables (toxina botulínica, ácido hialurónico, bioestimuladores, PRP y mesoterapia) siempre hacemos una valoración médica previa, que puede realizarse el mismo día. Para faciales y corporales no invasivos podés reservar directamente; igual evaluamos tu piel antes de empezar.', 1),
  ('¿Los tratamientos duelen?',
   'La mayoría son muy tolerables. En inyectables usamos anestesia tópica y agujas finas; en láser contamos con sistema de enfriamiento. Siempre te explicamos qué vas a sentir y podés pausar cuando quieras.', 2),
  ('¿Cuándo voy a ver los resultados?',
   'Depende del tratamiento: el hidrafacial y el ácido hialurónico muestran resultados inmediatos; la toxina botulínica entre 3 y 15 días; los bioestimuladores y el PRP de forma progresiva durante semanas. En la consulta te damos tiempos realistas.', 3),
  ('¿Cuál es la política de cancelación?',
   'Podés cancelar tu cita sin costo desde el link que te enviamos por correo hasta 24 horas antes del horario reservado. Pasado ese plazo, para cambios o cancelaciones escribinos por WhatsApp. Si no podés asistir, avisanos: así liberamos el horario para otra persona.', 4),
  ('¿Qué formas de pago aceptan?',
   'Aceptamos efectivo, transferencia bancaria y pago por QR. El pago se realiza en la clínica el día de tu cita. Los precios publicados son referenciales y pueden ajustarse según la valoración.', 5);

commit;
