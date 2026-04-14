import { clientPromise } from '../../../lib/mongodb';
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { requireAdmin } from '../../../lib/auth';

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
    const doc = await col.findOne({ id });
    if(!doc) return res.status(404).json({ error:'not found' });

    // generate PDF from stored HTML using puppeteer
    // Build a full HTML document including the global CSS so styles render correctly
    const cssPath = path.join(process.cwd(), 'styles', 'global.css');
    let css = '';
    try { css = fs.readFileSync(cssPath, 'utf8'); } catch (e) { console.warn('Could not read global.css', e); }
    const fonts = `<link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,700;1,400&display=swap" rel="stylesheet">`;
    const bodyHtml = doc.html || (`<div><h1>Resultado de ${doc.name || ''}</h1><p>Score: ${doc.pct}%</p></div>`);
    const fullHtml = `<!doctype html><html><head><meta charset="utf-8">${fonts}<style>${css}</style></head><body>${bodyHtml}</body></html>`;

    const browser = await puppeteer.launch({ args: ['--no-sandbox','--disable-setuid-sandbox'], headless: true });
    const page = await browser.newPage();
    await page.setContent(fullHtml, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();

    res.setHeader('Content-Type','application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="relatorio-${doc.id}.pdf"`);
    return res.status(200).send(pdfBuffer);
  }catch(e){ console.error('pdf error', e); return res.status(500).json({ error:String(e) }); }
}
