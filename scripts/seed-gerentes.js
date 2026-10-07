import { clientPromise } from '../lib/mongodb.js';
import { ensureStoreManagers } from '../lib/auth.js';

async function run() {
  try {
    console.log('Iniciando seed de gerentes das 15 lojas...');
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || 'avaliacao');
    await ensureStoreManagers(db);
    console.log('Gerentes das lojas 01 a 15 verificados/criados com sucesso!');
    process.exit(0);
  } catch (err) {
    console.error('Erro ao semear gerentes:', err);
    process.exit(1);
  }
}

run();
