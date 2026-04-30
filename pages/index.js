import Head from 'next/head';
import { useEffect, useState } from 'react';

export default function Home(){
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [candidateName, setCandidateName] = useState('');
  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState(false);
  

  useEffect(()=>{ const savedName = localStorage.getItem('candidate_name') || ''; setCandidateName(savedName); },[]);

  // fetch questions from backend
  useEffect(()=>{
    let mounted = true;
    async function load(){
  try{
    const r = await fetch('/api/questions');
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
  },[]);

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

    // Build dynamic maximums from current question set so each dimension stays in 0-100%.
    questions.forEach((q)=>{
      if(!q.dimension) return;
      dimMax[q.dimension] = (dimMax[q.dimension] || 0) + 3;
      if(dims[q.dimension] === undefined) dims[q.dimension] = 0;
    });

    questions.forEach((q,i)=>{
      const ans = answers[i];
      if(q.type==='options' && ans !== null){
        const opt = q.options?.[ans];
        const pts = Number(opt?.score || 0);
        total += pts;
        max += 3;
        if(q.dimension) dims[q.dimension] = (dims[q.dimension] || 0) + pts;
        if(opt?.flag) flags.push({flag:opt.flag,q:q.id});
      }
      else if(q.type==='calc'){
        const raw = Number(ans || 0);
        const correctVal = Number(q.correctAnswer || 0);
        const correct = Math.abs(raw - correctVal) < 0.01;
        const pts = correct ? 3 : (Math.abs(raw - correctVal) < 1 ? 1 : 0);
        total += pts;
        max += 3;
        if(q.dimension) dims[q.dimension] = (dims[q.dimension] || 0) + pts;
        if(!correct) flags.push({flag:'calculo_erro',q:q.id});
      }
      else if(q.type==='open'){
        const len = (ans || '').trim().length;
        const pts = len > 100 ? 3 : len > 50 ? 2 : len > 20 ? 1 : 0;
        total += pts;
        max += 3;
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

    const submission = { id: Date.now(), name: candidateName || 'Sem nome', date: now.toISOString(), pct, flags, dims, dimMax, html: reportHtml };
    // save local
    try{ const existing = JSON.parse(localStorage.getItem('submissions')||'[]'); existing.push(submission); localStorage.setItem('submissions', JSON.stringify(existing)); }catch(e){ console.error(e); }
    // send server
    try{ await fetch('/api/submit',{ method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(submission) }); }catch(e){ console.warn('Envio falhou',e); }

    setStarted(false);
    setCompleted(true);
  }

  function buildReportHtml({ candidateName, pct, flags, dims, dimMax, dateStr, openAnswers }){
    const flagMeta = {
      logistica_risco:      { icon:'🚌', label:'Logística em risco', desc:'Transporte ou deslocamento sem solução definida.' },
      logistica_incerta:    { icon:'⚠️', label:'Logística incerta',  desc:'Confirmar antes da admissão.' },
      conciliacao_risco:    { icon:'👶', label:'Conflito de horário', desc:'Responsabilidades que podem impactar presença.' },
      conciliacao_incerta:  { icon:'📅', label:'Conciliação a resolver', desc:'Verificar se a solução será viável.' },
      historico_curto:      { icon:'📋', label:'Histórico curto',    desc:'Empregos anteriores de curta duração — aprofundar motivos.' },
      historico_muito_curto:{ icon:'🔁', label:'Padrão de saída rápida', desc:'Verificar se há padrão de desligamentos precoces.' },
      conflito_relacional:  { icon:'🤝', label:'Saída por conflito', desc:'Investigar contexto — pode indicar dificuldade com hierarquia.' },
      adaptacao_risco:      { icon:'🔄', label:'Dificuldade de adaptação', desc:'Não se adaptou ao ritmo ou regras do emprego anterior.' },
      reatividade_emocional:{ icon:'😤', label:'Alta reatividade emocional', desc:'Tende a reagir sob pressão — monitorar nos primeiros dias.' },
      regulacao_risco:      { icon:'😰', label:'Dificuldade sob pressão', desc:'Indica possível impacto na experiência do cliente em momentos críticos.' },
      postura_passiva:      { icon:'🤐', label:'Postura passiva em conflito', desc:'Pode gerar insatisfação do cliente por omissão.' },
      reatividade_baixa:    { icon:'⏳', label:'Baixa proatividade', desc:'Espera instruções ao invés de agir — precisa de acompanhamento.' },
      integridade_risco:    { icon:'🔒', label:'Atenção à integridade', desc:'Tendência a evitar reporte de erros — ponto crítico para a função.' },
      integridade_passiva:  { icon:'🔔', label:'Integridade passiva', desc:'Não esconde, mas hesita em reportar — orientar no onboarding.' },
      resistencia_feedback: { icon:'💬', label:'Resistência a feedback', desc:'Pode dificultar o aprendizado no período de experiência.' },
      abertura_feedback:    { icon:'💬', label:'Abertura moderada a feedback', desc:'Atenção ao estilo do supervisor para não gerar resistência.' },
      core_dificuldade:     { icon:'🧩', label:'Dificuldade no core da função', desc:'Lidar com clientes é o centro do trabalho — avaliar com cuidado.' },
      fit_risco:            { icon:'🎯', label:'Fit com a função em dúvida', desc:'Horário/rotina como dificuldade central — verificar expectativas.' },
      fit_plano:            { icon:'🗺️', label:'Plano divergente da área', desc:'Não se vê no varejo a médio prazo — tendência de saída.' },
      sem_perspectiva:      { icon:'🌫️', label:'Sem perspectiva clara', desc:'Ausência de projeto profissional pode levar à saída quando surgir outra opção.' },
      calculo_erro:         { icon:'🧮', label:'Erro no cálculo de troco', desc:'Verificar atenção numérica — pode precisar de reforço no início.' },
    };

    const dimLabel = { logistica:'Logística', estabilidade:'Estabilidade', regulacao:'Regulação emocional', integridade:'Integridade', aprendizado:'Abertura p/ aprender', fit:'Fit com a função', atencao:'Atenção numérica', autoconsciencia:'Autoconsciência' };

    let verdict = '⚑ Requer análise aprofundada', verdictClass='verdict-red', recClass='rec-red', recTitle='🔴 Requer entrevista aprofundada antes de avançar', recText=`Foram identificados ${flags.length} sinalizadores que podem indicar risco de saída precoce. Recomendado uma entrevista presencial focada nos pontos críticos antes de qualquer decisão de avanço.`;
    const riskFlags = flags.filter(f => ['logistica_risco','reatividade_emocional','regulacao_risco','integridade_risco','adaptacao_risco','historico_muito_curto','fit_risco'].includes(f.flag));
    if(pct >= 72 && riskFlags.length === 0){ verdict = '✓ Perfil recomendado'; verdictClass='verdict-green'; recClass='rec-green'; recTitle='🟢 Recomendado para avançar'; recText = `${candidateName} demonstrou boa estabilidade, regulação emocional e fit com a função. Sinalizadores comportamentais de risco não foram identificados. Avance para entrevista presencial ou etapa de admissão.`; }
    else if(pct >= 50 && riskFlags.length <= 1){ verdict = '⚡ Avançar com atenção'; verdictClass='verdict-yellow'; recClass='rec-yellow'; recTitle='🟡 Avançar com plano de acompanhamento'; recText = `${candidateName} apresenta pontos positivos mas tem ${flags.length > 0 ? flags.length + ' sinalizador(es) de atenção' : 'algumas incertezas'}. Recomendado avançar com acompanhamento próximo nos primeiros 30 dias e alinhamento claro de expectativas na admissão.`; }

    const ringColor = pct>=72 ? '#34c77b' : pct>=50 ? '#f0b429' : '#e05c5c';
    const circumference = 2 * Math.PI * 44;
    const offset = circumference - (pct/100)*circumference;

    const dimOrder = ['regulacao','integridade','estabilidade','logistica','fit','aprendizado','atencao','autoconsciencia'];
    let dimsHTML = '';
    dimOrder.forEach(d => {
      const v = dims[d]||0; const m = dimMax[d]||0;
      const p = m > 0 ? Math.max(0, Math.min(100, Math.round((v/m)*100))) : 0;
      const barClass = p>=70?'bar-green':p>=40?'bar-yellow':'bar-red';
      const valColor = p>=70?'var(--green)':p>=40?'var(--yellow)':'var(--red)';
      dimsHTML += `<div class="ind-card"><div class="ind-title">${dimLabel[d] || d}</div><div class="ind-bar-wrap"><div class="ind-bar-bg"><div class="ind-bar-fill ${barClass}" style="width:${p}%" data-w="${p}"></div></div><span class="ind-val" style="color:${valColor}">${p}%</span></div></div>`;
    });

    let flagsHTML = '';
    if(!flags || flags.length === 0){ flagsHTML = `<div class="flag-item"><span class="flag-icon">✅</span><div class="flag-text"><strong>Nenhum sinalizador de risco identificado</strong><span>Todas as respostas dentro do perfil esperado.</span></div></div>`; }
    else { flags.forEach(f => { const m = flagMeta[f.flag] || { icon:'⚠️', label:f.flag, desc:'' }; flagsHTML += `<div class="flag-item"><span class="flag-icon">${m.icon}</span><div class="flag-text"><strong>${m.label}</strong><span>${m.desc}</span></div></div>`; }); }

    let openAnswersHTML = '';
    if(openAnswers && openAnswers.length > 0){
      const rows = openAnswers.map((item, idx)=>{
        const qText = escapeHtml(item.question?.text || `Pergunta ${idx + 1}`);
        const answer = escapeHtml(String(item.answer || '(sem resposta)')).replace(/\n/g, '<br/>');
        return `<div class="flag-item"><span class="flag-icon">✍️</span><div class="flag-text"><strong>${qText}</strong><span>${answer}</span></div></div>`;
      }).join('');
      openAnswersHTML = `<div class="flags-section"><h3>Respostas abertas (${openAnswers.length})</h3>${rows}</div>`;
    }

    return `
      <div class="result-header">
        <span class="verdict-badge ${verdictClass}">${verdict}</span>
        <div class="result-name">Resultado de <em>${escapeHtml(candidateName)}</em></div>
        <div class="result-sub">Avaliação Comportamental &nbsp;·&nbsp; ${dateStr}</div>
        <div class="score-ring-wrap"><div class="score-ring"><svg viewBox="0 0 100 100"><circle class="ring-bg" cx="50" cy="50" r="44" stroke-dasharray="${circumference}" stroke-dashoffset="0"/><circle class="ring-fill" cx="50" cy="50" r="44" stroke="${ringColor}" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}" id="ring-anim"/></svg><div class="score-text"><span class="score-num" style="color:${ringColor}">${pct}%</span><span class="score-label">fit geral</span></div></div></div>
      </div>
      <div class="indicators-grid">${dimsHTML}</div>
      <div class="flags-section"><h3>⚑ Sinalizadores comportamentais (${flags.length})</h3>${flagsHTML}</div>
      ${openAnswersHTML}
      <div class="recommendation ${recClass}"><h3>${recTitle}</h3><p>${recText}</p></div>
      <p class="print-note">Este resultado é para uso interno do RH — não compartilhe com o candidato.</p>
    `;
  }

  function escapeHtml(str){ return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  return (
    <>
      <Head>
        <title>Avaliação Comportamental</title>
      </Head>

      <div id="progress-bar"><div id="progress-fill" style={{width: `${Math.round((current/questions.length)*100)}%`}}></div></div>

      {!started && !completed && (
        <div id="screen-intro" className="screen active">
          <div className="intro-card">
            <div className="logo-badge">🧠 Avaliação Comportamental</div>
            <h1>Você está a um passo de<br/><em>fazer parte do time</em></h1>
            <p>Este questionário nos ajuda a entender melhor o seu perfil. Não há respostas certas ou erradas — seja honesto(a).</p>
            <div className="meta-list"><span className="meta-item"><span className="dot"></span> ~8 minutos</span><span className="meta-item"><span className="dot"></span>{questions.length} perguntas</span><span className="meta-item"><span className="dot"></span> Operador(a) de Caixa</span></div>
            <div className="name-input-wrap"><label>Seu nome completo</label><input value={candidateName} onChange={e=>setCandidateName(e.target.value)} placeholder="Ex: Maria Silva" /></div>
            <button className="btn-primary" onClick={startQuiz} disabled={candidateName.trim().length < 2 || questions.length === 0}>Iniciar avaliação →</button>
            <button className="btn-secondary" onClick={()=>window.location.href='/admin/login'} style={{marginTop:10,width:'100%',justifyContent:'center'}}>Acessar área administrativa</button>
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
          </div>
        </div>
      )}
    </>
  );
}
