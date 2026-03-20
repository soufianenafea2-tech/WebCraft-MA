// TEST VERSION - bla Supabase, juste bach nchofu wach Vercel tatshghel

module.exports = function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method === 'OPTIONS') return res.status(204).end();
  
  if (req.method === 'GET') {
    return res.status(200).json([
      {
        id: 1,
        name: "Test Client",
        phone: "0612345678",
        email: "test@test.com",
        site_type: "vitrine",
        budget: "1500-3000",
        features: ["seo"],
        description: "Test - function marche!",
        statut: "nouveau",
        created_at: new Date().toISOString()
      }
    ]);
  }

  if (req.method === 'POST') {
    return res.status(201).json({ success: true, message: "POST marche!" });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
