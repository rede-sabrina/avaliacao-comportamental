const { clientPromise } = require('../lib/mongodb');

async function main(){
  if(!process.env.MONGODB_URI){
    console.error('Please set MONGODB_URI environment variable');
    process.exit(1);
  }

  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB || 'avaliacao');
  const col = db.collection('submissions');

  const subs = await col.find({}).toArray();
  console.log(`Found ${subs.length} submissions`);
  let updated = 0;

  for(const s of subs){
    try{
      const candidateName = s.name || 'Sem nome';
      const DIM_MAX = s.dimMax || {};
      const dims = s.dims || {};
      const flags = s.flags || [];

      const dimsList = Object.keys(DIM_MAX).length ? Object.keys(DIM_MAX) : Object.keys(dims || {});

      function getLevel(pct, dim){
        if(String(dim||'').toLowerCase().includes('risco')){ if(pct>=60) return {label:'Alto',cls:'danger'}; if(pct>=35) return {label:'Médio',cls:'warn'}; return {label:'Baixo',cls:''}; }
        if(pct>=70) return {label:'Alto',cls:''}; if(pct>=45) return {label:'Médio',cls:'warn'}; return {label:'Baixo',cls:'danger'};
      }
      function getBarClass(pct, dim){
        if(String(dim||'').toLowerCase().includes('risco')){ if(pct>=60) return 'bar-red'; if(pct>=35) return 'bar-yellow'; return 'bar-teal'; }
        if(pct>=70) return 'bar-teal'; if(pct>=45) return 'bar-yellow'; return 'bar-red';
      }

      // Compute pcts with inversion for 'risco' dims
      const pcts = {};
      dimsList.forEach(k=>{
        const raw = (dims && dims[k]) || 0;
        const denom = (DIM_MAX && DIM_MAX[k]) || 1;
        let val = 0;
        if(String(k||'').toLowerCase().includes('risco')){
          val = denom > 0 ? ((denom - raw) / denom) * 100 : 0;
        } else {
          val = denom > 0 ? (raw/denom)*100 : 0;
        }
        pcts[k] = Math.round(val*10)/10;
      });

      const best = dimsList.slice().sort((a,b)=> (pcts[b]||0) - (pcts[a]||0))[0] || null;

      const barsHTML = dimsList.map(d=>{ const p = pcts[d]||0; return `<div class="bar-row"><span class="bar-label">${d}</span><div class="bar-track"><div class="bar-fill ${getBarClass(p,d)}" style="width:${p}%" data-w="${p}"><span>${p.toFixed(1)}%</span></div></div></div>`; }).join('');

      const dimDescriptions = {
      'Comunicação': { high: 'Excelente comunicação: informa proativamente problemas e passagens de turno, garantindo continuidade operacional.', mid: 'Boa comunicação na maior parte do tempo, mas pode falhar em situações de pressão; reforçar instruções claras no onboarding.', low: 'Indicadores sugerem tendência a não comunicar ativamente problemas e passagens de turno. Em operações com vários turnos, a comunicação é essencial.' },
      'Priorização': { high: 'Excelente capacidade de priorização, sendo capaz de identificar rapidamente as tarefas mais críticas e focar recursos onde terão maior impacto.', mid: 'Demonstra habilidade de priorizar tarefas, mas pode perder foco sob carga intensa; orientar em técnicas simples de priorização.', low: 'Dificuldade em priorizar tarefas; tende a tratar tudo como urgente. Recomendado acompanhar na integração.' },
      'Gestão de Conflitos': { high: 'Alta capacidade de mediação e manutenção da calma em situações tensas.', mid: 'Boa capacidade de lidar com clientes e colegas em tensão, mas pode se beneficiar de desenvolvimento em técnicas de mediação.', low: 'Tende a escalar conflitos ou evitar confronto — atenção em funções com atendimento ao cliente.' },
      'Qualidade': { high: 'Mantém alto padrão de qualidade mesmo sob pressão.', mid: 'Boa atenção à qualidade, mas pode oscilar quando o ritmo aumenta; reforçar procedimentos.', low: 'Dificuldade em manter padrões de qualidade; requer supervisão e treinamento prático.' },
      'Colaboração': { high: 'Colabora proativamente com a equipe e facilita o trabalho conjunto.', mid: 'Colabora quando solicitado, pode precisar de estímulo para iniciativa colaborativa.', low: 'Tende a trabalhar isoladamente e não busca colaboração; importante avaliar fit com equipes baseadas em cooperação.' },
      'Adaptabilidade': { high: 'Adapta-se rapidamente a mudanças e novos procedimentos.', mid: 'Adapta-se com alguma resistência inicial, mas tende a ajustar-se com tempo.', low: 'Resistência a mudanças e dificuldades para seguir novos processos; atenção em ambientes dinâmicos.' },
      'Responsabilidade': { high: 'Demonstra forte senso de responsabilidade: comunica imprevistos e assume pendências.', mid: 'Cumpre responsabilidades na maior parte do tempo, mas pode hesitar em se expor em casos de erro.', low: 'Indicadores sugerem tendência a não assumir responsabilidades; ponto crítico para funções com autonomia.' },
      'Honestidade': { high: 'Demonstra boa capacidade de honestidade e transparência, comunicando erros e inconsistências com proatividade.', mid: 'Demonstra honestidade na maioria das situações, mas pode hesitar em se expor quando há risco pessoal.', low: 'Tendência a omitir informações quando isso oferece vantagem; atenção em funções com manuseio de recursos.' },
      'Confiabilidade': { high: 'Perfil confiável, cumpre compromissos mesmo quando é inconveniente.', mid: 'Confiável na maioria das situações, mas pode ter dificuldade com imprevistos pessoais.', low: 'Dificuldade em manter compromissos; atenção em funções que exigem presença e ritmo.' },
      'Conformidade': { high: 'Segue normas e procedimentos mesmo quando discorda, buscando canais adequados para expor opiniões.', mid: 'Segue regras na maior parte do tempo, mas pode flexibilizar quando não há supervisão.', low: 'Tende a contornar regras que considera desnecessárias; risco para procedimentos sensíveis.' },
      'Risco Ético': { high: 'Indicadores sugerem risco ético elevado. Respostas apontam para relativização de limites com recursos da empresa ou de clientes.', mid: 'Alguma flexibilidade ética em situações de pressão; aprofundar em entrevistas.', low: 'Postura ética consistente diante de situações de pressão; sem indicadores de risco.' }
      };

      const cardsHTML = dimsList.map(d=>{
        const p = pcts[d]||0;
        const lv = getLevel(p,d);
        const descObj = dimDescriptions[d] || { high:'', mid:'', low:'' };
        const desc = (String(d).toLowerCase().includes('risco') ? (p>=60?descObj.high: p>=35?descObj.mid: descObj.low) : (p>=70?descObj.high: p>=45?descObj.mid: descObj.low));
        return `<div class="dim-card ${lv.cls}"><div class="dim-card-title">${d} (${p.toFixed(1)}%) <span class="level">— ${lv.label}</span></div><p>${desc || 'Descrição disponível no painel do RH.'}</p></div>`;
      }).join('');

      const flagMeta = {
        integridade_passiva: { icon:'⚠️', label:'Integridade passiva', desc:'Não esconde, mas hesita em reportar — orientar no onboarding.' },
        integridade_risco: { icon:'🔒', label:'Atenção à integridade', desc:'Tendência a evitar reporte de erros — ponto crítico para a função.' },
        adaptacao_risco: { icon:'⚠️', label:'Dificuldade de adaptação', desc:'Não se adaptou ao ritmo ou regras do emprego anterior.' },
        historico_muito_curto: { icon:'⚠️', label:'Padrão de saída rápida', desc:'Verificar motivos de desligamentos precoces.' },
        historico_curto: { icon:'⚠️', label:'Histórico curto', desc:'Possível padrão de mudanças frequentes de emprego; investigar motivos.' },
        postura_passiva: { icon:'⚠️', label:'Postura passiva em conflito', desc:'Pode gerar omissão em situações de cliente/turno.' },
        reatividade_baixa: { icon:'⚠️', label:'Baixa proatividade', desc:'Espera instruções ao invés de agir — precisa de acompanhamento.' },
        calculo_erro: { icon:'🧮', label:'Erro no cálculo', desc:'Verificar atenção numérica — pode precisar de reforço.' }
      };
      // Additional suggested flags (ethics + behavioral)
      flagMeta.relativizacao_limites = { icon:'⚠️', label:'Relativização de limites', desc:'Tende a justificar transgressões ou minimizar impactos éticos.' };
      flagMeta.conflito_interesse = { icon:'⚠️', label:'Conflito de interesse', desc:'Prioriza interesses pessoais em detrimento de regras ou clientes.' };
      flagMeta.omissao_report = { icon:'⚠️', label:'Omissão de reporte', desc:'Hesita ou omite reportar irregularidades ou problemas.' };
      flagMeta.falsificacao_informacao = { icon:'⚠️', label:'Falsificação/omissão de informação', desc:'Propensão a mentir ou omitir informações relevantes.' };
      flagMeta.pressao_companhia = { icon:'⚠️', label:'Influência do grupo', desc:'Acata grupo/pares mesmo quando contraria normas.' };
      flagMeta.risco_conformidade = { icon:'⚠️', label:'Risco à conformidade', desc:'Padrões de resposta apontam risco de não seguir políticas.' };
      // Behavioral flags
      flagMeta.proatividade_baixa = { icon:'⚠️', label:'Baixa proatividade', desc:'Tende a esperar instruções em vez de tomar iniciativa.' };
      flagMeta.autonomia_baixa = { icon:'⚠️', label:'Autonomia reduzida', desc:'Precisa de supervisão constante para executar tarefas.' };
      flagMeta.comprometimento_baixo = { icon:'⚠️', label:'Baixo comprometimento', desc:'Indicadores de baixa assiduidade ou descumprimento de combinados.' };
      flagMeta.colaboracao_fraca = { icon:'⚠️', label:'Colaboração fraca', desc:'Prefere trabalhar isolado e evita cooperação com o time.' };
      flagMeta.adaptabilidade_baixa = { icon:'⚠️', label:'Baixa adaptabilidade', desc:'Dificuldade em aceitar mudanças de processo ou ritmo.' };
      // Additional flags descriptions (from seeds)
      flagMeta.resistencia_feedback = { icon:'⚠️', label:'Resistência a feedback', desc:'Reluta em aceitar feedback; pode dificultar desenvolvimento.' };
      flagMeta.conflito_relacional = { icon:'⚠️', label:'Conflito relacional', desc:'Tende a tomar partido em conflitos internos — risco para clima.' };
      flagMeta.core_dificuldade = { icon:'⚠️', label:'Dificuldade operacional', desc:'Possível dificuldade com tarefas centrais do cargo; requer atenção.' };
      flagMeta.conciliacao_risco = { icon:'⚠️', label:'Risco de conciliação', desc:'Dificuldade em conciliar compromissos, podendo afetar presença.' };
      flagMeta.conciliacao_incerta = { icon:'⚠️', label:'Conciliação incerta', desc:'Incerteza em cumprir combinados; precisa de acompanhamento.' };
      const uniqueFlags = (flags && flags.length) ? Array.from(new Map(flags.map(f=>[f.flag,f])).values()) : [];
      let flagsHTML = '';
      if(uniqueFlags.length === 0){
        flagsHTML = `<div class="flag-item"><span class="flag-icon">✅</span><div class="flag-text"><strong>Nenhum sinalizador de risco identificado</strong><span>Todas as respostas dentro do perfil esperado.</span></div></div>`;
      } else {
        flagsHTML = uniqueFlags.map(f=>{ const m = flagMeta[f.flag] || { icon:'⚠️', label:f.flag, desc:'' }; return `<div class="flag-item"><span class="flag-icon">${m.icon}</span><div class="flag-text"><strong>${m.label}</strong><span>${m.desc}</span></div></div>`; }).join('');
      }

      function escapeHtml(str){ return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

      const now = (s.date && new Date(s.date).toLocaleDateString('pt-BR',{day:'2-digit',month:'long',year:'numeric'})) || new Date().toLocaleDateString('pt-BR',{day:'2-digit',month:'long',year:'numeric'});

      const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Análise — ${escapeHtml(candidateName)}</title>
  <style>
    :root{--bg:#f9f7f4;--white:#fff;--ink:#1c1a18;--teal:#1a7f6e;--teal-light:#e8f5f2;--teal-mid:#2a9d88;--border:#e2ddd8;--muted:#8a857e;--yellow:#f59e0b;--red:#dc2626;--green:#16a34a;--bar-track:#e8e4df}
    *{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;background:var(--bg);color:var(--ink);padding:24px}
    .rpt-header{background:var(--white);border:1px solid var(--border);border-radius:12px;padding:20px;margin-bottom:12px}
    .rpt-name{font-size:24px;font-weight:600;margin-bottom:4px}
    .rpt-sub{font-size:13px;color:var(--muted);margin-bottom:6px}
    .rpt-date{font-size:12px;color:var(--muted)}
    .rpt-section{background:var(--white);border:1px solid var(--border);border-radius:12px;padding:18px;margin-bottom:12px}
    .rpt-section-title{font-size:18px;color:var(--teal);margin-bottom:12px}
    .bar-row{display:flex;align-items:center;gap:8px;margin-bottom:10px}
    .bar-label{width:160px;font-size:13px;font-weight:500;text-align:right;flex-shrink:0}
    .bar-track{flex:1;height:20px;background:var(--bar-track);border-radius:4px;overflow:hidden}
    .bar-fill{height:100%;border-radius:4px;display:flex;align-items:center;justify-content:flex-end;padding-right:8px;color:#fff;font-weight:700}
    .bar-teal{background:var(--teal)}.bar-yellow{background:var(--yellow)}.bar-red{background:var(--red)}
    .dim-card{border-left:3px solid var(--teal);background:var(--bg);border-radius:0 8px 8px 0;padding:12px;margin-bottom:8px}
    .dim-card.danger{border-left-color:var(--red)}.dim-card.warn{border-left-color:var(--yellow)}
    .dim-card-title{font-size:14px;font-weight:700;margin-bottom:6px}
    .flag-item{display:flex;gap:10px;padding:8px 0;border-top:1px solid rgba(0,0,0,0.03)}.flag-icon{width:30px}
    .flag-text strong{display:block}
    .btn-pdf{display:inline-block;padding:10px 18px;background:var(--teal);color:#fff;border-radius:999px;border:none}
  </style>
</head>
<body>
  <div class="rpt-header">
    <div class="rpt-name">${escapeHtml(candidateName)}</div>
    <div class="rpt-sub">Relatório • Análise</div>
    <div class="rpt-date">Gerado em ${now}</div>
  </div>

    <div class="rpt-section">
    <div class="rpt-section-title">Análise</div>
    <div class="bar-chart">${barsHTML}</div>
    ${cardsHTML}
    <div class="flags-section"><h3>⚑ Sinalizadores (${uniqueFlags.length})</h3>${flagsHTML}</div>
  </div>

  <div style="text-align:center;margin-top:8px"><button class="btn-pdf">⬇️ Baixar relatório em PDF</button></div>
</body>
</html>`;

      // compute overall pct as mean of pcts
      const pctsArr = dimsList.map(k=>pcts[k]||0);
      const mean = pctsArr.length ? (pctsArr.reduce((a,b)=>a+b,0)/pctsArr.length) : 0;
      const newPct = Math.round(mean);

      await col.updateOne({ _id: s._id }, { $set: { html, pct: newPct } });
      updated++;
    }catch(e){
      console.error('failed for', s._id, e);
    }
  }

  console.log(`Updated ${updated}/${subs.length} submissions`);
  process.exit(0);
}

main().catch(err=>{ console.error(err); process.exit(1); });
