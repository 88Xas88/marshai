-- Marshai admin panel + DB-backed blog (Stage 5)
-- Idempotent: safe to re-run.

-- 1. Таблица админ-пользователей. Отдельная от users (которые приходят через
--    magic-link). Аутентификация: login + bcrypt-hash пароля. Сессия — JWT в
--    cookie marshai_admin_session (то же AUTH_SECRET что у юзеров).
CREATE TABLE IF NOT EXISTS admin_users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  login         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name  TEXT,
  created_at    TIMESTAMP DEFAULT NOW(),
  last_login    TIMESTAMP
);

CREATE INDEX IF NOT EXISTS admin_users_login_idx ON admin_users (login);

-- 2. Таблица статей блога. Заменяет файловое хранение в content/blog/*.md.
--    status: 'draft' | 'published'. Только published показываются на /blog.
--    keywords: массив строк (Postgres TEXT[]).
CREATE TABLE IF NOT EXISTS blog_articles (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug             TEXT NOT NULL UNIQUE,
  title            TEXT NOT NULL,
  description      TEXT NOT NULL,
  content          TEXT NOT NULL,
  meta_title       TEXT,
  meta_description TEXT,
  keywords         TEXT[] DEFAULT '{}',
  status           TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  author_id        UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at       TIMESTAMP DEFAULT NOW(),
  updated_at       TIMESTAMP DEFAULT NOW(),
  published_at     TIMESTAMP
);

CREATE INDEX IF NOT EXISTS blog_articles_slug_idx     ON blog_articles (slug);
CREATE INDEX IF NOT EXISTS blog_articles_status_idx   ON blog_articles (status);
CREATE INDEX IF NOT EXISTS blog_articles_published_idx ON blog_articles (published_at DESC) WHERE status = 'published';
