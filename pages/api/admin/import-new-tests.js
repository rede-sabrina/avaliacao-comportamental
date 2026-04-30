import { clientPromise } from '../../../lib/mongodb';

export default async function handler(req, res){
  if(req.method !== 'POST') return res.status(405).end();
  
  try{
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || 'avaliacao');
    const col = db.collection('questions');

    // Import SJT questions (Comportamental)
    const { sjtQuestions, DIM_MAX_SJT } = await import('../../../lib/seed/sjt-questions.js');
    const { ethicsQuestions, DIM_MAX_ETHICS } = await import('../../../lib/seed/ethics-questions.js');

    // Check and insert SJT questions
    let sjtInserted = 0;
    for(const q of sjtQuestions){
      const exists = await col.findOne({ test_type: 'comportamental', text: q.text });
      if(!exists){
        await col.insertOne({ ...q, createdAt: new Date() });
        sjtInserted++;
      }
    }

    // Check and insert Ethics questions
    let ethicsInserted = 0;
    for(const q of ethicsQuestions){
      const exists = await col.findOne({ test_type: 'etica', text: q.text });
      if(!exists){
        await col.insertOne({ ...q, createdAt: new Date() });
        ethicsInserted++;
      }
    }

    return res.status(200).json({ 
      msg: 'Import concluído',
      sjtInserted,
      ethicsInserted,
      total: sjtInserted + ethicsInserted
    });
  }catch(e){
    console.error('import-new-tests error', e);
    return res.status(500).json({ error: String(e) });
  }
}
