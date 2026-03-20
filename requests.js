// WebCraft MA — Backend avec JSONBin.io
// Bla Supabase, bla SQL, juste JSON storage gratuit

const BIN_ID  = process.env.JSONBIN_ID;
const API_KEY = process.env.JSONBIN_KEY;
const BASE    = 'https://api.jsonbin.io/v3/b';

const CORS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Lire toutes les demandes
async function readAll() {
  const r = await fetch(`${BASE}/${BIN_ID}/latest`, {
    headers: { 'X-Master-Key': API_KEY }
  });
  const json = await r.json();
  return json.record?.requests || [];
}

// Sauvegarder toutes les demandes
async function writeAll(requests) {
  await fetch(`${BASE}/${BIN_ID}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Master-Key': API_KEY,
    },
    body: JSON.stringify({ requests }),
  });
}

module.exports = async (req, res) => {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (!BIN_ID || !API_KEY) {
    return res.status(500).json({
      error: 'JSONBIN_ID ou JSONBIN_KEY manquant',
      fix: 'Vercel → Settings → Environment Variables'
    });
  }

  const id = req.query?.id;

  try {
    // GET — toutes les demandes
    if (req.method === 'GET') {
      const requests = await readAll();
      return res.status(200).json(requests.reverse());
    }

    // POST — nouvelle demande
    if (req.method === 'POST') {
      const { name, phone, email, siteType, budget, features, description } = req.body || {};
      if (!name || !phone || !email || !siteType)
        return res.status(400).json({ error: 'Champs obligatoires manquants.' });

      const requests = await readAll();
      const newReq = {
        id: Date.now(),
        name: name.trim(), phone: phone.trim(),
        email: email.trim().toLowerCase(),
        site_type: siteType, budget: budget || '',
        features: Array.isArray(features) ? features : [],
        description: (description || '').trim(),
        statut: 'nouveau',
        created_at: new Date().toISOString(),
      };
      requests.push(newReq);
      await writeAll(requests);
      return res.status(201).json({ success: true, data: newReq });
    }

    // PATCH — update statut
    if (req.method === 'PATCH' && id) {
      const { statut } = req.body || {};
      if (!['nouveau','en_cours','termine','annule'].includes(statut))
        return res.status(400).json({ error: 'Statut invalide.' });

      const requests = await readAll();
      const idx = requests.findIndex(r => String(r.id) === String(id));
      if (idx === -1) return res.status(404).json({ error: 'Demande introuvable.' });
      requests[idx].statut = statut;
      await writeAll(requests);
      return res.status(200).json({ success: true });
    }

    // DELETE
    if (req.method === 'DELETE' && id) {
      let requests = await readAll();
      requests = requests.filter(r => String(r.id) !== String(id));
      await writeAll(requests);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Méthode non supportée.' });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
