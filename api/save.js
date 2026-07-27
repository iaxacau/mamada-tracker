// API: Save a feeding record
// POST /api/save
// Body: { session: "phone-id", babyName: "...", side: "left|right", timestamp: 1234567890, duration: 300 }
import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { session, babyName, side, timestamp, duration, clearAll } = req.body;

    if (!session) {
      return res.status(400).json({ error: 'Session ID required' });
    }

    const key = `feeds:${session}`;

    // Clear all records
    if (clearAll) {
      await kv.set(key, []);
      if (babyName !== undefined) await kv.set(`babyname:${session}`, babyName);
      return res.status(200).json({ success: true, cleared: true });
    }

    // Save baby name
    if (babyName) {
      await kv.set(`babyname:${session}`, babyName);
    }

    // Add feeding record
    const entry = {
      id: timestamp || Date.now(),
      timestamp: timestamp || Date.now(),
      duration: duration || 0,
      side: side || 'left',
      date: new Date((timestamp || Date.now())).toISOString().split('T')[0]
    };

    // Get existing, prepend new, cap at 500 entries
    const existing = await kv.get(key) || [];
    existing.unshift(entry);
    if (existing.length > 500) existing.length = 500;
    await kv.set(key, existing);

    return res.status(200).json({ success: true, entry });
  } catch (err) {
    console.error('Save error:', err);
    return res.status(500).json({ error: 'Failed to save', detail: err.message });
  }
}
