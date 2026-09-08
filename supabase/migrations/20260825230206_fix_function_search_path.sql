/*
# Fix mutable search_path on trigger functions

Sets an explicit search_path on both PL/pgSQL trigger functions to resolve
the security advisor warning about mutable search_path.
*/

CREATE OR REPLACE FUNCTION public.generate_order_code()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
