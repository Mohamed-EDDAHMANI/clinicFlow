-- Up Migration
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TYPE user_role AS ENUM ('admin', 'staff');
CREATE TYPE appt_status AS ENUM ('pending', 'confirmed', 'cancelled');
CREATE TYPE audit_action AS ENUM ('CREATE', 'UPDATE', 'DELETE');

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Down Migration
DROP FUNCTION IF EXISTS set_updated_at();

DROP TYPE IF EXISTS audit_action;
DROP TYPE IF EXISTS appt_status;
DROP TYPE IF EXISTS user_role;

DROP EXTENSION IF EXISTS btree_gist;
DROP EXTENSION IF EXISTS pg_trgm;
DROP EXTENSION IF EXISTS pgcrypto;
