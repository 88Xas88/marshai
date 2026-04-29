#!/usr/bin/env bash
# Marshai · Atomic deploy script.
# Скрипт ЖИВЁТ в /var/www/marshai/shared/deploy_atomic.sh — при обновлении
# исходник в репо marshai/deploy/deploy_atomic.sh нужно скопировать вручную.
set -euo pipefail

BASE="/var/www/marshai"
cd "$BASE" || { echo "[deploy] FATAL: cannot cd to $BASE"; exit 1; }

REPO="${MARSHAI_REPO:-git@github.com:88Xas88/marshai.git}"
BRANCH="${MARSHAI_BRANCH:-main}"

RELEASE_ID="$(date -u +%Y%m%d%H%M%S)"
RELEASE_DIR="$BASE/releases/$RELEASE_ID"
CURRENT_LINK="$BASE/current"
SHARED_ENV="$BASE/shared/.env.production"
HEALTH_URL="http://127.0.0.1:3001/"

# lock — не запускать второй деплой параллельно
exec 9>/tmp/marshai_deploy.lock
flock -n 9 || { echo "[deploy] another deploy is running"; exit 1; }

echo "[deploy] create release $RELEASE_DIR"
mkdir -p "$RELEASE_DIR"

echo "[deploy] clone repo $REPO branch $BRANCH"
git clone --depth 1 --branch "$BRANCH" "$REPO" "$RELEASE_DIR"

echo "[deploy] link env"
if [ ! -f "$SHARED_ENV" ]; then
  echo "[deploy] FATAL: $SHARED_ENV not found"
  exit 1
fi
ln -sfn "$SHARED_ENV" "$RELEASE_DIR/.env.production"
# Next.js при build/start читает .env.local и .env.production
ln -sfn "$SHARED_ENV" "$RELEASE_DIR/.env.local"

echo "[deploy] install deps (npm ci)"
cd "$RELEASE_DIR"
npm ci

echo "[deploy] build (npm run build)"
NODE_OPTIONS="--max-old-space-size=512" npm run build

# запоминаем предыдущий релиз для возможного rollback
PREV="$(readlink -f "$CURRENT_LINK" 2>/dev/null || true)"

cd "$BASE"
echo "[deploy] switch current -> $RELEASE_DIR"
ln -sfn "$RELEASE_DIR" "$CURRENT_LINK"

# ===== RESTART NEXTJS =====
echo "[deploy] restart marshai (pm2)"
if pm2 describe marshai >/dev/null 2>&1; then
  pm2 delete marshai
fi
NODE_OPTIONS="--max-old-space-size=384" PORT=3001 NODE_ENV=production \
  pm2 start "$RELEASE_DIR/node_modules/.bin/next" \
  --name marshai \
  --cwd "$RELEASE_DIR" \
  --update-env \
  -- start -p 3001

pm2 save

# проверка порта
echo "[deploy] checking if port 3001 is listening..."
if ss -ltn | grep -q ':3001'; then
  echo "[deploy] ✅ port 3001 is listening"
else
  echo "[deploy] ⚠️  port 3001 not yet listening, will retry..."
fi

echo "[deploy] health check"
HEALTH_OK=0
for i in {1..30}; do
  echo "[deploy] waiting marshai... ($i/30)"
  if curl -fsS "$HEALTH_URL" >/dev/null 2>&1; then
    echo "[deploy] ✅ marshai health ok"
    HEALTH_OK=1
    break
  fi
  sleep 1
done

if [ "$HEALTH_OK" -ne 1 ]; then
  echo "[deploy] ❌ ERROR: marshai health failed, rolling back"
  if [ -n "${PREV:-}" ] && [ -d "$PREV" ]; then
    ln -sfn "$PREV" "$CURRENT_LINK"
    pm2 delete marshai 2>/dev/null || true
    NODE_OPTIONS="--max-old-space-size=384" PORT=3001 NODE_ENV=production \
      pm2 start "$PREV/node_modules/.bin/next" \
      --name marshai \
      --cwd "$PREV" \
      --update-env \
      -- start -p 3001
  fi
  pm2 logs marshai --lines 120 || true
  exit 1
fi

echo "[deploy] reload nginx"
sudo systemctl reload nginx || echo "[deploy] nginx reload skipped (no sudo)"

echo "[deploy] cleanup old releases (keep last 5)"
ls -1dt "$BASE/releases/"* 2>/dev/null | tail -n +6 | xargs -r rm -rf

echo "[deploy] done: $RELEASE_ID"
