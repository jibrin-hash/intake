-- Add compliance fields to customers table for LeadsOnline integration
ALTER TABLE customers
ADD COLUMN address_line_1 text,
ADD COLUMN city text,
ADD COLUMN state text,
ADD COLUMN postal_code text,
ADD COLUMN dob date,
ADD COLUMN gender text,
ADD COLUMN height integer, -- stored in inches
ADD COLUMN weight integer, -- stored in lbs
ADD COLUMN eye_color text,
ADD COLUMN hair_color text,
ADD COLUMN race text;

-- Add comment to clarify units
COMMENT ON COLUMN customers.height IS 'Height in inches';
COMMENT ON COLUMN customers.weight IS 'Weight in lbs';
