-- Marshai initial schema
-- Idempotent: safe to re-run.
-- Stage 1: plans
-- Stage 2: booking_status, booked_items, price_alerts

-- Расширение для gen_random_uuid (доступно в Neon из коробки, но включаем явно).
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS plans (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT,
  from_city   TEXT NOT NULL,
  to_city     TEXT NOT NULL,
  dates       TEXT NOT NULL,
  days        INTEGER NOT NULL,
  pax         INTEGER DEFAULT 1,
  plan_json   JSONB NOT NULL,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Stage 2: добавляем колонки только если их ещё нет.
ALTER TABLE plans ADD COLUMN IF NOT EXISTS booking_status TEXT DEFAULT 'not_booked';
ALTER TABLE plans ADD COLUMN IF NOT EXISTS booked_items   JSONB DEFAULT '{}'::jsonb;

-- Поиск планов пользователя (для /account).
CREATE INDEX IF NOT EXISTS plans_email_created_at_idx
  ON plans (email, created_at DESC);

CREATE TABLE IF NOT EXISTS price_alerts (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id               UUID REFERENCES plans(id) ON DELETE CASCADE,
  email                 TEXT NOT NULL,
  last_price_transport  INTEGER,
  last_price_hotel      INTEGER,
  alerted_at            TIMESTAMP,
  created_at            TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS price_alerts_plan_id_idx
  ON price_alerts (plan_id);
