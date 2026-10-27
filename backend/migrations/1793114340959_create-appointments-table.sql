-- Up Migration
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  appointment_date TIMESTAMPTZ NOT NULL,
  status appt_status NOT NULL DEFAULT 'pending',
  reason VARCHAR(255) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  CONSTRAINT appointments_no_overlap_confirmed
  EXCLUDE USING gist (
    patient_id WITH =,
    tsrange(appointment_date AT TIME ZONE 'UTC', (appointment_date AT TIME ZONE 'UTC') + INTERVAL '30 minutes') WITH &&
  ) WHERE (status = 'confirmed' AND deleted_at IS NULL)
);

CREATE INDEX appointments_date_status_idx ON appointments (appointment_date, status) WHERE deleted_at IS NULL;
CREATE INDEX appointments_patient_date_idx ON appointments (patient_id, appointment_date);

CREATE TRIGGER trg_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Down Migration
DROP TABLE IF EXISTS appointments;
