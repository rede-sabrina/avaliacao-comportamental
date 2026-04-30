import { ObjectId } from 'mongodb';
import { clientPromise } from '../../../lib/mongodb';
import fs from 'fs';
import path from 'path';
import { requireAdmin } from '../../../lib/auth';

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

export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).end();
  const session = requireAdmin(req, res);
  if(!session) return;

  const { id } = req.body;
  if(!id) return res.status(400).json({ error:'missing id' });

  try{
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || 'avaliacao');
    const col = db.collection('submissions');
    
    // Try to find by _id (ObjectId) first, then fallback to id (string or number)
    let doc = null;
    if(ObjectId.isValid(String(id))){
      doc = await col.findOne({ _id: new ObjectId(String(id)) });
    }
    if(!doc){
      doc = await col.findOne({ id: String(id) });
    }
    if(!doc && !Number.isNaN(Number(id))){
      doc = await col.findOne({ id: Number(id) });
    }
    if(!doc) return res.status(404).json({ error:'not found' });

    // generate PDF from stored HTML using puppeteer
    // Build a full HTML document including the global CSS so styles render correctly
    const cssPath = path.join(process.cwd(), 'styles', 'global.css');
    let css = '';
    try { css = fs.readFileSync(cssPath, 'utf8'); } catch (e) { console.warn('Could not read global.css', e); }
    const fonts = `<link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,700;1,400&display=swap" rel="stylesheet">`;
    let bodyHtml = doc.html || (`<div><h1>Resultado de ${doc.name || ''}</h1><p>Score: ${doc.pct}%</p></div>`);
    // Strip interactive download buttons or controls that should not appear in printed PDF
    try{
      bodyHtml = bodyHtml.replace(/<button[^>]*class=["']?btn-pdf["']?[^>]*>[\s\S]*?<\/button>/gi, '');
      // also remove any script tags for safety
      bodyHtml = bodyHtml.replace(/<script[\s\S]*?<\/script>/gi, '');
    }catch(e){ /* ignore */ }

    // If saved HTML already contains a full document, use it directly; otherwise wrap with head/style
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

    // Build a friendly filename using candidate name and test type
    function slugify(s){ return String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,''); }
    const baseName = doc.name ? slugify(doc.name) : (doc.id || 'relatorio');
    const typeLabel = doc.test_type ? slugify(doc.test_type) : 'relatorio';
    const filename = `${baseName}_${typeLabel}.pdf`;

    res.setHeader('Content-Type','application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(pdfBuffer);
  }catch(e){ console.error('pdf error', e); return res.status(500).json({ error:String(e) }); }
}
