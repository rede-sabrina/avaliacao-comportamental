import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';

export default function GerenteAvaliacaoView() {
  const router = useRouter();
  const { id } = router.query;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (!id) return;
    async function fetchAvaliacao() {
      setLoading(true);
      try {
        const res = await fetch(`/api/gerente/avaliacao/${id}`);
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            throw new Error('Acesso não autorizado para esta loja.');
          }
          throw new Error('Avaliação não encontrada.');
        }
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchAvaliacao();
  }, [id]);

  async function downloadPdf() {
    if (!data) return;
    setIsDownloading(true);
    try {
      const res = await fetch('/api/gerente/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: data._id })
      });
      if (!res.ok) throw new Error('Falha ao gerar PDF');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `avaliacao_${(data.nome_funcionario || 'funcionario').toLowerCase().replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Erro: ' + err.message);
    } finally {
      setIsDownloading(false);
    }
  }

  if (loading) {
    return (
      <div style={{minHeight:'100vh',background:'#0f0f13',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Sora, sans-serif'}}>
        Carregando avaliação...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{minHeight:'100vh',background:'#0f0f13',color:'#fff',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',fontFamily:'Sora, sans-serif',gap:16}}>
        <div style={{color:'#fca5a5',fontSize:18}}>{error || 'Não encontrado'}</div>
        <button
          onClick={() => router.push('/gerente')}
          style={{background:'#1e1e28',border:'1px solid #2a2a38',color:'#f3efe8',padding:'8px 16px',borderRadius:8,cursor:'pointer'}}
        >
          ← Voltar ao painel da loja
        </button>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Avaliação DISC — {data.nome_funcionario} (Loja {data.loja_id})</title>
      </Head>

      <div style={{minHeight:'100vh',background:'#0f0f13',color:'#f3efe8',fontFamily:'Sora, sans-serif',padding:'24px 20px'}}>
        <div style={{maxWidth:860,margin:'0 auto'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
            <button
              onClick={() => router.push('/gerente')}
              style={{background:'#17171e',border:'1px solid #2a2a38',color:'#f3efe8',padding:'8px 16px',borderRadius:8,cursor:'pointer'}}
            >
              ← Voltar ao painel da loja
            </button>
            <button
              onClick={downloadPdf}
              disabled={isDownloading}
              style={{background:'linear-gradient(135deg, #e05c2a, #f0b429)',color:'#0f0f13',border:'none',padding:'8px 18px',borderRadius:8,fontWeight:700,cursor:'pointer'}}
            >
              {isDownloading ? 'Gerando PDF...' : 'Baixar PDF'}
            </button>
          </div>

          <div style={{background:'#17171e',border:'1px solid #2a2a38',borderRadius:16,padding:'2rem'}}>
            <div style={{textAlign:'center',marginBottom:24}}>
              <div style={{display:'inline-block',background:'rgba(240,180,41,.12)',color:'#f0b429',borderRadius:20,padding:'4px 14px',fontSize:12,fontWeight:700,marginBottom:8}}>
                LOJA {data.loja_id} • AVALIAÇÃO DE COLABORADOR
              </div>
              <h1 style={{fontSize:'2.2rem',margin:'4px 0'}}>{data.nome_funcionario}</h1>
              <div style={{color:'#a9a4bf',fontSize:13}}>
                Realizada em: {new Date(data.data_avaliacao).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
              </div>
            </div>

            {/* Scores em Cards */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(4, 1fr)',gap:12,marginBottom:28}}>
              {[
                { label: 'DOMINÂNCIA', val: data.scores?.dominancia || 0, col: '#e05c5c' },
                { label: 'INFLUÊNCIA', val: data.scores?.influencia || 0, col: '#f59e0b' },
                { label: 'ESTABILIDADE', val: data.scores?.estabilidade || 0, col: '#34c77b' },
                { label: 'CONFORMIDADE', val: data.scores?.conformidade || 0, col: '#1a7f6e' },
              ].map(item => (
                <div key={item.label} style={{background:'#1e1e28',border:'1px solid #2a2a38',borderRadius:10,padding:'1.2rem',textAlign:'center'}}>
                  <div style={{fontSize:11,fontWeight:700,color:'#a9a4bf'}}>{item.label}</div>
                  <div style={{fontSize:'2.2rem',fontWeight:700,color:item.col,margin:'6px 0'}}>{item.val}%</div>
                  {(data.dominantProfiles || []).includes(item.label) && (
                    <span style={{background:item.col,color:'#fff',fontSize:10,fontWeight:700,padding:'2px 6px',borderRadius:20}}>DOMINANTE</span>
                  )}
                </div>
              ))}
            </div>

            {/* Perfis Dominantes */}
            <div style={{marginBottom:24}}>
              <h3 style={{fontSize:'1.2rem',marginBottom:12}}>Perfis Dominantes</h3>
              {(data.dominantProfiles || []).length === 0 ? (
                <div style={{background:'#1e1e28',padding:'1rem',borderRadius:8,color:'#a9a4bf'}}>
                  Nenhum perfil superou 25%. Equilíbrio entre as dimensões.
                </div>
              ) : (
                (data.dominantProfiles || []).map(dim => (
                  <div key={dim} style={{background:'#1e1e28',border:'1px solid #2a2a38',borderRadius:10,padding:'1.2rem',marginBottom:10}}>
                    <div style={{color:'#f0b429',fontWeight:700,fontSize:'1.1rem',marginBottom:4}}>{dim}</div>
                    <div style={{color:'#d8d5ea',fontSize:13,lineHeight:1.6}}>
                      {dim === 'DOMINÂNCIA' && 'Direcionamento a resultados rápidos, assertividade, independência e coragem frente a desafios.'}
                      {dim === 'INFLUÊNCIA' && 'Foco em pessoas, comunicação aberta e expressiva, facilidade para engajar colegas e clientes.'}
                      {dim === 'ESTABILIDADE' && 'Foco na harmonia, método, previsibilidade, confiabilidade nas rotinas e espírito de equipe.'}
                      {dim === 'CONFORMIDADE' && 'Foco na qualidade, rigor técnico, disciplina, organização e cumprimento rigoroso das normas.'}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
