import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';
import { clientPromise } from '../../../lib/mongodb';
import { requireAdmin } from '../../../lib/auth';

function safeUser(u){
  return {
    _id: String(u._id),
    name: u.name || '',
    username: u.username || '',
    email: u.email || '',
    role: u.role || 'admin',
    active: u.active !== false,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt
  };
}

export default async function handler(req, res){
  const session = requireAdmin(req, res);
  if(!session) return;

  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB || 'avaliacao');
  const users = db.collection('users');

  if(req.method === 'GET'){
    const docs = await users.find({}).sort({ createdAt: -1 }).toArray();
    return res.status(200).json(docs.map(safeUser));
  }

  if(req.method === 'POST'){
    const { name, username, email, role, password, active } = req.body || {};
    if(!username || !email || !password) return res.status(400).json({ error: 'username_email_password_required' });

    const normalizedUsername = String(username).trim();
    const normalizedEmail = String(email).trim().toLowerCase();

    const exists = await users.findOne({
      $or: [
        { username: normalizedUsername },
        { email: normalizedEmail }
      ]
    });
    if(exists) return res.status(409).json({ error: 'user_exists' });

    const passwordHash = await bcrypt.hash(password, 10);
    const now = new Date();
    const doc = {
      name: name || normalizedUsername,
      username: normalizedUsername,
      email: normalizedEmail,
      role: role || 'admin',
      active: active !== false,
      passwordHash,
      createdAt: now,
      updatedAt: now
    };

    const r = await users.insertOne(doc);
    return res.status(201).json({ ok: true, user: safeUser({ ...doc, _id: r.insertedId }) });
  }

  if(req.method === 'PUT'){
    const { _id, name, username, email, role, active } = req.body || {};
    if(!_id) return res.status(400).json({ error: 'missing_id' });

    const target = await users.findOne({ _id: new ObjectId(_id) });
    if(!target) return res.status(404).json({ error: 'not_found' });

    const updates = {
      updatedAt: new Date()
    };
    if(name !== undefined) updates.name = name;
    if(username !== undefined) updates.username = String(username).trim();
    if(email !== undefined) updates.email = String(email).trim().toLowerCase();
    if(role !== undefined) updates.role = role;
    if(active !== undefined) updates.active = !!active;

    if((updates.username && updates.username !== target.username) || (updates.email && updates.email !== target.email)){
      const exists = await users.findOne({
        _id: { $ne: target._id },
        $or: [
          { username: updates.username || target.username },
          { email: updates.email || target.email }
        ]
      });
      if(exists) return res.status(409).json({ error: 'user_exists' });
    }

    await users.updateOne({ _id: target._id }, { $set: updates });
    const updated = await users.findOne({ _id: target._id });
    return res.status(200).json({ ok: true, user: safeUser(updated) });
  }

  if(req.method === 'DELETE'){
    const { id } = req.query;
    if(!id) return res.status(400).json({ error: 'missing_id' });

    const target = await users.findOne({ _id: new ObjectId(String(id)) });
    if(!target) return res.status(404).json({ error: 'not_found' });

    if(String(target._id) === String(session.sub)){
      return res.status(400).json({ error: 'cannot_delete_own_user' });
    }

    await users.deleteOne({ _id: target._id });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).end();
}
