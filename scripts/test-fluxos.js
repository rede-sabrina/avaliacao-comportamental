import { clientPromise } from '../lib/mongodb.js';
import { ensureStoreManagers, signGerenteToken, verifyToken } from '../lib/auth.js';
import {
  submitBehaviorStyleTest,
  listStoreEmployeeResults,
  getStoreEmployeeResult,
  deleteStoreEmployeeResult
} from '../lib/behavior-service.js';

// Respostas simuladas válidas para 10 blocos
const mockAnswers = Array.from({ length: 10 }, (_, i) => ({
  block: i + 1,
  dominancia: 4,
  influencia: 3,
  estabilidade: 2,
  conformidade: 1
}));

async function runTests() {
  console.log('=== INICIANDO TESTES AUTOMATIZADOS DE ISOLAMENTO E REGRAS ===\n');
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB || 'avaliacao');

  // 1. Garantir que os 15 gerentes existem
  console.log('1. Testando provisionamento dos 15 gerentes...');
  await ensureStoreManagers(db);
  const usersCol = db.collection('users');
  const gerentes = await usersCol.find({ role: 'gerente' }).toArray();
  if (gerentes.length < 15) {
    throw new Error(`Esperado pelo menos 15 gerentes, encontrado ${gerentes.length}`);
  }
  console.log(`✓ ${gerentes.length} gerentes provisionados com sucesso (loja01 a loja15).\n`);

  // 2. Testar token JWT do gerente
  console.log('2. Testando emissão e validação do token do gerente...');
  const gerenteLoja01 = gerentes.find(g => g.username === 'loja01');
  const token = signGerenteToken(gerenteLoja01);
  const payload = verifyToken(token);
  if (payload.role !== 'gerente' || payload.loja_id !== '01') {
    throw new Error('Payload do token do gerente inválido');
  }
  console.log(`✓ Token emitido com role='${payload.role}' e loja_id='${payload.loja_id}'.\n`);

  // 3. Submeter avaliação de colaborador na Loja 01
  console.log('3. Testando submissão de colaborador na Loja 01...');
  const funcResult = await submitBehaviorStyleTest({
    tipo_avaliacao: 'funcionario',
    nome_funcionario: 'Colaborador Teste 01',
    loja_id: '01',
    answers: mockAnswers
  });
  if (funcResult.tipo_avaliacao !== 'funcionario' || funcResult.loja_id !== '01') {
    throw new Error('Falha nos dados do colaborador registrado');
  }
  console.log(`✓ Colaborador registrado com ID: ${funcResult._id}, Loja: ${funcResult.loja_id}\n`);

  // 4. Submeter avaliação de candidato
  console.log('4. Testando submissão de candidato...');
  const candResult = await submitBehaviorStyleTest({
    tipo_avaliacao: 'candidato',
    candidateName: 'Candidato Teste Isolamento',
    candidateCpf: '11122233344',
    candidateId: 'cpf_11122233344',
    answers: mockAnswers
  });
  if (candResult.tipo_avaliacao !== 'candidato') {
    throw new Error('Falha no tipo de avaliação do candidato');
  }
  console.log(`✓ Candidato registrado com ID: ${candResult._id}, Tipo: ${candResult.tipo_avaliacao}\n`);

  // 5. Verificar que o gerente da Loja 01 vê o colaborador da Loja 01, mas NÃO vê o candidato
  console.log('5. Testando segurança: Gerente Loja 01 listando sua equipe...');
  const listaLoja01 = await listStoreEmployeeResults('01');
  const achouFuncNa01 = listaLoja01.some(f => String(f._id) === String(funcResult._id));
  const achouCandNa01 = listaLoja01.some(f => String(f._id) === String(candResult._id));

  if (!achouFuncNa01) {
    throw new Error('Gerente da Loja 01 não conseguiu ver o colaborador da própria loja!');
  }
  if (achouCandNa01) {
    throw new Error('FALHA DE SEGURANÇA: Candidato vazou na lista do gerente da Loja 01!');
  }
  console.log('✓ Gerente Loja 01 visualiza apenas colaboradores da Loja 01. Candidatos 100% isolados!\n');

  // 6. Verificar que o gerente da Loja 02 NÃO vê o colaborador da Loja 01
  console.log('6. Testando segurança: Gerente Loja 02 listando equipe (isolamento entre lojas)...');
  const listaLoja02 = await listStoreEmployeeResults('02');
  const achouFunc01Na02 = listaLoja02.some(f => String(f._id) === String(funcResult._id));
  if (achouFunc01Na02) {
    throw new Error('FALHA DE SEGURANÇA: Colaborador da Loja 01 apareceu para o gerente da Loja 02!');
  }
  console.log('✓ Gerente Loja 02 NÃO tem acesso aos colaboradores da Loja 01.\n');

  // 7. Testar acesso direto por ID pelo gerente da Loja 02 ao colaborador da Loja 01
  console.log('7. Testando tentativa de acesso direto por URL/ID cruzado...');
  const tentativaCruzada = await getStoreEmployeeResult('02', funcResult._id);
  if (tentativaCruzada !== null) {
    throw new Error('FALHA DE SEGURANÇA: Gerente da Loja 02 conseguiu abrir avaliação da Loja 01 via ID!');
  }
  console.log('✓ Tentativa de acesso a colaborador de outra loja bloqueada no banco (retornou null).\n');

  // 8. Testar tentativa de gerente acessar avaliação de candidato via ID
  console.log('8. Testando tentativa do gerente acessar candidato via ID...');
  const tentativaAcessoCandidato = await getStoreEmployeeResult('01', candResult._id);
  if (tentativaAcessoCandidato !== null) {
    throw new Error('FALHA DE SEGURANÇA: Gerente conseguiu acessar avaliação de candidato via ID!');
  }
  console.log('✓ Tentativa de acesso a candidato pelo gerente bloqueada no banco (retornou null).\n');

  // 9. Testar segurança de exclusão: gerente da Loja 02 tentando excluir colaborador da Loja 01
  console.log('9. Testando segurança de exclusão cruzada (Loja 02 tentando excluir Loja 01)...');
  const deleteCruzado = await deleteStoreEmployeeResult('02', funcResult._id);
  if (deleteCruzado) {
    throw new Error('FALHA DE SEGURANÇA: Gerente da Loja 02 conseguiu excluir colaborador da Loja 01!');
  }
  console.log('✓ Exclusão cruzada bloqueada com sucesso.\n');

  // 10. Testar segurança de exclusão: gerente tentando excluir candidato
  console.log('10. Testando segurança de exclusão (gerente tentando excluir candidato)...');
  const deleteCandidato = await deleteStoreEmployeeResult('01', candResult._id);
  if (deleteCandidato) {
    throw new Error('FALHA DE SEGURANÇA: Gerente conseguiu excluir avaliação de candidato!');
  }
  console.log('✓ Tentativa de exclusão de candidato pelo gerente bloqueada com sucesso.\n');

  // 11. Testar exclusão autorizada: gerente da Loja 01 excluindo colaborador da Loja 01
  console.log('11. Testando exclusão autorizada pelo gerente da Loja 01...');
  const deleteAutorizado = await deleteStoreEmployeeResult('01', funcResult._id);
  if (!deleteAutorizado) {
    throw new Error('Gerente da Loja 01 não conseguiu excluir o colaborador da própria loja!');
  }
  console.log('✓ Exclusão autorizada efetuada com sucesso.\n');

  // Limpar candidato de teste
  const col = db.collection('behavior_style_results');
  await col.deleteOne({ _id: candResult._id });
  console.log('✓ Registros de teste limpos.');

  console.log('\n=== TODOS OS 11 TESTES DE SEGURANÇA, EXCLUSÃO E ISOLAMENTO PASSARAM COM SUCESSO! ===');
  process.exit(0);
}

runTests().catch(err => {
  console.error('\n❌ ERRO NOS TESTES:', err);
  process.exit(1);
});
