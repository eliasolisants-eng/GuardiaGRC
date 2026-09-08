/*
# Fix order code generation function

The previous trigger tried to MAX a non-existent `num` column.
This version extracts the numeric suffix from the code string with a regex
and increments it to produce OS-YYYY-NNNN codes.
*/

CREATE OR REPLACE FUNCTION generate_order_code()
RETURNS trigger AS $$
DECLARE
  current_year text := EXTRACT(YEAR FROM now())::text;
  next_num integer;
BEGIN
  SELECT COALESCE(MAX(
    CAST(
      regexp_replace(
        COALESCE(code, ''),
        '^OS-' || current_year || '-([0-9]+)$',
        '\1'
      ) AS integer
    )
  ), 0) + 1
  INTO next_num
  FROM service_orders
  WHERE code ~ ('^OS-' || current_year || '-[0-9]+$');

  NEW.code := 'OS-' || current_year || '-' || LPAD(next_num::text, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
