import fs from 'fs';
import path from 'path';
import { requireGerente } from '../../../lib/auth.js';
import { getStoreEmployeeResult } from '../../../lib/behavior-service.js';

function prepareChromiumEnvForVercel(){
  if(!process.env.VERCEL) return;
  if(process.env.AWS_EXECUTION_ENV || process.env.AWS_LAMBDA_JS_RUNTIME) return;

  const major = Number(process.versions.node.split('.')[0] || '20');
  process.env.AWS_EXECUTION_ENV = major >= 20 ? 'AWS_Lambda_nodejs20.x' : 'AWS_Lambda_nodejs18.x';
}

async function launchPdfBrowser(){
  const isVercel = !!process.env.VERCEL;

  if(isVercel){
    prepareChromiumEnvForVercel();
    const chromium = (await import('@sparticuz/chromium')).default;
    const puppeteerCore = (await import('puppeteer-core')).default;

    return puppeteerCore.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });
  }

  const puppeteer = (await import('puppeteer')).default;
  return puppeteer.launch({ args: ['--no-sandbox','--disable-setuid-sandbox'], headless: true });
}

export default async function handler(req, res){
  if(req.method !== 'POST') return res.status(405).end();
  
  // Validar sessão do gerente e garantir loja_id
  const session = requireGerente(req, res);
  if(!session) return;

  const { id } = req.body || {};
  if(!id) return res.status(400).json({ error: 'missing id' });

  try{
    // Restrito estritamente à loja do gerente
    const doc = await getStoreEmployeeResult(session.loja_id, id);
    if(!doc){
      return res.status(404).json({ error: 'Avaliação não encontrada ou sem permissão de acesso.' });
    }

    const cssPath = path.join(process.cwd(), 'styles', 'global.css');
    let css = '';
    try { css = fs.readFileSync(cssPath, 'utf8'); } catch (e) { console.warn('Could not read global.css', e); }
    const fonts = `<link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,700;1,400&display=swap" rel="stylesheet">`;
    let bodyHtml = doc.html || (`<div><h1>Resultado de ${doc.nome_funcionario || ''}</h1><p>Loja: ${doc.loja_id}</p></div>`);
    
    try{
      bodyHtml = bodyHtml.replace(/<button[^>]*class=["']?btn-pdf["']?[^>]*>[\s\S]*?<\/button>/gi, '');
      bodyHtml = bodyHtml.replace(/<script[\s\S]*?<\/script>/gi, '');
    }catch(_e){ /* ignore */ }

    let fullHtml = '';
    if(/<html[\s>]/i.test(bodyHtml) || /<!doctype/i.test(bodyHtml)){
      fullHtml = bodyHtml;
    } else {
      fullHtml = `<!doctype html><html><head><meta charset="utf-8">${fonts}<style>${css}</style></head><body>${bodyHtml}</body></html>`;
    }

    const browser = await launchPdfBrowser();
    const page = await browser.newPage();
    await page.setContent(fullHtml, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();

    function slugify(s){ return String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,''); }
    const name = doc.nome_funcionario || doc.candidateName || 'funcionario';
    const filename = `${slugify(name)}_loja${doc.loja_id}_disc.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(pdfBuffer);
  }catch(e){
    console.error('gerente pdf error', e);
    return res.status(500).json({ error: String(e) });
  }
}
