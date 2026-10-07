import { requireGerente } from '../../../lib/auth.js';

export default function handler(req, res){
  if(req.method !== 'GET') return res.status(405).end();
  const session = requireGerente(req, res);
  if(!session) return;

  return res.status(200).json({
    ok: true,
    user: {
      username: session.username,
      name: session.name,
      role: session.role,
      loja_id: session.loja_id
    }
  });
}
