// WebCraft MA — Backend Vercel Serverless Function
// Fichier: /api/requests.js
// Vercel le détecte automatiquement → accessible via /api/requests

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

// Helper Supabase
async function db(method, filter = '', body = null) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/requests${filter}`, {
    method,
    headers: {
      'apikey':        SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type':  'application/json',
      'Prefer':        'return=representation',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${text}`);
  return text ? JSON.parse(text) : null;
}

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const { id } = req.query;

  // Check env vars
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ error: 'Variables SUPABASE_URL et SUPABASE_KEY manquantes dans Vercel → Settings → Environment Variables' });
  }

  try {
    // ── GET — toutes les demandes ──────────────────────────
    if (req.method === 'GET') {
      const data = await db('GET', '?order=created_at.desc');
      return res.status(200).json(data);
    }

    // ── POST — nouvelle demande ────────────────────────────
    if (req.method === 'POST') {
      const { name, phone, email, siteType, budget, features, description } = req.body;
      if (!name || !phone || !email || !siteType)
        return res.status(400).json({ error: 'Champs obligatoires manquants.' });

      const data = await db('POST', '', {
        name:        name.trim(),
        phone:       phone.trim(),
        email:       email.trim().toLowerCase(),
        site_type:   siteType,
        budget:      budget || '',
        features:    Array.isArray(features) ? features : [],
        description: (description || '').trim(),
        statut:      'nouveau',
      });
      return res.status(201).json({ success: true, data: data?.[0] });
    }

    // ── PATCH — update statut ──────────────────────────────
    if (req.method === 'PATCH' && id) {
      const { statut } = req.body;
      if (!['nouveau','en_cours','termine','annule'].includes(statut))
        return res.status(400).json({ error: 'Statut invalide.' });
      await db('PATCH', `?id=eq.${id}`, { statut });
      return res.status(200).json({ success: true });
    }

    // ── DELETE ─────────────────────────────────────────────
    if (req.method === 'DELETE' && id) {
      await db('DELETE', `?id=eq.${id}`);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Méthode non supportée.' });

  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ error: err.message });
  }
}
