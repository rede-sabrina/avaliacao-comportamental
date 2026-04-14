import { clientPromise } from '../../lib/mongodb';

export default async function handler(req, res){
  if(req.method !== 'POST') return res.status(405).end();
  try{
    const data = req.body;
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || 'avaliacao');
    const col = db.collection('submissions');
    await col.insertOne({...data, createdAt: new Date()});
    return res.status(201).json({ ok:true });
  }catch(e){
    console.error('submit error', e);
    return res.status(500).json({ error: String(e) });
  }
}
