/*
# GRC Dashboard — LGPD Compliance & IT Asset Security Monitoring

This migration creates the complete database schema for a Governance, Risk, and
Compliance (GRC) dashboard focused on LGPD compliance and IT asset security.

## New Tables

1. **grc_assets** — IT assets (servers, databases, APIs, endpoints)
   - id, name, type, criticality, owner, last_audit_date, status, created_at, updated_at

2. **grc_lgpd_items** — LGPD compliance checklist items
   - id, title, description, category, status, updated_at, created_at

3. **grc_credentials** — Access credentials, SSL certs, security policies with expiration tracking
   - id, name, type, holder, issue_date, expiry_date, status, created_at

4. **grc_audit_logs** — Security incidents and non-compliance events / action items
   - id, title, description, severity, status, assigned_to, incident_date, resolved_at, created_at

5. **grc_risk_history** — Daily snapshots of the compliance risk score for trend charting
   - id, score, calculated_at

## Security (RLS)
- All tables use RLS with `TO anon, authenticated` policies (single-tenant, no auth screen).
- Full CRUD access for both anon and authenticated roles since data is intentionally shared.

## Seed Data
- 5 IT assets with varying criticality and compliance status
- 6 LGPD checklist items with mixed statuses
- 4 credentials (1 expired, 1 expiring within 30 days)
- 4 audit log entries with various severities and statuses
- 14 days of risk score history for the trend chart
*/

-- ============================================================
-- 1. grc_assets
-- ============================================================
CREATE TABLE IF NOT EXISTS grc_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL DEFAULT 'Server',
  criticality text NOT NULL DEFAULT 'Medium',
  owner text,
  last_audit_date date,
  status text NOT NULL DEFAULT 'Compliant',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE grc_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_assets" ON grc_assets;
CREATE POLICY "anon_select_assets" ON grc_assets FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_assets" ON grc_assets;
CREATE POLICY "anon_insert_assets" ON grc_assets FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_assets" ON grc_assets;
CREATE POLICY "anon_update_assets" ON grc_assets FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_assets" ON grc_assets;
CREATE POLICY "anon_delete_assets" ON grc_assets FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- 2. grc_lgpd_items
-- ============================================================
CREATE TABLE IF NOT EXISTS grc_lgpd_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'General',
  status text NOT NULL DEFAULT 'Non-Compliant',
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE grc_lgpd_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_lgpd" ON grc_lgpd_items;
CREATE POLICY "anon_select_lgpd" ON grc_lgpd_items FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_lgpd" ON grc_lgpd_items;
CREATE POLICY "anon_insert_lgpd" ON grc_lgpd_items FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_lgpd" ON grc_lgpd_items;
CREATE POLICY "anon_update_lgpd" ON grc_lgpd_items FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_lgpd" ON grc_lgpd_items;
CREATE POLICY "anon_delete_lgpd" ON grc_lgpd_items FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- 3. grc_credentials
-- ============================================================
CREATE TABLE IF NOT EXISTS grc_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL DEFAULT 'Employee Access',
  holder text,
  issue_date date,
  expiry_date date,
  status text NOT NULL DEFAULT 'Active',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE grc_credentials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_credentials" ON grc_credentials;
CREATE POLICY "anon_select_credentials" ON grc_credentials FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_credentials" ON grc_credentials;
CREATE POLICY "anon_insert_credentials" ON grc_credentials FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_credentials" ON grc_credentials;
CREATE POLICY "anon_update_credentials" ON grc_credentials FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_credentials" ON grc_credentials;
CREATE POLICY "anon_delete_credentials" ON grc_credentials FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- 4. grc_audit_logs
-- ============================================================
CREATE TABLE IF NOT EXISTS grc_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  severity text NOT NULL DEFAULT 'Medium',
  status text NOT NULL DEFAULT 'Open',
  assigned_to text,
  incident_date date,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE grc_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_audits" ON grc_audit_logs;
CREATE POLICY "anon_select_audits" ON grc_audit_logs FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_audits" ON grc_audit_logs;
CREATE POLICY "anon_insert_audits" ON grc_audit_logs FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_audits" ON grc_audit_logs;
CREATE POLICY "anon_update_audits" ON grc_audit_logs FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_audits" ON grc_audit_logs;
CREATE POLICY "anon_delete_audits" ON grc_audit_logs FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- 5. grc_risk_history
-- ============================================================
CREATE TABLE IF NOT EXISTS grc_risk_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  score integer NOT NULL DEFAULT 100,
  calculated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE grc_risk_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_risk_history" ON grc_risk_history;
