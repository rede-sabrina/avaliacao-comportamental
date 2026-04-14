import { clientPromise } from '../../lib/mongodb';

export default async function handler(req, res){
  if(req.method !== 'GET') return res.status(405).end();
  try{
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || 'avaliacao');
    const col = db.collection('questions');
    const docs = await col.find({}).sort({ createdAt: 1 }).toArray();
    return res.status(200).json(docs);
  }catch(e){
    console.error('GET /api/questions error', e);
    return res.status(500).json({ error: String(e) });
  }
}
