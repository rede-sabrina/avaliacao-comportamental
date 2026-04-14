import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';
import { clientPromise } from '../../../lib/mongodb';
import { requireAdmin } from '../../../lib/auth';

export default async function handler(req, res){
  if(req.method !== 'POST') return res.status(405).end();

  const session = requireAdmin(req, res);
  if(!session) return;

  const { userId, newPassword } = req.body || {};
  if(!userId || !newPassword || String(newPassword).length < 6){
    return res.status(400).json({ error: 'invalid_payload' });
  }

  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB || 'avaliacao');
  const users = db.collection('users');

  const target = await users.findOne({ _id: new ObjectId(String(userId)) });
  if(!target) return res.status(404).json({ error: 'not_found' });

  const passwordHash = await bcrypt.hash(String(newPassword), 10);
  await users.updateOne(
    { _id: target._id },
    { $set: { passwordHash, updatedAt: new Date() } }
  );

  return res.status(200).json({ ok: true });
}
