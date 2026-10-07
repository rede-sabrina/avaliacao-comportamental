import Head from 'next/head';
import { useState } from 'react';

export default function GerenteLogin() {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(e) {
    e.preventDefault();
    if (!user || !pass) {
      setError('Informe usuário e senha');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/gerente/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: user.trim(), pass })
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.error === 'too_many_attempts') {
          throw new Error('Muitas tentativas incorretas. Aguarde alguns minutos.');
        }
        if (data.error === 'invalid_credentials') {
          throw new Error('Usuário ou senha inválidos.');
        }
        throw new Error(data.error || 'Falha no login');
      }

      window.location.replace('/gerente');
    } catch (err) {
      setError(String(err.message || err));
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>Login do Gerente — Avaliação da Equipe</title>
      </Head>

      <div style={{
        minHeight: '100vh',
        background: '#0f0f13',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        fontFamily: 'Sora, sans-serif',
        color: '#f3efe8'
      }}>
        <div style={{
          background: '#17171e',
          border: '1px solid #2a2a38',
          borderRadius: '20px',
          padding: '2.5rem 2rem',
          maxWidth: '440px',
          width: '100%',
          boxShadow: '0 10px 40px rgba(0,0,0,0.45)'
        }}>
          <div style={{textAlign: 'center', marginBottom: '1.8rem'}}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'rgba(240,180,41,.12)',
              border: '1px solid rgba(240,180,41,.25)',
              borderRadius: '20px',
              padding: '.35rem 1rem',
              fontSize: '.75rem',
              fontWeight: 600,
              letterSpacing: '.1em',
              textTransform: 'uppercase',
              color: '#f0b429',
              marginBottom: '1rem'
            }}>
              🏪 Gestão de Lojas
            </div>
            <h1 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: '1.9rem',
              lineHeight: 1.2,
              marginBottom: '0.5rem'
            }}>
              Área do <em>Gerente</em>
            </h1>
            <p style={{color: '#a9a4bf', fontSize: '0.88rem'}}>
              Acesse o painel da sua loja para visualizar as avaliações comportamentais da sua equipe.
            </p>
          </div>

          <form onSubmit={handleLogin}>
            <div style={{marginBottom: '1.2rem'}}>
              <label style={{
                display: 'block',
                fontSize: '.75rem',
                fontWeight: 600,
                color: '#a9a4bf',
                letterSpacing: '.06em',
                textTransform: 'uppercase',
                marginBottom: '.4rem'
              }}>
                Usuário da Loja
              </label>
              <input
                type="text"
                value={user}
                onChange={e => setUser(e.target.value)}
                placeholder="Ex: loja01"
                autoCapitalize="none"
                style={{
                  width: '100%',
                  background: '#1e1e28',
                  border: '1px solid #2a2a38',
                  borderRadius: '8px',
                  padding: '.85rem 1rem',
                  fontSize: '.95rem',
                  color: '#f3efe8',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{marginBottom: '1.5rem'}}>
              <label style={{
                display: 'block',
                fontSize: '.75rem',
                fontWeight: 600,
                color: '#a9a4bf',
                letterSpacing: '.06em',
                textTransform: 'uppercase',
                marginBottom: '.4rem'
              }}>
                Senha
              </label>
              <input
                type="password"
                value={pass}
                onChange={e => setPass(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  background: '#1e1e28',
                  border: '1px solid #2a2a38',
                  borderRadius: '8px',
                  padding: '.85rem 1rem',
                  fontSize: '.95rem',
                  color: '#f3efe8',
                  outline: 'none'
                }}
              />
            </div>

            {error && (
              <div style={{
                background: 'rgba(224,92,92,0.12)',
                border: '1px solid rgba(224,92,92,0.3)',
                color: '#fca5a5',
                padding: '0.75rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                marginBottom: '1.2rem',
                textAlign: 'center'
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #e05c2a, #f0b429)',
                color: '#0f0f13',
                fontSize: '.95rem',
                fontWeight: 700,
                padding: '.85rem',
                borderRadius: '50px',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                letterSpacing: '.02em',
                transition: 'opacity .2s'
              }}
            >
              {loading ? 'Acessando...' : 'Entrar no Painel da Loja →'}
            </button>
          </form>

          <div style={{textAlign: 'center', marginTop: '1.5rem', borderTop: '1px solid #2a2a38', paddingTop: '1rem'}}>
            <a
              href="/"
              style={{
                color: '#a9a4bf',
                fontSize: '0.82rem',
                textDecoration: 'none'
              }}
            >
              ← Voltar à página principal
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
