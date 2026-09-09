import { clientPromise } from '../../lib/mongodb';

export default async function handler(req, res){
  if(req.method !== 'GET') return res.status(405).end();
  try{
    const { test } = req.query; // test parameter: 'comportamental', 'etica', 'estilo-comportamento'
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || 'avaliacao');
    const col = db.collection('questions');
    
    // Build query filter
    const query = {};
    if(test === 'comportamental'){
      query.test_type = 'comportamental';
    } else if(test === 'etica'){
      query.test_type = 'etica';
    } else if(test === 'estilo-comportamento'){
      query.test_type = 'estilo-comportamento';
    }
    // If no test specified, return all
    
    const docs = await col.find(query).sort({ createdAt: 1 }).toArray();
    return res.status(200).json(docs);
  }catch(e){
    console.error('GET /api/questions error', e);
    return res.status(500).json({ error: String(e) });
  }
}
