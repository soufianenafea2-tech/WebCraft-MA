const express = require('express');
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'requests.json');

// ─── MIDDLEWARE ────────────────────────────────────────
app.use(express.json());
app.use(express.static(__dirname)); // Sert les fichiers HTML/CSS/JS

// ─── HELPERS ──────────────────────────────────────────
function readDB() {
  if (!fs.existsSync(DB_FILE)) return [];
  const raw = fs.readFileSync(DB_FILE, 'utf-8');
  try { return JSON.parse(raw); } catch { return []; }
}

function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// ─── ROUTES ───────────────────────────────────────────

// GET /api/requests — Récupérer toutes les demandes (admin)
app.get('/api/requests', (req, res) => {
  const requests = readDB();
  // Trier par date décroissante (plus récent en premier)
  requests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(requests);
});

// POST /api/requests — Soumettre une nouvelle demande (client)
app.post('/api/requests', (req, res) => {
  const { name, phone, email, siteType, budget, features, description } = req.body;

  // Validation basique
  if (!name || !phone || !email || !siteType) {
    return res.status(400).json({ error: 'Champs obligatoires manquants.' });
  }

  const newRequest = {
    id: randomUUID(),
    name: name.trim(),
    phone: phone.trim(),
    email: email.trim().toLowerCase(),
    siteType,
    budget: budget || '',
    features: Array.isArray(features) ? features : [],
    description: (description || '').trim(),
    status: 'nouveau',
    createdAt: new Date().toISOString(),
  };

  const requests = readDB();
  requests.push(newRequest);
  writeDB(requests);

  console.log(`[${new Date().toLocaleString('fr-MA')}] Nouvelle demande: ${name} — ${siteType}`);
  res.status(201).json({ success: true, id: newRequest.id });
});

// PATCH /api/requests/:id — Mettre à jour le statut (admin)
app.patch('/api/requests/:id', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const validStatuses = ['nouveau', 'en_cours', 'termine', 'annule'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Statut invalide.' });
  }

  const requests = readDB();
  const index = requests.findIndex(r => r.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Demande introuvable.' });
  }

  requests[index].status = status;
  requests[index].updatedAt = new Date().toISOString();
  writeDB(requests);

  console.log(`[${new Date().toLocaleString('fr-MA')}] Statut mis à jour: ${id} → ${status}`);
  res.json({ success: true });
});

// DELETE /api/requests/:id — Supprimer une demande (admin)
app.delete('/api/requests/:id', (req, res) => {
  const { id } = req.params;
  let requests = readDB();
  const before = requests.length;
  requests = requests.filter(r => r.id !== id);

  if (requests.length === before) {
    return res.status(404).json({ error: 'Demande introuvable.' });
  }

  writeDB(requests);
  console.log(`[${new Date().toLocaleString('fr-MA')}] Demande supprimée: ${id}`);
  res.json({ success: true });
});

// ─── START ────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('\n╔══════════════════════════════════╗');
  console.log('║     WebCraft MA — Serveur        ║');
  console.log('╠══════════════════════════════════╣');
  console.log(`║  ✅  http://localhost:${PORT}        ║`);
  console.log(`║  🔒  http://localhost:${PORT}/admin  ║`);
  console.log('╚══════════════════════════════════╝\n');
});
