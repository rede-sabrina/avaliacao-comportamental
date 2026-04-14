import { clientPromise } from '../../../lib/mongodb';
import { requireAdmin } from '../../../lib/auth';

export default async function handler(req,res){
  const session = requireAdmin(req, res);
  if(!session) return;

  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB || 'avaliacao');
  const col = db.collection('questions');

  try{
    if(req.method === 'GET'){
      const docs = await col.find({}).sort({ order: 1 }).toArray();
      return res.status(200).json(docs);
    }

    if(req.method === 'POST'){
      const q = req.body;
      if(!q) return res.status(400).json({ error: 'missing payload' });
      // support batch insert (array) or single object
      if(Array.isArray(q)){
        const toInsert = q.map(it => ({ ...it, createdAt: new Date() }));
        const r = await col.insertMany(toInsert);
        return res.status(201).json({ ok:true, inserted: r.insertedCount });
      }
      // single object
      if(!q.text) return res.status(400).json({ error: 'missing text' });
      q.createdAt = new Date();
      const r = await col.insertOne(q);
      return res.status(201).json({ ok:true, insertedId: r.insertedId });
    }

    if(req.method === 'PUT'){
      const { _id, ...rest } = req.body;
      if(!_id) return res.status(400).json({ error:'missing id' });
      const { ObjectId } = require('mongodb');
      const r = await col.updateOne({ _id: new ObjectId(_id) }, { $set: rest });
      return res.status(200).json({ ok:true, matched: r.matchedCount, modified: r.modifiedCount });
    }

    if(req.method === 'DELETE'){
      const { id } = req.query;
      if(!id) return res.status(400).json({ error:'missing id' });
      const { ObjectId } = require('mongodb');
      await col.deleteOne({ _id: new ObjectId(id) });
      return res.status(200).json({ ok:true });
    }

    return res.status(405).end();
  }catch(e){ console.error('questions api error', e); return res.status(500).json({ error: String(e) }); }
}
