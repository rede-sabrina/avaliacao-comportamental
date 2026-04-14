import { clientPromise } from '../../../lib/mongodb';
import { requireAdmin } from '../../../lib/auth';

export default async function handler(req,res){
  if(req.method!=='GET') return res.status(405).end();
  const session = requireAdmin(req, res);
  if(!session) return;
  try{
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || 'avaliacao');
    const col = db.collection('submissions');
    const docs = await col.find({}).sort({ createdAt:-1 }).limit(500).toArray();
    return res.status(200).json(docs);
  }catch(e){ console.error(e); return res.status(500).json({ error:String(e) }); }
}
