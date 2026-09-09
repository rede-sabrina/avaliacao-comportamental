import { BEHAVIOR_STYLE_META, BEHAVIOR_STYLE_DESCRIPTIONS } from './seed/behavior-style-questions.js';

// Chaves usadas nos dados (sem acentos, minúsculas)
const DIM_KEYS = {
  DOMINÂNCIA: 'dominancia',
  INFLUÊNCIA: 'influencia',
  ESTABILIDADE: 'estabilidade',
  CONFORMIDADE: 'conformidade'
};

/**
 * Valida um bloco individual
 * @param {Object} blockAnswers - { dominancia, influencia, estabilidade, conformidade }
 * @returns {Object} { valid: boolean, error: string|null }
 */
function validateBlock(blockAnswers) {
  const values = [
    blockAnswers[DIM_KEYS.DOMINÂNCIA],
    blockAnswers[DIM_KEYS.INFLUÊNCIA],
    blockAnswers[DIM_KEYS.ESTABILIDADE],
    blockAnswers[DIM_KEYS.CONFORMIDADE]
  ];

  // Verificar se todos os valores estão presentes
  for (const v of values) {
    if (v === undefined || v === null) {
      return { valid: false, error: 'Bloco incompleto: todas as 4 dimensões devem ter valor' };
    }
  }

  // Verificar se todos estão entre 1 e 4
  for (const v of values) {
    if (!Number.isInteger(v) || v < 1 || v > 4) {
      return { valid: false, error: 'Valores inválidos: cada dimensão deve ser 1, 2, 3 ou 4' };
    }
  }

  // Verificar duplicatas (deve ter exatamente 1, 2, 3, 4)
  const unique = new Set(values);
  if (unique.size !== 4) {
    return { valid: false, error: 'Valores duplicados: cada bloco deve ter exatamente 1, 2, 3 e 4' };
  }

  // Verificar se a soma é 10
  const sum = values.reduce((a, b) => a + b, 0);
  if (sum !== BEHAVIOR_STYLE_META.blockSum) {
    return { valid: false, error: `Soma inválida: a soma do bloco deve ser ${BEHAVIOR_STYLE_META.blockSum}` };
  }

  return { valid: true, error: null };
}

/**
 * Calcula o resultado do Teste de Estilo de Comportamento
 * @param {Array} answers - Array de 10 objetos, cada um com { block, dominancia, influencia, estabilidade, conformidade }
 * @returns {Object} Resultado calculado
 */
export function calculateBehaviorResult(answers) {
  // 1. Validar estrutura básica
  if (!Array.isArray(answers)) {
    throw new Error('Respostas devem ser um array');
  }

  if (answers.length !== BEHAVIOR_STYLE_META.totalBlocks) {
    throw new Error(`Esperados ${BEHAVIOR_STYLE_META.totalBlocks} blocos, recebidos ${answers.length}`);
  }

  // 2. Validar cada bloco
  for (let i = 0; i < answers.length; i++) {
    const block = answers[i];
    if (!block || typeof block !== 'object') {
      throw new Error(`Bloco ${i + 1}: formato inválido`);
    }
    if (block.block !== i + 1) {
      throw new Error(`Bloco ${i + 1}: número do bloco incorreto (esperado ${i + 1}, recebido ${block.block})`);
    }

    const validation = validateBlock(block);
    if (!validation.valid) {
      throw new Error(`Bloco ${i + 1}: ${validation.error}`);
    }
  }

  // 3. Somar por dimensão
  const scores = {
    DOMINÂNCIA: 0,
    INFLUÊNCIA: 0,
    ESTABILIDADE: 0,
    CONFORMIDADE: 0
  };

  for (const block of answers) {
    scores.DOMINÂNCIA += block.dominancia;
    scores.INFLUÊNCIA += block.influencia;
    scores.ESTABILIDADE += block.estabilidade;
    scores.CONFORMIDADE += block.conformidade;
  }

  // 4. Verificar soma total = 100
  const total = scores.DOMINÂNCIA + scores.INFLUÊNCIA + scores.ESTABILIDADE + scores.CONFORMIDADE;
  if (total !== BEHAVIOR_STYLE_META.totalPoints) {
    throw new Error(`Soma total inválida: esperado ${BEHAVIOR_STYLE_META.totalPoints}, obtido ${total}`);
  }

  // 5. Identificar perfis dominantes (> 25%)
  const dominantProfiles = [];
  for (const [dimension, score] of Object.entries(scores)) {
    if (score > BEHAVIOR_STYLE_META.dominanceThreshold) {
      dominantProfiles.push(dimension);
    }
  }

  // 6. Retornar resultado
  return {
    dominancia: scores.DOMINÂNCIA,
    influencia: scores.INFLUÊNCIA,
    estabilidade: scores.ESTABILIDADE,
    conformidade: scores.CONFORMIDADE,
    dominantProfiles,
    total,
    descriptions: BEHAVIOR_STYLE_DESCRIPTIONS
  };
}

