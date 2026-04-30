import Head from 'next/head';
import { useEffect, useState } from 'react';

export default function Home(){
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [candidateName, setCandidateName] = useState('');
  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [showTestSelection, setShowTestSelection] = useState(true);
  

  useEffect(()=>{ const savedName = localStorage.getItem('candidate_name') || ''; setCandidateName(savedName); },[]);

  // fetch questions from backend
  useEffect(()=>{
    if(!selectedTest) return; // Só carrega perguntas se teste foi selecionado
    let mounted = true;
    async function load(){
      try{
        const r = await fetch(`/api/questions?test=${selectedTest}`);
        if(!r.ok) throw new Error('failed');
        const data = await r.json();
        if(!mounted) return;

    const categoryOrder = [
      'Logística',
      'Estabilidade',
      'Regulação emocional',
      'Integridade',
      'Fit',
      'Abertas'
    ];

    const sorted = data.slice().sort((a,b) => {
      const isOpenA = (a.type || '').toLowerCase().includes('aberta');
      const isOpenB = (b.type || '').toLowerCase().includes('aberta');

      const keyA = isOpenA ? 'Abertas' : (a.category || '');
      const keyB = isOpenB ? 'Abertas' : (b.category || '');

      const iA = categoryOrder.indexOf(keyA);
      const iB = categoryOrder.indexOf(keyB);

      const posA = iA === -1 ? categoryOrder.length + 1 : iA;
      const posB = iB === -1 ? categoryOrder.length + 1 : iB;

      if(posA !== posB) return posA - posB;

      return 0;
    });

    setQuestions(sorted);
    setAnswers(Array(sorted.length).fill(null));

  }catch(e){
    console.warn('Could not load questions', e);
  }
}
    load();
    return ()=>{ mounted = false; };
  },[selectedTest]);

  useEffect(()=>{ localStorage.setItem('candidate_name', candidateName); },[candidateName]);

  function selectOption(qIdx, optIdx){
    const copy = [...answers];
    copy[qIdx] = optIdx;
    setAnswers(copy);
  }

  function handleCalc(qIdx, v){
    const copy = [...answers];
    const num = parseFloat(v);
    copy[qIdx] = isNaN(num) ? null : num;
    setAnswers(copy);
  }

  function handleOpen(qIdx, v){
    const copy = [...answers]; copy[qIdx] = v; setAnswers(copy);
  }

  function refreshNextEnabled(idx){
    const q = questions[idx];
    const ans = answers[idx];
    if(q.type==='options') return ans !== null;
    if(q.type==='calc') return ans !== null && ans !== '';
    if(q.type==='open') return ans && ans.trim().length >= (q.minLength||10);
    return false;
  }

  function startQuiz(){ setStarted(true); setCurrent(0); }

  function nextQ(){ if(current < questions.length-1) setCurrent(c=>c+1); else submitResult(); }
  function prevQ(){ if(current>0) setCurrent(c=>c-1); }

  function calcScore(){
    let total = 0;
    let max = 0;
    const flags = [];
    const dims = {};
    const dimMax = {};
    const questionMax = [];

    // Build dynamic maximums per question (use option max when available)
    questions.forEach((q,i)=>{
      let qMax = 3;
      if(q.type === 'options' && Array.isArray(q.options) && q.options.length){
        qMax = Math.max(...q.options.map(o=>Number(o.score||0)));
        if(!isFinite(qMax) || qMax <= 0) qMax = 3;
      }
      questionMax[i] = qMax;

      if(q.dimension){
        dimMax[q.dimension] = (dimMax[q.dimension] || 0) + qMax;
        if(dims[q.dimension] === undefined) dims[q.dimension] = 0;
      }
    });

    questions.forEach((q,i)=>{
      const ans = answers[i];
      const qMax = questionMax[i] || 3;
      if(q.type==='options' && ans !== null){
        const opt = q.options?.[ans];
        const pts = Number(opt?.score || 0);
        total += pts;
        max += qMax;
        if(q.dimension) dims[q.dimension] = (dims[q.dimension] || 0) + pts;
        if(opt?.flag) flags.push({flag:opt.flag,q:q.id});
      }
      else if(q.type==='calc'){
        const raw = Number(ans || 0);
        const correctVal = Number(q.correctAnswer || 0);
        const correct = Math.abs(raw - correctVal) < 0.01;
        const pts = correct ? 3 : (Math.abs(raw - correctVal) < 1 ? 1 : 0);
        total += pts;
        max += qMax;
        if(q.dimension) dims[q.dimension] = (dims[q.dimension] || 0) + pts;
        if(!correct) flags.push({flag:'calculo_erro',q:q.id});
      }
      else if(q.type==='open'){
        const len = (ans || '').trim().length;
        const pts = len > 100 ? 3 : len > 50 ? 2 : len > 20 ? 1 : 0;
        total += pts;
        max += qMax;
        if(q.dimension) dims[q.dimension] = (dims[q.dimension] || 0) + pts;
      }
    });

    const pct = max > 0 ? Math.max(0, Math.min(100, Math.round((total / max) * 100))) : 0;
    return { total, max, pct, flags, dims, dimMax };
  }

  async function submitResult(){
    const now = new Date();
    const { pct, flags, dims, dimMax } = calcScore();
    const openAnswers = questions
      .map((q, i)=> ({ question: q, answer: answers[i] }))
      .filter((item)=> item.question?.type === 'open');
    // build full report HTML (same look as old index.html)
    const dateStr = now.toLocaleDateString('pt-BR',{day:'2-digit',month:'long',year:'numeric'});
    const reportHtml = buildReportHtml({ candidateName: candidateName||'Sem nome', pct, flags, dims, dimMax, dateStr, openAnswers });

    const submission = { id: Date.now(), name: candidateName || 'Sem nome', date: now.toISOString(), pct, flags, dims, dimMax, html: reportHtml, test_type: selectedTest || 'antigo' };
    // save local
    try{ const existing = JSON.parse(localStorage.getItem('submissions')||'[]'); existing.push(submission); localStorage.setItem('submissions', JSON.stringify(existing)); }catch(e){ console.error(e); }
    // send server
    try{ await fetch('/api/submit',{ method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(submission) }); }catch(e){ console.warn('Envio falhou',e); }

    setStarted(false);
    setCompleted(true);
  }

  function buildReportHtml({ candidateName, pct, flags, dims, dimMax, dateStr, openAnswers }){
    const DIM_MAX = dimMax || {};
    const dimsList = Object.keys(DIM_MAX).length ? Object.keys(DIM_MAX) : Object.keys(dims || {});

    // dimension descriptions for both tests
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

    // flags meta (more complete)
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

    function getLevel(pct, dim){
      if(String(dim||'').toLowerCase().includes('risco')){ if(pct>=60) return {label:'Alto',cls:'danger'}; if(pct>=35) return {label:'Médio',cls:'warn'}; return {label:'Baixo',cls:''}; }
      if(pct>=70) return {label:'Alto',cls:''}; if(pct>=45) return {label:'Médio',cls:'warn'}; return {label:'Baixo',cls:'danger'};
    }
    function getBarClass(pct, dim){
      if(String(dim||'').toLowerCase().includes('risco')){ if(pct>=60) return 'bar-red'; if(pct>=35) return 'bar-yellow'; return 'bar-teal'; }
      if(pct>=70) return 'bar-teal'; if(pct>=45) return 'bar-yellow'; return 'bar-red';
    }

    // Calculate per-dimension percentages with one decimal
    const pcts = {};
    dimsList.forEach(k=>{
      const raw = (dims && dims[k]) || 0;
      const denom = (DIM_MAX && DIM_MAX[k]) || 1;
      const val = denom > 0 ? (raw/denom)*100 : 0;
      pcts[k] = Math.round(val*10)/10;
    });

    const best = dimsList.slice().sort((a,b)=> (pcts[b]||0) - (pcts[a]||0))[0] || null;

    const barsHTML = dimsList.map(d=>{ const p = pcts[d]||0; return `<div class="bar-row"><span class="bar-label">${d}</span><div class="bar-track"><div class="bar-fill ${getBarClass(p,d)}" style="width:${p}%" data-w="${p}"><span>${p.toFixed(1)}%</span></div></div></div>`; }).join('');

    const cardsHTML = dimsList.map(d=>{ const p = pcts[d]||0; const lv = getLevel(p,d); const descObj = dimDescriptions[d] || { high:'', mid:'', low:'' }; const desc = (String(d).toLowerCase().includes('risco') ? (p>=60?descObj.high: p>=35?descObj.mid: descObj.low) : (p>=70?descObj.high: p>=45?descObj.mid: descObj.low)); return `<div class="dim-card ${lv.cls}"><div class="dim-card-title">${d} (${p.toFixed(1)}%) <span class="level">— ${lv.label}</span></div><p>${desc || 'Descrição disponível no painel do RH.'}</p></div>`; }).join('');

    // deduplicate flags by flag name and show explanation once
    const uniqueFlags = (flags && flags.length) ? Array.from(new Map(flags.map(f=>[f.flag,f])).values()) : [];
    let flagsHTML = '';
    if(uniqueFlags.length === 0){
      flagsHTML = `<div class="flag-item"><span class="flag-icon">✅</span><div class="flag-text"><strong>Nenhum sinalizador de risco identificado</strong><span>Todas as respostas dentro do perfil esperado.</span></div></div>`;
    } else {
      flagsHTML = uniqueFlags.map(f=>{ const m = flagMeta[f.flag] || { icon:'⚠️', label:f.flag, desc:'' }; return `<div class="flag-item"><span class="flag-icon">${m.icon}</span><div class="flag-text"><strong>${m.label}</strong><span>${m.desc}</span></div></div>`; }).join('');
    }

    const openAnswersHTML = (openAnswers && openAnswers.length>0) ? openAnswers.map((it,idx)=>`<div class="flag-item"><span class="flag-icon">✍️</span><div class="flag-text"><strong>${escapeHtml(it.question?.text||'Pergunta')}</strong><span>${escapeHtml(String(it.answer||'(sem resposta)'))}</span></div></div>`).join('') : '';

    const now = dateStr || new Date().toLocaleDateString('pt-BR',{day:'2-digit',month:'long',year:'numeric'});

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Análise — ${escapeHtml(candidateName)}</title>
  <link href="https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,300;0,400;0,600;1,400&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">
  <style>
    :root{--bg:#f9f7f4;--white:#fff;--ink:#1c1a18;--teal:#1a7f6e;--teal-light:#e8f5f2;--teal-mid:#2a9d88;--border:#e2ddd8;--muted:#8a857e;--yellow:#f59e0b;--red:#dc2626;--green:#16a34a;--bar-track:#e8e4df}
    *{margin:0;padding:0;box-sizing:border-box}body{font-family:'DM Sans',sans-serif;background:var(--bg);color:var(--ink);padding:24px}
    .rpt-header{background:var(--white);border:1px solid var(--border);border-radius:12px;padding:20px;margin-bottom:12px}
    .rpt-name{font-family:'Crimson Pro',serif;font-size:24px;font-weight:600;margin-bottom:4px}
    .rpt-sub{font-size:13px;color:var(--muted);margin-bottom:6px}
    .rpt-date{font-size:12px;color:var(--muted)}
    .rpt-section{background:var(--white);border:1px solid var(--border);border-radius:12px;padding:18px;margin-bottom:12px}
    .rpt-section-title{font-family:'Crimson Pro',serif;font-size:18px;color:var(--teal);margin-bottom:12px}
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
    ${openAnswersHTML}
  </div>

  <div style="text-align:center;margin-top:8px"><button class="btn-pdf">⬇️ Baixar relatório em PDF</button></div>
</body>
</html>`;
  }

  function escapeHtml(str){ return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  return (
    <>
      <Head>
        <title>Avaliação Comportamental</title>
      </Head>

      <div id="progress-bar"><div id="progress-fill" style={{width: `${Math.round((current/questions.length)*100)}%`}}></div></div>

      {showTestSelection && !started && !completed && (
        <div id="screen-test-selection" className="screen active" style={{justifyContent:'center',alignItems:'center',padding:'2rem',minHeight:'60vh',display:'flex'}}>
          <div className="intro-card" style={{maxWidth:720}}>
            <div className="logo-badge">🧠 Avaliação Comportamental</div>
            <h1>Selecione o tipo de avaliação</h1>
            <p>Escolha qual teste você deseja realizar:</p>
            
            <div style={{marginTop:32,display:'flex',flexDirection:'column',gap:12}}>
              <button 
                className="btn-primary select-btn" 
                  onClick={()=>{setSelectedTest('comportamental'); setShowTestSelection(false);}}
                style={{padding:'16px 20px',fontSize:16,height:'auto'}}
              >
                  <div style={{fontWeight:600,marginBottom:4}}>🧠 Teste Comportamental</div>
                  <div style={{fontSize:13,opacity:0.9}}>Avaliação de competências comportamentais e situacionais</div>
              </button>

              <button 
                className="btn-secondary select-btn" 
                  onClick={()=>{setSelectedTest('etica'); setShowTestSelection(false);}}
                style={{padding:'16px 20px',fontSize:16,height:'auto',borderColor:'var(--accent)',color:'var(--accent)'}}
              >
                  <div style={{fontWeight:600,marginBottom:4}}>⚖️ Teste de Ética</div>
                  <div style={{fontSize:13,opacity:0.9}}>Avaliação de integridade, honestidade e conformidade</div>
              </button>
            </div>

            <div style={{marginTop:16,display:'flex',justifyContent:'center'}}>
              <button onClick={()=>window.location.href='/admin'} className="select-admin-btn">Painel administrativo</button>
            </div>

            <style jsx>{`
              .select-btn{ transition: transform .14s ease, box-shadow .14s ease; border-radius:10px; }
              .select-btn:hover{ transform: translateY(-6px); box-shadow: 0 14px 30px rgba(16,24,40,0.12); }
              .select-admin-btn{ margin-top:6px; padding:10px 18px; border-radius:999px; border:1px solid rgba(26,127,110,0.12); background:transparent; color:var(--teal); cursor:pointer; transition: transform .12s ease, box-shadow .12s ease; }
              .select-admin-btn:hover{ transform: translateY(-4px); box-shadow: 0 8px 20px rgba(16,24,40,0.08); background: rgba(26,127,110,0.04); }
            `}</style>
          </div>
        </div>
      )}

      {!showTestSelection && !started && !completed && (
        <div id="screen-intro" className="screen active">
          <div className="intro-card">
            <div className="logo-badge">🧠 Avaliação Comportamental</div>
            <h1>Você está a um passo de<br/><em>fazer parte do time</em></h1>
            <p>Este questionário nos ajuda a entender melhor o seu perfil. Não há respostas certas ou erradas — seja honesto(a).</p>
            <div className="meta-list"><span className="meta-item"><span className="dot"></span> ~8 minutos</span><span className="meta-item"><span className="dot"></span>{questions.length} perguntas</span></div>
            <div className="name-input-wrap"><label>Seu nome completo</label><input value={candidateName} onChange={e=>setCandidateName(e.target.value)} placeholder="Ex: Maria Silva" /></div>
            <button className="btn-primary" onClick={startQuiz} disabled={candidateName.trim().length < 2 || questions.length === 0}>Iniciar avaliação →</button>
            <button className="btn-secondary" onClick={()=>window.location.href='/admin/login'} style={{marginTop:10,width:'100%',justifyContent:'center'}}>Acessar área administrativa</button>
            <button className="btn-secondary" onClick={()=>{setShowTestSelection(true); setCandidateName('');}} style={{marginTop:8,width:'100%',justifyContent:'center',borderColor:'rgba(200,200,200,.3)',color:'var(--muted)'}}>← Trocar de teste</button>
          </div>
        </div>
      )}

      {started && !completed && (
        <div id="screen-quiz" className="screen active">
          <div className="quiz-inner">
            <div className="step-indicator">
              <span className="step-num">{current+1} / {questions.length}</span>
              <div className="step-dots">{questions.map((_,i)=>(<div key={i} className={`step-dot ${i<current?'done':i===current?'current':''}`}></div>))}</div>
            </div>

            <div className="question-block">
              <span className={`q-category ${questions[current].catClass}`}>{questions[current].category}</span>
              <p className="q-text">{questions[current].text}</p>

              {questions[current].type === 'options' && (
                <div className="options-list">{questions[current].options.map((opt,oi)=> (
                  <button key={oi} className={`option-btn ${answers[current]===oi ? 'selected' : ''}`} onClick={()=>selectOption(current,oi)}>
                    <span className="opt-letter">{opt.letter}</span>
                    <span>{opt.text}</span>
                  </button>
                ))}</div>
              )}

              {questions[current].type === 'calc' && (
                <div className="calc-wrap"><span className="calc-label">Troco: R$</span><input className="calc-input" type="number" step="0.01" value={answers[current]||''} onChange={e=>handleCalc(current,e.target.value)} /></div>
              )}

              {questions[current].type === 'open' && (
                <textarea className="open-textarea" value={answers[current]||''} onChange={e=>handleOpen(current,e.target.value)} placeholder="Escreva aqui com suas próprias palavras..." />
              )}

            </div>

            <div className="nav-row">
              <button className="btn-secondary" onClick={prevQ} style={{visibility: current>0 ? 'visible' : 'hidden'}}>← Voltar</button>
              <button className="btn-primary" onClick={nextQ} disabled={!refreshNextEnabled(current)} style={{maxWidth:220}}>{current === questions.length-1 ? 'Finalizar avaliação ✓' : 'Próxima →'}</button>
            </div>
          </div>
        </div>
      )}

      {completed && (
        <div id="screen-result" className="screen active" style={{justifyContent:'center',alignItems:'center',padding:'2rem 1.2rem'}}>
          <div className="intro-card" style={{maxWidth:560,textAlign:'center'}}>
            <div className="logo-badge">✅ Concluído</div>
            <h1>Obrigado por concluir</h1>
            <p>Seu questionário foi enviado com sucesso. Nossa equipe vai analisar as respostas e retornar em breve.</p>
            <div style={{marginTop:12,display:'flex',gap:8,justifyContent:'center'}}>
              <button className="btn-primary" onClick={()=>{ setShowTestSelection(true); setCompleted(false); setSelectedTest(null); setAnswers([]); setCurrent(0); setStarted(false); }} style={{padding:'10px 16px'}}>Voltar ao início</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
