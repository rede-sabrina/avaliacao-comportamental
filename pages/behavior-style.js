import Head from 'next/head';
import { useEffect, useState } from 'react';

export default function BehaviorStyleTest() {
  const [blocks, setBlocks] = useState([]);
  const [currentBlock, setCurrentBlock] = useState(0);
  const [answers, setAnswers] = useState({});
  const [candidateName, setCandidateName] = useState('');
  const [candidateCpf, setCandidateCpf] = useState('');
  const [candidateId, setCandidateId] = useState('');
  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showIntro, setShowIntro] = useState(true);

  // Carregar blocos do backend
  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const r = await fetch('/api/behavior-style');
        if (!r.ok) throw new Error('Falha ao carregar teste');
        const data = await r.json();
        if (mounted) setBlocks(data);
      } catch (e) {
        console.warn('Could not load behavior style test', e);
        if (mounted) setError('Erro ao carregar o teste. Tente recarregar a página.');
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  // Gerar ID único do candidato (baseado no CPF ou nome + timestamp)
  useEffect(() => {
    if (candidateCpf) {
      setCandidateId('cpf_' + candidateCpf.replace(/\D/g, ''));
    } else if (candidateName) {
      setCandidateId('name_' + candidateName.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now());
    }
  }, [candidateName, candidateCpf]);

  // Validação de CPF
  function validateCPF(cpf) {
    if (!cpf) return false;
    const s = String(cpf).replace(/\D/g, '');
    if (s.length !== 11) return false;
    if (/^([0-9])\1{10}$/.test(s)) return false;
    const calc = (arr) => arr.reduce((acc, cur, i) => acc + Number(cur) * (arr.length + 1 - i), 0);
    const digits = s.split('').map(Number);
    const dv1 = ((calc(digits.slice(0, 9)) * 10) % 11) % 10;
    const dv2 = ((calc(digits.slice(0, 10)) * 10) % 11) % 10;
    return dv1 === digits[9] && dv2 === digits[10];
  }

  // Obter respostas do bloco atual
  const currentAnswers = answers[currentBlock] || { dominancia: null, influencia: null, estabilidade: null, conformidade: null };

  // Valores já usados no bloco atual
  const usedValues = Object.values(currentAnswers).filter(v => v !== null);

  // Verificar se valor está disponível
  function isValueAvailable(value) {
    return !usedValues.includes(value);
  }

  // Selecionar valor para uma dimensão
  function selectValue(dimension, value) {
    if (!isValueAvailable(value)) return;
    
    const newBlockAnswers = { ...currentAnswers, [dimension]: value };
    setAnswers(prev => ({ ...prev, [currentBlock]: newBlockAnswers }));
  }

  // Remover valor de uma dimensão
  function removeValue(dimension) {
    const newBlockAnswers = { ...currentAnswers, [dimension]: null };
    setAnswers(prev => ({ ...prev, [currentBlock]: newBlockAnswers }));
  }

  // Verificar se bloco está completo
  function isBlockComplete(blockIdx) {
    const blockAns = answers[blockIdx];
    if (!blockAns) return false;
    return blockAns.dominancia !== null && 
           blockAns.influencia !== null && 
           blockAns.estabilidade !== null && 
           blockAns.conformidade !== null;
  }

  // Verificar se todos os blocos estão completos
  function isTestComplete() {
    return blocks.every((_, idx) => isBlockComplete(idx));
  }

  // Obter progresso
  const completedBlocks = blocks.filter((_, idx) => isBlockComplete(idx)).length;
  const progress = blocks.length > 0 ? Math.round((completedBlocks / blocks.length) * 100) : 0;

  // Próximo bloco
  function nextBlock() {
    if (currentBlock < blocks.length - 1) {
      setCurrentBlock(c => c + 1);
    }
  }

  // Bloco anterior
  function prevBlock() {
    if (currentBlock > 0) {
      setCurrentBlock(c => c - 1);
    }
  }

  // Ir para bloco específico
  function goToBlock(idx) {
    setCurrentBlock(idx);
  }

  // Submeter teste
  async function submitTest() {
    if (!isTestComplete()) {
      setError('Complete todos os blocos antes de finalizar');
      return;
    }
    if (!candidateName.trim()) {
      setError('Informe seu nome');
      return;
    }
    if (!candidateCpf || !validateCPF(candidateCpf)) {
      setError('CPF inválido');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Preparar respostas no formato esperado pelo backend
      const formattedAnswers = blocks.map((block, idx) => {
        const ans = answers[idx];
        return {
          block: block.block,
          dominancia: ans.dominancia,
          influencia: ans.influencia,
          estabilidade: ans.estabilidade,
          conformidade: ans.conformidade
        };
      });

      const response = await fetch('/api/behavior-style', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId,
          candidateName: candidateName.trim(),
          candidateCpf: candidateCpf.replace(/\D/g, ''),
          answers: formattedAnswers
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erro ao enviar');

      // Redirecionar para página de resultado
      window.location.href = `/behavior-style-result?candidateId=${encodeURIComponent(candidateId)}`;
    } catch (e) {
      setError(String(e));
      setIsSubmitting(false);
    }
  }

  // Iniciar teste
  function startTest() {
    if (!candidateName.trim()) {
      setError('Informe seu nome');
      return;
    }
    if (!candidateCpf || !validateCPF(candidateCpf)) {
      setError('CPF inválido');
      return;
    }
    setShowIntro(false);
    setStarted(true);
    setError('');
  }

  if (showIntro && !completed) {
    return (
      <>
        <Head>
          <title>Teste de Estilo de Comportamento</title>
        </Head>
        <div id="screen-intro" className="screen active">
          <div className="intro-card">
            <div className="logo-badge">🧠 Teste de Estilo de Comportamento</div>
            <h1>Descubra seu<br/><em>perfil comportamental</em></h1>
            <p>Este teste avalia 4 dimensões do seu estilo de comportamento através de 10 blocos de questões.</p>
            <div className="meta-list">
              <span className="meta-item"><span className="dot"></span> 10 blocos</span>
              <span className="meta-item"><span className="dot"></span> ~5 minutos</span>
              <span className="meta-item"><span className="dot"></span> Sem respostas certas ou erradas</span>
            </div>
            <div className="name-input-wrap">
              <label>Seu nome completo</label>
              <input value={candidateName} onChange={e => setCandidateName(e.target.value)} placeholder="Ex: Maria Silva" />
            </div>
            <div className="name-input-wrap">
              <label>CPF</label>
              <input value={candidateCpf} onChange={e => setCandidateCpf(e.target.value)} placeholder="000.000.000-00" />
            </div>
            {candidateCpf && !validateCPF(candidateCpf) && <div style={{color:'#dc2626',fontSize:13,marginTop:6}}>CPF inválido</div>}
            {error && <div style={{color:'#dc2626',fontSize:13,marginTop:8}}>{error}</div>}
            <button className="btn-primary" onClick={startTest} disabled={candidateName.trim().length < 2 || blocks.length === 0 || !validateCPF(candidateCpf)}>
              Iniciar teste →
            </button>
            <button className="btn-secondary" onClick={() => window.location.href = '/'} style={{marginTop: 10, width: '100%', justifyContent: 'center'}}>
              ← Trocar de teste
            </button>
          </div>
        </div>
      </>
    );
  }

  if (completed || isSubmitting) {
    return (
      <>
        <Head>
          <title>Enviando... - Teste de Estilo de Comportamento</title>
        </Head>
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.4)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1200}}>
          <div style={{background:'#fff',color:'#111',padding:22,borderRadius:10,display:'flex',flexDirection:'column',alignItems:'center',gap:10,boxShadow:'0 6px 30px rgba(0,0,0,0.25)'}}>
            <div style={{fontSize:18,fontWeight:700}}>⏳ Enviando respostas</div>
            <div style={{fontSize:13,color:'#666'}}>Aguarde enquanto processamos seu envio...</div>
            <div style={{marginTop:8,display:'flex',gap:6}}>
              <div style={{width:8,height:8,borderRadius:'50%',background:'#1a7f6e',animation:'pulse 1.4s infinite'}}></div>
              <div style={{width:8,height:8,borderRadius:'50%',background:'#1a7f6e',animation:'pulse 1.4s infinite',animationDelay:'0.2s'}}></div>
              <div style={{width:8,height:8,borderRadius:'50%',background:'#1a7f6e',animation:'pulse 1.4s infinite',animationDelay:'0.4s'}}></div>
            </div>
            <style>{`@keyframes pulse { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }`}</style>
          </div>
        </div>
      </>
    );
  }

  const currentBlockData = blocks[currentBlock];

  return (
    <>
      <Head>
        <title>Teste de Estilo de Comportamento</title>
      </Head>

      <div id="progress-bar"><div id="progress-fill" style={{width: `${progress}%`}}></div></div>

      <div id="screen-quiz" className="screen active">
        <div className="quiz-inner">
          {/* Header com progresso */}
          <div className="step-indicator">
            <button 
              className="btn-ghost" 
              onClick={() => window.location.href = '/'}
              style={{fontSize: '0.75rem', padding: '0.4rem 0.8rem', marginRight: '1rem', height: 'auto'}}
            >
              ← Trocar de teste
            </button>
            <span className="step-num">Bloco {currentBlock + 1} de {blocks.length}</span>
            <div className="step-dots">
              {blocks.map((_, i) => (
                <div 
                  key={i} 
                  className={`step-dot ${isBlockComplete(i) ? 'done' : i === currentBlock ? 'current' : ''}`}
                  onClick={() => goToBlock(i)}
                  style={{cursor: 'pointer'}}
                ></div>
              ))}
            </div>
            <span className="step-num" style={{marginLeft: 'auto'}}>{progress}% concluído</span>
          </div>

{/* Instrução visível em todos os blocos */}
            <div style={{background: 'rgba(26,127,110,0.1)', border: '1px solid rgba(26,127,110,0.3)', borderRadius: 8, padding: '1rem', marginBottom: '1.5rem', fontSize: '0.85rem', color: 'var(--teal)'}}>
              <strong>Instrução:</strong> Em cada bloco existem quatro grupos de características. Distribua os números de 1 a 4 conforme o quanto cada grupo se parece com você.
              <br/>
              <strong>4 = mais parecido comigo</strong> | <strong>1 = menos parecido comigo</strong>
              <br/>
              Os números não podem se repetir dentro do mesmo bloco.
            </div>

            {/* Legenda das cores dos números */}
            <div style={{display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '1rem', fontSize: '0.75rem', color: 'var(--muted)'}}>
              <span style={{display:'flex',alignItems:'center',gap:'0.35rem'}}><span style={{width:'14px',height:'14px',borderRadius:'4px',background:'#e05c5c',border:'2px solid #e05c5c'}}></span> 1 = Menos parecido</span>
              <span style={{display:'flex',alignItems:'center',gap:'0.35rem'}}><span style={{width:'14px',height:'14px',borderRadius:'4px',background:'#f59e0b',border:'2px solid #f59e0b'}}></span> 2</span>
              <span style={{display:'flex',alignItems:'center',gap:'0.35rem'}}><span style={{width:'14px',height:'14px',borderRadius:'4px',background:'#34c77b',border:'2px solid #34c77b'}}></span> 3</span>
              <span style={{display:'flex',alignItems:'center',gap:'0.35rem'}}><span style={{width:'14px',height:'14px',borderRadius:'4px',background:'#1a7f6e',border:'2px solid #1a7f6e'}}></span> 4 = Mais parecido</span>
            </div>

          {/* Bloco atual */}
          <div className="question-block" style={{animation: 'fadeUp .35s ease'}}>
            <span className="q-category" style={{background: 'rgba(240,180,41,.15)', color: 'var(--accent)'}}>{currentBlockData.title}</span>
            
            <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
              {currentBlockData.items.map((item, itemIdx) => {
                const dimensionKey = item.dimension.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                const currentValue = currentAnswers[dimensionKey];
                const isSelected = (val) => currentValue === val;
                
                return (
                  <div key={itemIdx} className="dimension-card" style={{
                    background: 'var(--surface)',
                    border: '1.5px solid var(--border)',
                    borderRadius: '10px',
                    padding: '1rem',
                    transition: 'border-color .2s, background .2s'
                  }}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem'}}>
                      <div>
                        <div style={{fontSize: '0.95rem', fontWeight: 500, color: 'var(--text)', lineHeight: 1.5}}>
                          {item.label}
                        </div>
                        {item.traits.length > 1 && (
                          <div style={{fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.35rem', lineHeight: 1.5}}>
                            {item.traits.join(' • ')}
                          </div>
                        )}
                      </div>
                      <div style={{display: 'flex', gap: '0.5rem'}}>
                        {[1, 2, 3, 4].map(val => {
                          const colors = { 1: '#e05c5c', 2: '#f59e0b', 3: '#34c77b', 4: '#1a7f6e' };
                          const color = colors[val];
                          return (
                            <button
                              key={val}
                              className={`score-btn ${isSelected(val) ? 'selected' : ''} ${!isValueAvailable(val) && !isSelected(val) ? 'unavailable' : ''}`}
                              onClick={() => isSelected(val) ? removeValue(dimensionKey) : selectValue(dimensionKey, val)}
                              disabled={!isValueAvailable(val) && !isSelected(val)}
                              style={{
                                width: '44px',
                                height: '44px',
                                borderRadius: '8px',
                                border: isSelected(val) ? `2px solid ${color}` : '1.5px solid var(--border)',
                                background: isSelected(val) ? `${color}22` : (!isValueAvailable(val) && !isSelected(val) ? 'var(--surface2)' : 'var(--surface)'),
                                color: isSelected(val) ? color : (!isValueAvailable(val) && !isSelected(val) ? 'var(--muted)' : 'var(--text)'),
                                fontWeight: isSelected(val) ? '700' : '600',
                                fontSize: '1rem',
                                cursor: (!isValueAvailable(val) && !isSelected(val)) ? 'not-allowed' : 'pointer',
                                opacity: (!isValueAvailable(val) && !isSelected(val)) ? 0.5 : 1,
                                transition: 'all .2s',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: isSelected(val) ? `0 0 0 3px ${color}44` : 'none'
                              }}
                            >
                              {val}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    {/* Indicador visual dos valores usados */}
                    <div style={{display: 'flex', gap: '0.5rem', fontSize: '0.7rem'}}>
                      {[1, 2, 3, 4].map(val => {
                        const colors = { 1: '#e05c5c', 2: '#f59e0b', 3: '#34c77b', 4: '#1a7f6e' };
                        return (
                          <span 
                            key={val} 
                            style={{
                              width: '44px',
                              textAlign: 'center',
                              color: usedValues.includes(val) ? (isSelected(val) ? colors[val] : colors[val]) : 'var(--border)',
                              fontWeight: usedValues.includes(val) ? '600' : '400'
                            }}
                          >
                            {usedValues.includes(val) ? (isSelected(val) ? '✓' : '−') : val}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Navegação */}
          <div className="nav-row" style={{marginTop: '1.5rem'}}>
            <button className="btn-secondary" onClick={prevBlock} disabled={currentBlock === 0 || isSubmitting} style={{visibility: currentBlock > 0 ? 'visible' : 'hidden'}}>
              ← Voltar
            </button>
            <div style={{display: 'flex', gap: '0.5rem', flex: 1, justifyContent: 'center'}}>
              {blocks.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => goToBlock(idx)}
                  className={`step-dot-btn ${isBlockComplete(idx) ? 'done' : idx === currentBlock ? 'current' : ''}`}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    border: '1.5px solid',
                    borderColor: isBlockComplete(idx) ? 'var(--accent)' : idx === currentBlock ? 'var(--accent2)' : 'var(--border)',
                    background: isBlockComplete(idx) ? 'var(--accent)' : idx === currentBlock ? 'rgba(224,92,42,.15)' : 'var(--surface)',
                    color: isBlockComplete(idx) ? '#0f0f13' : 'var(--text)',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all .2s'
                  }}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
            <button 
              className="btn-primary" 
              onClick={currentBlock === blocks.length - 1 ? submitTest : nextBlock} 
              disabled={!isBlockComplete(currentBlock) || isSubmitting}
              style={{maxWidth: 220}}
            >
              {isSubmitting ? 'Enviando...' : (currentBlock === blocks.length - 1 ? 'Finalizar teste ✓' : 'Próximo →')}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .dimension-card:hover {
          border-color: var(--accent);
          background: var(--surface2);
        }
        .score-btn:hover:not(:disabled) {
          border-color: var(--accent);
          background: var(--surface2);
          transform: translateY(-1px);
        }
        .score-btn.selected {
          box-shadow: 0 0 0 2px rgba(240,180,41,.3);
        }
        .step-dot-btn:hover {
          transform: scale(1.1);
        }
        .step-dot-btn.done {
          animation: popIn .3s ease;
        }
        @keyframes popIn {
          0% { transform: scale(0.8); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
      `}</style>
    </>
  );
}