CREATE POLICY "anon_select_risk_history" ON grc_risk_history FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_risk_history" ON grc_risk_history;
CREATE POLICY "anon_insert_risk_history" ON grc_risk_history FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_risk_history" ON grc_risk_history;
CREATE POLICY "anon_delete_risk_history" ON grc_risk_history FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- SEED DATA — IT Assets
-- ============================================================
INSERT INTO grc_assets (name, type, criticality, owner, last_audit_date, status) VALUES
  ('Main Database Postgres', 'Database', 'High', 'Carlos Mendes', '2026-07-15', 'Compliant'),
  ('Auth API Gateway', 'API', 'High', 'Ana Ribeiro', '2026-06-20', 'At Risk'),
  ('File Storage Server', 'Server', 'Medium', 'Bruno Costa', '2026-05-10', 'Non-Compliant'),
  ('Employee Endpoint Cluster', 'Endpoint', 'Low', 'IT Dept', '2026-08-01', 'Compliant'),
  ('Payment Processing API', 'API', 'High', 'Diana Souza', '2026-04-05', 'At Risk')
ON CONFLICT DO NOTHING;

-- ============================================================
-- SEED DATA — LGPD Checklist
-- ============================================================
INSERT INTO grc_lgpd_items (title, description, category, status) VALUES
  ('Data Mapping / ROPA', 'Maintain a Record of Processing Activities (ROPA) documenting all data flows.', 'Data Governance', 'Compliant'),
  ('Consent Management', 'Implement mechanisms for collecting, recording, and withdrawing user consent.', 'User Rights', 'In Progress'),
  ('DPO Appointment', 'Appoint a Data Protection Officer (DPO) and publish contact information.', 'Governance', 'Compliant'),
  ('Incident Response Plan', 'Establish and test a data breach incident response plan with notification procedures.', 'Security', 'Non-Compliant'),
  ('Data Encryption at Rest', 'Encrypt all sensitive personal data at rest using industry-standard algorithms.', 'Security', 'In Progress'),
  ('Data Retention Policy', 'Define and enforce data retention and deletion schedules for personal data.', 'Data Governance', 'Non-Compliant')
ON CONFLICT DO NOTHING;

-- ============================================================
-- SEED DATA — Credentials
-- ============================================================
INSERT INTO grc_credentials (name, type, holder, issue_date, expiry_date, status) VALUES
  ('Admin SSL Certificate', 'SSL Certificate', 'IT Security', '2025-09-01', '2026-09-28', 'Active'),
  ('Carlos M. — DB Admin Access', 'Employee Access', 'Carlos Mendes', '2025-01-15', '2026-08-15', 'Active'),
  ('Security Policy v3.2', 'Security Policy', 'Compliance Team', '2025-03-01', '2026-12-01', 'Active'),
  ('API Gateway TLS Cert', 'SSL Certificate', 'DevOps', '2025-06-01', '2026-09-05', 'Active')
ON CONFLICT DO NOTHING;

-- ============================================================
-- SEED DATA — Audit Logs / Action Items
-- ============================================================
INSERT INTO grc_audit_logs (title, description, severity, status, assigned_to, incident_date) VALUES
  ('Unauthorized access attempt on Main Database', 'Multiple failed login attempts detected from external IP on the Postgres main database. Investigation required.', 'High', 'Open', 'Carlos Mendes', '2026-08-20'),
  ('Missing encryption on File Storage Server', 'Audit revealed that the file storage server does not encrypt data at rest, violating LGPD Article 46.', 'High', 'In Review', 'Bruno Costa', '2026-07-05'),
  ('Consent registry incomplete for mobile app users', 'Approximately 30% of mobile app users lack recorded consent timestamps. Data processing may be non-compliant.', 'Medium', 'Open', 'Ana Ribeiro', '2026-08-10'),
  ('Outdated security policy document', 'Security policy v3.0 is outdated; v3.2 was approved but not distributed to all departments.', 'Low', 'Resolved', 'Compliance Team', '2026-06-15')
ON CONFLICT DO NOTHING;

-- ============================================================
-- SEED DATA — Risk Score History (last 14 days)
-- ============================================================
INSERT INTO grc_risk_history (score, calculated_at)
SELECT
  CASE
    WHEN d < 5 THEN 85
    WHEN d < 8 THEN 78
    WHEN d < 11 THEN 72
    ELSE 68
  END,
  now() - (d || ' days')::interval
FROM generate_series(0, 13) AS d
ON CONFLICT DO NOTHING;
