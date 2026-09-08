/*
# Service Order Management System - Database Schema (complete)

1. New Tables
- `clients` — Customers who request service work
- `technicians` — Field workers who execute service orders
- `service_orders` — Core work order records
- `checklist_items` — Digital checklist steps per service order
- `order_photos` — Photos taken during field service
- `order_signatures` — Customer signature captured on screen
- `order_status_history` — Audit trail of status changes

2. Security: RLS on all tables, single-tenant anon+authenticated access.
3. Indexes on FK and filter columns.
4. Auto-generated order code via trigger (OS-YYYY-NNNN).
*/

CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  document text,
  address text,
  city text,
  state text,
  zip_code text,
  notes text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_clients" ON clients;
CREATE POLICY "anon_select_clients" ON clients FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_clients" ON clients;
CREATE POLICY "anon_insert_clients" ON clients FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_clients" ON clients;
CREATE POLICY "anon_update_clients" ON clients FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_clients" ON clients;
CREATE POLICY "anon_delete_clients" ON clients FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS technicians (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  specialty text,
  status text NOT NULL DEFAULT 'active',
  avatar_url text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE technicians ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_technicians" ON technicians;
CREATE POLICY "anon_select_technicians" ON technicians FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_technicians" ON technicians;
CREATE POLICY "anon_insert_technicians" ON technicians FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_technicians" ON technicians;
CREATE POLICY "anon_update_technicians" ON technicians FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_technicians" ON technicians;
CREATE POLICY "anon_delete_technicians" ON technicians FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS service_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  technician_id uuid REFERENCES technicians(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'pending',
  priority text NOT NULL DEFAULT 'medium',
  scheduled_date timestamptz,
  completed_at timestamptz,
  address text,
  city text,
  state text,
  zip_code text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE service_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_orders" ON service_orders;
CREATE POLICY "anon_select_orders" ON service_orders FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_orders" ON service_orders;
CREATE POLICY "anon_insert_orders" ON service_orders FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_orders" ON service_orders;
CREATE POLICY "anon_update_orders" ON service_orders FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_orders" ON service_orders;
CREATE POLICY "anon_delete_orders" ON service_orders FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_orders_client ON service_orders(client_id);
CREATE INDEX IF NOT EXISTS idx_orders_tech ON service_orders(technician_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON service_orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_scheduled ON service_orders(scheduled_date);

CREATE TABLE IF NOT EXISTS checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
  description text NOT NULL,
  checked boolean NOT NULL DEFAULT false,
  completed_at timestamptz
);
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_checklist" ON checklist_items;
CREATE POLICY "anon_select_checklist" ON checklist_items FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_checklist" ON checklist_items;
CREATE POLICY "anon_insert_checklist" ON checklist_items FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_checklist" ON checklist_items;
CREATE POLICY "anon_update_checklist" ON checklist_items FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_checklist" ON checklist_items;
CREATE POLICY "anon_delete_checklist" ON checklist_items FOR DELETE TO anon, authenticated USING (true);
CREATE INDEX IF NOT EXISTS idx_checklist_order ON checklist_items(order_id);

CREATE TABLE IF NOT EXISTS order_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
  url text NOT NULL,
  caption text,
  taken_at timestamptz DEFAULT now()
);
ALTER TABLE order_photos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_photos" ON order_photos;
CREATE POLICY "anon_select_photos" ON order_photos FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_photos" ON order_photos;
CREATE POLICY "anon_insert_photos" ON order_photos FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_photos" ON order_photos;
CREATE POLICY "anon_update_photos" ON order_photos FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_photos" ON order_photos;
CREATE POLICY "anon_delete_photos" ON order_photos FOR DELETE TO anon, authenticated USING (true);
CREATE INDEX IF NOT EXISTS idx_photos_order ON order_photos(order_id);

CREATE TABLE IF NOT EXISTS order_signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
  signature_data text NOT NULL,
  signed_at timestamptz DEFAULT now(),
  signed_by_name text
);
ALTER TABLE order_signatures ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_signatures" ON order_signatures;
CREATE POLICY "anon_select_signatures" ON order_signatures FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_signatures" ON order_signatures;
CREATE POLICY "anon_insert_signatures" ON order_signatures FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_signatures" ON order_signatures;
CREATE POLICY "anon_update_signatures" ON order_signatures FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_signatures" ON order_signatures;
CREATE POLICY "anon_delete_signatures" ON order_signatures FOR DELETE TO anon, authenticated USING (true);
CREATE INDEX IF NOT EXISTS idx_signatures_order ON order_signatures(order_id);

