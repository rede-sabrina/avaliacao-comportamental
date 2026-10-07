import { requireGerente } from '../../../lib/auth.js';
import { listStoreEmployeeResults } from '../../../lib/behavior-service.js';

export default async function handler(req, res){
  if(req.method !== 'GET') return res.status(405).end();
  
  // Autenticação e extração obrigatória de loja_id do token verificado
  const session = requireGerente(req, res);
  if(!session) return;

  try{
    const results = await listStoreEmployeeResults(session.loja_id);

    // Mapear dados retornados
    const items = results.map(doc => ({
      _id: String(doc._id),
      id: String(doc._id),
      nome: doc.nome_funcionario || doc.candidateName,
      loja_id: doc.loja_id,
      tipo_avaliacao: doc.tipo_avaliacao,
      data_avaliacao: doc.data_avaliacao || doc.completedAt || doc.createdAt,
      scores: doc.scores || {},
      dominantProfiles: doc.dominantProfiles || [],
      total: doc.total || 100
    }));

    return res.status(200).json({
      ok: true,
      loja_id: session.loja_id,
      total: items.length,
      funcionarios: items
    });
  }catch(e){
    console.error('Erro ao listar funcionários da loja:', e);
    return res.status(500).json({ error: String(e) });
  }
}
