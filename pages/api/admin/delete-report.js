import { ObjectId } from 'mongodb';
import { clientPromise } from '../../../lib/mongodb';
import { requireAdmin } from '../../../lib/auth';

export default async function handler(req, res){
  if(req.method !== 'DELETE') return res.status(405).end();
  const session = requireAdmin(req, res);
  if(!session) return;

  const { id } = req.query;
  if(!id) return res.status(400).json({ error: 'id obrigatório' });

  try{
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || 'avaliacao');
    const submissionsCol = db.collection('submissions');
    const behaviorCol = db.collection('behavior_style_results');

    // Try submissions first
    let result = null;
    if(ObjectId.isValid(String(id))){
      result = await submissionsCol.deleteOne({ _id: new ObjectId(String(id)) });
    }
    if(!result || result.deletedCount === 0){
      result = await submissionsCol.deleteOne({ id: String(id) });
      if(result.deletedCount === 0 && !Number.isNaN(Number(id))){
        result = await submissionsCol.deleteOne({ id: Number(id) });
      }
    }

    // If not found, try behavior_style_results
    if(!result || result.deletedCount === 0){
      if(ObjectId.isValid(String(id))){
        result = await behaviorCol.deleteOne({ _id: new ObjectId(String(id)) });
      }
      if(!result || result.deletedCount === 0){
        result = await behaviorCol.deleteOne({ candidateId: String(id) });
      }
    }

    if(!result || result.deletedCount === 0){
      return res.status(404).json({ error: 'relatório não encontrado' });
    }

    return res.status(200).json({ success: true });

  }catch(e){
    console.error('delete-report error', e);
    return res.status(500).json({ error: String(e) });
  }
}