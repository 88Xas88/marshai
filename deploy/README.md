# Marshai · auto-deploy

Атомарный деплой Marshai (Next.js) на сервер `fridgeai-wg` (REG.RU CloudVPS,
89.108.66.236) по `git push origin main`. Аналогично VkusAI:

- `deploy_atomic.sh` — атомарный деплой через `releases/<ts>` + симлинк `current`
- `webhook.js` — HTTP-сервер на `127.0.0.1:4568`, проверяет HMAC-SHA256 от GitHub
  и запускает `deploy_atomic.sh`
- `nginx-marshai.conf` — vhost `marshai.ru`, проксирует на `:3001` и `/webhook/deploy → :4568`

## Структура на сервере

```
/var/www/marshai/
├── current → releases/<latest>     (симлинк)
├── releases/
│   ├── 20260427120000/             (git clone + npm ci + npm run build)
│   ├── 20260427180000/
│   └── ...                          (хранится последние 5)
└── shared/
    ├── .env.production              (PROD env: DATABASE_URL, AUTH_SECRET, ...)
    ├── .env.webhook                 (WEBHOOK_SECRET=<...>)
    ├── deploy_atomic.sh             (копия из repo deploy/)
    └── webhook.js                   (копия из repo deploy/)
```

## Первоначальная установка (one-time)

> Все шаги от пользователя `fridgeai`. Папка `/var/www/marshai/` должна быть
> создана через `sudo` и передана во владение `fridgeai:fridgeai`.

### 1. Создать структуру

```bash
sudo mkdir -p /var/www/marshai/{releases,shared}
sudo chown -R fridgeai:fridgeai /var/www/marshai
```

### 2. Заполнить `shared/.env.production`

```bash
nano /var/www/marshai/shared/.env.production
```

Минимум (актуальные значения взять из Vercel project → Settings → Environment Variables):

```
NODE_ENV=production
DATABASE_URL=postgresql://...neon.tech/...
AUTH_SECRET=<...>
AUTH_URL=https://marshai.ru
TRAVELPAYOUTS_TOKEN=<...>
TRAVELPAYOUTS_MARKER=723162
YANDEX_MAPS_API_KEY=<...>
YANDEX_RASP_API_KEY=<...>
RESEND_API_KEY=<...>
```

### 3. Заполнить `shared/.env.webhook`

```bash
openssl rand -hex 32   # сохранить вывод — это будет WEBHOOK_SECRET
nano /var/www/marshai/shared/.env.webhook
```

Содержимое:

```
WEBHOOK_SECRET=<тот-самый-hex-из-openssl>
```

```bash
chmod 600 /var/www/marshai/shared/.env.webhook
```

### 4. Скопировать скрипты деплоя

С локальной машины (или сразу на сервере после `git clone`):

```bash
scp deploy/deploy_atomic.sh fridgeai-wg:/var/www/marshai/shared/deploy_atomic.sh
scp deploy/webhook.js       fridgeai-wg:/var/www/marshai/shared/webhook.js
ssh fridgeai-wg "chmod +x /var/www/marshai/shared/deploy_atomic.sh"
```

### 5. Первый ручной деплой

```bash
ssh fridgeai-wg "bash /var/www/marshai/shared/deploy_atomic.sh"
```

После успеха `pm2 list` должен показывать процесс `marshai` на порту `3001`.

### 6. Webhook через PM2

> Сначала нужен один прошедший деплой — webhook требует
> `/var/www/marshai/current/node_modules/dotenv`.

```bash
ssh fridgeai-wg "pm2 start /var/www/marshai/shared/webhook.js --name marshai-webhook && pm2 save"
```

Проверка:

```bash
ssh fridgeai-wg "curl -s -o /dev/null -w '%{http_code}\n' -X POST http://127.0.0.1:4568/"
# ожидаем 401 (Unauthorized — нет подписи)
```

### 7. nginx vhost

