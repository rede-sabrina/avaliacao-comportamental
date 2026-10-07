import Head from 'next/head';
import { useState, useEffect } from 'react';

export default function GerenteDashboard() {
  const [session, setSession] = useState(null);
  const [funcionarios, setFuncionarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal de resultado
  const [selectedAvaliacao, setSelectedAvaliacao] = useState(null);
  const [loadingAvaliacao, setLoadingAvaliacao] = useState(false);
  const [downloadingPdfId, setDownloadingPdfId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        // Obter sessão do gerente
        const sessRes = await fetch('/api/gerente/session');
        if (!sessRes.ok) {
          window.location.replace('/gerente/login');
          return;
        }
        const sessData = await sessRes.json();
        setSession(sessData.user);

        // Obter colaboradores avaliados daquela loja
        const funcRes = await fetch('/api/gerente/funcionarios');
        if (!funcRes.ok) throw new Error('Falha ao carregar colaboradores da loja');
        const funcData = await funcRes.json();
        setFuncionarios(funcData.funcionarios || []);
      } catch (err) {
        setError(String(err.message || err));
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  async function handleLogout() {
    await fetch('/api/gerente/logout', { method: 'POST' });
    window.location.replace('/gerente/login');
  }

  async function handleVerResultado(id) {
    setLoadingAvaliacao(true);
    setSelectedAvaliacao(null);
    try {
      const res = await fetch(`/api/gerente/avaliacao/${id}`);
      if (!res.ok) throw new Error('Não foi possível carregar a avaliação.');
      const data = await res.json();
      setSelectedAvaliacao(data);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoadingAvaliacao(false);
    }
  }

  async function handleDownloadPdf(id, nome) {
    if (downloadingPdfId) return; // Evita múltiplos cliques
    setDownloadingPdfId(id);
    try {
      const res = await fetch('/api/gerente/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (!res.ok) throw new Error('Falha ao gerar PDF');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `avaliacao_${(nome || 'colaborador').toLowerCase().replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Erro ao baixar PDF: ' + err.message);
    } finally {
      setDownloadingPdfId(null);
    }
  }

  async function handleDeleteAvaliacao(id, nome) {
    if (!confirm(`Deseja realmente excluir a avaliação de "${nome || 'colaborador'}"? Esta ação não pode ser desfeita.`)) {
      return;
    }
    setDeletingId(id);
    try {
      const res = await fetch(`/api/gerente/avaliacao/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao excluir avaliação');

      // Remover da listagem da tela
      setFuncionarios(prev => prev.filter(f => (f._id || f.id) !== id));
      if (selectedAvaliacao && (selectedAvaliacao._id === id || selectedAvaliacao.id === id)) {
        setSelectedAvaliacao(null);
      }
      alert('Avaliação excluída com sucesso.');
    } catch (err) {
      alert('Erro ao excluir avaliação: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  }

  const filtered = funcionarios.filter(f => {
    if (!searchTerm) return true;
    return (f.nome || '').toLowerCase().includes(searchTerm.trim().toLowerCase());
  });

  // Estatísticas da loja
  const totalAvaliados = funcionarios.length;
  const countPerfis = {
    DOMINÂNCIA: 0,
    INFLUÊNCIA: 0,
    ESTABILIDADE: 0,
    CONFORMIDADE: 0
  };
  funcionarios.forEach(f => {
    (f.dominantProfiles || []).forEach(p => {
      if (countPerfis[p] !== undefined) countPerfis[p]++;
    });
  });

  return (
    <>
      <Head>
        <title>Avaliação da Equipe — {session ? `Loja ${session.loja_id}` : 'Loja'}</title>
      </Head>

      <div style={{
        minHeight: '100vh',
        background: '#0f0f13',
        color: '#f3efe8',
        fontFamily: 'Sora, sans-serif',
        padding: '24px 20px'
      }}>
        <div style={{maxWidth: 1100, margin: '0 auto'}}>
          {/* Header Superior */}
          <div style={{
            background: '#17171e',
            border: '1px solid #2a2a38',
            borderRadius: 16,
            padding: '1.4rem 1.8rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
            marginBottom: 20
          }}>
            <div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: 'rgba(240,180,41,.12)',
                color: '#f0b429',
                borderRadius: 20,
                padding: '3px 12px',
                fontSize: 12,
                fontWeight: 600,
                marginBottom: 6
              }}>
                🏪 GESTÃO DE EQUIPE
              </div>
              <h1 style={{fontSize: '1.7rem', margin: 0, fontWeight: 700}}>
                Avaliação da Equipe — <span style={{color: '#f0b429'}}>{session ? `Loja ${session.loja_id}` : 'Carregando...'}</span>
              </h1>
              <div style={{color: '#a9a4bf', fontSize: 13, marginTop: 4}}>
                Acesso exclusivo: {session?.username} • Apenas colaboradores desta unidade
              </div>
            </div>

            <div style={{display: 'flex', gap: 10, alignItems: 'center'}}>
              <a
                href="/funcionario"
                target="_blank"
                rel="noreferrer"
                style={{
                  background: 'rgba(26,127,110,0.15)',
                  border: '1px solid rgba(26,127,110,0.3)',
                  color: '#2a9d88',
                  padding: '8px 14px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  textDecoration: 'none'
                }}
              >
                + Link de Avaliação do Colaborador
              </a>
              <button
                onClick={handleLogout}
                style={{
                  background: 'rgba(224,92,92,0.1)',
                  border: '1px solid rgba(224,92,92,0.25)',
                  color: '#fca5a5',
                  padding: '8px 16px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Sair
              </button>
            </div>
          </div>

          {/* Cards de Métricas */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 14,
            marginBottom: 20
          }}>
            <div style={{background: '#17171e', border: '1px solid #2a2a38', borderRadius: 12, padding: '1.2rem'}}>
              <div style={{color: '#a9a4bf', fontSize: 12, textTransform: 'uppercase', fontWeight: 600}}>Colaboradores Avaliados</div>
              <div style={{fontSize: '2rem', fontWeight: 700, color: '#f0b429', marginTop: 4}}>{totalAvaliados}</div>
              <div style={{fontSize: 12, color: '#a9a4bf'}}>nesta unidade</div>
            </div>

            <div style={{background: '#17171e', border: '1px solid #2a2a38', borderRadius: 12, padding: '1.2rem'}}>
              <div style={{color: '#a9a4bf', fontSize: 12, textTransform: 'uppercase', fontWeight: 600}}>Dominância (D)</div>
              <div style={{fontSize: '2rem', fontWeight: 700, color: '#e05c5c', marginTop: 4}}>{countPerfis.DOMINÂNCIA}</div>
              <div style={{fontSize: 12, color: '#a9a4bf'}}>com perfil dominante</div>
            </div>

            <div style={{background: '#17171e', border: '1px solid #2a2a38', borderRadius: 12, padding: '1.2rem'}}>
              <div style={{color: '#a9a4bf', fontSize: 12, textTransform: 'uppercase', fontWeight: 600}}>Influência (I)</div>
              <div style={{fontSize: '2rem', fontWeight: 700, color: '#f59e0b', marginTop: 4}}>{countPerfis.INFLUÊNCIA}</div>
              <div style={{fontSize: 12, color: '#a9a4bf'}}>com perfil dominante</div>
            </div>

            <div style={{background: '#17171e', border: '1px solid #2a2a38', borderRadius: 12, padding: '1.2rem'}}>
              <div style={{color: '#a9a4bf', fontSize: 12, textTransform: 'uppercase', fontWeight: 600}}>Estabilidade (S)</div>
              <div style={{fontSize: '2rem', fontWeight: 700, color: '#34c77b', marginTop: 4}}>{countPerfis.ESTABILIDADE}</div>
              <div style={{fontSize: 12, color: '#a9a4bf'}}>com perfil dominante</div>
            </div>

            <div style={{background: '#17171e', border: '1px solid #2a2a38', borderRadius: 12, padding: '1.2rem'}}>
              <div style={{color: '#a9a4bf', fontSize: 12, textTransform: 'uppercase', fontWeight: 600}}>Conformidade (C)</div>
              <div style={{fontSize: '2rem', fontWeight: 700, color: '#1a7f6e', marginTop: 4}}>{countPerfis.CONFORMIDADE}</div>
              <div style={{fontSize: 12, color: '#a9a4bf'}}>com perfil dominante</div>
            </div>
          </div>

          {/* Seção Principal: Lista de Colaboradores */}
          <div style={{
            background: '#17171e',
            border: '1px solid #2a2a38',
            borderRadius: 16,
            padding: 20
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
              marginBottom: 16
            }}>
              <div>
                <h2 style={{fontSize: '1.2rem', margin: 0, fontWeight: 700}}>Equipe da Loja</h2>
                <div style={{fontSize: 13, color: '#a9a4bf'}}>Lista de colaboradores avaliados e resultados DISC</div>
              </div>

              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar por nome do colaborador..."
                style={{
                  background: '#1e1e28',
                  border: '1px solid #2a2a38',
                  borderRadius: 8,
                  padding: '8px 14px',
                  color: '#f3efe8',
                  fontSize: 13,
                  minWidth: 260,
                  outline: 'none'
                }}
              />
            </div>

            {loading ? (
              <div style={{textAlign: 'center', padding: '3rem', color: '#a9a4bf'}}>
                Carregando avaliações da loja...
              </div>
            ) : error ? (
              <div style={{textAlign: 'center', padding: '2rem', color: '#fca5a5'}}>
                {error}
              </div>
            ) : filtered.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '3rem',
                background: '#1e1e28',
                borderRadius: 12,
                border: '1px dashed #2a2a38'
              }}>
                <div style={{fontSize: 32, marginBottom: 8}}>📋</div>
                <div style={{fontSize: 16, fontWeight: 600, color: '#f3efe8'}}>
                  {searchTerm ? 'Nenhum colaborador encontrado na busca' : 'Nenhuma avaliação registrada ainda nesta loja'}
                </div>
                <div style={{fontSize: 13, color: '#a9a4bf', marginTop: 6}}>
                  Compartilhe o link da avaliação com os colaboradores para que iniciem o teste.
                </div>
              </div>
            ) : (
              <div style={{overflowX: 'auto'}}>
                <table style={{width: '100%', borderCollapse: 'collapse', textAlign: 'left'}}>
                  <thead>
                    <tr style={{borderBottom: '1px solid #2a2a38', color: '#a9a4bf', fontSize: 13}}>
                      <th style={{padding: '12px 10px'}}>Colaborador</th>
                      <th style={{padding: '12px 10px'}}>Data</th>
                      <th style={{padding: '12px 10px'}}>Status</th>
                      <th style={{padding: '12px 10px'}}>Perfil Dominante</th>
                      <th style={{padding: '12px 10px'}}>Pontuação DISC</th>
                      <th style={{padding: '12px 10px', textAlign: 'right'}}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(func => {
                      const dataFormatada = func.data_avaliacao 
                        ? new Date(func.data_avaliacao).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
                        : '—';
                      
                      const scores = func.scores || {};
                      const dominantes = func.dominantProfiles || [];
                      const isDownloading = downloadingPdfId === (func._id || func.id);
                      const isDeleting = deletingId === (func._id || func.id);

                      return (
                        <tr key={func._id || func.id} style={{borderBottom: '1px solid #22222e'}}>
                          <td style={{padding: '14px 10px', fontWeight: 600, color: '#f3efe8'}}>
                            {func.nome}
                          </td>
                          <td style={{padding: '14px 10px', color: '#a9a4bf', fontSize: 13}}>
                            {dataFormatada}
                          </td>
                          <td style={{padding: '14px 10px'}}>
                            <span style={{
                              background: 'rgba(52,199,123,0.12)',
                              color: '#34c77b',
                              border: '1px solid rgba(52,199,123,0.3)',
                              borderRadius: 20,
                              padding: '2px 8px',
                              fontSize: 11,
                              fontWeight: 600
                            }}>
                              Avaliado
                            </span>
                          </td>
                          <td style={{padding: '14px 10px'}}>
                            {dominantes.length > 0 ? (
                              <div style={{display: 'flex', gap: 6, flexWrap: 'wrap'}}>
                                {dominantes.map(p => (
                                  <span key={p} style={{
                                    background: 'rgba(240,180,41,.15)',
                                    color: '#f0b429',
                                    borderRadius: 6,
                                    padding: '2px 8px',
                                    fontSize: 12,
                                    fontWeight: 700
                                  }}>
                                    {p}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span style={{color: '#a9a4bf', fontSize: 12}}>Equilibrado</span>
                            )}
                          </td>
                          <td style={{padding: '14px 10px', fontSize: 12}}>
                            <span style={{color: '#e05c5c', fontWeight: 600}}>D: {scores.dominancia ?? 0}%</span>{' '}
                            <span style={{color: '#f59e0b', fontWeight: 600}}>I: {scores.influencia ?? 0}%</span>{' '}
                            <span style={{color: '#34c77b', fontWeight: 600}}>S: {scores.estabilidade ?? 0}%</span>{' '}
                            <span style={{color: '#1a7f6e', fontWeight: 600}}>C: {scores.conformidade ?? 0}%</span>
                          </td>
                          <td style={{padding: '14px 10px', textAlign: 'right'}}>
                            <div style={{display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center'}}>
                              {/* Botão Ver Resultado */}
                              <button
                                onClick={() => handleVerResultado(func._id || func.id)}
                                style={{
                                  background: 'linear-gradient(135deg, #e05c2a, #f0b429)',
                                  color: '#0f0f13',
                                  border: 'none',
                                  borderRadius: 6,
                                  padding: '6px 12px',
                                  fontSize: 12,
                                  fontWeight: 700,
                                  cursor: 'pointer'
                                }}
                              >
                                Ver resultado
                              </button>

                              {/* Botão PDF com Feedback de Carregamento */}
                              <button
                                onClick={() => handleDownloadPdf(func._id || func.id, func.nome)}
                                disabled={isDownloading || isDeleting}
                                style={{
                                  background: isDownloading ? 'rgba(240,180,41,.15)' : 'transparent',
                                  border: '1px solid #2a2a38',
                                  color: isDownloading ? '#f0b429' : '#a9a4bf',
                                  borderRadius: 6,
                                  padding: '6px 10px',
                                  fontSize: 12,
                                  cursor: (isDownloading || isDeleting) ? 'not-allowed' : 'pointer',
                                  opacity: (isDownloading || isDeleting) ? 0.7 : 1,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4
                                }}
                              >
                                {isDownloading ? '⏳ Gerando...' : 'PDF'}
                              </button>

                              {/* Botão Excluir */}
                              <button
                                onClick={() => handleDeleteAvaliacao(func._id || func.id, func.nome)}
                                disabled={isDeleting || isDownloading}
                                style={{
                                  background: 'transparent',
                                  border: '1px solid rgba(224,92,92,0.3)',
                                  color: '#fca5a5',
                                  borderRadius: 6,
                                  padding: '6px 10px',
                                  fontSize: 12,
                                  cursor: (isDeleting || isDownloading) ? 'not-allowed' : 'pointer',
                                  opacity: isDeleting ? 0.6 : 1
                                }}
                              >
                                {isDeleting ? 'Excluindo...' : 'Excluir'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Modal de Detalhamento do Resultado DISC */}
        {selectedAvaliacao && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20
          }}>
            <div style={{
              background: '#17171e',
              border: '1px solid #2a2a38',
              borderRadius: 16,
              maxWidth: 800,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '2rem',
              position: 'relative'
            }}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20}}>
                <div>
                  <div style={{fontSize: 12, color: '#f0b429', fontWeight: 700, textTransform: 'uppercase'}}>
                    RESULTADO DISC • LOJA {selectedAvaliacao.loja_id}
                  </div>
                  <h2 style={{fontSize: '1.8rem', margin: '4px 0 0 0'}}>
                    {selectedAvaliacao.nome_funcionario}
                  </h2>
                  <div style={{fontSize: 13, color: '#a9a4bf', marginTop: 4}}>
                    Data da Avaliação: {new Date(selectedAvaliacao.data_avaliacao).toLocaleDateString('pt-BR')}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedAvaliacao(null)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#a9a4bf',
                    fontSize: 24,
                    cursor: 'pointer',
                    padding: 4
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Cards de Percentual */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 12,
                marginBottom: 24
              }}>
                {[
                  { label: 'DOMINÂNCIA', val: selectedAvaliacao.scores?.dominancia || 0, col: '#e05c5c' },
                  { label: 'INFLUÊNCIA', val: selectedAvaliacao.scores?.influencia || 0, col: '#f59e0b' },
                  { label: 'ESTABILIDADE', val: selectedAvaliacao.scores?.estabilidade || 0, col: '#34c77b' },
                  { label: 'CONFORMIDADE', val: selectedAvaliacao.scores?.conformidade || 0, col: '#1a7f6e' },
                ].map(item => {
                  const isDom = (selectedAvaliacao.dominantProfiles || []).includes(item.label);
                  return (
                    <div key={item.label} style={{
                      background: '#1e1e28',
                      border: isDom ? `2px solid ${item.col}` : '1px solid #2a2a38',
                      borderRadius: 10,
                      padding: '1rem',
                      textAlign: 'center'
                    }}>
                      <div style={{fontSize: 11, fontWeight: 700, color: '#a9a4bf'}}>{item.label}</div>
                      <div style={{fontSize: '1.9rem', fontWeight: 700, color: item.col, margin: '6px 0'}}>
                        {item.val}%
                      </div>
                      {isDom && (
                        <div style={{
                          display: 'inline-block',
                          background: item.col,
                          color: '#fff',
                          fontSize: 10,
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: 20
                        }}>
                          DOMINANTE
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Perfis Dominantes com Descrição */}
              <div style={{marginBottom: 24}}>
                <h3 style={{fontSize: '1.1rem', marginBottom: 12, color: '#f3efe8'}}>
                  Perfil Dominante Identificado
                </h3>
                {(selectedAvaliacao.dominantProfiles || []).length === 0 ? (
                  <div style={{padding: '1rem', background: '#1e1e28', borderRadius: 8, color: '#a9a4bf'}}>
                    Perfil equilibrado: nenhuma dimensão superou o limiar de dominância (25%).
                  </div>
                ) : (
                  (selectedAvaliacao.dominantProfiles || []).map(dim => (
                    <div key={dim} style={{
                      background: '#1e1e28',
                      border: '1px solid #2a2a38',
                      borderRadius: 10,
                      padding: '1.2rem',
                      marginBottom: 10
                    }}>
                      <div style={{fontSize: '1.1rem', fontWeight: 700, color: '#f0b429', marginBottom: 6}}>
                        {dim}
                      </div>
                      <div style={{fontSize: 13, color: '#d8d5ea', lineHeight: 1.6}}>
                        {dim === 'DOMINÂNCIA' && 'Foco em resultados, tomada rápida de decisões, assertividade, independência e direcionamento claro para superar metas.'}
                        {dim === 'INFLUÊNCIA' && 'Foco em pessoas, comunicação aberta e entusiasta, facilidade de relacionamento, motivação de equipes e criatividade.'}
                        {dim === 'ESTABILIDADE' && 'Foco em processos consistentes, paciência, lealdade, trabalho colaborativo harmonioso e manutenção de rotinas com qualidade.'}
                        {dim === 'CONFORMIDADE' && 'Foco na precisão, atenção rigorosa a detalhes e regras, alto senso de conformidade, organização e controle minucioso.'}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Ações do Modal */}
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #2a2a38', paddingTop: 16, flexWrap: 'wrap', gap: 10}}>
                <button
                  onClick={() => handleDeleteAvaliacao(selectedAvaliacao._id, selectedAvaliacao.nome_funcionario)}
                  disabled={deletingId === selectedAvaliacao._id}
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(224,92,92,0.4)',
                    color: '#fca5a5',
                    borderRadius: 8,
                    padding: '8px 16px',
                    fontSize: 13,
                    cursor: deletingId === selectedAvaliacao._id ? 'not-allowed' : 'pointer',
                    opacity: deletingId === selectedAvaliacao._id ? 0.6 : 1
                  }}
                >
                  {deletingId === selectedAvaliacao._id ? 'Excluindo...' : 'Excluir Avaliação'}
                </button>

                <div style={{display: 'flex', gap: 10}}>
                  <button
                    onClick={() => handleDownloadPdf(selectedAvaliacao._id, selectedAvaliacao.nome_funcionario)}
                    disabled={downloadingPdfId === selectedAvaliacao._id}
                    style={{
                      background: 'linear-gradient(135deg, #e05c2a, #f0b429)',
                      color: '#0f0f13',
                      border: 'none',
                      borderRadius: 8,
                      padding: '8px 18px',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: downloadingPdfId === selectedAvaliacao._id ? 'not-allowed' : 'pointer',
                      opacity: downloadingPdfId === selectedAvaliacao._id ? 0.7 : 1,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                  >
                    {downloadingPdfId === selectedAvaliacao._id ? '⏳ Gerando PDF...' : 'Baixar Relatório Completo (PDF)'}
                  </button>
                  <button
                    onClick={() => setSelectedAvaliacao(null)}
                    style={{
                      background: 'transparent',
                      border: '1px solid #2a2a38',
                      color: '#a9a4bf',
                      borderRadius: 8,
                      padding: '8px 16px',
                      fontSize: 13,
                      cursor: 'pointer'
                    }}
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
