import { submitBehaviorStyleTest } from '../../../lib/behavior-service.js';

export default async function handler(req, res){
  if(req.method !== 'POST') return res.status(405).end();

  try{
    const { nome_funcionario, loja_id, answers } = req.body || {};

    if(!nome_funcionario || !String(nome_funcionario).trim()){
      return res.status(400).json({ error: 'Por favor, informe o seu nome completo.' });
    }

    if(!loja_id){
      return res.status(400).json({ error: 'Por favor, selecione a sua loja.' });
    }

    const numLoja = parseInt(loja_id, 10);
    if(isNaN(numLoja) || numLoja < 1 || numLoja > 15){
      return res.status(400).json({ error: 'Loja inválida. Selecione uma loja de 01 a 15.' });
    }

    const normalizedLoja = String(numLoja).padStart(2, '0');

    const result = await submitBehaviorStyleTest({
      tipo_avaliacao: 'funcionario',
      nome_funcionario: String(nome_funcionario).trim(),
      loja_id: normalizedLoja,
      answers
    });

    return res.status(201).json({
      ok: true,
      id: String(result._id),
      nome_funcionario: result.nome_funcionario,
      loja_id: result.loja_id,
      data_avaliacao: result.data_avaliacao
    });
  }catch(e){
    console.error('Erro na submissão de avaliação de funcionário:', e);
    return res.status(400).json({ error: String(e.message || e) });
  }
}
