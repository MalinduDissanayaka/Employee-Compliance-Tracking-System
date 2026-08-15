-- Employee Compliance Tracking System — PostgreSQL schema
-- Mirrors the TypeORM entities in backend/src/employees and
-- backend/src/compliance-records. Run this if you prefer an explicit,
-- migration-style schema instead of TypeORM's `synchronize: true`.

CREATE EXTENSION IF NOT EXISTS pgcrypto; -- provides gen_random_uuid()

DO $$ BEGIN
  CREATE TYPE compliance_type_enum AS ENUM (
    'Visa',
    'Certification',
    'Background Check',
    'Training',
    'Work Permit'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE compliance_status_enum AS ENUM (
    'ACTIVE',
    'EXPIRING_SOON',
    'EXPIRED',
    'RENEWED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS employees (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_code  VARCHAR(50)  NOT NULL UNIQUE,
  first_name     VARCHAR(100) NOT NULL,
  last_name      VARCHAR(100) NOT NULL,
  email          VARCHAR(255) NOT NULL UNIQUE,
  department     VARCHAR(100) NOT NULL,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
  deleted_at     TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS compliance_records (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id                 UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  compliance_type             compliance_type_enum NOT NULL,
  issued_date                 DATE NOT NULL,
  expiry_date                 DATE NOT NULL,
  status                      compliance_status_enum NOT NULL DEFAULT 'ACTIVE',
  document_url                VARCHAR(1000),
  notes                       TEXT,
  expiring_notification_sent  BOOLEAN NOT NULL DEFAULT false,
  expired_notification_sent   BOOLEAN NOT NULL DEFAULT false,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at                  TIMESTAMPTZ,
  CONSTRAINT chk_expiry_after_issued CHECK (expiry_date > issued_date)
);

CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_compliance_records_employee_id ON compliance_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_compliance_records_status ON compliance_records(status);
CREATE INDEX IF NOT EXISTS idx_compliance_records_type ON compliance_records(compliance_type);
CREATE INDEX IF NOT EXISTS idx_compliance_records_expiry_date ON compliance_records(expiry_date);

-- Keep updated_at current for any row touched outside the application layer
-- (TypeORM's @UpdateDateColumn already handles this for API-driven writes).
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_employees_updated_at ON employees;
CREATE TRIGGER trg_employees_updated_at
  BEFORE UPDATE ON employees
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_compliance_records_updated_at ON compliance_records;
CREATE TRIGGER trg_compliance_records_updated_at
  BEFORE UPDATE ON compliance_records
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
