import { clientPromise } from './mongodb.js';
import { calculateBehaviorResult, validateBehaviorAnswers, generateBehaviorResultHtml } from './behavior-calculator.js';
import { BEHAVIOR_STYLE_META } from './seed/behavior-style-questions.js';

const COLLECTION_NAME = 'behavior_style_results';
const TEST_TYPE = 'estilo-comportamento';

/**
 * Obtém os dados do teste (blocos) para o frontend
 */
export async function getBehaviorStyleTest() {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB || 'avaliacao');
  
  // Buscar do banco se existir, senão usar seed
  const col = db.collection('questions');
  const docs = await col.find({ test_type: TEST_TYPE }).sort({ block: 1, dimension: 1 }).toArray();
  
  if (docs.length > 0) {
    // Agrupar por bloco
    const blocksMap = {};
    for (const doc of docs) {
      if (!blocksMap[doc.block]) {
        blocksMap[doc.block] = {
          block: doc.block,
          title: `Bloco ${doc.block}`,
          items: []
        };
      }
      blocksMap[doc.block].items.push({
        dimension: doc.dimension,
        label: doc.label,
        traits: doc.traits || []
      });
    }
    return Object.values(blocksMap).sort((a, b) => a.block - b.block);
  }
  
  // Fallback: usar seed estático
  const { behaviorStyleBlocks } = await import('./seed/behavior-style-questions.js');
  return behaviorStyleBlocks;
}

/**
 * Salva o resultado do teste
 * @param {Object} data - { candidateId, candidateName, candidateCpf, answers }
 * @returns {Object} Resultado salvo
 */
export async function submitBehaviorStyleTest(data) {
  const { candidateId, candidateName, candidateCpf, answers } = data;
  
  if (!candidateId) {
    throw new Error('candidateId é obrigatório');
  }
  if (!candidateName || !candidateName.trim()) {
    throw new Error('Nome do candidato é obrigatório');
  }
  if (!Array.isArray(answers) || answers.length !== BEHAVIOR_STYLE_META.totalBlocks) {
    throw new Error(`Respostas inválidas: esperados ${BEHAVIOR_STYLE_META.totalBlocks} blocos`);
  }

  // Validar respostas no backend
  const validation = validateBehaviorAnswers(answers);
  if (!validation.valid) {
    throw new Error('Validação falhou: ' + validation.errors.join('; '));
  }

  // Calcular resultado
  const result = calculateBehaviorResult(answers);
  const html = generateBehaviorResultHtml(result, { name: candidateName, cpf: candidateCpf });
  const completedAt = new Date();

  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB || 'avaliacao');
  const col = db.collection(COLLECTION_NAME);

  // Contar tentativas existentes para gerar número da tentativa
  const existingCount = await col.countDocuments({ candidateId: String(candidateId) });
  const attemptNumber = existingCount + 1;

  const doc = {
    candidateId: String(candidateId),
    candidateName: candidateName.trim(),
    candidateCpf: candidateCpf ? String(candidateCpf).replace(/\D/g, '') : '',
    attemptNumber,
    answers,
    scores: {
      dominancia: result.dominancia,
      influencia: result.influencia,
      estabilidade: result.estabilidade,
      conformidade: result.conformidade
    },
    dominantProfiles: result.dominantProfiles,
    total: result.total,
    html,
    test_type: TEST_TYPE,
    completedAt,
    createdAt: completedAt
  };

  // Remover índice único em candidateId se existir (para permitir múltiplas tentativas)
  try {
    await col.dropIndex('candidateId_1');
  } catch (e) {
    // Índice não existe ou erro ignorável
  }

  // Inserir novo documento (permite múltiplas tentativas)
  const insertResult = await col.insertOne(doc);

  return { ...doc, _id: insertResult.insertedId, attemptNumber };
}

/**
 * Busca resultado mais recente por candidateId
 * @param {string} candidateId 
 * @returns {Object|null}
 */
export async function getBehaviorStyleResult(candidateId) {
  if (!candidateId) return null;
  
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB || 'avaliacao');
  const col = db.collection(COLLECTION_NAME);
  
  return await col.findOne({ candidateId: String(candidateId) }, { sort: { attemptNumber: -1 } });
}

/**
 * Busca todas as tentativas de um candidato
 * @param {string} candidateId 
 * @returns {Array}
 */
export async function getBehaviorStyleAttempts(candidateId) {
  if (!candidateId) return [];
  
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB || 'avaliacao');
  const col = db.collection(COLLECTION_NAME);
  
  return await col.find({ candidateId: String(candidateId) }).sort({ attemptNumber: 1 }).toArray();
}

/**
 * Busca todos os resultados (para admin)
 * @returns {Array}
 */
export async function listBehaviorStyleResults() {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB || 'avaliacao');
  const col = db.collection(COLLECTION_NAME);
  
  return await col.find({}).sort({ completedAt: -1 }).toArray();
}