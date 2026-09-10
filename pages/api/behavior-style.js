import { getBehaviorStyleTest, submitBehaviorStyleTest } from '../../lib/behavior-service.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const blocks = await getBehaviorStyleTest();
      return res.status(200).json(blocks);
    } catch (e) {
      console.error('GET /api/behavior-style error', e);
      return res.status(500).json({ error: String(e), stack: e.stack });
    }
  }

  if (req.method === 'POST') {
    try {
      const data = req.body || {};
      console.log('POST /api/behavior-style received:', JSON.stringify(data, null, 2).substring(0, 500));
      const result = await submitBehaviorStyleTest(data);
      return res.status(201).json({ ok: true, attemptNumber: result.attemptNumber, result });
    } catch (e) {
      console.error('POST /api/behavior-style error', e);
      console.error('Stack:', e.stack);
      return res.status(400).json({ error: String(e), stack: e.stack });
    }
  }

  return res.status(405).end();
}