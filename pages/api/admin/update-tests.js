import { clientPromise } from '../../../lib/mongodb';

export default async function handler(req, res){
  if(req.method !== 'POST') return res.status(405).end();
  try{
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || 'avaliacao');
    const col = db.collection('questions');

    const { sjtQuestions } = await import('../../../lib/seed/sjt-questions.js');

    let updated = 0;
    for(const q of sjtQuestions){
      const exists = await col.findOne({ test_type: 'comportamental', text: q.text });
      if(exists){
        // update options and flag fields to match seed
        await col.updateOne({ _id: exists._id }, { $set: { options: q.options, dimension: q.dimension, category: q.category, catClass: q.catClass, test_type: q.test_type } });
        updated++;
      }
    }

    return res.status(200).json({ msg: 'Update concluído', updated });
  }catch(e){
    console.error('update-tests error', e);
    return res.status(500).json({ error: String(e) });
  }
}
