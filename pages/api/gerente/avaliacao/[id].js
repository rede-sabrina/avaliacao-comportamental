import { requireGerente } from '../../../../lib/auth.js';
import { getStoreEmployeeResult, deleteStoreEmployeeResult } from '../../../../lib/behavior-service.js';

export default async function handler(req, res){
  // Validar sessão do gerente e obter loja_id permanentemente do token
  const session = requireGerente(req, res);
  if(!session) return;

  const { id } = req.query;
  if(!id) return res.status(400).json({ error: 'id_obrigatorio' });

  if(req.method === 'GET'){
    try{
      // A busca filtra estritamente por tipo_avaliacao: 'funcionario' e loja_id: session.loja_id
      const result = await getStoreEmployeeResult(session.loja_id, id);

      if(!result){
        return res.status(404).json({ error: 'Avaliação não encontrada ou sem permissão de acesso.' });
      }

      return res.status(200).json({
        _id: String(result._id),
        nome_funcionario: result.nome_funcionario || result.candidateName,
        loja_id: result.loja_id,
        tipo_avaliacao: result.tipo_avaliacao,
        data_avaliacao: result.data_avaliacao || result.completedAt || result.createdAt,
        scores: result.scores || {},
        dominantProfiles: result.dominantProfiles || [],
        answers: result.answers || [],
        total: result.total || 100,
        html: result.html
      });
    }catch(e){
      console.error('Erro ao buscar avaliação do colaborador:', e);
      return res.status(500).json({ error: String(e) });
    }
  }

  if(req.method === 'DELETE'){
    try{
      // Exclusão estritamente restrita à loja do gerente autenticado
      const deleted = await deleteStoreEmployeeResult(session.loja_id, id);
      if(!deleted){
        return res.status(404).json({ error: 'Avaliação não encontrada ou sem permissão para exclusão.' });
      }
      return res.status(200).json({ ok: true, deleted: true });
    }catch(e){
      console.error('Erro ao excluir avaliação do colaborador:', e);
      return res.status(500).json({ error: String(e) });
    }
  }

  return res.status(405).end();
}
