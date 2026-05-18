-- ============================================================
-- BGS ADMISSION CONNECT - DATABASE SCHEMA
-- BGS PU College, Hanumanthpura, Shidlaghatta, Karnataka 562105
-- ============================================================
-- HOW TO RUN:
--   Supabase → SQL Editor → New Query → paste this → Run
--   Safe to run multiple times (drops & recreates everything cleanly)
-- ============================================================

-- EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- DROP EXISTING (for clean re-runs)
-- ============================================================
DROP TRIGGER IF EXISTS trigger_app_id       ON applications;
DROP TRIGGER IF EXISTS trigger_updated_at   ON applications;
DROP TRIGGER IF EXISTS set_app_id           ON applications;
DROP TRIGGER IF EXISTS applications_updated_at ON applications;

DROP FUNCTION IF EXISTS generate_app_id()   CASCADE;
DROP FUNCTION IF EXISTS update_updated_at() CASCADE;
DROP FUNCTION IF EXISTS export_and_clear_old_data(DATE) CASCADE;

DROP TABLE IF EXISTS sms_logs    CASCADE;
DROP TABLE IF EXISTS status_logs CASCADE;
DROP TABLE IF EXISTS applications CASCADE;
DROP TABLE IF EXISTS staff       CASCADE;

DROP SEQUENCE IF EXISTS app_id_seq;

-- ============================================================
-- SEQUENCE: BGS-2026-0001, 0002, ...
-- ============================================================
CREATE SEQUENCE app_id_seq START 1;

-- ============================================================
-- STAFF
-- ============================================================
CREATE TABLE staff (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username    TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  pin_hash    TEXT NOT NULL,
  role        TEXT NOT NULL CHECK (role IN ('teacher', 'office', 'admin')),
  phone       TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login  TIMESTAMPTZ
);

-- ============================================================
-- APPLICATIONS
-- ============================================================
CREATE TABLE applications (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  app_id              TEXT UNIQUE,
  student_name        TEXT NOT NULL,
  parent_name         TEXT NOT NULL,
  phone               TEXT NOT NULL,
  alt_phone           TEXT,
  village             TEXT NOT NULL,
  current_school      TEXT NOT NULL,
  course              TEXT NOT NULL,
  marks_percent       DECIMAL(5,2),
  message             TEXT,
  status              TEXT NOT NULL DEFAULT 'new'
                        CHECK (status IN ('new','contacted','meeting_fixed','confirmed','archived')),
  meeting_date        DATE,
  meeting_time        TIME,
  assigned_teacher_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  notes               TEXT NOT NULL DEFAULT '',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- STATUS LOGS
-- ============================================================
CREATE TABLE status_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id  UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  from_status     TEXT,
  to_status       TEXT NOT NULL,
  changed_by      UUID REFERENCES staff(id) ON DELETE SET NULL,
  changed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  note            TEXT
);

-- ============================================================
-- SMS / WHATSAPP LOGS
-- ============================================================
CREATE TABLE sms_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id  UUID REFERENCES applications(id) ON DELETE CASCADE,
  phone           TEXT NOT NULL,
  message         TEXT NOT NULL,
  channel         TEXT NOT NULL CHECK (channel IN ('whatsapp', 'sms')),
  sent_by         UUID REFERENCES staff(id) ON DELETE SET NULL,
  sent_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status          TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent','failed','pending'))
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_app_phone   ON applications(phone);
CREATE INDEX idx_app_app_id  ON applications(app_id);
CREATE INDEX idx_app_status  ON applications(status);
CREATE INDEX idx_app_village ON applications(village);
CREATE INDEX idx_app_course  ON applications(course);
CREATE INDEX idx_app_teacher ON applications(assigned_teacher_id);
CREATE INDEX idx_app_created ON applications(created_at);

