// API: Delete a feeding record
// POST /api/delete  Body: { session, id }
// or DELETE /api/delete?session=...&id=...
import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST' && req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data = req.method === 'POST' ? req.body : req.query;
    const { session, id } = data;

    if (!session || !id) {
      return res.status(400).json({ error: 'session and id required' });
    }

    const key = `feeds:${session}`;
    const history = await kv.get(key) || [];
    const filtered = history.filter(function(item) { return item.id !== parseInt(id); });
    await kv.set(key, filtered);

    return res.status(200).json({ success: true, remaining: filtered.length });
  } catch (err) {
    console.error('Delete error:', err);
    return res.status (500).json({ error: 'Failed to delete', detail: err.message });
  }
}
