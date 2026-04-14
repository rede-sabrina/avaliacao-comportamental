import { useState } from 'react';

export default function AdminLogin(){
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [loading, setLoading] = useState(false);

  async function doLogin(e){
    e.preventDefault();
    setLoading(true);
    try{
      const r = await fetch('/api/admin/login',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ user, pass })
      });
      if(!r.ok){
        alert('Login falhou');
        return;
      }
      await r.json().catch(()=>null);
      window.location.href = '/admin';
    }finally{
      setLoading(false);
    }
  }

  return (
    <div style={{padding:20,fontFamily:'Sora,Arial,Helvetica',background:'#0f0f13',minHeight:'100vh',color:'var(--text)'}}>
      <div style={{maxWidth:1000,margin:'0 auto'}}>
        <h1>Admin - Login</h1>
        <div style={{display:'flex',justifyContent:'center',marginTop:18}}>
          <div className="intro-card" style={{maxWidth:520,width:'100%'}}>
            <h2 style={{marginTop:0}}>Area do Administrador</h2>
            <p style={{color:'var(--light)',marginBottom:12}}>Faça login para acessar relatórios e gerenciar perguntas.</p>
            <form onSubmit={doLogin}>
              <div className="name-input-wrap">
                <label>Usuario</label>
                <input value={user} onChange={e=>setUser(e.target.value)} placeholder="Usuario" />
              </div>
              <div className="name-input-wrap">
                <label>Senha</label>
                <input type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="Senha" />
              </div>
              <button className="btn-primary" type="submit" disabled={!user || !pass || loading} style={{marginTop:8}}>
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
