import bcrypt from 'bcryptjs';
import { clientPromise } from '../../../lib/mongodb';
import { ensureDefaultAdmin, signAdminToken, buildAuthCookie } from '../../../lib/auth';

const MAX_ATTEMPTS = 8;
const WINDOW_MS = 10 * 60 * 1000;
const ATTEMPTS = new Map();

function getClientIp(req){
  const fwd = req.headers['x-forwarded-for'];
  if(Array.isArray(fwd) && fwd.length > 0) return String(fwd[0]).split(',')[0].trim();
  if(typeof fwd === 'string' && fwd.length > 0) return fwd.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

function isRateLimited(key){
  const now = Date.now();
  const current = ATTEMPTS.get(key);
  if(!current){
    ATTEMPTS.set(key, { count: 0, resetAt: now + WINDOW_MS });
    return false;
  }
  if(now > current.resetAt){
    ATTEMPTS.set(key, { count: 0, resetAt: now + WINDOW_MS });
    return false;
  }
  return current.count >= MAX_ATTEMPTS;
}

function registerAttempt(key, success){
  const now = Date.now();
  const current = ATTEMPTS.get(key) || { count: 0, resetAt: now + WINDOW_MS };
  if(now > current.resetAt){
    current.count = 0;
    current.resetAt = now + WINDOW_MS;
  }
  if(success){
    ATTEMPTS.delete(key);
    return;
  }
  current.count += 1;
  ATTEMPTS.set(key, current);
}

export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).end();
  const { user, pass } = req.body;
  if(!user || !pass) return res.status(400).json({ error:'missing' });

  const ip = getClientIp(req);
  const limiterKey = `${ip}:${String(user).trim().toLowerCase()}`;
  if(isRateLimited(limiterKey)){
    return res.status(429).json({ error:'too_many_attempts' });
  }

  try{
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || 'avaliacao');
    await ensureDefaultAdmin(db);

    const users = db.collection('users');
    const identifier = String(user).trim();
    const loginUser = await users.findOne({
      $or: [
        { username: identifier },
        { email: identifier.toLowerCase() }
      ]
    });

    if(!loginUser || !loginUser.passwordHash){
      registerAttempt(limiterKey, false);
      return res.status(401).json({ error:'invalid' });
    }

    const ok = await bcrypt.compare(pass, loginUser.passwordHash);
    if(!ok){
      registerAttempt(limiterKey, false);
      return res.status(401).json({ error:'invalid' });
    }
    if(loginUser.active === false) return res.status(403).json({ error:'inactive' });
    if(loginUser.role !== 'admin') return res.status(403).json({ error:'forbidden' });

    const token = signAdminToken(loginUser);
    res.setHeader('Set-Cookie', buildAuthCookie(token));
    registerAttempt(limiterKey, true);

    return res.status(200).json({
      user: {
        id: String(loginUser._id),
        name: loginUser.name,
        username: loginUser.username,
        email: loginUser.email,
        role: loginUser.role
      }
    });
  }catch(e){
    console.error('admin login error', e);
    return res.status(500).json({ error:'internal_error' });
  }
}
