// ============================================================
// WebCraft MA — api/requests.js
// Vercel Serverless Function — Node.js 18 (fetch natif)
// Database: Supabase (REST API)
// ============================================================

const SUPA_URL = process.env.SUPABASE_URL;
const SUPA_KEY = process.env.SUPABASE_KEY;

function setCORS(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

async function supa(method, path, body) {
  const url = `${SUPA_URL}/rest/v1/${path}`;
  const options = {
    method,
    headers: {
      'apikey':        SUPA_KEY,
      'Authorization': `Bearer ${SUPA_KEY}`,
      'Content-Type':  'application/json',
      'Prefer':        'return=representation',
    },
  };
  if (body !== undefined) options.body = JSON.stringify(body);
  const res = await fetch(url, options);
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${JSON.stringify(data)}`);
  return data;
}

module.exports = async function handler(req, res) {
  setCORS(res);
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') return res.status(204).end();

  if (!SUPA_URL || !SUPA_KEY) {
    return res.status(500).json({
      error: 'Variables manquantes: SUPABASE_URL et SUPABASE_KEY',
      fix: 'Vercel → Project → Settings → Environment Variables → Redeploy'
    });
  }

  const id = req.query && req.query.id;

  try {

    // GET — toutes les demandes
    if (req.method === 'GET') {
      const data = await supa('GET', 'requests?order=created_at.desc');
      return res.status(200).json(data || []);
    }

    // POST — nouvelle demande
    if (req.method === 'POST') {
      const b = req.body || {};
      const { name, phone, email, siteType, budget, features, description } = b;
      if (!name || !phone || !email || !siteType) {
        return res.status(400).json({ error: 'Champs obligatoires: name, phone, email, siteType' });
      }
      const row = await supa('POST', 'requests', {
        name:        String(name).trim(),
        phone:       String(phone).trim(),
        email:       String(email).trim().toLowerCase(),
        site_type:   String(siteType),
        budget:      String(budget || ''),
        features:    Array.isArray(features) ? features : [],
        description: String(description || '').trim(),
        statut:      'nouveau',
      });
      return res.status(201).json({ success: true, data: row ? row[0] : null });
    }

    // PATCH — changer statut
    if (req.method === 'PATCH') {
      if (!id) return res.status(400).json({ error: 'id manquant' });
      const { statut } = req.body || {};
      if (!['nouveau','en_cours','termine','annule'].includes(statut)) {
        return res.status(400).json({ error: 'Statut invalide' });
      }
      await supa('PATCH', `requests?id=eq.${id}`, { statut });
      return res.status(200).json({ success: true });
    }

    // DELETE
    if (req.method === 'DELETE') {
      if (!id) return res.status(400).json({ error: 'id manquant' });
      await supa('DELETE', `requests?id=eq.${id}`);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Methode non supportee' });

  } catch (err) {
    console.error('[WebCraft API]', err.message);
    return res.status(500).json({ error: err.message });
  }
};
