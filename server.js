const express = require('express');
const cors    = require('cors');
const fs      = require('fs');
const path    = require('path');
const crypto  = require('crypto');

const app      = express();
const PORT     = process.env.PORT     || 3847;
const PASSWORD = process.env.PASSWORD || '';   // senha opcional
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '50mb' }));

// ──────────────────────────────────────
// AUTH MIDDLEWARE
// ──────────────────────────────────────
const auth = (req, res, next) => {
  if (!PASSWORD) return next();
  const key = req.headers['x-api-key'] || req.query.key || '';
  if (key !== PASSWORD) return res.status(401).json({ ok: false, error: 'Unauthorized' });
  next();
};

// ──────────────────────────────────────
// SSE — REALTIME
// ──────────────────────────────────────
const clients = new Set();

// ──────────────────────────────────────
// ROUTES
// ──────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ ok: true, version: '1.0.0', ts: Date.now() });
});

app.get('/api/db', auth, (req, res) => {
  try {
    if (!fs.existsSync(DATA_FILE)) return res.json({ ok: true, data: null, hash: '' });
    const raw  = fs.readFileSync(DATA_FILE, 'utf8');
    const hash = crypto.createHash('md5').update(raw).digest('hex').slice(0, 8);
    res.json({ ok: true, data: JSON.parse(raw), hash, ts: Date.now() });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

app.post('/api/db', auth, (req, res) => {
  try {
    const json = JSON.stringify(req.body, null, 2);
    fs.writeFileSync(DATA_FILE, json, 'utf8');
    const hash = crypto.createHash('md5').update(json).digest('hex').slice(0, 8);
    // Notifica todos os clientes SSE
    const payload = `data: ${JSON.stringify({ hash, ts: Date.now() })}\n\n`;
    clients.forEach(c => c.write(payload));
    res.json({ ok: true, hash, ts: Date.now() });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

app.get('/api/events', auth, (req, res) => {
  res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive', 'Access-Control-Allow-Origin': '*' });
  clients.add(res);
  res.write(`data: {"type":"connected","ts":${Date.now()}}\n\n`);
  const ka = setInterval(() => res.write(': keepalive\n\n'), 25000);
  req.on('close', () => { clearInterval(ka); clients.delete(res); });
});

// Serve o HTML do app em /
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log('\n╔══════════════════════════════════╗');
  console.log('║   EstoqueOp Server · v1.0.0      ║');
  console.log('╚══════════════════════════════════╝');
  console.log(`\n🟢  Rodando em  http://localhost:${PORT}`);
  console.log(`📦  Dados em    ${DATA_FILE}`);
  console.log(PASSWORD ? `🔒  Senha ativa` : `⚠️   Sem senha — adicione PASSWORD=suasenha`);
  console.log(`\n💡  Acesse de outro dispositivo: http://SEU_IP:${PORT}`);
  console.log(`    Coloque o HTML em ./public/index.html para servir pelo servidor.\n`);
});
