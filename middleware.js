import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(req){
  const { pathname, search } = req.nextUrl;

  // ADMIN PROTECTION
  if(pathname.startsWith('/admin/login')) return NextResponse.next();

  if(pathname.startsWith('/admin')){
    const token = req.cookies.get('admin_token')?.value;
    if(!token){
      const url = new URL('/admin/login', req.url);
      if(pathname !== '/admin/login') url.searchParams.set('next', pathname + search);
      return NextResponse.redirect(url);
    }

    const jwtSecret = process.env.JWT_SECRET;
    if(!jwtSecret){
      const url = new URL('/admin/login', req.url);
      url.searchParams.set('expired', '1');
      return NextResponse.redirect(url);
    }
    const secret = new TextEncoder().encode(jwtSecret);
    try{
      const { payload } = await jwtVerify(token, secret);
      if(payload.role !== 'admin') throw new Error('forbidden');
    }catch(_e){
      const url = new URL('/admin/login', req.url);
      url.searchParams.set('expired', '1');
      const res = NextResponse.redirect(url);
      res.cookies.set('admin_token', '', { path: '/', maxAge: 0 });
      return res;
    }

    return NextResponse.next();
  }

  // GERENTE PROTECTION
  if(pathname.startsWith('/gerente/login')) return NextResponse.next();

  if(pathname.startsWith('/gerente')){
    const token = req.cookies.get('gerente_token')?.value;
    if(!token){
      const url = new URL('/gerente/login', req.url);
      if(pathname !== '/gerente/login') url.searchParams.set('next', pathname + search);
      return NextResponse.redirect(url);
    }

    const jwtSecret = process.env.JWT_SECRET;
    if(!jwtSecret){
      const url = new URL('/gerente/login', req.url);
      url.searchParams.set('expired', '1');
      return NextResponse.redirect(url);
    }
    const secret = new TextEncoder().encode(jwtSecret);
    try{
      const { payload } = await jwtVerify(token, secret);
      if(payload.role !== 'gerente' || !payload.loja_id) throw new Error('forbidden');
    }catch(_e){
      const url = new URL('/gerente/login', req.url);
      url.searchParams.set('expired', '1');
      const res = NextResponse.redirect(url);
      res.cookies.set('gerente_token', '', { path: '/', maxAge: 0 });
      return res;
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/gerente/:path*'],
};

