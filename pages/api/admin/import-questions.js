import { clientPromise } from '../../../lib/mongodb';
import questions from '../../../lib/seed/questions';
import { requireAdmin } from '../../../lib/auth';

export default async function handler(req,res){
  if(req.method !== 'POST') return res.status(405).end();
  const session = requireAdmin(req, res);
  if(!session) return;
  try{
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || 'avaliacao');
    const col = db.collection('questions');
    const existing = await col.countDocuments();
    if(existing > 0) return res.status(200).json({ ok:false, msg:'already exists', existing });
    // insert questions from module (strip id fields if any)
    const toInsert = questions.map(q=> ({ ...q, createdAt: new Date() }));
    const r = await col.insertMany(toInsert);
    return res.status(201).json({ ok:true, inserted: r.insertedCount });
  }catch(e){ console.error('import questions error', e); return res.status(500).json({ error:String(e) }); }
}