-- ============================================================
-- TRIGGER: Auto-generate BGS-2026-XXXX app_id
-- ============================================================
CREATE OR REPLACE FUNCTION generate_app_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.app_id IS NULL THEN
    NEW.app_id := 'BGS-2026-' || LPAD(nextval('app_id_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_app_id
  BEFORE INSERT ON applications
  FOR EACH ROW EXECUTE FUNCTION generate_app_id();

-- ============================================================
-- TRIGGER: Auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff        ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_logs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_logs     ENABLE ROW LEVEL SECURITY;

-- Applications: public can submit
CREATE POLICY "public_insert_applications"  ON applications FOR INSERT TO anon WITH CHECK (true);
-- Applications: anon key can read and update (staff dashboards)
CREATE POLICY "anon_select_applications"    ON applications FOR SELECT TO anon USING (true);
CREATE POLICY "anon_update_applications"    ON applications FOR UPDATE TO anon USING (true);
-- Staff: anon key can read/insert/update (login + admin management)
CREATE POLICY "anon_select_staff"           ON staff FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_staff"           ON staff FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_staff"           ON staff FOR UPDATE TO anon USING (true);
-- Logs: anon can insert and read
CREATE POLICY "anon_insert_status_logs"     ON status_logs FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_select_status_logs"     ON status_logs FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_sms_logs"        ON sms_logs FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_select_sms_logs"        ON sms_logs FOR SELECT TO anon USING (true);

-- ============================================================
-- REALTIME: Enable live dashboard updates
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE applications;

-- ============================================================
-- SEED: DEFAULT STAFF
-- PINs hashed with SHA-256 + salt "bgs_salt_2026"
-- kumar=1234  radha=5678  office1=9012  admin=0000
-- CHANGE THESE PINS after first login using Admin Dashboard!
-- ============================================================
INSERT INTO staff (username, name, pin_hash, role, phone, is_active) VALUES
  ('kumar',   'Shri. Kumar',    '9dab8299c1c0cc839d1e275ca2e11521d698c7a0a824e6575e68f4049206e152', 'teacher', '9876500001', true),
  ('radha',   'Smt. Radha',     'd9f81aa5c6f10648105238b3311d0c42199b8fe13c4bbeaba880e21d45b1a408', 'teacher', '9876500002', true),
  ('office1', 'Shri. Ananth',   '99c5f12b043b8ecef1a7d49466db64630e033328be16e43b284282e7a408de45', 'office',  '9876500003', true),
  ('admin',   'Principal',      '525f78af8539215f31062f901bbd264d411e96be5b2b99ddb35dfcfcd124bcbf', 'admin',   '9876500000', true);

-- ============================================================
-- SEED: SAMPLE APPLICATIONS (for testing)
-- ============================================================
INSERT INTO applications
  (student_name, parent_name, phone, village, current_school, course, marks_percent, status, assigned_teacher_id, notes)
VALUES
  ('Priya Ramesh',    'Ramesh',  '9876543210', 'Kudur',          'Govt High School, Kudur',   'PCMB',  87.5, 'new',          (SELECT id FROM staff WHERE username='kumar'),  ''),
  ('Lakshmi Narayan', 'Narayan', '9988776655', 'Manchenahalli',  'St. Marys School',           'CEBA',  72.0, 'contacted',    (SELECT id FROM staff WHERE username='radha'),  'Parent works mornings'),
  ('Suresh Gowda',    'Gowda',   '9876512345', 'Dibburahalli',   'Govt High School',           'PCMCS', 91.0, 'confirmed',    (SELECT id FROM staff WHERE username='kumar'),  'Fee paid'),
  ('Anita Devi',      'Devi',    '9876523456', 'Shidlaghatta',   'Govt High School',           'PCMB',  85.0, 'meeting_fixed',(SELECT id FROM staff WHERE username='kumar'),  'Meeting 15 May 11 AM'),
  ('Raju Kumar',      'Kumar',   '9876534567', 'Kudur',          'St. Joseph School',          'Arts',  65.0, 'archived',     (SELECT id FROM staff WHERE username='radha'),  'Joined other college');

-- ============================================================
-- UTILITY: Annual reset (export data first, then call this)
-- ============================================================
CREATE OR REPLACE FUNCTION export_and_clear_old_data(cutoff_date DATE)
RETURNS VOID AS $$
BEGIN
  DELETE FROM status_logs  WHERE changed_at < cutoff_date;
  DELETE FROM sms_logs     WHERE sent_at    < cutoff_date;
  DELETE FROM applications WHERE created_at < cutoff_date;
  ALTER SEQUENCE app_id_seq RESTART WITH 1;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- DONE! Default login credentials:
--   admin   / PIN: 0000  → Admin dashboard
--   office1 / PIN: 9012  → Office dashboard
--   kumar   / PIN: 1234  → Teacher dashboard
--   radha   / PIN: 5678  → Teacher dashboard
-- Change PINs via Admin Dashboard after first login.
-- ============================================================
