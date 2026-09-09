import { getBehaviorStyleResult } from '../../../lib/behavior-service.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  try {
    const { candidateId } = req.query;
    if (!candidateId) {
      return res.status(400).json({ error: 'candidateId é obrigatório' });
    }

    const result = await getBehaviorStyleResult(candidateId);
    if (!result) {
      return res.status(404).json({ error: 'Resultado não encontrado' });
    }

    return res.status(200).json(result);
  } catch (e) {
    console.error('GET /api/behavior-style/[candidateId] error', e);
    return res.status(500).json({ error: String(e) });
  }
}