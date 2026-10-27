-- Up Migration
CREATE TABLE refresh_tokens (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX refresh_tokens_user_id_idx ON refresh_tokens (user_id);

ALTER TABLE users DROP COLUMN refresh_token;

-- Down Migration
ALTER TABLE users ADD COLUMN refresh_token CHAR(64);

DROP TABLE refresh_tokens;
