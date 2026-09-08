/*
# Tighten RLS to authenticated-only

## What changed
All 7 tables currently allow both `anon` and `authenticated` roles to perform CRUD.
Now that the app has a login screen, we remove anon access and keep authenticated-only.
Since this is a company-wide system (all signed-in staff share the same data), 
the policies use `USING (true)` / `WITH CHECK (true)` scoped to `TO authenticated` — 
any logged-in user can access all data, but anonymous visitors get nothing.

## Tables affected
- clients
- technicians
- service_orders
- checklist_items
- order_photos
- order_signatures
- order_status_history

## Security
- Drops all existing `anon, authenticated` policies.
- Recreates 4 policies per table (SELECT/INSERT/UPDATE/DELETE) scoped `TO authenticated`.
- anon role retains no access — RLS will return 0 rows for unauthenticated requests.
*/

-- clients
DROP POLICY IF EXISTS "anon_select_clients" ON clients;
DROP POLICY IF EXISTS "anon_insert_clients" ON clients;
DROP POLICY IF EXISTS "anon_update_clients" ON clients;
DROP POLICY IF EXISTS "anon_delete_clients" ON clients;

CREATE POLICY "auth_select_clients" ON clients FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_clients" ON clients FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_clients" ON clients FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_clients" ON clients FOR DELETE TO authenticated USING (true);

-- technicians
DROP POLICY IF EXISTS "anon_select_technicians" ON technicians;
DROP POLICY IF EXISTS "anon_insert_technicians" ON technicians;
DROP POLICY IF EXISTS "anon_update_technicians" ON technicians;
DROP POLICY IF EXISTS "anon_delete_technicians" ON technicians;

CREATE POLICY "auth_select_technicians" ON technicians FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_technicians" ON technicians FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_technicians" ON technicians FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_technicians" ON technicians FOR DELETE TO authenticated USING (true);

-- service_orders
DROP POLICY IF EXISTS "anon_select_orders" ON service_orders;
DROP POLICY IF EXISTS "anon_insert_orders" ON service_orders;
DROP POLICY IF EXISTS "anon_update_orders" ON service_orders;
DROP POLICY IF EXISTS "anon_delete_orders" ON service_orders;

CREATE POLICY "auth_select_orders" ON service_orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_orders" ON service_orders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_orders" ON service_orders FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_orders" ON service_orders FOR DELETE TO authenticated USING (true);

-- checklist_items
DROP POLICY IF EXISTS "anon_select_checklist" ON checklist_items;
DROP POLICY IF EXISTS "anon_insert_checklist" ON checklist_items;
DROP POLICY IF EXISTS "anon_update_checklist" ON checklist_items;
DROP POLICY IF EXISTS "anon_delete_checklist" ON checklist_items;

CREATE POLICY "auth_select_checklist" ON checklist_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_checklist" ON checklist_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_checklist" ON checklist_items FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_checklist" ON checklist_items FOR DELETE TO authenticated USING (true);

-- order_photos
DROP POLICY IF EXISTS "anon_select_photos" ON order_photos;
DROP POLICY IF EXISTS "anon_insert_photos" ON order_photos;
DROP POLICY IF EXISTS "anon_update_photos" ON order_photos;
DROP POLICY IF EXISTS "anon_delete_photos" ON order_photos;

CREATE POLICY "auth_select_photos" ON order_photos FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_photos" ON order_photos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_photos" ON order_photos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_photos" ON order_photos FOR DELETE TO authenticated USING (true);

-- order_signatures
DROP POLICY IF EXISTS "anon_select_signatures" ON order_signatures;
DROP POLICY IF EXISTS "anon_insert_signatures" ON order_signatures;
DROP POLICY IF EXISTS "anon_update_signatures" ON order_signatures;
DROP POLICY IF EXISTS "anon_delete_signatures" ON order_signatures;

CREATE POLICY "auth_select_signatures" ON order_signatures FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_signatures" ON order_signatures FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_signatures" ON order_signatures FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_signatures" ON order_signatures FOR DELETE TO authenticated USING (true);

-- order_status_history
DROP POLICY IF EXISTS "anon_select_history" ON order_status_history;
DROP POLICY IF EXISTS "anon_insert_history" ON order_status_history;
DROP POLICY IF EXISTS "anon_update_history" ON order_status_history;
DROP POLICY IF EXISTS "anon_delete_history" ON order_status_history;

CREATE POLICY "auth_select_history" ON order_status_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_history" ON order_status_history FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_history" ON order_status_history FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_history" ON order_status_history FOR DELETE TO authenticated USING (true);

-- Revoke anon privileges explicitly (belt-and-suspenders on top of RLS)
REVOKE ALL ON clients FROM anon;
REVOKE ALL ON technicians FROM anon;
REVOKE ALL ON service_orders FROM anon;
REVOKE ALL ON checklist_items FROM anon;
REVOKE ALL ON order_photos FROM anon;
REVOKE ALL ON order_signatures FROM anon;
REVOKE ALL ON order_status_history FROM anon;
