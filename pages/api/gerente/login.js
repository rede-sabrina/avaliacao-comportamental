import bcrypt from 'bcryptjs';
import { clientPromise } from '../../../lib/mongodb.js';
import { ensureStoreManagers, signGerenteToken, buildGerenteCookie } from '../../../lib/auth.js';

const MAX_ATTEMPTS = 10;
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

export default async function handler(req, res){
  if(req.method !== 'POST') return res.status(405).end();
  
  const { user, pass } = req.body || {};
  if(!user || !pass) return res.status(400).json({ error: 'missing_credentials' });

  const ip = getClientIp(req);
  const limiterKey = `${ip}:${String(user).trim().toLowerCase()}`;
  if(isRateLimited(limiterKey)){
    return res.status(429).json({ error: 'too_many_attempts' });
  }

  try{
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || 'avaliacao');
    await ensureStoreManagers(db);

    const users = db.collection('users');
    const identifier = String(user).trim().toLowerCase();

    const loginUser = await users.findOne({
      username: identifier,
      role: 'gerente'
    });

    if(!loginUser || !loginUser.passwordHash){
      registerAttempt(limiterKey, false);
      return res.status(401).json({ error: 'invalid_credentials' });
    }

    const ok = await bcrypt.compare(pass, loginUser.passwordHash);
    if(!ok){
      registerAttempt(limiterKey, false);
      return res.status(401).json({ error: 'invalid_credentials' });
    }

    if(loginUser.active === false){
      return res.status(403).json({ error: 'inactive' });
    }

    const token = signGerenteToken(loginUser);
    res.setHeader('Set-Cookie', buildGerenteCookie(token));
    registerAttempt(limiterKey, true);

    return res.status(200).json({
      ok: true,
      user: {
        id: String(loginUser._id),
        name: loginUser.name,
        username: loginUser.username,
        role: loginUser.role,
        loja_id: loginUser.loja_id
      }
    });
  }catch(e){
    console.error('gerente login error', e);
    return res.status(500).json({ error: 'internal_error' });
  }
}
