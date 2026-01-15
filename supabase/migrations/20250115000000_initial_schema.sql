-- Create Enums
create type public.user_role as enum ('user', 'clerk', 'manager', 'admin');
create type public.id_type as enum ('driver_license', 'passport', 'state_id', 'matricula_consular', 'other');
create type public.intake_status as enum ('draft', 'completed', 'canceled');
create type public.item_status as enum ('intake_started', 'intake_completed', 'on_hold', 'cleared_for_resale', 'published', 'sold', 'flagged');

-- Create Tables

-- PROFILES
create table public.profiles (
  id uuid not null references auth.users(id) on delete cascade primary key,
  role public.user_role not null default 'clerk',
  full_name text,
  store_location_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

-- CUSTOMERS
create table public.customers (
  id uuid not null default gen_random_uuid() primary key,
  first_name text not null,
  last_name text not null,
  phone text,
  email text,
  id_type public.id_type not null,
  id_number text not null, -- In a real app, consider encryption or tokenization
  banned boolean not null default false,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.customers enable row level security;

-- INTAKES
create table public.intakes (
  id uuid not null default gen_random_uuid() primary key,
  customer_id uuid not null references public.customers(id),
  processor_id uuid not null references public.profiles(id),
  status public.intake_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.intakes enable row level security;

-- ITEMS
create table public.items (
  id uuid not null default gen_random_uuid() primary key,
  intake_id uuid not null references public.intakes(id),
  category text,
  brand text,
  model text,
  serial_number text,
  description text,
  condition text,
  purchase_price numeric(10, 2),
  status public.item_status not null default 'intake_started',
  hold_expires_at timestamptz,
  shopify_product_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.items enable row level security;

-- ITEM IMAGES
create table public.item_images (
  id uuid not null default gen_random_uuid() primary key,
  item_id uuid not null references public.items(id) on delete cascade,
  storage_path text not null,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.item_images enable row level security;

-- AUDIT LOGS
create table public.audit_logs (
  id uuid not null default gen_random_uuid() primary key,
  table_name text not null,
  record_id uuid not null,
  action text not null,
  changed_by uuid references public.profiles(id),
  payload jsonb,
  created_at timestamptz not null default now()
);
alter table public.audit_logs enable row level security;

-- RLS POLICIES

-- Profiles
create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using ( true );

create policy "Users can update own profile"
  on public.profiles for update
  using ( auth.uid() = id );

-- Customers
-- All authenticated staff can read customers (to search)
create policy "Authenticated staff can read customers"
  on public.customers for select
  to authenticated
  using ( true );

-- Clerks can create customers
create policy "Clerks can create customers"
  on public.customers for insert
  to authenticated
  with check ( true ); 

-- Only managers can update customers (e.g. fix typos, ban)
create policy "Managers can update customers"
  on public.customers for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('manager', 'admin')
    )
  );

-- Intakes
create policy "Staff can read intakes"
  on public.intakes for select
  to authenticated
  using ( true );

create policy "Staff can create intakes"
  on public.intakes for insert
  to authenticated
  with check ( true );

create policy "Staff can update own intakes if draft"
  on public.intakes for update
  to authenticated
  using (
    processor_id = auth.uid() 
    and status = 'draft'
  )
  with check (
    processor_id = auth.uid()
  );

-- Items
create policy "Staff can read items"
  on public.items for select
  to authenticated
  using ( true );

create policy "Staff can create items for draft intakes"
  on public.items for insert
  to authenticated
  with check (
    exists (
      select 1 from public.intakes
      where intakes.id = items.intake_id
      and intakes.status = 'draft'
    )
  );

create policy "Staff can update items in intake"
  on public.items for update
  to authenticated
  using (
    exists (
      select 1 from public.intakes
      where intakes.id = items.intake_id
      and intakes.status = 'draft'
    )
  );

create policy "Staff can delete items in draft intake"
  on public.items for delete
  to authenticated
  using (
    exists (
      select 1 from public.intakes
      where intakes.id = items.intake_id
      and intakes.status = 'draft'
    )
  );

-- Admin/Manager override for items (e.g. to release hold manually)
create policy "Managers can update items anytime"
  on public.items for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('manager', 'admin')
    )
  );

-- Images
create policy "Staff can view images"
  on public.item_images for select
  to authenticated
  using ( true );

create policy "Staff can insert images"
  on public.item_images for insert
  to authenticated
  with check ( true );

-- Audit Logs
create policy "Staff can view audit logs"
  on public.audit_logs for select
  to authenticated
  using ( true );
-- No update/delete for audit logs

-- FUNCTIONS & TRIGGERS

-- Handle New User -> Profile
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', 'user'); -- Default to user
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Updated At Stamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_profiles_updated_at before update on public.profiles for each row execute procedure public.handle_updated_at();
create trigger set_customers_updated_at before update on public.customers for each row execute procedure public.handle_updated_at();
create trigger set_intakes_updated_at before update on public.intakes for each row execute procedure public.handle_updated_at();
create trigger set_items_updated_at before update on public.items for each row execute procedure public.handle_updated_at();
