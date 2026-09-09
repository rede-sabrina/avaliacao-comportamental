import Head from 'next/head';
import { useEffect, useState } from 'react';

export default function BehaviorStyleResult() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [candidateId, setCandidateId] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('candidateId');
    if (id) {
      setCandidateId(id);
      loadResult(id);
    } else {
      setError('ID do candidato não encontrado na URL');
      setLoading(false);
    }
  }, []);

  async function loadResult(id) {
    try {
      const r = await fetch(`/api/behavior-style/${encodeURIComponent(id)}`);
      if (!r.ok) {
        if (r.status === 404) throw new Error('Resultado não encontrado');
        throw new Error('Erro ao carregar resultado');
      }
      const data = await r.json();
      setResult(data);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <>
        <Head>
          <title>Carregando... - Teste de Estilo de Comportamento</title>
        </Head>
        <div style={{position:'fixed',inset:0,background:'#0f0f13',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1200,color:'#fff'}}>
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:12}}>
            <div style={{fontSize:18,fontWeight:700}}>Carregando resultado</div>
            <div style={{display:'flex',gap:6}}>
              <div style={{width:8,height:8,borderRadius:'50%',background:'#f0b429',animation:'pulse 1.4s infinite'}}></div>
              <div style={{width:8,height:8,borderRadius:'50%',background:'#f0b429',animation:'pulse 1.4s infinite',animationDelay:'0.2s'}}></div>
              <div style={{width:8,height:8,borderRadius:'50%',background:'#f0b429',animation:'pulse 1.4s infinite',animationDelay:'0.4s'}}></div>
            </div>
            <style>{`@keyframes pulse { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }`}</style>
          </div>
        </div>
      </>
    );
  }

  if (error || !result) {
    return (
      <>
        <Head>
          <title>Erro - Teste de Estilo de Comportamento</title>
        </Head>
        <div id="screen-result" className="screen active" style={{justifyContent:'center',alignItems:'center',padding:'2rem 1.2rem'}}>
          <div className="intro-card" style={{maxWidth:560,textAlign:'center'}}>
            <div className="logo-badge" style={{background:'rgba(224,92,92,.12)',borderColor:'rgba(224,92,92,.25)',color:'#e05c5c' }}>⚠️ Erro</div>
            <h1>Não foi possível carregar o resultado</h1>
            <p style={{color:'var(--light)',marginTop:8}}>{error}</p>
            <button className="btn-primary" onClick={() => window.location.href = '/behavior-style'} style={{marginTop:16,width:'auto',padding:'0.9rem 2rem'}}>
              Voltar ao início
            </button>
          </div>
        </div>
      </>
    );
  }

  const scores = [
    { key: 'dominancia', label: 'DOMINÂNCIA', value: result.dominancia || result.scores?.dominancia || 0, desc: result.descriptions?.DOMINÂNCIA || '' },
    { key: 'influencia', label: 'INFLUÊNCIA', value: result.influencia || result.scores?.influencia || 0, desc: result.descriptions?.INFLUÊNCIA || '' },
    { key: 'estabilidade', label: 'ESTABILIDADE', value: result.estabilidade || result.scores?.estabilidade || 0, desc: result.descriptions?.ESTABILIDADE || '' },
    { key: 'conformidade', label: 'CONFORMIDADE', value: result.conformidade || result.scores?.conformidade || 0, desc: result.descriptions?.CONFORMIDADE || '' }
  ];

  const dominantProfiles = result.dominantProfiles || [];
  const total = result.total || 100;

  // Calcular ângulos para gráfico radar
  const radarData = scores.map((s, i) => ({
    ...s,
    angle: (i * 90) - 90, // 4 dimensões = 90° cada, começar no topo
    radius: (s.value / 100) * 130 // max radius 130px
  }));

  // Pontos do polígono radar
  const radarPoints = radarData.map(d => {
    const rad = (d.angle * Math.PI) / 180;
    const x = 160 + d.radius * Math.cos(rad);
    const y = 160 + d.radius * Math.sin(rad);
    return `${x},${y}`;
  }).join(' ');

  // Eixos do radar
  const axisLines = scores.map((_, i) => {
    const angle = (i * 90) - 90;
    const rad = (angle * Math.PI) / 180;
    const x = 160 + 140 * Math.cos(rad);
    const y = 160 + 140 * Math.sin(rad);
    return { x, y, label: scores[i].label };
  });

  // Círculos de referência (25%, 50%, 75%, 100%)
  const refCircles = [25, 50, 75, 100].map(pct => ({
    radius: (pct / 100) * 130,
    label: `${pct}%`
  }));

  function formatCPF(cpf) {
    if (!cpf) return '';
    const s = String(cpf).replace(/\D/g, '');
    if (s.length !== 11) return cpf;
    return `${s.slice(0,3)}.${s.slice(3,6)}.${s.slice(6,9)}-${s.slice(9)}`;
  }

  const dateStr = result.completedAt ? new Date(result.completedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

  // Obter descrição do perfil dominante
  function getDominantDescription(dim) {
    const descriptions = result.descriptions || {};
    return descriptions[dim] || '';
  }

  return (
    <>
      <Head>
        <title>Resultado - Teste de Estilo de Comportamento</title>
      </Head>

      <div id="screen-result" className="screen active" style={{padding: '2rem 1.2rem 4rem', alignItems: 'center', background: '#f5f3f0', minHeight: '100vh'}}>
        <div className="result-inner" style={{maxWidth: '800px', width: '100%'}}>
          
          {/* Header */}
          <div className="result-header" style={{background: '#fff', border: '1px solid #e0ddd8', borderRadius: '16px', padding: '2rem', marginBottom: '1.5rem', textAlign: 'center'}}>
            <div className="verdict-badge" style={{display:'inline-flex',alignItems:'center',gap:'0.5rem',borderRadius:'50px',padding:'0.5rem 1.4rem',fontSize:'0.85rem',fontWeight:'700',letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:'1.2rem',background:'rgba(26,127,110,0.12)',color:'#1a7f6e',border:'1px solid rgba(26,127,110,0.25)'}}>✅ Teste Concluído</div>
            <div className="result-name" style={{fontFamily:'Playfair Display,serif',fontSize:'2rem',marginBottom:'0.5rem',color:'#1c1a18'}}>
              {result.candidateName || 'Candidato'} <em style={{fontStyle:'italic',color:'#f0b429'}}>{formatCPF(result.candidateCpf)}</em>
            </div>
            <div className="result-sub" style={{fontSize:'1rem',color:'#8a857e'}}>Teste de Estilo de Comportamento • {dateStr}</div>
          </div>

          {/* Resumo rápido - Cards de percentual grandes */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'1rem',marginBottom:'1.5rem'}}>
            {scores.map(s => (
              <div key={s.key} style={{
                background: '#fff',
                border: '1px solid #e0ddd8',
                borderRadius: '12px',
                padding: '1.25rem',
                textAlign: 'center',
                position: 'relative',
                borderTop: dominantProfiles.includes(s.label) ? '4px solid #1a7f6e' : '4px solid transparent'
              }}>
                <div style={{fontSize:'0.7rem',fontWeight:'700',textTransform:'uppercase',letterSpacing:'0.1em',color:'#8a857e',marginBottom:'0.5rem'}}>{s.label}</div>
                <div style={{fontSize:'2.5rem',fontWeight:'700',color:'#1a7f6e',lineHeight:1,fontFamily:'DM Sans,sans-serif'}}>
                  {s.value}<span style={{fontSize:'1.2rem'}}>%</span>
                </div>
                {dominantProfiles.includes(s.label) && (
                  <div style={{position:'absolute',top:'-8px',right:'-8px',background:'#1a7f6e',color:'#fff',fontSize:'0.6rem',fontWeight:'700',padding:'0.15rem 0.5rem',borderRadius:'50px',textTransform:'uppercase'}}>
                    Dominante
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Gráfico Radar + Barras */}
          <div style={{background: '#fff', border: '1px solid #e0ddd8', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem'}}>
            <div style={{color: '#1a7f6e', marginBottom: '1.5rem', fontFamily: 'Playfair Display,serif', fontSize: '1.4rem', fontWeight: '600'}}>Visualização dos Perfis</div>
            
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start'}}>
              {/* Radar Chart */}
              <div style={{position: 'relative', width: '320px', height: '320px', margin: '0 auto'}}>
                <svg width="320" height="320" style={{transform: 'rotate(-90deg)'}}>
                  {/* Círculos de referência */}
                  {refCircles.map(c => (
                    <circle key={c.pct} cx="160" cy="160" r={c.radius} fill="none" stroke="#e8e4df" strokeWidth="1" strokeDasharray="4,4" />
                  ))}
                  {/* Linha de 25% destacada (limiar de dominância) */}
                  <circle cx="160" cy="160" r={(25/100)*130} fill="none" stroke="rgba(220,38,38,0.3)" strokeWidth="1.5" strokeDasharray="6,4" />
                  {/* Eixos */}
                  {axisLines.map((axis, i) => (
                    <g key={i}>
                      <line x1="160" y1="160" x2={axis.x} y2={axis.y} stroke="#d7d7d7" strokeWidth="1" />
                      <text 
                        x={axis.x + (axis.x > 160 ? 14 : axis.x < 160 ? -14 : 0)} 
                        y={axis.y + (axis.y > 160 ? 14 : axis.y < 160 ? -14 : 5)} 
                        textAnchor={axis.x > 160 ? 'start' : axis.x < 160 ? 'end' : 'middle'}
                        dominantBaseline={axis.y > 160 ? 'hanging' : axis.y < 160 ? 'auto' : 'middle'}
                        fontSize="12" fontWeight="600" fill="#333" fontFamily="'DM Sans',sans-serif">
                        {axis.label}
                      </text>
                    </g>
                  ))}
                  {/* Área do resultado */}
                  <polygon points={radarPoints} fill="rgba(26,127,110,0.18)" stroke="#1a7f6e" strokeWidth="2.5" strokeLinejoin="round" />
                  {/* Pontos com valores */}
                  {radarData.map((d, i) => {
                    const rad = (d.angle * Math.PI) / 180;
                    const x = 160 + d.radius * Math.cos(rad);
                    const y = 160 + d.radius * Math.sin(rad);
                    const isDominant = dominantProfiles.includes(d.label);
                    return (
                      <g key={i}>
                        <circle cx={x} cy={y} r={6} fill={isDominant ? '#dc2626' : '#1a7f6e'} stroke="#fff" strokeWidth={2} />
                        <text x={x} y={y - 14} textAnchor="middle" fontSize="12" fontWeight="700" fill={isDominant ? '#dc2626' : '#1a7f6e'} fontFamily="'DM Sans',sans-serif">
                          {d.value}%
                        </text>
                      </g>
                    );
                  })}
                  {/* Legenda 25% */}
                  <text x="160" y="30" textAnchor="middle" fontSize="10" fill="rgba(220,38,38,0.6)" fontFamily="'DM Sans',sans-serif" fontWeight="600">
                    Limiar de dominância (25%)
                  </text>
                </svg>
              </div>

              {/* Barras horizontais melhoradas */}
              <div style={{display: 'flex', flexDirection: 'column', gap: '1.25rem'}}>
                {scores.map((s, i) => {
                  const isDominant = dominantProfiles.includes(s.label);
                  return (
                    <div key={s.key} style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                        <div style={{fontSize: '14px', fontWeight: '600', color: '#1c1a18', fontFamily: "'DM Sans',sans-serif"}}>
                          {s.label}
                          {isDominant && <span style={{marginLeft:'0.5rem',padding:'0.15rem 0.5rem',background:'#1a7f6e',color:'#fff',fontSize:'0.65rem',fontWeight:'700',borderRadius:'50px',textTransform:'uppercase'}}>Dominante</span>}
                        </div>
                        <div style={{fontSize: '16px', fontWeight: '700', color: '#1a7f6e', fontFamily: "'DM Sans',sans-serif", minWidth: '55px', textAlign: 'right'}}>
                          {s.value}%
                        </div>
                      </div>
                      <div style={{height: '16px', background: '#e8e4df', borderRadius: '8px', overflow: 'hidden', position: 'relative'}}>
                        <div style={{
                          height: '100%',
                          width: `${s.value}%`,
                          background: isDominant ? 'linear-gradient(90deg, #1a7f6e, #2a9d88)' : '#1a7f6e',
                          borderRadius: '8px',
                          transition: 'width 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        }} />
                        {/* Marcador 25% */}
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          bottom: 0,
                          left: '25%',
                          width: '2px',
                          background: 'rgba(220,38,38,0.5)',
                          pointerEvents: 'none'
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Cards detalhados por dimensão */}
          <div style={{background: '#fff', border: '1px solid #e0ddd8', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem'}}>
            <div style={{color: '#1a7f6e', marginBottom: '1.25rem', fontFamily: 'Playfair Display,serif', fontSize: '1.4rem', fontWeight: '600'}}>Detalhamento por Dimensão</div>
            {scores.map(s => {
              const isDominant = dominantProfiles.includes(s.label);
              return (
                <div key={s.key} style={{
                  borderLeft: `4px solid ${isDominant ? '#1a7f6e' : '#e0ddd8'}`,
                  background: isDominant ? '#f0faf8' : '#faf9f7',
                  borderRadius: '0 10px 10px 0',
                  padding: '1.25rem',
                  marginBottom: '1rem'
                }}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.75rem'}}>
                    <div style={{fontSize: '15px', fontWeight: '700', color: '#1c1a18'}}>
                      {s.label} <span style={{color: '#1a7f6e', fontWeight: '600'}}>({s.value}%)</span>
                    </div>
                    {isDominant && (
                      <span style={{background:'#1a7f6e',color:'#fff',fontSize:'0.65rem',fontWeight:'700',padding:'0.2rem 0.6rem',borderRadius:'50px',textTransform:'uppercase'}}>
                        Perfil Dominante
                      </span>
                    )}
                  </div>
                  <p style={{fontSize: '14px', lineHeight: '1.65', color: '#333'}}>{s.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Perfis Dominantes com descrição completa */}
          <div style={{background: '#fff', border: '1px solid #e0ddd8', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem'}}>
            <div style={{color: '#1a7f6e', marginBottom: '1.25rem', fontFamily: 'Playfair Display,serif', fontSize: '1.4rem', fontWeight: '600'}}>Perfil(is) Dominante(s)</div>
            
            {dominantProfiles.length === 0 ? (
              <div style={{textAlign:'center',padding:'2rem',background:'#faf9f7',borderRadius:'10px',border:'1px dashed #e0ddd8'}}>
                <div style={{fontSize:'1.1rem',color:'#666',marginBottom:'0.5rem'}}>Nenhum perfil dominante identificado</div>
                <div style={{fontSize:'0.9rem',color:'#888'}}>Nenhuma dimensão superou 25%. Seu perfil é equilibrado entre as quatro dimensões.</div>
              </div>
            ) : (
              <div style={{display:'flex',flexDirection:'column',gap:'1.5rem'}}>
                {dominantProfiles.map((dim, idx) => {
                  const scoreData = scores.find(s => s.key === dim.toLowerCase());
                  const description = getDominantDescription(dim);
                  return (
                    <div key={dim} style={{
                      background: '#f0faf8',
                      border: '1px solid #1a7f6e',
                      borderRadius: '12px',
                      padding: '1.5rem',
                      position: 'relative'
                    }}>
                      <div style={{display:'flex',alignItems:'center',gap:'1rem',marginBottom:'1rem',flexWrap:'wrap'}}>
                        <div style={{background:'#1a7f6e',color:'#fff',width:'48px',height:'48px',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:'700',fontSize:'1.1rem',flexShrink:0}}>{idx + 1}</div>
                        <div>
                          <div style={{fontSize:'1.3rem',fontWeight:'700',color:'#1a7f6e',fontFamily:'Playfair Display,serif'}}>{dim}</div>
                          <div style={{fontSize:'1.5rem',fontWeight:'700',color:'#1a7f6e',fontFamily:'DM Sans,sans-serif'}}>{scoreData?.value}%</div>
                        </div>
                      </div>
                      <p style={{fontSize: '14px', lineHeight: '1.7', color: '#333', margin: 0}}>{description}</p>
                    </div>
                  );
                })}
              </div>
            )}
            
            <div style={{marginTop: '1.5rem', padding: '1rem', background: '#faf9f7', borderRadius: '8px', border: '1px solid #e0ddd8'}}>
              <p style={{fontSize: '13px', color: '#666', margin: 0, lineHeight: 1.6}}>
                <strong style={{color:'#333'}}>Critério de dominância:</strong> Um perfil é considerado dominante quando seu resultado é <strong>superior a 25%</strong>. 
                Resultado igual a 25% exatamente <strong>não</strong> é considerado dominante. 
                A soma total das quatro dimensões é sempre 100%, permitindo leitura direta como percentual.
              </p>
            </div>
          </div>

          {/* Botões de navegação */}
          <div style={{textAlign: 'center', marginTop: '1rem', display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap'}}>
            <button className="btn-secondary" onClick={() => window.location.href = '/'} style={{width: 'auto', padding: '0.9rem 2rem', fontSize: '1rem', borderColor: 'var(--accent)', color: 'var(--accent)'}}>
              ← Voltar à seleção de testes
            </button>
            <button className="btn-primary" onClick={() => window.location.href = '/behavior-style'} style={{width: 'auto', padding: '0.9rem 2rem', fontSize: '1rem'}}>
              ← Fazer novo teste
            </button>
          </div>

        </div>
      </div>

      <style jsx>{`
        .result-header {
          text-align: center;
          padding: 2rem 1.5rem 1.5rem;
          background: #fff;
          border: 1px solid #e0ddd8;
          border-radius: 16px;
          margin-bottom: 1.5rem;
          position: relative;
          overflow: hidden;
          color: #111;
        }
        .verdict-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          border-radius: 50px;
          padding: 0.5rem 1.4rem;
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          margin-bottom: 1.2rem;
        }
        .verdict-green {
          background: rgba(52,199,123,0.15);
          color: #16a34a;
          border: 1px solid rgba(52,199,123,0.3);
        }
        .result-name {
          font-family: 'Playfair Display', serif;
          font-size: 1.6rem;
          margin-bottom: 0.4rem;
        }
        .result-name em {
          font-style: italic;
          color: #f0b429;
        }
        .result-sub {
          font-size: 0.85rem;
          color: #666;
        }
      `}</style>
    </>
  );
}