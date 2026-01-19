-- Allow clerks to update customers (needed for adding address/compliance info)
DROP POLICY IF EXISTS "Managers can update customers" ON public.customers;

CREATE POLICY "Staff can update customers"
  ON public.customers FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('clerk', 'manager', 'admin')
    )
  );