CREATE TABLE IF NOT EXISTS order_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
  previous_status text,
  new_status text NOT NULL,
  changed_at timestamptz DEFAULT now(),
  changed_by text,
  note text
);
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_history" ON order_status_history;
CREATE POLICY "anon_select_history" ON order_status_history FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_history" ON order_status_history;
CREATE POLICY "anon_insert_history" ON order_status_history FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_history" ON order_status_history;
CREATE POLICY "anon_update_history" ON order_status_history FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_history" ON order_status_history;
CREATE POLICY "anon_delete_history" ON order_status_history FOR DELETE TO anon, authenticated USING (true);
CREATE INDEX IF NOT EXISTS idx_history_order ON order_status_history(order_id);

-- Auto-generate order code (extracts numeric suffix from existing codes)
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

DROP TRIGGER IF EXISTS trg_generate_order_code ON service_orders;
CREATE TRIGGER trg_generate_order_code
  BEFORE INSERT ON service_orders
  FOR EACH ROW
  WHEN (NEW.code IS NULL)
  EXECUTE FUNCTION generate_order_code();

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_updated_at ON service_orders;
CREATE TRIGGER trg_update_updated_at
  BEFORE UPDATE ON service_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Seed technicians
INSERT INTO technicians (name, email, phone, specialty, status)
SELECT * FROM (VALUES
  ('Carlos Mendes', 'carlos@techsrv.com', '(11) 98765-4321', 'Refrigeração', 'active'),
  ('Ana Ribeiro', 'ana@techsrv.com', '(11) 99876-5432', 'Elétrica', 'active'),
  ('Roberto Lima', 'roberto@techsrv.com', '(11) 98123-4567', 'Hidráulica', 'active'),
  ('Patrícia Santos', 'patricia@techsrv.com', '(11) 99000-1122', 'Eletrodomésticos', 'active')
) AS t(name, email, phone, specialty, status)
WHERE NOT EXISTS (SELECT 1 FROM technicians LIMIT 1);

-- Seed clients
INSERT INTO clients (name, email, phone, document, address, city, state, zip_code)
SELECT * FROM (VALUES
  ('Supermercado Bom Preço', 'contato@bompreco.com', '(11) 3333-4444', '12.345.678/0001-90', 'Av. Paulista, 1500', 'São Paulo', 'SP', '01310-100'),
  ('Restaurante Sabor & Arte', 'admin@saborearte.com', '(11) 3334-5555', '23.456.789/0001-01', 'R. das Oliveiras, 230', 'São Paulo', 'SP', '01222-050'),
  ('Clínica Vida Saúvel', 'ti@vidasauvel.com', '(11) 3335-6666', '34.567.890/0001-12', 'R. dos Lírios, 45', 'São Paulo', 'SP', '02030-080'),
  ('Maria Fernandes', 'maria.f@gmail.com', '(11) 98888-7777', '123.456.789-00', 'R. das Acácias, 12', 'Guarulhos', 'SP', '07010-100'),
  ('Hotel Central Plaza', 'manutencao@centralplaza.com', '(11) 3336-7777', '45.678.901/0001-23', 'Av. Industrial, 800', 'Osasco', 'SP', '06080-100')
) AS c(name, email, phone, document, address, city, state, zip_code)
WHERE NOT EXISTS (SELECT 1 FROM clients LIMIT 1);

-- Seed service orders + child data
DO $$
DECLARE
  c1 uuid; c2 uuid; c3 uuid; c4 uuid; c5 uuid;
  t1 uuid; t2 uuid; t3 uuid; t4 uuid;
