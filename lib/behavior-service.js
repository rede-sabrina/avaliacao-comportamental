import { ObjectId } from 'mongodb';
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
 * Salva o resultado do teste (candidato ou funcionário)
 * @param {Object} data - { tipo_avaliacao, loja_id, nome_funcionario, candidateId, candidateName, candidateCpf, answers }
 * @returns {Object} Resultado salvo
 */
export async function submitBehaviorStyleTest(data) {
  const tipo_avaliacao = data.tipo_avaliacao === 'funcionario' ? 'funcionario' : 'candidato';
  const loja_id = data.loja_id ? String(data.loja_id).padStart(2, '0') : null;
  const nome_funcionario = (data.nome_funcionario || data.candidateName || '').trim();
  const candidateName = (data.candidateName || nome_funcionario || '').trim();
  const candidateCpf = data.candidateCpf ? String(data.candidateCpf).replace(/\D/g, '') : '';
  const answers = data.answers;

  console.log('submitBehaviorStyleTest called with:', {
    tipo_avaliacao,
    loja_id,
    candidateName,
    answersLength: answers?.length
  });

  if (tipo_avaliacao === 'funcionario') {
    if (!nome_funcionario) {
      throw new Error('Nome do funcionário é obrigatório');
    }
    if (!loja_id) {
      throw new Error('Selecione uma loja válida');
    }
  } else {
    // candidato
    if (!candidateName) {
      throw new Error('Nome do candidato é obrigatório');
    }
    if (!data.candidateId && !candidateCpf) {
      throw new Error('Identificador ou CPF do candidato é obrigatório');
    }
  }

  if (!Array.isArray(answers) || answers.length !== BEHAVIOR_STYLE_META.totalBlocks) {
    throw new Error(`Respostas inválidas: esperados ${BEHAVIOR_STYLE_META.totalBlocks} blocos`);
  }

  // Validar respostas no backend com regras de cálculo existentes
  const validation = validateBehaviorAnswers(answers);
  if (!validation.valid) {
    console.error('Validation failed:', validation.errors);
    throw new Error('Validação falhou: ' + validation.errors.join('; '));
  }

  // Calcular resultado
  const result = calculateBehaviorResult(answers);
  const displayName = tipo_avaliacao === 'funcionario' ? nome_funcionario : candidateName;
  const html = generateBehaviorResultHtml(result, {
    name: displayName,
    cpf: candidateCpf,
    loja: loja_id ? `Loja ${loja_id}` : undefined
  });
  const completedAt = new Date();

  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB || 'avaliacao');
  const col = db.collection(COLLECTION_NAME);

  const candidateId = tipo_avaliacao === 'funcionario'
    ? (data.candidateId || `func_${loja_id}_${displayName.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`)
    : String(data.candidateId || `cpf_${candidateCpf}`);

  // Contar tentativas existentes
  const existingCount = await col.countDocuments({ candidateId: String(candidateId) });
  const attemptNumber = existingCount + 1;

  const doc = {
    tipo_avaliacao,
    loja_id: tipo_avaliacao === 'funcionario' ? loja_id : null,
    nome_funcionario: tipo_avaliacao === 'funcionario' ? nome_funcionario : null,
    candidateId: String(candidateId),
    candidateName: displayName,
    candidateCpf,
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
    data_avaliacao: completedAt,
    completedAt,
    createdAt: completedAt
  };

  // Remover índice legado restritivo se existir
  try {
    await col.dropIndex('candidateId_1');
  } catch (_e) {
    // Ignorável
  }

  const insertResult = await col.insertOne(doc);

  return { ...doc, _id: insertResult.insertedId, attemptNumber };
}

/**
 * Busca resultado de candidato mais recente por candidateId (apenas candidatos)
 * @param {string} candidateId 
 * @returns {Object|null}
 */
export async function getBehaviorStyleResult(candidateId) {
  if (!candidateId) return null;
  
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB || 'avaliacao');
  const col = db.collection(COLLECTION_NAME);
  
  return await col.findOne({
    candidateId: String(candidateId),
    $or: [{ tipo_avaliacao: 'candidato' }, { tipo_avaliacao: { $exists: false } }]
  }, { sort: { attemptNumber: -1 } });
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
  
  return await col.find({
    candidateId: String(candidateId),
    $or: [{ tipo_avaliacao: 'candidato' }, { tipo_avaliacao: { $exists: false } }]
  }).sort({ attemptNumber: 1 }).toArray();
}

/**
 * Busca todos os resultados de funcionários de uma loja específica (segurança por loja_id)
 * @param {string} lojaId
 * @returns {Array}
 */
export async function listStoreEmployeeResults(lojaId) {
  if (!lojaId) return [];
  const normalizedLojaId = String(lojaId).padStart(2, '0');
  
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB || 'avaliacao');
  const col = db.collection(COLLECTION_NAME);
  
  return await col.find({
    tipo_avaliacao: 'funcionario',
    loja_id: normalizedLojaId
  }).sort({ completedAt: -1 }).toArray();
}

/**
 * Busca resultado de funcionário por ID garantindo a loja do gerente (segurança estrita)
 * @param {string} lojaId
 * @param {string} resultId
 * @returns {Object|null}
 */
export async function getStoreEmployeeResult(lojaId, resultId) {
  if (!lojaId || !resultId) return null;
  const normalizedLojaId = String(lojaId).padStart(2, '0');
  
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB || 'avaliacao');
  const col = db.collection(COLLECTION_NAME);

  const query = {
    tipo_avaliacao: 'funcionario',
    loja_id: normalizedLojaId
  };

  if (ObjectId.isValid(String(resultId))) {
    query._id = new ObjectId(String(resultId));
  } else {
    query.candidateId = String(resultId);
  }

  return await col.findOne(query);
}

/**
 * Exclui resultado de colaborador por ID garantindo a loja do gerente (segurança estrita)
 * @param {string} lojaId
 * @param {string} resultId
 * @returns {boolean}
 */
export async function deleteStoreEmployeeResult(lojaId, resultId) {
  if (!lojaId || !resultId) return false;
  const normalizedLojaId = String(lojaId).padStart(2, '0');
  
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB || 'avaliacao');
  const col = db.collection(COLLECTION_NAME);

  const query = {
    tipo_avaliacao: 'funcionario',
    loja_id: normalizedLojaId
  };

  if (ObjectId.isValid(String(resultId))) {
    query._id = new ObjectId(String(resultId));
  } else {
    query.candidateId = String(resultId);
  }

  const res = await col.deleteOne(query);
  return res.deletedCount > 0;
}


/**
 * Busca todos os resultados de funcionários de todas as lojas (para visualização no Admin/RH)
 * @param {string|null} lojaId (opcional para filtro)
 * @returns {Array}
 */
export async function listAllEmployeeResults(lojaId = null) {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB || 'avaliacao');
  const col = db.collection(COLLECTION_NAME);
  
  const query = { tipo_avaliacao: 'funcionario' };
  if (lojaId) {
    query.loja_id = String(lojaId).padStart(2, '0');
  }

  return await col.find(query).sort({ completedAt: -1 }).toArray();
}

/**
 * Busca todos os resultados de candidatos (para admin)
 * @returns {Array}
 */
export async function listBehaviorStyleResults() {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB || 'avaliacao');
  const col = db.collection(COLLECTION_NAME);
  
  return await col.find({
    $or: [{ tipo_avaliacao: 'candidato' }, { tipo_avaliacao: { $exists: false } }]
  }).sort({ completedAt: -1 }).toArray();
}