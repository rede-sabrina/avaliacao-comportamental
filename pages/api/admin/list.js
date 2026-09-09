import { clientPromise } from '../../../lib/mongodb';
import { requireAdmin } from '../../../lib/auth';

export default async function handler(req,res){
  if(req.method!=='GET') return res.status(405).end();
  const session = requireAdmin(req, res);
  if(!session) return;
  try{
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || 'avaliacao');
    
    // Fetch from both collections
    const submissionsCol = db.collection('submissions');
    const behaviorCol = db.collection('behavior_style_results');
    
    const [submissions, behaviorResults] = await Promise.all([
      submissionsCol.find({}).sort({ createdAt:-1 }).limit(500).toArray(),
      behaviorCol.find({}).sort({ completedAt:-1 }).limit(500).toArray()
    ]);
    
    // Normalize behavior results to match submissions format
    const normalizedBehavior = behaviorResults.map(doc => ({
      ...doc,
      _id: doc._id,
      id: doc._id,
      name: doc.candidateName,
      cpf: doc.candidateCpf,
      test_type: 'estilo-comportamento',
      pct: doc.total || 100,
      dims: doc.scores || {},
      dimMax: { 
        DOMINÂNCIA: 40, 
        INFLUÊNCIA: 40, 
        ESTABILIDADE: 40, 
        CONFORMIDADE: 40 
      },
      flags: [],
      html: doc.html,
      createdAt: doc.completedAt || doc.createdAt
    }));
    
    // Merge and sort by date
    const allDocs = [...submissions, ...normalizedBehavior].sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );
    
    return res.status(200).json(allDocs);
  }catch(e){ console.error(e); return res.status(500).json({ error:String(e) }); }
}
