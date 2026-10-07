import Head from 'next/head';
import { useEffect, useState } from 'react';
import { LOJAS } from '../lib/auth.js';

export default function AvaliacaoFuncionario() {
  const [blocks, setBlocks] = useState([]);
  const [currentBlock, setCurrentBlock] = useState(0);
  const [answers, setAnswers] = useState({});
  const [nomeFuncionario, setNomeFuncionario] = useState('');
  const [lojaId, setLojaId] = useState('01');
  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showIntro, setShowIntro] = useState(true);

  // Carregar blocos DISC existentes do backend
  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const r = await fetch('/api/behavior-style');
        if (!r.ok) throw new Error('Falha ao carregar teste DISC');
        const data = await r.json();
        if (mounted) setBlocks(data);
      } catch (e) {
        console.warn('Erro ao carregar teste', e);
        if (mounted) setError('Erro ao carregar o teste. Tente recarregar a página.');
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  // Obter respostas do bloco atual
  const currentAnswers = answers[currentBlock] || { dominancia: null, influencia: null, estabilidade: null, conformidade: null };
  const usedValues = Object.values(currentAnswers).filter(v => v !== null);

  function isValueAvailable(value) {
    return !usedValues.includes(value);
  }

  function selectValue(dimension, value) {
    if (!isValueAvailable(value)) return;
    const newBlockAnswers = { ...currentAnswers, [dimension]: value };
    setAnswers(prev => ({ ...prev, [currentBlock]: newBlockAnswers }));
  }

  function removeValue(dimension) {
    const newBlockAnswers = { ...currentAnswers, [dimension]: null };
    setAnswers(prev => ({ ...prev, [currentBlock]: newBlockAnswers }));
  }

  function isBlockComplete(blockIdx) {
    const blockAns = answers[blockIdx];
    if (!blockAns) return false;
    return blockAns.dominancia !== null && 
           blockAns.influencia !== null && 
           blockAns.estabilidade !== null && 
           blockAns.conformidade !== null;
  }

  function isTestComplete() {
    return blocks.length > 0 && blocks.every((_, idx) => isBlockComplete(idx));
  }

  const completedBlocks = blocks.filter((_, idx) => isBlockComplete(idx)).length;
  const progress = blocks.length > 0 ? Math.round((completedBlocks / blocks.length) * 100) : 0;

  function nextBlock() {
    if (currentBlock < blocks.length - 1) {
      setCurrentBlock(c => c + 1);
    }
  }

  function prevBlock() {
    if (currentBlock > 0) {
      setCurrentBlock(c => c - 1);
    }
  }

  function goToBlock(idx) {
    setCurrentBlock(idx);
  }

  function startTest() {
    if (!nomeFuncionario.trim()) {
      setError('Por favor, informe seu nome completo.');
      return;
    }
    if (!lojaId) {
      setError('Por favor, selecione sua loja.');
      return;
    }
    setError('');
    setShowIntro(false);
    setStarted(true);
  }

  async function submitTest() {
    if (!isTestComplete()) {
      setError('Complete todos os 10 blocos antes de finalizar.');
      return;
    }
    if (!nomeFuncionario.trim()) {
      setError('Informe seu nome completo.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Formato idêntico ao exigido pelo teste DISC da plataforma
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

      const response = await fetch('/api/funcionario/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome_funcionario: nomeFuncionario.trim(),
          loja_id: lojaId,
          answers: formattedAnswers
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao registrar avaliação');
      }

      setCompleted(true);
      setIsSubmitting(false);
    } catch (e) {
      setError(String(e.message || e));
      setIsSubmitting(false);
    }
  }

  const currentBlockData = blocks[currentBlock];
  const lojaNome = LOJAS.find(l => l.id === lojaId)?.name || `Loja ${lojaId}`;

  // TELA DE SUCESSO / CONCLUSÃO
  if (completed) {
    return (
      <>
        <Head>
          <title>Avaliação Concluída — Loja {lojaId}</title>
        </Head>
        <div id="screen-intro" className="screen active" style={{minHeight:'100vh',justifyContent:'center',alignItems:'center',padding:'2rem 1.2rem'}}>
          <div className="intro-card" style={{maxWidth:540,textAlign:'center'}}>
            <div className="logo-badge" style={{background:'rgba(52,199,123,0.15)',borderColor:'rgba(52,199,123,0.3)',color:'var(--green)'}}>
              ✓ Avaliação Concluída
            </div>
            <h1 style={{fontSize:'2.1rem',marginBottom:'1rem'}}>Obrigado,<br/><em>{nomeFuncionario}</em>!</h1>
            <p style={{fontSize:'1rem',color:'var(--light)',lineHeight:1.7}}>
              Sua avaliação comportamental foi finalizada com sucesso e vinculada à <strong>{lojaNome}</strong>.
            </p>
            <div style={{background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:12,padding:'1.2rem',margin:'1.5rem 0',textAlign:'left'}}>
              <div style={{fontSize:'0.85rem',color:'var(--muted)',marginBottom:4}}>RESUMO DO REGISTRO</div>
              <div style={{fontSize:'0.95rem',fontWeight:600,color:'var(--text)'}}>Colaborador: <span style={{color:'var(--accent)'}}>{nomeFuncionario}</span></div>
              <div style={{fontSize:'0.95rem',fontWeight:600,color:'var(--text)',marginTop:4}}>Unidade: <span style={{color:'var(--accent)'}}>{lojaNome}</span></div>
              <div style={{fontSize:'0.82rem',color:'var(--muted)',marginTop:8}}>
                O resultado DISC já se encontra disponível no painel de gestão da sua loja para acompanhamento da gerência.
              </div>
            </div>
            <button className="btn-primary" onClick={() => window.location.href = '/'} style={{marginTop:10}}>
              Voltar à página inicial
            </button>
          </div>
        </div>
      </>
    );
  }

  // TELA DE IDENTIFICAÇÃO (Nome + Loja)
  if (showIntro) {
    return (
      <>
        <Head>
          <title>Avaliação Comportamental de Colaboradores</title>
        </Head>
        <div id="screen-intro" className="screen active">
          <div className="intro-card">
            <div className="logo-badge">🏢 Avaliação da Equipe • Teste DISC</div>
            <h1>Avaliação Comportamental<br/><em>dos Colaboradores</em></h1>
            <p>Seja bem-vindo(a)! Preencha seus dados para iniciar seu teste comportamental.</p>
            
            <div className="meta-list">
              <span className="meta-item"><span className="dot"></span> 10 blocos</span>
              <span className="meta-item"><span className="dot"></span> ~5 minutos</span>
              <span className="meta-item"><span className="dot"></span> Sem respostas certas ou erradas</span>
            </div>

            <div className="name-input-wrap">
              <label>Nome do colaborador</label>
              <input
                value={nomeFuncionario}
                onChange={e => setNomeFuncionario(e.target.value)}
                placeholder="Ex: João Silva"
                autoFocus
              />
            </div>

            <div className="name-input-wrap">
              <label>Selecione sua loja</label>
              <select
                value={lojaId}
                onChange={e => setLojaId(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--surface2)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  padding: '.85rem 1rem',
                  fontFamily: 'Sora, sans-serif',
                  fontSize: '.95rem',
                  color: 'var(--text)',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                {LOJAS.map(loja => (
                  <option key={loja.id} value={loja.id}>
                    {loja.name}
                  </option>
                ))}
              </select>
            </div>

            {error && <div style={{color:'#dc2626',fontSize:13,marginTop:8,marginBottom:8}}>{error}</div>}

            <button
              className="btn-primary"
              onClick={startTest}
              disabled={nomeFuncionario.trim().length < 2 || blocks.length === 0}
              style={{marginTop: 12}}
            >
              Iniciar teste →
            </button>

            <button
              className="btn-secondary"
              onClick={() => window.location.href = '/'}
              style={{marginTop: 10, width: '100%', justifyContent: 'center'}}
            >
              ← Voltar ao início
            </button>
          </div>
        </div>
      </>
    );
  }

  // TELA DE PROCESSAMENTO
  if (isSubmitting) {
    return (
      <>
        <Head>
          <title>Enviando... - Avaliação da Equipe</title>
        </Head>
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.6)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1200}}>
          <div style={{background:'#fff',color:'#111',padding:24,borderRadius:12,display:'flex',flexDirection:'column',alignItems:'center',gap:12,boxShadow:'0 8px 32px rgba(0,0,0,0.3)'}}>
            <div style={{fontSize:18,fontWeight:700}}>⏳ Registrando avaliação</div>
            <div style={{fontSize:13,color:'#666'}}>Aguarde enquanto salvamos suas respostas na {lojaNome}...</div>
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

  // TELA DO TESTE DISC (BLOCOS 1 a 10)
  return (
    <>
      <Head>
        <title>Teste DISC — {nomeFuncionario} ({lojaNome})</title>
      </Head>

      <div id="progress-bar"><div id="progress-fill" style={{width: `${progress}%`}}></div></div>

      <div id="screen-quiz" className="screen active" style={{padding:'1.5rem 1rem'}}>
        <div className="quiz-inner" style={{maxWidth:780,margin:'0 auto'}}>
          {/* Header com identificação e progresso */}
          <div className="step-indicator" style={{display:'flex',alignItems:'center',gap:12,marginBottom:'1.2rem',flexWrap:'wrap'}}>
            <div style={{background:'rgba(240,180,41,.12)',padding:'4px 10px',borderRadius:20,fontSize:'0.75rem',color:'var(--accent)',fontWeight:600}}>
              {lojaNome} • {nomeFuncionario}
            </div>
            <span className="step-num">Bloco {currentBlock + 1} de {blocks.length}</span>
            <div className="step-dots" style={{display:'flex',gap:6}}>
              {blocks.map((_, i) => (
                <div 
                  key={i} 
                  className={`step-dot ${isBlockComplete(i) ? 'done' : i === currentBlock ? 'current' : ''}`}
                  onClick={() => goToBlock(i)}
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: isBlockComplete(i) ? 'var(--accent)' : i === currentBlock ? 'var(--accent2)' : 'var(--border)',
                    cursor: 'pointer'
                  }}
                ></div>
              ))}
            </div>
            <span className="step-num" style={{marginLeft: 'auto'}}>{progress}% concluído</span>
          </div>

          {/* Instruções */}
          <div style={{background: 'rgba(26,127,110,0.1)', border: '1px solid rgba(26,127,110,0.3)', borderRadius: 10, padding: '1rem', marginBottom: '1.2rem', fontSize: '0.85rem', color: 'var(--teal)'}}>
            <strong>Instrução:</strong> Em cada bloco existem quatro grupos de características. Distribua os números de 1 a 4 conforme o quanto cada grupo se parece com você.
            <br/>
            <strong>4 = mais parecido comigo</strong> | <strong>1 = menos parecido comigo</strong>
            <br/>
            Os números não podem se repetir dentro do mesmo bloco.
          </div>

          {/* Legenda de pontuação */}
          <div style={{display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '1rem', fontSize: '0.75rem', color: 'var(--muted)', flexWrap: 'wrap'}}>
            <span style={{display:'flex',alignItems:'center',gap:'0.35rem'}}><span style={{width:'14px',height:'14px',borderRadius:'4px',background:'#e05c5c'}}></span> 1 = Menos parecido</span>
            <span style={{display:'flex',alignItems:'center',gap:'0.35rem'}}><span style={{width:'14px',height:'14px',borderRadius:'4px',background:'#f59e0b'}}></span> 2</span>
            <span style={{display:'flex',alignItems:'center',gap:'0.35rem'}}><span style={{width:'14px',height:'14px',borderRadius:'4px',background:'#34c77b'}}></span> 3</span>
            <span style={{display:'flex',alignItems:'center',gap:'0.35rem'}}><span style={{width:'14px',height:'14px',borderRadius:'4px',background:'#1a7f6e'}}></span> 4 = Mais parecido</span>
          </div>

          {error && <div style={{color:'#dc2626',fontSize:13,marginBottom:12,textAlign:'center'}}>{error}</div>}

          {/* Bloco atual de perguntas */}
          {currentBlockData && (
            <div className="question-block" style={{animation: 'fadeUp .35s ease'}}>
              <span className="q-category" style={{background: 'rgba(240,180,41,.15)', color: 'var(--accent)', display:'inline-block', padding:'4px 12px', borderRadius:20, fontSize:12, marginBottom:12}}>
                {currentBlockData.title}
              </span>
              
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
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', gap: 12}}>
                        <div>
                          <div style={{fontSize: '0.95rem', fontWeight: 500, color: 'var(--text)', lineHeight: 1.5}}>
                            {item.label}
                          </div>
                          {item.traits && item.traits.length > 1 && (
                            <div style={{fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.35rem', lineHeight: 1.5}}>
                              {item.traits.join(' • ')}
                            </div>
                          )}
                        </div>
                        <div style={{display: 'flex', gap: '0.5rem', flexShrink: 0}}>
                          {[1, 2, 3, 4].map(val => {
                            const colors = { 1: '#e05c5c', 2: '#f59e0b', 3: '#34c77b', 4: '#1a7f6e' };
                            const color = colors[val];
                            return (
                              <button
                                key={val}
                                className={`score-btn ${isSelected(val) ? 'selected' : ''}`}
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
                                  opacity: (!isValueAvailable(val) && !isSelected(val)) ? 0.4 : 1,
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
                      
                      {/* Indicador dos valores */}
                      <div style={{display: 'flex', gap: '0.5rem', fontSize: '0.7rem', justifyContent:'flex-end'}}>
                        {[1, 2, 3, 4].map(val => {
                          const colors = { 1: '#e05c5c', 2: '#f59e0b', 3: '#34c77b', 4: '#1a7f6e' };
                          return (
                            <span 
                              key={val} 
                              style={{
                                width: '44px',
                                textAlign: 'center',
                                color: usedValues.includes(val) ? colors[val] : 'var(--border)',
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
          )}

          {/* Navegação entre blocos */}
          <div className="nav-row" style={{marginTop: '1.5rem', display:'flex', justifyContent:'space-between', alignItems:'center', gap:10}}>
            <button
              className="btn-secondary"
              onClick={prevBlock}
              disabled={currentBlock === 0 || isSubmitting}
              style={{visibility: currentBlock > 0 ? 'visible' : 'hidden'}}
            >
              ← Voltar
            </button>
            <div style={{display: 'flex', gap: '0.4rem', flexWrap:'wrap', justifyContent: 'center'}}>
              {blocks.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => goToBlock(idx)}
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
      `}</style>
    </>
  );
}
