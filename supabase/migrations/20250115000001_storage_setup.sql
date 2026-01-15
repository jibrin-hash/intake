-- Create Storage Bucket for Intake Photos
insert into storage.buckets (id, name, public)
values ('intake-photos', 'intake-photos', true)
on conflict (id) do nothing;

-- Storage Policies
create policy "Staff can view intake photos"
  on storage.objects for select
  to authenticated
  using ( bucket_id = 'intake-photos' );

create policy "Staff can upload intake photos"
  on storage.objects for insert
  to authenticated
  with check ( bucket_id = 'intake-photos' );

create policy "Staff can delete intake photos"
  on storage.objects for delete
  to authenticated
  using ( bucket_id = 'intake-photos' );
