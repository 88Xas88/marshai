-- Marshai auth schema (Stage 4)
-- Magic-link авторизация: токен 15 минут → JWT-сессия 30 дней.

-- users: каталог зарегистрированных пользователей (создаётся при первом входе)
CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT NOT NULL UNIQUE,
  name        TEXT,
  created_at  TIMESTAMP DEFAULT NOW(),
  last_login  TIMESTAMP
);

-- auth_tokens: одноразовые magic-link токены
CREATE TABLE IF NOT EXISTS auth_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT NOT NULL,
  token       TEXT NOT NULL UNIQUE,
  used        BOOLEAN DEFAULT false,
  expires_at  TIMESTAMP NOT NULL,
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS auth_tokens_token_idx ON auth_tokens (token);
CREATE INDEX IF NOT EXISTS auth_tokens_email_idx ON auth_tokens (email);
-- Чистый sweep устаревших токенов будет идти по expires_at.
CREATE INDEX IF NOT EXISTS auth_tokens_expires_at_idx ON auth_tokens (expires_at);
