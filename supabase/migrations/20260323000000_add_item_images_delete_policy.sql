-- Add missing DELETE policy for item_images
create policy "Staff can delete images in draft intake"
  on public.item_images for delete
  to authenticated
  using (
    exists (
      select 1 from public.items
      join public.intakes on intakes.id = items.intake_id
      where items.id = item_images.item_id
      and intakes.status = 'draft'
    )
  );
