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

    // Check and insert/update SJT questions
    let sjtInserted = 0;
    let sjtUpdated = 0;
    for(const q of sjtQuestions){
      const filter = { test_type: 'comportamental', text: q.text };
      const exists = await col.findOne(filter);
      if(!exists){
        await col.insertOne({ ...q, createdAt: new Date() });
        sjtInserted++;
      } else {
        // update existing question with seed values (keep createdAt)
        await col.updateOne(filter, { $set: { ...q, updatedAt: new Date() } });
        sjtUpdated++;
      }
    }

    // Check and insert/update Ethics questions
    let ethicsInserted = 0;
    let ethicsUpdated = 0;
    for(const q of ethicsQuestions){
      const filter = { test_type: 'etica', text: q.text };
      const exists = await col.findOne(filter);
      if(!exists){
        await col.insertOne({ ...q, createdAt: new Date() });
        ethicsInserted++;
      } else {
        await col.updateOne(filter, { $set: { ...q, updatedAt: new Date() } });
        ethicsUpdated++;
      }
    }

    return res.status(200).json({ 
      msg: 'Import concluído',
      sjtInserted,
      sjtUpdated,
      ethicsInserted,
      ethicsUpdated,
      totalInserted: sjtInserted + ethicsInserted,
      totalUpdated: sjtUpdated + ethicsUpdated
    });
  }catch(e){
    console.error('import-new-tests error', e);
    return res.status(500).json({ error: String(e) });
  }
}
