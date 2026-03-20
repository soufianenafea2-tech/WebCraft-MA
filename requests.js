// WebCraft MA — Vercel Serverless Function
// Node.js 18+, CommonJS

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

const CORS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

module.exports = async function handler(req, res) {
  // CORS
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === 'OPTIONS') return res.status(204).end();

  // ← Debug: check env vars first
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({
      error: 'SUPABASE_URL ou SUPABASE_KEY manquant.',
      fix: 'Vercel → Project → Settings → Environment Variables → ajouter SUPABASE_URL et SUPABASE_KEY → Redeploy'
    });
  }

  const id = req.query?.id;

  try {
    // ── GET ──────────────────────────────────────────────
    if (req.method === 'GET') {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/requests?order=created_at.desc`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        }
      });
      const data = await r.json();
      if (!r.ok) return res.status(r.status).json(data);
      return res.status(200).json(data);
    }

    // ── POST ─────────────────────────────────────────────
    if (req.method === 'POST') {
      const body = req.body || {};
      const { name, phone, email, siteType, budget, features, description } = body;

      if (!name || !phone || !email || !siteType) {
        return res.status(400).json({ error: 'Champs obligatoires manquants: name, phone, email, siteType' });
      }

      const r = await fetch(`${SUPABASE_URL}/rest/v1/requests`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({
          name:        name.trim(),
          phone:       phone.trim(),
          email:       email.trim().toLowerCase(),
          site_type:   siteType,
          budget:      budget || '',
          features:    Array.isArray(features) ? features : [],
          description: (description || '').trim(),
          statut:      'nouveau',
        }),
      });
      const data = await r.json();
      if (!r.ok) return res.status(r.status).json(data);
      return res.status(201).json({ success: true, data: data?.[0] });
    }

    // ── PATCH ─────────────────────────────────────────────
    if (req.method === 'PATCH' && id) {
      const { statut } = req.body || {};
      if (!['nouveau','en_cours','termine','annule'].includes(statut)) {
        return res.status(400).json({ error: 'Statut invalide.' });
      }
      const r = await fetch(`${SUPABASE_URL}/rest/v1/requests?id=eq.${id}`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({ statut }),
      });
      if (!r.ok) return res.status(r.status).json({ error: 'Erreur Supabase' });
      return res.status(200).json({ success: true });
    }

    // ── DELETE ────────────────────────────────────────────
    if (req.method === 'DELETE' && id) {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/requests?id=eq.${id}`, {
        method: 'DELETE',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
      });
      if (!r.ok) return res.status(r.status).json({ error: 'Erreur Supabase' });
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Méthode non supportée.' });

  } catch (err) {
    return res.status(500).json({ error: err.message, stack: err.stack });
  }
};