```bash
scp deploy/nginx-marshai.conf fridgeai-wg:/tmp/marshai.ru
ssh fridgeai-wg "sudo mv /tmp/marshai.ru /etc/nginx/sites-available/marshai.ru \
  && sudo ln -sf /etc/nginx/sites-available/marshai.ru /etc/nginx/sites-enabled/marshai.ru \
  && sudo nginx -t \
  && sudo systemctl reload nginx"
```

### 8. SSL через certbot

> DNS `marshai.ru` и `www.marshai.ru` уже должны указывать на `89.108.66.236`
> (A-records, Cloudflare DNS-only, не proxied).

```bash
ssh fridgeai-wg "sudo certbot --nginx -d marshai.ru -d www.marshai.ru \
  --non-interactive --agree-tos -m 88xas88@gmail.com --redirect"
```

certbot сам допишет 443-блок в `nginx-marshai.conf` и перезагрузит nginx.

### 9. GitHub webhook

В репозитории `88Xas88/marshai` → **Settings → Webhooks → Add webhook**:

| Поле | Значение |
| --- | --- |
| Payload URL | `https://marshai.ru/webhook/deploy` |
| Content type | `application/json` |
| Secret | значение `WEBHOOK_SECRET` из `.env.webhook` |
| SSL verification | Enable |
| Events | Just the push event |
| Active | ✅ |

После клика **Add webhook** GitHub отправит ping — должен вернуться `200 deploying`
или `200 skip` (если push был не в `main`). В **Recent Deliveries** видно историю.

## Дальнейшие деплои

Просто `git push origin main` — webhook поймает, проверит подпись,
запустит `deploy_atomic.sh` в фоне. Логи:

```bash
ssh fridgeai-wg "pm2 logs marshai-webhook --lines 50"
ssh fridgeai-wg "pm2 logs marshai --lines 50"
```

## Ручной деплой (без push)

```bash
ssh fridgeai-wg "bash /var/www/marshai/shared/deploy_atomic.sh"
```

## Откат

`deploy_atomic.sh` уже автоматически откатывается если health-check на
`http://127.0.0.1:3001/` не отвечает 30 секунд. Ручной откат:

```bash
ssh fridgeai-wg
cd /var/www/marshai
ls releases/                                 # выбрать предыдущий timestamp
ln -sfn releases/<ts> current
pm2 delete marshai
NODE_OPTIONS="--max-old-space-size=384" PORT=3001 NODE_ENV=production \
  pm2 start /var/www/marshai/current/node_modules/.bin/next \
  --name marshai --cwd /var/www/marshai/current --update-env -- start -p 3001
pm2 save
```

## Обновление самих скриптов

`deploy_atomic.sh` и `webhook.js` лежат в `shared/` (вне `current/`), потому
что они *запускают* деплой и не должны меняться на лету. Когда меняешь файлы
в этом репо (`deploy/`), скопируй вручную:

```bash
scp deploy/deploy_atomic.sh fridgeai-wg:/var/www/marshai/shared/deploy_atomic.sh
scp deploy/webhook.js       fridgeai-wg:/var/www/marshai/shared/webhook.js
ssh fridgeai-wg "pm2 restart marshai-webhook"   # только если менялся webhook.js
```

## Порты и PM2-процессы на сервере

| Процесс | Порт | Назначение |
| --- | --- | --- |
| `vkusai-express` | 5001 | VkusAI Express API + SPA |
| `vkusai-next` | 3000 | VkusAI Next.js (если используется) |
| `vkusai-webhook` | 4567 | VkusAI деплой |
| `marshai` | 3001 | Marshai Next.js |
| `marshai-webhook` | 4568 | Marshai деплой |

## Блокеры до первого деплоя

- [ ] `sudo mkdir -p /var/www/marshai && sudo chown fridgeai:fridgeai /var/www/marshai`
- [ ] DNS `marshai.ru` A-record → `89.108.66.236` (сейчас `216.198.79.1` — Vercel)
- [ ] `TRAVELPAYOUTS_TOKEN` из Vercel → `.env.production`
- [ ] (опц.) проверить `free -h` — на сервере 1.9 GB RAM, второй Next с
      `--max-old-space-size=384` помещается, но без запаса. Перед первым
      деплоем имеет смысл `pm2 flush` и `apt clean`.
