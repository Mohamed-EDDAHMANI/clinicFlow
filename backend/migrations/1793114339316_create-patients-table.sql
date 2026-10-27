-- Up Migration
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(255) NOT NULL,
  cin VARCHAR(20) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  birth_date DATE NOT NULL,
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX patients_cin_active_uq ON patients (cin) WHERE deleted_at IS NULL;
CREATE INDEX patients_full_name_trgm_idx ON patients USING GIN (full_name gin_trgm_ops);
CREATE INDEX patients_cin_trgm_idx ON patients USING GIN (cin gin_trgm_ops);
CREATE INDEX patients_created_at_idx ON patients (created_at DESC, id) WHERE deleted_at IS NULL;

CREATE TRIGGER trg_patients_updated_at
  BEFORE UPDATE ON patients
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Down Migration
DROP TABLE IF EXISTS patients;
