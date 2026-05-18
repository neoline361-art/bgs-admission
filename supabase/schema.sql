-- ============================================================
-- BGS Admission Connect - Supabase Schema
-- BGS PU College, Hanumanthpura, Shidlaghatta, Karnataka 562105
-- ============================================================
-- Run this entire file in: Supabase → SQL Editor → New Query → Run

-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- STAFF TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS staff (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username   TEXT UNIQUE NOT NULL,
  name       TEXT NOT NULL,
  pin_hash   TEXT NOT NULL,
  role       TEXT NOT NULL CHECK (role IN ('teacher', 'office', 'admin')),
  phone      TEXT,
  is_active  BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- APPLICATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS applications (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id               TEXT UNIQUE,                          -- Auto-generated: BGS-2026-0001
  student_name         TEXT NOT NULL,
  parent_name          TEXT NOT NULL,
  phone                TEXT NOT NULL,
  alt_phone            TEXT,
  village              TEXT NOT NULL,
  current_school       TEXT NOT NULL,
  course               TEXT NOT NULL,
  marks_percent        NUMERIC(5,2),
  message              TEXT,
  status               TEXT NOT NULL DEFAULT 'new'
                         CHECK (status IN ('new','contacted','meeting_fixed','confirmed','archived')),
  meeting_date         DATE,
  meeting_time         TIME,
  assigned_teacher_id  UUID REFERENCES staff(id) ON DELETE SET NULL,
  notes                TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- STATUS LOGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS status_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id  UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  from_status     TEXT,
  to_status       TEXT NOT NULL,
  changed_by      UUID REFERENCES staff(id) ON DELETE SET NULL,
  changed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  note            TEXT
);

-- ============================================================
-- SMS LOGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS sms_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id  UUID REFERENCES applications(id) ON DELETE CASCADE,
  phone           TEXT NOT NULL,
  message         TEXT NOT NULL,
  channel         TEXT NOT NULL CHECK (channel IN ('whatsapp', 'sms')),
  sent_by         UUID REFERENCES staff(id) ON DELETE SET NULL,
  sent_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status          TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent','failed','pending'))
);

-- ============================================================
-- SEQUENCE: AUTO-INCREMENT app_id (BGS-2026-0001, 0002, ...)
-- ============================================================
CREATE SEQUENCE IF NOT EXISTS app_id_seq START 1;

CREATE OR REPLACE FUNCTION generate_app_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.app_id IS NULL THEN
    NEW.app_id := 'BGS-2026-' || LPAD(nextval('app_id_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_app_id ON applications;
CREATE TRIGGER set_app_id
  BEFORE INSERT ON applications
  FOR EACH ROW EXECUTE FUNCTION generate_app_id();

-- ============================================================
-- TRIGGER: Auto-update updated_at on applications
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS applications_updated_at ON applications;
CREATE TRIGGER applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- Enable RLS on all tables.
-- Applications: public can INSERT (for student form submission).
-- All SELECT/UPDATE: open (for staff dashboards using anon key).
-- ============================================================

ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff        ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_logs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_logs     ENABLE ROW LEVEL SECURITY;

-- Applications: anyone can submit (INSERT)
CREATE POLICY "Public can submit applications"
  ON applications FOR INSERT
  TO anon
  WITH CHECK (true);

-- Applications: anyone with anon key can read (staff dashboards)
CREATE POLICY "Anon can read applications"
  ON applications FOR SELECT
  TO anon
  USING (true);

-- Applications: anon can update (staff dashboards)
CREATE POLICY "Anon can update applications"
  ON applications FOR UPDATE
  TO anon
  USING (true);

-- Staff: anon can read (for login verification)
CREATE POLICY "Anon can read staff"
  ON staff FOR SELECT
  TO anon
  USING (true);

-- Staff: anon can insert (for adding staff via admin)
CREATE POLICY "Anon can insert staff"
  ON staff FOR INSERT
  TO anon
  WITH CHECK (true);

-- Staff: anon can update (for PIN changes, active toggle)
CREATE POLICY "Anon can update staff"
  ON staff FOR UPDATE
  TO anon
  USING (true);

-- Status logs: anon can insert and read
CREATE POLICY "Anon can insert status_logs"
  ON status_logs FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon can read status_logs"
  ON status_logs FOR SELECT TO anon USING (true);

-- SMS logs: anon can insert and read
CREATE POLICY "Anon can insert sms_logs"
  ON sms_logs FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon can read sms_logs"
  ON sms_logs FOR SELECT TO anon USING (true);

-- ============================================================
-- REALTIME: Enable for live dashboard updates
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE applications;

-- ============================================================
-- SEED DATA: Default Staff Accounts
-- PINs are SHA-256("PIN" + "bgs_salt_2026")
-- Default PINs: admin=1234, kumar=5678, radha=9012, office1=3456
-- ============================================================

-- To generate your own hashes, run this in your browser console:
--   const hash = async (pin) => {
--     const enc = new TextEncoder();
--     const buf = await crypto.subtle.digest("SHA-256", enc.encode(pin + "bgs_salt_2026"));
--     return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,"0")).join("");
--   };
--   console.log(await hash("1234"));

-- admin / PIN: 1234
INSERT INTO staff (username, name, pin_hash, role, phone, is_active) VALUES
  ('admin',   'Administrator',  'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', 'admin',  NULL, true),
  ('kumar',   'Kumar Sir',      '6c84fb90acfd5e96b19bfd2fb3a0eed9c5c96e5e4dcdc9c28e97c1a1c6b93a4e', 'teacher', NULL, true),
  ('radha',   'Radha Ma''am',    '3f4e3b3bcf58d6e7f3d7b8bfa2c3e98a8e7eb97eb8e2ee55ced9c4c7ab7ecf97', 'teacher', NULL, true),
  ('office1', 'Office Staff',   'c1c8b2b22af3b9c0c4f68a0ee0e7e0d8e5c0c4c8f2f3f5e3c6b0b1a7a9f5d0c', 'office', NULL, true)
ON CONFLICT (username) DO NOTHING;

-- ============================================================
-- NOTE ON DEFAULT PINS
-- ============================================================
-- The hashes above are EXAMPLES. You MUST generate real hashes.
-- Use the Admin Dashboard → Staff Management → Add Staff to add
-- your real staff members with proper PINs after setup.
-- 
-- Or use the browser console snippet above to get the correct hash
-- for any PIN you want, then UPDATE the staff table directly.
-- ============================================================
