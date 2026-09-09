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
    const { behaviorStyleBlocks, BEHAVIOR_STYLE_META } = await import('../../../lib/seed/behavior-style-questions.js');

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

    // Check and insert/update Behavior Style questions
    let behaviorInserted = 0;
    let behaviorUpdated = 0;
    // Flatten blocks into individual questions for storage
    const behaviorQuestions = behaviorStyleBlocks.flatMap(block => 
      block.items.map(item => ({
        test_type: 'estilo-comportamento',
        block: block.block,
        dimension: item.dimension,
        label: item.label,
        traits: item.traits,
        category: 'Estilo de Comportamento',
        catClass: 'cat-sit',
        type: 'options',
        text: `${item.dimension}: ${item.label}`,
        options: [
          { letter: 'A', text: '1 - Menos parecido', score: 1 },
          { letter: 'B', text: '2', score: 2 },
          { letter: 'C', text: '3', score: 3 },
          { letter: 'D', text: '4 - Mais parecido', score: 4 }
        ]
      }))
    );

    for(const q of behaviorQuestions){
      const filter = { test_type: 'estilo-comportamento', block: q.block, dimension: q.dimension };
      const exists = await col.findOne(filter);
      if(!exists){
        await col.insertOne({ ...q, createdAt: new Date() });
        behaviorInserted++;
      } else {
        await col.updateOne(filter, { $set: { ...q, updatedAt: new Date() } });
        behaviorUpdated++;
      }
    }

    return res.status(200).json({ 
      msg: 'Import concluído',
      sjtInserted,
      sjtUpdated,
      ethicsInserted,
      ethicsUpdated,
      behaviorInserted,
      behaviorUpdated,
      totalInserted: sjtInserted + ethicsInserted + behaviorInserted,
      totalUpdated: sjtUpdated + ethicsUpdated + behaviorUpdated
    });
  }catch(e){
    console.error('import-new-tests error', e);
    return res.status(500).json({ error: String(e) });
  }
}
