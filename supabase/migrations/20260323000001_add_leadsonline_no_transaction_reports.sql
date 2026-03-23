-- Table to track reported "No Transaction" days to LeadsOnline
create table public.leadsonline_no_transaction_reports (
  id uuid not null default gen_random_uuid() primary key,
  report_date date not null unique,
  reported_at timestamptz not null default now(),
  status text not null default 'success',
  raw_response text
);

-- RLS
alter table public.leadsonline_no_transaction_reports enable row level security;

create policy "Staff can read reports"
  on public.leadsonline_no_transaction_reports for select
  to authenticated
  using ( true );

create policy "Staff can create reports"
  on public.leadsonline_no_transaction_reports for insert
  to authenticated
  with check ( true );
