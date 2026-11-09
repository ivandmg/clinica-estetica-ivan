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
