import { clientPromise } from '../../lib/mongodb';

export default async function handler(req, res){
  if(req.method !== 'POST') return res.status(405).end();
  try{
    const data = req.body || {};
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || 'avaliacao');
    const col = db.collection('submissions');

    // ensure a unique index on dedupeKey to avoid race-condition duplicates
    try{ await col.createIndex({ dedupeKey: 1 }, { unique: true, sparse: true }); }catch(e){ console.warn('createIndex dedupeKey:', e && e.message); }

    // build a dedupe key from name, test type, pct and a time window (10s)
    const name = String(data.name || '').trim().toLowerCase();
    const test = String(data.test_type || '');
    const pct = String(data.pct || '');
    const time = new Date(data.date || Date.now()).getTime();
    const windowMs = 10 * 1000; // 10-second window to consider duplicates
    const truncated = Math.floor(time / windowMs) * windowMs;
    const dedupeKey = `${name}|${test}|${pct}|${truncated}`;

    const doc = { ...data, dedupeKey, createdAt: new Date() };

    // use upsert with $setOnInsert to atomically insert only when no matching dedupeKey exists
    const r = await col.updateOne({ dedupeKey }, { $setOnInsert: doc }, { upsert: true });
    if(r.upsertedCount === 0){
      // document already existed (duplicate within window)
      return res.status(200).json({ ok: true, duplicate: true });
    }
    return res.status(201).json({ ok: true, duplicate: false });
  }catch(e){
    console.error('submit error', e);
    if(e && e.code === 11000) return res.status(200).json({ ok:true, duplicate:true });
    return res.status(500).json({ error: String(e) });
  }
}
