import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_COOKIE = 'admin_token';

export function getJwtSecret(){
  const secret = process.env.JWT_SECRET;
  if(!secret){
    throw new Error('JWT_SECRET is required');
  }
  return secret;
}

export function signAdminToken(user){
  return jwt.sign(
    {
      sub: String(user._id || user.id || user.username || user.email),
      username: user.username || null,
      email: user.email || null,
      name: user.name || null,
      role: user.role || 'admin'
    },
    getJwtSecret(),
    { expiresIn: '8h' }
  );
}

export function parseCookies(cookieHeader){
  const cookie = cookieHeader || '';
  const parts = cookie.split(';');
  const parsed = {};
  for(const p of parts){
    const [k, ...rest] = p.trim().split('=');
    if(!k) continue;
    parsed[k] = decodeURIComponent(rest.join('='));
  }
  return parsed;
}

export function getTokenFromReq(req){
  const auth = req.headers.authorization || '';
  if(auth.startsWith('Bearer ')) return auth.slice(7);
  const cookies = parseCookies(req.headers.cookie || '');
  return cookies[JWT_COOKIE] || null;
}

export function verifyToken(token){
  return jwt.verify(token, getJwtSecret());
}

export function requireAdmin(req, res){
  const token = getTokenFromReq(req);
  if(!token){
    res.status(401).json({ error: 'no token' });
    return null;
  }

  try{
    const payload = verifyToken(token);
    if(!payload || payload.role !== 'admin'){
      res.status(403).json({ error: 'forbidden' });
      return null;
    }
    return payload;
  }catch(_e){
    res.status(401).json({ error: 'invalid token' });
    return null;
  }
}

export async function ensureDefaultAdmin(db){
  const users = db.collection('users');
  const existing = await users.countDocuments();
  if(existing > 0) return;

  const username = process.env.ADMIN_USER;
  const password = process.env.ADMIN_PASS;
  const email = (process.env.ADMIN_EMAIL || 'admin@local.dev').toLowerCase();
  if(!username || !password){
    throw new Error('No admin users found. Set ADMIN_USER and ADMIN_PASS to bootstrap the first admin user.');
  }
  const passwordHash = await bcrypt.hash(password, 10);

  await users.insertOne({
    name: 'Administrador',
    username,
    email,
    role: 'admin',
    active: true,
    passwordHash,
    createdAt: new Date(),
    updatedAt: new Date()
  });
}

export function buildAuthCookie(token){
  const isProd = process.env.NODE_ENV === 'production';
  const maxAge = 60 * 60 * 8;
  return `admin_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${isProd ? '; Secure' : ''}`;
}

export function buildClearAuthCookie(){
  const isProd = process.env.NODE_ENV === 'production';
  return `admin_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${isProd ? '; Secure' : ''}`;
}
