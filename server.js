/**
 * WebCraft MA – Backend Server
 * Node.js + Express + SQLite (better-sqlite3)
 * Même approche que AM Academy ✅
 *
 * Démarrer: node server.js
 * Port:     http://localhost:3000
 */

const express  = require('express');
const Database = require('better-sqlite3');
const path     = require('path');
const cors     = require('cors');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── MIDDLEWARE ──────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// ── DATABASE SETUP ──────────────────────────────────────────
const db = new Database('./webcraft.db');
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS requests (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL,
    phone       TEXT    NOT NULL,
    email       TEXT    NOT NULL,
    siteType    TEXT    NOT NULL,
    budget      TEXT,
    features    TEXT    DEFAULT '[]',
    description TEXT,
    statut      TEXT    DEFAULT 'nouveau',
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

console.log('✅ Base de données initialisée: webcraft.db');

// ── ROUTES ─────────────────────────────────────────────────

// GET toutes les demandes
app.get('/api/requests', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM requests ORDER BY created_at DESC').all();
    // Parse features JSON
    const data = rows.map(r => ({ ...r, features: JSON.parse(r.features || '[]') }));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST nouvelle demande (depuis le formulaire client)
app.post('/api/requests', (req, res) => {
  try {
    const { name, phone, email, siteType, budget, features, description } = req.body;

    if (!name || !phone || !email || !siteType) {
      return res.status(400).json({ error: 'Champs obligatoires manquants.' });
    }

    const stmt = db.prepare(`
      INSERT INTO requests (name, phone, email, siteType, budget, features, description)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      name.trim(),
      phone.trim(),
      email.trim().toLowerCase(),
      siteType,
      budget || '',
      JSON.stringify(Array.isArray(features) ? features : []),
      (description || '').trim()
    );

    const newRow = db.prepare('SELECT * FROM requests WHERE id = ?').get(result.lastInsertRowid);
    console.log(`[NOUVELLE DEMANDE] ${name} — ${siteType} — ${new Date().toLocaleString('fr-MA')}`);
    res.status(201).json({ success: true, data: { ...newRow, features: JSON.parse(newRow.features) } });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH update statut (depuis dashboard admin)
app.patch('/api/requests/:id', (req, res) => {
  try {
    const { statut } = req.body;
    const valid = ['nouveau', 'en_cours', 'termine', 'annule'];
    if (!valid.includes(statut)) {
      return res.status(400).json({ error: 'Statut invalide.' });
    }
    db.prepare(`
      UPDATE requests SET statut = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(statut, req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE une demande
app.delete('/api/requests/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM requests WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET stats
app.get('/api/stats', (req, res) => {
  try {
    const total    = db.prepare("SELECT COUNT(*) as n FROM requests").get().n;
    const nouveau  = db.prepare("SELECT COUNT(*) as n FROM requests WHERE statut='nouveau'").get().n;
    const en_cours = db.prepare("SELECT COUNT(*) as n FROM requests WHERE statut='en_cours'").get().n;
    const termine  = db.prepare("SELECT COUNT(*) as n FROM requests WHERE statut='termine'").get().n;
    const weekAgo  = new Date(Date.now() - 7*24*3600*1000).toISOString();
    const semaine  = db.prepare('SELECT COUNT(*) as n FROM requests WHERE created_at >= ?').get(weekAgo).n;
    res.json({ total, nouveau, en_cours, termine, semaine });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve index.html pour toutes les autres routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ── START ───────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════╗
║   🌐 WebCraft MA — Serveur           ║
║   http://localhost:${PORT}              ║
║   Admin: http://localhost:${PORT}/admin ║
╚══════════════════════════════════════╝
  `);
});
