import { useState, useEffect } from 'react';

export default function Admin(){
  const [authChecked, setAuthChecked] = useState(false);
  const [token, setToken] = useState(null);
  const [subs, setSubs] = useState([]);
  const [subsMaster, setSubsMaster] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('reports'); // 'reports' | 'questions' | 'users'
  const [questions, setQuestions] = useState([]);
  const [questionSearch, setQuestionSearch] = useState('');
  const [questionTypeFilter, setQuestionTypeFilter] = useState('all');
  const [users, setUsers] = useState([]);
  const [userForm, setUserForm] = useState({ name:'', username:'', email:'', role:'admin', password:'', active:true });
  const [editingUserId, setEditingUserId] = useState('');
  const [resetTargetId, setResetTargetId] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [qModal, setQModal] = useState({ open:false, data:null });
  const [showView, setShowView] = useState(false);
  const [viewQ, setViewQ] = useState(null);

  useEffect(()=>{
    setToken('cookie-session');
    fetchQuestions();
    fetchList();
    fetchUsers();
    setAuthChecked(true);
  },[]);

  async function fetchList(){
    setLoading(true);
    const r = await fetch('/api/admin/list');
    if(r.ok){ const j=await r.json(); setSubs(j); setSubsMaster(j); }
    else if(r.status === 401 || r.status === 403){ window.location.replace('/admin/login'); }
    else { alert('Falha ao buscar'); }
    setLoading(false);
  }

  async function fetchQuestions(){
    try{
      const r = await fetch('/api/admin/questions');
      if(r.ok){ const j=await r.json(); setQuestions(j); }
    }catch(e){ console.warn(e); }
  }

  async function fetchUsers(){
    try{
      const r = await fetch('/api/admin/users');
      if(r.ok){ const j=await r.json(); setUsers(j); }
    }catch(e){ console.warn(e); }
  }

  function openNewQuestion(){ setQModal({ open:true, data: { type:'options', text:'', options:[], dimension:'', catClass:'cat-val' } }); }

  function openEditQuestion(q){ setQModal({ open:true, data: q }); }

  async function saveQuestion(payload){
    const method = payload._id ? 'PUT' : 'POST';
    try{
      const r = await fetch('/api/admin/questions',{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      const j = await r.json().catch(()=>null);
      if(r.ok){ setQModal({ open:false, data:null }); fetchQuestions(); alert('Salvo'); }
      else { console.error('saveQuestion error', j); alert('Erro ao salvar: '+(j && (j.error||j.message||j.msg)) ); }
    }catch(e){ console.error('saveQuestion exception', e); alert('Erro ao salvar: '+String(e)); }
  }

  async function deleteQuestion(id){
    if(!confirm('Excluir questão?')) return;
    const r = await fetch('/api/admin/questions?id='+id,{method:'DELETE'});
    if(r.ok){ fetchQuestions(); alert('Excluído'); } else alert('Erro');
  }

  async function logout(){
    try{ await fetch('/api/admin/logout', { method:'POST' }); }catch(_e){}
    setToken(null);
    setSubs([]);
    setSubsMaster([]);
    setUsers([]);
    window.location.replace('/admin/login');
  }
  

  async function downloadPdf(id){
    const r = await fetch('/api/admin/pdf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id})});
    if(r.ok){ const blob = await r.blob(); const url = URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`relatorio-${id}.pdf`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); }
    else { const j=await r.json(); alert('Erro: '+(j.error||r.status)); }
  }

  function startNewUser(){
    setEditingUserId('');
    setUserForm({ name:'', username:'', email:'', role:'admin', password:'', active:true });
  }

  function startEditUser(u){
    setEditingUserId(u._id);
    setUserForm({ name:u.name||'', username:u.username||'', email:u.email||'', role:u.role||'admin', password:'', active:u.active !== false });
  }

  async function saveUser(){
    if(!userForm.username || !userForm.email){
      alert('Usuário e e-mail são obrigatórios');
      return;
    }
    if(!editingUserId && !userForm.password){
      alert('Informe uma senha para criar usuário');
      return;
    }

    const payload = {
      ...(editingUserId ? { _id: editingUserId } : {}),
      name: userForm.name,
      username: userForm.username,
      email: userForm.email,
      role: userForm.role,
      active: !!userForm.active,
      ...(userForm.password ? { password: userForm.password } : {})
    };

    const method = editingUserId ? 'PUT' : 'POST';
    const r = await fetch('/api/admin/users',{
      method,
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });
    const j = await r.json().catch(()=>null);
    if(!r.ok){
      alert('Erro ao salvar usuário: ' + (j?.error || r.status));
      return;
    }

    startNewUser();
    fetchUsers();
  }

  async function removeUser(id){
    if(!confirm('Excluir usuário?')) return;
    const r = await fetch('/api/admin/users?id='+id,{ method:'DELETE' });
    const j = await r.json().catch(()=>null);
    if(!r.ok){
      alert('Erro ao excluir: ' + (j?.error || r.status));
      return;
    }
    fetchUsers();
  }

  async function deleteReport(id){
  if(!confirm('Excluir este relatório?')) return;

  const r = await fetch('/api/admin/delete-report?id=' + id, {
    method: 'DELETE'
  });

  const j = await r.json().catch(()=>null);

  if(!r.ok){
    alert('Erro ao excluir: ' + (j?.error || r.status));
    return;
  }

  // 🔥 atualiza lista sem reload
  fetchList();
  }

  async function submitResetPassword(){
    if(!resetTargetId || !resetPassword || resetPassword.length < 6){
      alert('Informe usuário e nova senha (mínimo 6)');
      return;
    }
    const r = await fetch('/api/admin/users-reset-password',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ userId: resetTargetId, newPassword: resetPassword })
    });
    const j = await r.json().catch(()=>null);
    if(!r.ok){
      alert('Erro ao resetar senha: ' + (j?.error || r.status));
      return;
    }
    setResetPassword('');
    alert('Senha resetada com sucesso');
  }

  const filteredQuestions = questions.filter((q)=>{
    const matchesType = questionTypeFilter === 'all' ? true : q.type === questionTypeFilter;
    const search = questionSearch.trim().toLowerCase();
    const matchesSearch = !search
      ? true
      : (q.text || '').toLowerCase().includes(search)
        || (q.category || '').toLowerCase().includes(search)
        || (q.dimension || '').toLowerCase().includes(search);
    return matchesType && matchesSearch;
  });

  if(!authChecked) return null;
  if(!token) return null;

  return (
    <div style={{padding:20,fontFamily:'Sora,Arial,Helvetica',background:'#0f0f13',minHeight:'100vh',color:'#e8e4dc'}}>
      <div style={{maxWidth:1000,margin:'0 auto'}}>
        <h1>Admin — Relatórios</h1>
        {token && (
          <div>
            <div className="intro-card" style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'1rem 1.2rem'}}>
              <div>
                <h2 style={{margin:0}}>Área do Administrador</h2>
                <div style={{color:'var(--muted)',fontSize:13}}>Gerencie relatórios, gere PDFs e edite perguntas</div>
              </div>
              <div style={{display:'flex',gap:8,alignItems:'center'}}>
                <button className="btn-secondary" onClick={()=>fetchQuestions()}>Atualizar</button>
                <button className="btn-ghost" onClick={logout}>Sair</button>
              </div>
            </div>

            <div style={{marginTop:12,display:'flex',gap:12,alignItems:'center'}}>
              <div style={{display:'flex',gap:8}}>
                <button className={activeTab==='reports' ? 'btn-primary' : 'btn-secondary'} onClick={()=>setActiveTab('reports')}>Relatórios</button>
                <button className={activeTab==='questions' ? 'btn-primary' : 'btn-secondary'} onClick={()=>setActiveTab('questions')}>Perguntas</button>
                <button className={activeTab==='users' ? 'btn-primary' : 'btn-secondary'} onClick={()=>setActiveTab('users')}>Usuários</button>
              </div>
              <div style={{marginLeft:'auto',color:'var(--muted)'}}> {subsMaster.length} submissões totais</div>
            </div>

            {activeTab === 'reports' && (
              <div style={{marginTop:8,display:'grid',gridTemplateColumns:'1fr 320px',gap:16,alignItems:'start'}}>
              <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:12,padding:12}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                  <strong>Submissões</strong>
                  <div style={{color:'var(--muted)',fontSize:13}}>{subs.length} registros</div>
                </div>
                {loading ? <div>Carregando...</div> : (
                  <div style={{overflowX:'auto'}}>
                    <table style={{width:'100%',borderCollapse:'collapse'}}>
                      <thead>
                        <tr style={{textAlign:'left',color:'var(--muted)',fontSize:13}}>
                          <th style={{padding:'8px 6px'}}>Nome</th>
                          <th style={{padding:'8px 6px'}}>Data</th>
                          <th style={{padding:'8px 6px'}}>Score</th>
                          <th style={{padding:'8px 6px'}}>Sinalizadores</th>
                          <th style={{padding:'8px 6px'}}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {subs.map(s=> (
                          <tr key={s._id} style={{borderTop:'1px solid var(--border)'}}>
                            <td style={{padding:10}}>{s.name}</td>
                            <td style={{padding:10,color:'var(--muted)'}}>{new Date(s.createdAt).toLocaleString('pt-BR')}</td>
                            <td style={{padding:10}}>{s.pct}%</td>
                            <td style={{padding:10,color:'var(--muted)'}}>{(s.flags||[]).map(f=>f.flag).join(', ')}</td>
                            <td style={{padding:10,textAlign:'right'}}>
  <div style={{display:'flex',gap:6,justifyContent:'flex-end'}}>
    
    <button 
      className="btn-primary" 
      onClick={()=>downloadPdf(s.id)} 
      style={{padding:'8px 10px',fontSize:13}}
    >
      PDF
    </button>

    <button 
      className="btn-secondary" 
      onClick={()=>deleteReport(s._id)} 
      style={{padding:'8px 10px',fontSize:13,borderColor:'rgba(224,92,92,.35)',color:'#f2b7b7'}}
    >
      Excluir
    </button>

  </div>
</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:12,padding:12}}>
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  <strong>Ferramentas</strong>
                  <div style={{display:'flex',gap:8}}>
                    <input placeholder="Buscar por nome" onChange={e=>{ const q=e.target.value.toLowerCase(); if(!q) return setSubs(subsMaster); setSubs(subsMaster.filter(x=> (x.name||'').toLowerCase().includes(q))); }} style={{flex:1,background:'var(--surface2)',border:'1px solid var(--border)',padding:8,borderRadius:8,color:'var(--text)'}} />
                  </div>
                  <div style={{marginTop:8,color:'var(--muted)',fontSize:13}}>Selecione uma submissão para gerar o PDF ou use o gerenciador de perguntas.</div>
                </div>
              </div>
            </div>
          )}
        
        {/* Question manager */}
        {token && activeTab === 'questions' && (
          <div style={{marginTop:16,background:'var(--surface)',border:'1px solid var(--border)',borderRadius:14,padding:14}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap'}}>
              <div>
                <h2 style={{margin:'0 0 4px 0'}}>Banco de Perguntas</h2>
                <div style={{color:'var(--light)',fontSize:13}}>Crie, ajuste e organize as perguntas usadas na avaliação.</div>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <div style={{background:'var(--surface2)',border:'1px solid var(--border)',padding:'6px 10px',borderRadius:999,fontSize:12,color:'var(--light)'}}>
                  {filteredQuestions.length} exibidas
                </div>
                <div style={{background:'rgba(240,180,41,.12)',border:'1px solid rgba(240,180,41,.28)',padding:'6px 10px',borderRadius:999,fontSize:12,color:'var(--accent)'}}>
                  {questions.length} total
                </div>
              </div>
            </div>

            <div style={{marginTop:12,display:'grid',gridTemplateColumns:'1fr 170px auto',gap:8}}>
              <input
                value={questionSearch}
                onChange={e=>setQuestionSearch(e.target.value)}
                placeholder="Buscar por texto, categoria ou dimensão"
                style={{background:'var(--surface2)',border:'1px solid var(--border)',padding:'10px 12px',borderRadius:10,color:'var(--text)'}}
              />
              <select
                value={questionTypeFilter}
                onChange={e=>setQuestionTypeFilter(e.target.value)}
                style={{background:'var(--surface2)',border:'1px solid var(--border)',padding:'10px 12px',borderRadius:10,color:'var(--text)'}}
              >
                <option value="all">Todos os tipos</option>
                <option value="options">Opções</option>
                <option value="calc">Cálculo</option>
                <option value="open">Resposta aberta</option>
              </select>
              <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
                <button className="btn-secondary" onClick={()=>fetchQuestions()}>Atualizar</button>
                <button className="btn-secondary" onClick={async ()=>{
                  if(!confirm('Importar questões iniciais do projeto para o banco? Isso não irá duplicar se já existirem.')) return;
                  const r = await fetch('/api/admin/import-questions',{method:'POST'});
                  const j = await r.json(); if(r.ok) { alert('Importado: '+(j.inserted||0)); fetchQuestions(); } else { alert('Import falhou: '+(j.msg||j.error||r.status)); }
                }}>Importar</button>
                <button className="btn-primary" style={{width:'auto',padding:'0.7rem 1.2rem'}} onClick={openNewQuestion}>Nova pergunta</button>
              </div>
            </div>

            <div style={{marginTop:12,overflowX:'auto',border:'1px solid var(--border)',borderRadius:12}}>
              <table style={{width:'100%',borderCollapse:'collapse',background:'var(--surface)'}}>
                <thead>
                  <tr style={{textAlign:'left',fontSize:12,color:'var(--light)',background:'var(--surface2)'}}>
                    <th style={{padding:'10px 12px'}}>Pergunta</th>
                    <th style={{padding:'10px 12px'}}>Tipo</th>
                    <th style={{padding:'10px 12px'}}>Dimensão</th>
                    <th style={{padding:'10px 12px'}}>Categoria</th>
                    <th style={{padding:'10px 12px'}}>Opções</th>
                    <th style={{padding:'10px 12px',textAlign:'right'}}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQuestions.map(q=> (
                    <tr key={q._id} style={{borderTop:'1px solid var(--border)'}}>
                      <td style={{padding:'10px 12px',maxWidth:460}} title={q.text}>{q.text.length>95? q.text.slice(0,95)+'…': q.text}</td>
                      <td style={{padding:'10px 12px',color:'var(--light)'}}>{q.type}</td>
                      <td style={{padding:'10px 12px',color:'var(--light)'}}>{q.dimension||'—'}</td>
                      <td style={{padding:'10px 12px'}}>{q.category||q.catClass||'—'}</td>
                      <td style={{padding:'10px 12px',color:'var(--light)'}}>{q.options ? q.options.length : '—'}</td>
                      <td style={{padding:'10px 12px'}}>
                        <div style={{display:'flex',justifyContent:'flex-end',gap:6}}>
                          <button className="btn-secondary" style={{padding:'6px 10px'}} onClick={()=>{ setViewQ(q); setShowView(true); }}>Ver</button>
                          <button className="btn-secondary" style={{padding:'6px 10px'}} onClick={()=>openEditQuestion(q)}>Editar</button>
                          <button className="btn-secondary" style={{padding:'6px 10px',borderColor:'rgba(224,92,92,.35)',color:'#f2b7b7'}} onClick={()=>deleteQuestion(q._id)}>Excluir</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredQuestions.length === 0 && (
                <div style={{padding:16,color:'var(--light)'}}>Nenhuma pergunta encontrada com os filtros atuais.</div>
              )}
            </div>
          </div>
        )}

        {token && activeTab === 'users' && (
          <div style={{marginTop:16,display:'grid',gridTemplateColumns:'340px 1fr',gap:14,alignItems:'start'}}>
            <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:14,padding:14}}>
              <h2 style={{margin:'0 0 8px 0'}}>{editingUserId ? 'Editar usuário' : 'Novo usuário'}</h2>
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                <input value={userForm.name} onChange={e=>setUserForm(prev=>({ ...prev, name:e.target.value }))} placeholder="Nome" style={{background:'var(--surface2)',border:'1px solid var(--border)',padding:10,borderRadius:10,color:'var(--text)'}} />
                <input value={userForm.username} onChange={e=>setUserForm(prev=>({ ...prev, username:e.target.value }))} placeholder="Usuário" style={{background:'var(--surface2)',border:'1px solid var(--border)',padding:10,borderRadius:10,color:'var(--text)'}} />
                <input value={userForm.email} onChange={e=>setUserForm(prev=>({ ...prev, email:e.target.value }))} placeholder="E-mail" style={{background:'var(--surface2)',border:'1px solid var(--border)',padding:10,borderRadius:10,color:'var(--text)'}} />
                <select value={userForm.role} onChange={e=>setUserForm(prev=>({ ...prev, role:e.target.value }))} style={{background:'var(--surface2)',border:'1px solid var(--border)',padding:10,borderRadius:10,color:'var(--text)'}}>
                  <option value="admin">Admin</option>
                </select>
                <input type="password" value={userForm.password} onChange={e=>setUserForm(prev=>({ ...prev, password:e.target.value }))} placeholder={editingUserId ? 'Nova senha (opcional)' : 'Senha'} style={{background:'var(--surface2)',border:'1px solid var(--border)',padding:10,borderRadius:10,color:'var(--text)'}} />
                <label style={{display:'flex',alignItems:'center',gap:8,color:'var(--light)',fontSize:13}}>
                  <input type="checkbox" checked={!!userForm.active} onChange={e=>setUserForm(prev=>({ ...prev, active:e.target.checked }))} />
                  Usuário ativo
                </label>
                <div style={{display:'flex',gap:8}}>
                  <button className="btn-primary" style={{width:'auto'}} onClick={saveUser}>{editingUserId ? 'Salvar alterações' : 'Criar usuário'}</button>
                  <button className="btn-secondary" onClick={startNewUser}>Limpar</button>
                </div>
              </div>

              <div style={{marginTop:16,paddingTop:12,borderTop:'1px solid var(--border)'}}>
                <h3 style={{margin:'0 0 8px 0'}}>Resetar senha</h3>
                <select value={resetTargetId} onChange={e=>setResetTargetId(e.target.value)} style={{width:'100%',background:'var(--surface2)',border:'1px solid var(--border)',padding:10,borderRadius:10,color:'var(--text)',marginBottom:8}}>
                  <option value="">Selecione um usuário</option>
                  {users.map(u=> <option key={u._id} value={u._id}>{u.username} ({u.email})</option>)}
                </select>
                <input type="password" value={resetPassword} onChange={e=>setResetPassword(e.target.value)} placeholder="Nova senha" style={{width:'100%',background:'var(--surface2)',border:'1px solid var(--border)',padding:10,borderRadius:10,color:'var(--text)',marginBottom:8}} />
                <button className="btn-secondary" onClick={submitResetPassword}>Resetar senha</button>
              </div>
            </div>

            <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:14,padding:14}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                <h2 style={{margin:0}}>Usuários cadastrados</h2>
                <button className="btn-secondary" onClick={()=>fetchUsers()}>Atualizar</button>
              </div>
              <div style={{overflowX:'auto'}}>
                <table style={{width:'100%',borderCollapse:'collapse'}}>
                  <thead>
                    <tr style={{textAlign:'left',fontSize:12,color:'var(--light)'}}>
                      <th style={{padding:'8px 6px'}}>Nome</th>
                      <th style={{padding:'8px 6px'}}>Usuário</th>
                      <th style={{padding:'8px 6px'}}>E-mail</th>
                      <th style={{padding:'8px 6px'}}>Papel</th>
                      <th style={{padding:'8px 6px'}}>Status</th>
                      <th style={{padding:'8px 6px',textAlign:'right'}}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u=> (
                      <tr key={u._id} style={{borderTop:'1px solid var(--border)'}}>
                        <td style={{padding:'10px 6px'}}>{u.name || '—'}</td>
                        <td style={{padding:'10px 6px'}}>{u.username}</td>
                        <td style={{padding:'10px 6px'}}>{u.email}</td>
                        <td style={{padding:'10px 6px'}}>{u.role}</td>
                        <td style={{padding:'10px 6px',color:u.active ? '#9de5bb' : '#f2b7b7'}}>{u.active ? 'ativo' : 'inativo'}</td>
                        <td style={{padding:'10px 6px'}}>
                          <div style={{display:'flex',justifyContent:'flex-end',gap:6}}>
                            <button className="btn-secondary" style={{padding:'6px 10px'}} onClick={()=>startEditUser(u)}>Editar</button>
                            <button className="btn-secondary" style={{padding:'6px 10px',borderColor:'rgba(224,92,92,.35)',color:'#f2b7b7'}} onClick={()=>removeUser(u._id)}>Excluir</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {users.length === 0 && <div style={{padding:12,color:'var(--light)'}}>Nenhum usuário cadastrado.</div>}
              </div>
            </div>
          </div>
        )}
        
        {/* View question modal */}
        {showView && viewQ && (
          <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.6)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1200}}>
            <div style={{background:'#fff',color:'#111',padding:16,width:'90%',maxWidth:800,maxHeight:'90vh',overflow:'auto'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <strong>Visualizar questão</strong>
                <div><button onClick={()=>setShowView(false)}>Fechar</button></div>
              </div>
              <div style={{marginTop:12}}>
                <div style={{marginBottom:8}}><strong>Texto:</strong><div style={{marginTop:6}}>{viewQ.text}</div></div>
                <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
                  <div><strong>Tipo:</strong><div>{viewQ.type}</div></div>
                  <div><strong>Categoria:</strong><div>{viewQ.catClass||'—'}</div></div>
                  <div><strong>Dimensão:</strong><div>{viewQ.dimension||'—'}</div></div>
                </div>
                {viewQ.options && (
                  <div style={{marginTop:12}}>
                    <strong>Opções</strong>
                    <div style={{marginTop:8}}>
                      {viewQ.options.map((o,i)=> (
                        <div key={i} style={{padding:8,background:'#f7f7f7',borderRadius:8,marginBottom:8}}>
                          <div style={{fontWeight:700}}>{o.letter} — {o.text}</div>
                          <div style={{fontSize:13,color:'var(--muted)'}}>Score: {o.score} {o.flag ? '· flag: ' + o.flag : ''}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
          {qModal.open && token && (
            <QuestionModal open={qModal.open} data={qModal.data} onClose={()=>setQModal({open:false,data:null})} onSave={saveQuestion} />
          )}
          </div>
        )}
      </div>
    </div>
  );
}

// Simple modal UI for editing question as JSON
export function QuestionModal({ open, data, onClose, onSave }){
  const defaultForm = { type:'options', category:'Situação Prática', catClass:'cat-sit', dimension:'regulacao', text:'', options:[{letter:'A',text:'',score:3,flag:null},{letter:'B',text:'',score:2,flag:null}], correctAnswer:null, minLength:30 };
  const [form, setForm] = useState(defaultForm);

  useEffect(()=>{
    if(!data){ setForm(defaultForm); return; }
    // clone and ensure options letters
    const f = { ...data };
    if(f.options && Array.isArray(f.options)){
      f.options = f.options.map((o,i)=>({ letter: o.letter || String.fromCharCode(65+i), text: o.text||'', score: typeof o.score === 'number' ? o.score : 0, flag: o.flag || null }));
    }
    setForm(f);
  },[data]);

  if(!open) return null;

  function setField(k,v){ setForm(prev=>({ ...prev, [k]: v })); }

  function updateOption(idx, key, value){ setForm(prev=>{ const opts = [...(prev.options||[])]; opts[idx] = { ...opts[idx], [key]: value }; return { ...prev, options: opts }; }); }
  function addOption(){ setForm(prev=>{ const next = (prev.options||[]).length; const letter = String.fromCharCode(65+next); const opts = [...(prev.options||[]), { letter, text:'', score:0, flag:null }]; return { ...prev, options: opts }; }); }
  function removeOption(idx){ setForm(prev=>{ const opts = [...(prev.options||[])]; opts.splice(idx,1); // fix letters
    for(let i=0;i<opts.length;i++) opts[i].letter = String.fromCharCode(65+i);
    return { ...prev, options: opts }; }); }

  function validateAndSave(){
    if(!form.text || form.text.trim().length < 5) return alert('Informe o texto da questão (min 5 caracteres)');
    if(form.type === 'options'){
      if(!form.options || form.options.length < 2) return alert('Adicione pelo menos 2 opções');
      for(const o of form.options){ if(!o.text || o.text.trim().length===0) return alert('Todas as opções devem ter texto'); }
    }
    if(form.type === 'calc'){
      if(form.correctAnswer === null || form.correctAnswer === undefined) return alert('Informe a resposta correta');
    }
    if(form.type === 'open'){
      if(!form.minLength) form.minLength = 30;
    }
    // pass back to parent
    onSave(form);
  }

  const categories = [
    {label:'Contexto de Vida', value:'Contexto de Vida', catClass:'cat-vida'},
    {label:'Histórico Profissional', value:'Histórico Profissional', catClass:'cat-hist'},
    {label:'Situação Prática', value:'Situação Prática', catClass:'cat-sit'},
    {label:'Valores', value:'Valores', catClass:'cat-val'},
    {label:'Cálculo Rápido', value:'Cálculo Rápido', catClass:'cat-calc'},
    {label:'Reflexão Aberta', value:'Reflexão Aberta', catClass:'cat-val'}
  ];

  const dimensions = ['logistica','estabilidade','regulacao','integridade','aprendizado','fit','atencao','autoconsciencia'];

  const flagsList = [
    { value: '', label: '(nenhuma)' },
    { value: 'logistica_risco', label: 'logistica_risco — Logística em risco' },
    { value: 'logistica_incerta', label: 'logistica_incerta — Logística incerta' },
    { value: 'conciliacao_risco', label: 'conciliacao_risco — Conflito de horário (alto risco)' },
    { value: 'conciliacao_incerta', label: 'conciliacao_incerta — Conciliação a resolver' },
    { value: 'historico_curto', label: 'historico_curto — Histórico curto' },
    { value: 'historico_muito_curto', label: 'historico_muito_curto — Saídas muito curtas' },
    { value: 'conflito_relacional', label: 'conflito_relacional — Saída por conflito' },
    { value: 'adaptacao_risco', label: 'adaptacao_risco — Dificuldade de adaptação' },
    { value: 'reatividade_emocional', label: 'reatividade_emocional — Alta reatividade emocional' },
    { value: 'regulacao_risco', label: 'regulacao_risco — Dificuldade sob pressão' },
    { value: 'postura_passiva', label: 'postura_passiva — Postura passiva' },
    { value: 'reatividade_baixa', label: 'reatividade_baixa — Baixa proatividade' },
    { value: 'integridade_risco', label: 'integridade_risco — Integridade em risco' },
    { value: 'integridade_passiva', label: 'integridade_passiva — Integridade passiva' },
    { value: 'resistencia_feedback', label: 'resistencia_feedback — Resistência a feedback' },
    { value: 'abertura_feedback', label: 'abertura_feedback — Abertura a feedback' },
    { value: 'core_dificuldade', label: 'core_dificuldade — Dificuldade no core' },
    { value: 'fit_risco', label: 'fit_risco — Fit em dúvida' },
    { value: 'fit_plano', label: 'fit_plano — Plano divergente' },
    { value: 'sem_perspectiva', label: 'sem_perspectiva — Sem perspectiva' },
    { value: 'calculo_erro', label: 'calculo_erro — Erro no cálculo (automático)' }
  ];

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.6)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1200}}>
      <div className="intro-card" style={{width:'95%',maxWidth:900,maxHeight:'90vh',overflow:'auto'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <strong style={{fontSize:18}}>{form._id ? 'Editar questão' : 'Nova questão'}</strong>
          <div><button onClick={onClose} className="btn-secondary">Fechar</button></div>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginTop:16}}>
          <div className="name-input-wrap">
            <label>Tipo</label>
            <select value={form.type} onChange={e=>setField('type', e.target.value)} style={{width:'100%',background:'var(--surface2)',border:'1px solid var(--border)',padding:10,borderRadius:8,color:'var(--text)',fontFamily:'Sora,Arial,Helvetica',fontSize:14}}>
              <option value="options">Opções</option>
              <option value="calc">Cálculo</option>
              <option value="open">Resposta aberta</option>
            </select>
          </div>
          <div className="name-input-wrap">
            <label>Categoria</label>
            <select value={form.category} onChange={e=>{ const sel = e.target.value; setField('category', sel); const found = categories.find(c=>c.value===sel); if(found) setField('catClass', found.catClass); }} style={{width:'100%',background:'var(--surface2)',border:'1px solid var(--border)',padding:10,borderRadius:8,color:'var(--text)',fontFamily:'Sora,Arial,Helvetica',fontSize:14}}>
              {categories.map(c=> (<option key={c.value} value={c.value}>{c.label}</option>))}
            </select>
          </div>
          <div className="name-input-wrap">
            <label>Classe (categoria)</label>
            <select value={form.catClass} onChange={e=>setField('catClass', e.target.value)} style={{width:'100%',background:'var(--surface2)',border:'1px solid var(--border)',padding:10,borderRadius:8,color:'var(--text)',fontFamily:'Sora,Arial,Helvetica',fontSize:14}}>
              <option value="cat-vida">cat-vida</option>
              <option value="cat-hist">cat-hist</option>
              <option value="cat-sit">cat-sit</option>
              <option value="cat-val">cat-val</option>
              <option value="cat-calc">cat-calc</option>
            </select>
          </div>
          <div className="name-input-wrap">
            <label>Dimensão</label>
            <select value={form.dimension||''} onChange={e=>setField('dimension', e.target.value)} style={{width:'100%',background:'var(--surface2)',border:'1px solid var(--border)',padding:10,borderRadius:8,color:'var(--text)',fontFamily:'Sora,Arial,Helvetica',fontSize:14}}>
              <option value="">(nenhuma)</option>
              {dimensions.map(d=> (<option key={d} value={d}>{d}</option>))}
            </select>
          </div>
        </div>

        <div className="name-input-wrap" style={{marginTop:14}}>
          <label>Texto da questão</label>
          <textarea value={form.text||''} onChange={e=>setField('text', e.target.value)} style={{width:'100%',minHeight:100,background:'var(--surface)',border:'1.5px solid var(--border)',borderRadius:10,padding:12,color:'var(--text)',fontFamily:'Sora,Arial,Helvetica',fontSize:15}} />
        </div>

        {form.type === 'options' && (
          <div style={{marginTop:12}}>
            <strong>Opções</strong>
            <div style={{marginTop:8}}>
              <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:6,fontSize:13,color:'var(--muted)'}}>
                <div style={{width:28,fontWeight:700}}>Letra</div>
                <div style={{flex:1}}>Texto</div>
                <div style={{width:100,textAlign:'center'}}>Peso da opção (pts)</div>
                <div style={{width:220}}>Flag</div>
                <div style={{width:80}}></div>
              </div>
              {(form.options||[]).map((o,i)=> (
                <div key={i} style={{display:'flex',gap:8,alignItems:'center',marginBottom:8}}>
                  <div style={{width:28,fontWeight:700}}>{o.letter}</div>
                  <input placeholder="Texto da opção" value={o.text} onChange={e=>updateOption(i,'text',e.target.value)} style={{flex:1,background:'var(--surface2)',border:'1px solid var(--border)',padding:10,borderRadius:8,color:'var(--text)',fontFamily:'Sora,Arial,Helvetica'}} />
                  <input title="Peso da opção" type="number" placeholder="Pts" value={o.score} onChange={e=>updateOption(i,'score',Number(e.target.value))} style={{width:100,textAlign:'center',background:'var(--surface2)',border:'1px solid var(--border)',padding:8,borderRadius:8,color:'var(--text)',fontFamily:'Sora,Arial,Helvetica'}} />
                  <select value={o.flag||''} onChange={e=>updateOption(i,'flag',e.target.value||null)} style={{width:220,background:'var(--surface2)',border:'1px solid var(--border)',padding:8,borderRadius:8,color:'var(--text)',fontFamily:'Sora,Arial,Helvetica'}}>
                    {flagsList.map(f=> (<option key={f.value} value={f.value}>{f.label}</option>))}
                  </select>
                  <div style={{width:80}}><button onClick={()=>removeOption(i)} className="btn-secondary">Remover</button></div>
                </div>
              ))}
              <div><button onClick={addOption} className="btn-primary" style={{width:180}}>Adicionar opção</button></div>
            </div>
          </div>
        )}

        {form.type === 'calc' && (
          <div style={{marginTop:12}}>
            <label>Resposta correta (numérica)</label>
            <input type="number" step="0.01" value={form.correctAnswer||''} onChange={e=>setField('correctAnswer', e.target.value === '' ? null : Number(e.target.value))} style={{background:'var(--surface2)',border:'1px solid var(--border)',padding:8,borderRadius:8,color:'var(--text)',fontFamily:'Sora,Arial,Helvetica'}} />
          </div>
        )}

        {form.type === 'open' && (
          <div style={{marginTop:12}}>
            <label>Tamanho mínimo (caracteres)</label>
            <input type="number" value={form.minLength||30} onChange={e=>setField('minLength', Number(e.target.value))} style={{background:'var(--surface2)',border:'1px solid var(--border)',padding:8,borderRadius:8,color:'var(--text)',fontFamily:'Sora,Arial,Helvetica'}} />
          </div>
        )}

        <div style={{marginTop:12,display:'flex',justifyContent:'flex-end',gap:8}}>
          <button onClick={onClose} className="btn-ghost">Cancelar</button>
          <button onClick={validateAndSave} className="btn-primary" style={{width:'auto',padding:'0.7rem 1.3rem'}}>Salvar</button>
        </div>
      </div>
    </div>
  );
}