BEGIN
  SELECT id INTO c1 FROM clients WHERE name = 'Supermercado Bom Preço' LIMIT 1;
  SELECT id INTO c2 FROM clients WHERE name = 'Restaurante Sabor & Arte' LIMIT 1;
  SELECT id INTO c3 FROM clients WHERE name = 'Clínica Vida Saúvel' LIMIT 1;
  SELECT id INTO c4 FROM clients WHERE name = 'Maria Fernandes' LIMIT 1;
  SELECT id INTO c5 FROM clients WHERE name = 'Hotel Central Plaza' LIMIT 1;
  SELECT id INTO t1 FROM technicians WHERE name = 'Carlos Mendes' LIMIT 1;
  SELECT id INTO t2 FROM technicians WHERE name = 'Ana Ribeiro' LIMIT 1;
  SELECT id INTO t3 FROM technicians WHERE name = 'Roberto Lima' LIMIT 1;
  SELECT id INTO t4 FROM technicians WHERE name = 'Patrícia Santos' LIMIT 1;

  IF NOT EXISTS (SELECT 1 FROM service_orders LIMIT 1) THEN
    INSERT INTO service_orders (client_id, technician_id, title, description, status, priority, scheduled_date, address, city, state, zip_code)
    VALUES
      (c1, t1, 'Manutenção de câmaras frias', 'Verificação e reparo das câmaras frias do setor de congelados. Temperatura acima do normal.', 'in_progress', 'high', '2026-08-25 09:00:00+00', 'Av. Paulista, 1500', 'São Paulo', 'SP', '01310-100'),
      (c2, t2, 'Instalação de iluminação LED', 'Troca de lâmpadas fluorescentes por LED na área de eventos.', 'assigned', 'medium', '2026-08-25 14:00:00+00', 'R. das Oliveiras, 230', 'São Paulo', 'SP', '01222-050'),
      (c3, t3, 'Reparo de vazamento na cozinha', 'Vazamento identificado na tubulação da pia da cozinha industrial.', 'pending', 'urgent', '2026-08-26 08:00:00+00', 'R. dos Lírios, 45', 'São Paulo', 'SP', '02030-080'),
      (c4, t4, 'Conserto de máquina de lavar', 'Máquina não está centrifugando. Cliente relatou barulho estranho.', 'pending', 'medium', '2026-08-26 10:30:00+00', 'R. das Acácias, 12', 'Guarulhos', 'SP', '07010-100'),
      (c5, t1, 'Manutenção preventiva HVAC', 'Manutenção preventiva trimestral do sistema de ar condicionado.', 'completed', 'low', '2026-08-23 09:00:00+00', 'Av. Industrial, 800', 'Osasco', 'SP', '06080-100'),
      (c1, t2, 'Instalação de tomadas industriais', 'Instalação de 10 tomadas industriais no novo setor de estoque.', 'completed', 'medium', '2026-08-22 13:00:00+00', 'Av. Paulista, 1500', 'São Paulo', 'SP', '01310-100'),
      (c2, t3, 'Reparo de encanamento banheiro', 'Troca de registro e reparo de descarga nos banheiros do salão.', 'assigned', 'medium', '2026-08-26 15:00:00+00', 'R. das Oliveiras, 230', 'São Paulo', 'SP', '01222-050');

    INSERT INTO checklist_items (order_id, description, checked)
    SELECT so.id, ci.description, ci.checked
    FROM service_orders so, (VALUES
      ('Verificar temperatura das câmaras frias', false),
      ('Inspecionar compressor', false),
      ('Verificar nível de gás refrigerante', false),
      ('Limpar condensadores', false),
      ('Testar termostato', false),
      ('Conferir vedação das portas', false)
    ) AS ci(description, checked)
    WHERE so.title = 'Manutenção de câmaras frias';

    INSERT INTO order_photos (order_id, url, caption)
    SELECT so.id, p.url, p.caption
    FROM service_orders so, (VALUES
      ('https://images.pexels.com/photos/2606532/pexels-photo-2606532.jpeg', 'Antes do reparo'),
      ('https://images.pexels.com/photos/3239040/pexels-photo-3239040.jpeg', 'Equipamento após manutenção')
    ) AS p(url, caption)
    WHERE so.title = 'Manutenção preventiva HVAC';

    INSERT INTO order_status_history (order_id, previous_status, new_status, changed_by, note)
    SELECT so.id, 'assigned', 'in_progress', 'Carlos Mendes', 'Técnico iniciou o atendimento no local'
    FROM service_orders so WHERE so.title = 'Manutenção de câmaras frias';

    INSERT INTO order_status_history (order_id, previous_status, new_status, changed_by, note)
    SELECT so.id, 'in_progress', 'completed', 'Carlos Mendes', 'Serviço concluído com sucesso'
    FROM service_orders so WHERE so.title = 'Manutenção preventiva HVAC';
  END IF;
END $$;
