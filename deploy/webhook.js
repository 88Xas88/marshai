// Marshai · GitHub webhook deployer.
// Скрипт ЖИВЁТ в /var/www/marshai/shared/webhook.js — при обновлении
// исходник в репо marshai/deploy/webhook.js нужно скопировать вручную.
//
// .env.webhook парсится вручную — без зависимости от dotenv, чтобы webhook
// не зависел от /var/www/marshai/current/ (которое появляется только
// после первого atomic-деплоя).
const fs = require('fs');
const http = require('http');
const crypto = require('crypto');
const { execFile } = require('child_process');

const ENV_FILE = '/var/www/marshai/shared/.env.webhook';
const env = Object.fromEntries(
  fs.readFileSync(ENV_FILE, 'utf-8')
    .split('\n')
    .map(s => s.trim())
    .filter(line => line && !line.startsWith('#'))
    .map(line => {
      const i = line.indexOf('=');
      return [line.slice(0, i).trim(), line.slice(i + 1).trim().replace(/^["']|["']$/g, '')];
    })
);

const SECRET = env.WEBHOOK_SECRET;
if (!SECRET || SECRET === 'change-me') {
  console.error('[webhook] WEBHOOK_SECRET not set in', ENV_FILE);
  process.exit(1);
}
const DEPLOY_SCRIPT = '/var/www/marshai/shared/deploy_atomic.sh';

http.createServer((req, res) => {
  if (req.method !== 'POST') { res.writeHead(405); res.end(); return; }
  let body = '';
  req.on('data', d => body += d);
  req.on('end', () => {
    const sig = req.headers['x-hub-signature-256'] || '';
    const expected = 'sha256=' + crypto.createHmac('sha256', SECRET).update(body).digest('hex');
    if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
      console.warn('[webhook] bad signature from', req.socket.remoteAddress);
      res.writeHead(401); res.end('Unauthorized'); return;
    }
    let payload;
    try { payload = JSON.parse(body); } catch(e) { res.writeHead(400); res.end('bad json'); return; }
    if (payload.ref !== 'refs/heads/main') { res.writeHead(200); res.end('skip'); return; }
    res.writeHead(200); res.end('deploying');
    console.log('[webhook] deploy triggered at', new Date().toISOString(), 'by', payload.pusher?.name || '?');
    execFile('bash', [DEPLOY_SCRIPT], { timeout: 600000 }, (err, stdout, stderr) => {
      if (err) console.error('[webhook] deploy FAILED:\n', stderr.slice(-1000));
      else console.log('[webhook] deploy OK\n', stdout.slice(-500));
    });
  });
}).listen(4568, '127.0.0.1', () => console.log('[webhook] listening on 127.0.0.1:4568'));