/**
 * Valida respostas completas sem lançar exceção
 * @param {Array} answers
 * @returns {Object} { valid: boolean, errors: string[] }
 */
export function validateBehaviorAnswers(answers) {
  const errors = [];

  if (!Array.isArray(answers)) {
    errors.push('Respostas devem ser um array');
    return { valid: false, errors };
  }

  if (answers.length !== BEHAVIOR_STYLE_META.totalBlocks) {
    errors.push(`Esperados ${BEHAVIOR_STYLE_META.totalBlocks} blocos, recebidos ${answers.length}`);
  }

  for (let i = 0; i < answers.length; i++) {
    const block = answers[i];
    if (!block || typeof block !== 'object') {
      errors.push(`Bloco ${i + 1}: formato inválido`);
      continue;
    }
    if (block.block !== i + 1) {
      errors.push(`Bloco ${i + 1}: número do bloco incorreto`);
      continue;
    }

    const validation = validateBlock(block);
    if (!validation.valid) {
      errors.push(`Bloco ${i + 1}: ${validation.error}`);
    }
  }

  // Se passou nas validações de bloco, verificar soma total
  if (errors.length === 0) {
    const scores = {
      DOMINÂNCIA: 0,
      INFLUÊNCIA: 0,
      ESTABILIDADE: 0,
      CONFORMIDADE: 0
    };
    for (const block of answers) {
      scores.DOMINÂNCIA += block.dominancia;
      scores.INFLUÊNCIA += block.influencia;
      scores.ESTABILIDADE += block.estabilidade;
      scores.CONFORMIDADE += block.conformidade;
    }
    const total = scores.DOMINÂNCIA + scores.INFLUÊNCIA + scores.ESTABILIDADE + scores.CONFORMIDADE;
    if (total !== BEHAVIOR_STYLE_META.totalPoints) {
      errors.push(`Soma total inválida: esperado ${BEHAVIOR_STYLE_META.totalPoints}, obtido ${total}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Gera o HTML do relatório de resultado (para PDF)
 * @param {Object} result - Resultado de calculateBehaviorResult
 * @param {Object} candidate - { name, cpf }
 * @returns {string} HTML
 */
export function generateBehaviorResultHtml(result, candidate) {
  const { dominancia, influencia, estabilidade, conformidade, dominantProfiles, descriptions } = result;
  const dateStr = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

  const scores = [
    { key: 'dominancia', label: 'DOMINÂNCIA', value: dominancia, desc: descriptions.DOMINÂNCIA },
    { key: 'influencia', label: 'INFLUÊNCIA', value: influencia, desc: descriptions.INFLUÊNCIA },
    { key: 'estabilidade', label: 'ESTABILIDADE', value: estabilidade, desc: descriptions.ESTABILIDADE },
    { key: 'conformidade', label: 'CONFORMIDADE', value: conformidade, desc: descriptions.CONFORMIDADE }
  ];

  // Cards de percentual grandes (topo)
  const summaryCardsHtml = scores.map(s => {
    const isDominant = dominantProfiles.includes(s.label);
    return `
      <div style="
        background: #fff;
        border: 1px solid #e0ddd8;
        border-radius: 12px;
        padding: 1.25rem;
        text-align: center;
        border-top: ${isDominant ? '4px solid #1a7f6e' : '4px solid transparent'};
      ">
        <div style="font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #8a857e; margin-bottom: 0.5rem;">${s.label}</div>
        <div style="font-size: 2.5rem; font-weight: 700; color: #1a7f6e; line-height: 1;">${s.value}<span style="font-size: 1.2rem;">%</span></div>
        ${isDominant ? '<div style="margin-top: 0.5rem; display: inline-block; background: #1a7f6e; color: #fff; font-size: 0.65rem; font-weight: 700; padding: 0.2rem 0.6rem; border-radius: 50px; text-transform: uppercase;">Dominante</div>' : ''}
      </div>
    `;
  }).join('');

  // Barras horizontais
  const barsHtml = scores.map(s => {
    const isDominant = dominantProfiles.includes(s.label);
    return `
      <div style="margin-bottom: 1.25rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
          <div style="font-size: 14px; font-weight: 600; color: #1c1a18;">
            ${s.label}
            ${isDominant ? '<span style="margin-left: 0.5rem; padding: 0.15rem 0.5rem; background: #1a7f6e; color: #fff; font-size: 0.65rem; font-weight: 700; border-radius: 50px; text-transform: uppercase;">Dominante</span>' : ''}
          </div>
          <div style="font-size: 16px; font-weight: 700; color: #1a7f6e; min-width: 55px; text-align: right;">${s.value}%</div>
        </div>
        <div style="height: 16px; background: #e8e4df; border-radius: 8px; overflow: hidden; position: relative;">
          <div style="
            height: 100%;
            width: ${s.value}%;
            background: ${isDominant ? 'linear-gradient(90deg, #1a7f6e, #2a9d88)' : '#1a7f6e'};
            border-radius: 8px;
          "></div>
          <div style="position: absolute; top: 0; bottom: 0; left: 25%; width: 2px; background: rgba(220,38,38,0.5); pointer-events: none;"></div>
        </div>
      </div>
    `;
  }).join('');

  // Radar chart SVG (upright - sem rotação)
  const radarSize = 320;
  const center = radarSize / 2;
  const maxRadius = 130;
  
  const radarData = scores.map((s, i) => ({
    ...s,
    angle: (i * 90) - 90,
    radius: (s.value / 100) * maxRadius
  }));

  const radarPoints = radarData.map(d => {
    const rad = (d.angle * Math.PI) / 180;
    const x = center + d.radius * Math.cos(rad);
    const y = center + d.radius * Math.sin(rad);
    return `${x},${y}`;
  }).join(' ');

  const axisLines = scores.map((_, i) => {
    const angle = (i * 90) - 90;
    const rad = (angle * Math.PI) / 180;
    const x = center + (maxRadius + 10) * Math.cos(rad);
    const y = center + (maxRadius + 10) * Math.sin(rad);
    return { x, y, label: scores[i].label };
  });

  const refCircles = [25, 50, 75, 100].map(pct => ({
    radius: (pct / 100) * maxRadius
  }));

  const radarSvg = `
    <svg width="${radarSize}" height="${radarSize}" viewBox="0 0 ${radarSize} ${radarSize}" style="max-width: 100%; height: auto;">
      <!-- Círculos de referência -->
      ${refCircles.map(c => `<circle cx="${center}" cy="${center}" r="${c.radius}" fill="none" stroke="#e8e4df" stroke-width="1" stroke-dasharray="4,4" />`).join('')}
      <!-- Linha de 25% destacada -->
      <circle cx="${center}" cy="${center}" r="${(25/100)*maxRadius}" fill="none" stroke="rgba(220,38,38,0.3)" stroke-width="1.5" stroke-dasharray="6,4" />
      <!-- Eixos -->
      ${axisLines.map((axis, i) => `
        <line x1="${center}" y1="${center}" x2="${axis.x}" y2="${axis.y}" stroke="#d7d7d7" stroke-width="1" />
        <text x="${axis.x}" y="${axis.y}" text-anchor="${axis.x > center ? 'start' : axis.x < center ? 'end' : 'middle'}" dominant-baseline="${axis.y > center ? 'hanging' : axis.y < center ? 'auto' : 'middle'}" font-size="12" font-weight="600" fill="#333" font-family="DM Sans, sans-serif">${axis.label}</text>
      `).join('')}
      <!-- Área do resultado -->
      <polygon points="${radarPoints}" fill="rgba(26,127,110,0.18)" stroke="#1a7f6e" stroke-width="2.5" stroke-linejoin="round" />
      <!-- Pontos com valores -->
      ${radarData.map((d, i) => {
        const rad = (d.angle * Math.PI) / 180;
        const x = center + d.radius * Math.cos(rad);
        const y = center + d.radius * Math.sin(rad);
        const isDominant = dominantProfiles.includes(d.label);
        return `
          <circle cx="${x}" cy="${y}" r="6" fill="${isDominant ? '#dc2626' : '#1a7f6e'}" stroke="#fff" stroke-width="2" />
          <text x="${x}" y="${y - 14}" text-anchor="middle" font-size="12" font-weight="700" fill="${isDominant ? '#dc2626' : '#1a7f6e'}" font-family="DM Sans, sans-serif">${d.value}%</text>
        `;
      }).join('')}
      <!-- Legenda 25% -->
      <text x="${center}" y="25" text-anchor="middle" font-size="10" fill="rgba(220,38,38,0.6)" font-family="DM Sans, sans-serif" font-weight="600">Limiar de dominância (25%)</text>
    </svg>
  `;

  // Cards detalhados
  const detailCardsHtml = scores.map(s => {
    const isDominant = dominantProfiles.includes(s.label);
    return `
      <div style="border-left: 4px solid ${isDominant ? '#1a7f6e' : '#e0ddd8'}; background: ${isDominant ? '#f0faf8' : '#faf9f7'}; border-radius: 0 10px 10px 0; padding: 1.25rem; margin-bottom: 1rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
          <div style="font-size: 15px; font-weight: 700; color: #1c1a18;">${s.label} <span style="color: #1a7f6e; font-weight: 600;">(${s.value}%)</span></div>
          ${isDominant ? '<span style="background: #1a7f6e; color: #fff; font-size: 0.65rem; font-weight: 700; padding: 0.2rem 0.6rem; border-radius: 50px; text-transform: uppercase;">Perfil Dominante</span>' : ''}
        </div>
        <p style="font-size: 14px; line-height: 1.65; color: #333;">${s.desc}</p>
      </div>
    `;
  }).join('');

  // Perfis dominantes com descrição completa
  let dominantHtml = '';
  if (dominantProfiles.length === 0) {
    dominantHtml = `
      <div style="text-align: center; padding: 2rem; background: #faf9f7; border-radius: 10px; border: 1px dashed #e0ddd8;">
        <div style="font-size: 1.1rem; color: #666; margin-bottom: 0.5rem;">Nenhum perfil dominante identificado</div>
        <div style="font-size: 0.9rem; color: #888;">Nenhuma dimensão superou 25%. Seu perfil é equilibrado entre as quatro dimensões.</div>
      </div>
    `;
  } else {
    dominantHtml = dominantProfiles.map((dim, idx) => {
      const scoreData = scores.find(s => s.key === dim.toLowerCase());
      const description = descriptions[dim] || '';
      return `
        <div style="background: #f0faf8; border: 1px solid #1a7f6e; border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem;">
          <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; flex-wrap: wrap;">
            <div style="background: #1a7f6e; color: #fff; width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.1rem; flex-shrink: 0;">${idx + 1}</div>
            <div>
              <div style="font-size: 1.3rem; font-weight: 700; color: #1a7f6e; font-family: 'Crimson Pro', serif;">${dim}</div>
              <div style="font-size: 1.5rem; font-weight: 700; color: #1a7f6e; font-family: 'DM Sans', sans-serif;">${scoreData?.value}%</div>
            </div>
          </div>
          <p style="font-size: 14px; line-height: 1.7; color: #333; margin: 0;">${description}</p>
        </div>
      `;
    }).join('');
    
    dominantHtml += `
      <div style="margin-top: 1.5rem; padding: 1rem; background: #faf9f7; border-radius: 8px; border: 1px solid #e0ddd8;">
        <p style="font-size: 13px; color: #666; margin: 0; line-height: 1.6;">
          <strong style="color: #333;">Critério de dominância:</strong> Um perfil é considerado dominante quando seu resultado é <strong>superior a 25%</strong>. 
          Resultado igual a 25% exatamente <strong>não</strong> é considerado dominante. 
          A soma total das quatro dimensões é sempre 100%, permitindo leitura direta como percentual.
        </p>
      </div>
    `;
  }

  function formatCPF(cpf) {
    if (!cpf) return '';
    const s = String(cpf).replace(/\D/g, '');
    if (s.length !== 11) return cpf;
    return `${s.slice(0,3)}.${s.slice(3,6)}.${s.slice(6,9)}-${s.slice(9)}`;
  }

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Resultado — ${candidate.name || 'Candidato'}</title>
  <link href="https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,300;0,400;0,600;1,400&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">
  <style>
    :root{--bg:#f5f3f0;--white:#fff;--ink:#1c1a18;--teal:#1a7f6e;--teal-light:#e8f5f2;--border:#e0ddd8;--muted:#8a857e;--red:#dc2626;}
    *{margin:0;padding:0;box-sizing:border-box}body{font-family:'DM Sans',sans-serif;background:var(--bg);color:var(--ink);padding:24px}
    .rpt-header{background:var(--white);border:1px solid var(--border);border-radius:16px;padding:2rem;margin-bottom:1.5rem;text-align:center}
    .rpt-name{font-family:'Crimson Pro',serif;font-size:2rem;font-weight:600;margin-bottom:0.5rem}
    .rpt-name em{font-style:italic;color:#f0b429}
    .rpt-sub{font-size:1rem;color:var(--muted);margin-bottom:6px}
    .rpt-date{font-size:12px;color:var(--muted)}
    .rpt-section{background:var(--white);border:1px solid var(--border);border-radius:16px;padding:1.5rem;margin-bottom:1.5rem}
    .rpt-section-title{font-family:'Crimson Pro',serif;font-size:1.4rem;color:var(--teal);margin-bottom:1.25rem;font-weight:600}
    .summary-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;margin-bottom:1.5rem}
    @media print { .summary-grid { grid-template-columns: repeat(4, 1fr) !important; } }
    @media (max-width: 800px) { .summary-grid { grid-template-columns: repeat(2, 1fr) !important; } }
  </style>
</head>
<body>
  <div class="rpt-header">
    <div style="display: inline-flex; align-items: center; gap: 0.5rem; border-radius: 50px; padding: 0.5rem 1.4rem; font-size: 0.85rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 1.2rem; background: rgba(26,127,110,0.12); color: #1a7f6e; border: 1px solid rgba(26,127,110,0.25);">✅ Teste Concluído</div>
    <div class="rpt-name">${candidate.name || 'Sem nome'} <em>${formatCPF(candidate.cpf)}</em></div>
    <div class="rpt-sub">Teste de Estilo de Comportamento • ${dateStr}</div>
  </div>

  <!-- Resumo rápido - Cards de percentual -->
  <div class="rpt-section" style="padding: 0;">
    <div class="summary-grid">${summaryCardsHtml}</div>
  </div>

  <!-- Visualização: Radar + Barras -->
  <div class="rpt-section">
    <div class="rpt-section-title">Visualização dos Perfis</div>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; align-items: start;">
      <div style="text-align: center;">${radarSvg}</div>
      <div>${barsHtml}</div>
    </div>
  </div>

  <!-- Detalhamento por dimensão -->
  <div class="rpt-section">
    <div class="rpt-section-title">Detalhamento por Dimensão</div>
    ${detailCardsHtml}
  </div>

  <!-- Perfis Dominantes -->
  <div class="rpt-section">
    <div class="rpt-section-title">Perfil(is) Dominante(s)</div>
    ${dominantHtml}
  </div>
</body>
</html>`;
}