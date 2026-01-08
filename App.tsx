
import React, { useState, useEffect } from 'react';
import { 
  User, 
  UserRole, 
  Protocol, 
  ManifestType, 
  ProtocolStatus 
} from './types';
import { supabase } from './supabaseClient';
import { getAIAnalysis } from './geminiService';
import { 
  UserCircle, 
  Building2, 
  LayoutDashboard, 
  PlusCircle, 
  History, 
  LogOut, 
  Sparkles, 
  ShieldCheck, 
  CheckCircle2,
  ArrowLeft,
  X,
  Camera,
  Users,
  Quote,
  Star,
  ShieldAlert,
  Hash,
  Lock
} from 'lucide-react';

// --- Shared Components ---

const Button: React.FC<{
  onClick?: () => void;
  type?: 'button' | 'submit';
  variant?: 'primary' | 'secondary' | 'ghost' | 'ai';
  className?: string;
  disabled?: boolean;
  children: React.ReactNode;
}> = ({ onClick, type = 'button', variant = 'primary', className = '', disabled, children }) => {
  const base = "px-6 py-3.5 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 select-none";
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-100",
    secondary: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50",
    ghost: "text-slate-500 hover:bg-slate-100",
    ai: "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white hover:opacity-90 shadow-lg shadow-purple-200"
  };
  return (
    <button onClick={onClick} type={type} disabled={disabled} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { icon?: React.ReactNode }> = ({ icon, ...props }) => (
  <div className="relative w-full group">
    {icon && (
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
        {icon}
      </div>
    )}
    <input 
      {...props} 
      className={`w-full ${icon ? 'pl-12' : 'px-5'} pr-5 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all bg-white text-slate-800 placeholder:text-slate-400 font-semibold`} 
    />
  </div>
);

const Toast: React.FC<{ message: string; type: 'success' | 'error'; onClose: () => void }> = ({ message, type, onClose }) => (
  <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 px-8 py-5 rounded-3xl shadow-2xl border backdrop-blur-xl animate-in z-[100] flex items-center gap-4 ${
    type === 'success' ? 'bg-emerald-600/95 border-emerald-500 text-white' : 'bg-rose-600/95 border-rose-500 text-white'
  }`}>
    {type === 'success' ? <CheckCircle2 size={24} /> : <ShieldAlert size={24} />}
    <p className="text-sm font-black uppercase tracking-wide">{message}</p>
    <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-lg transition-colors"><X size={18} /></button>
  </div>
);

// --- Main Application ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<'login' | 'register' | 'dashboard' | 'new-manifest' | 'history'>('login');
  const [role, setRole] = useState<UserRole>(UserRole.APPRENTICE);
  
  // Auth States
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [companies, setCompanies] = useState<User[]>([]);
  const [regData, setRegData] = useState({
    name: '',
    identifier: '',
    password: '',
    companyId: '',
    avatarUrl: ''
  });

  // App States
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [companyPraises, setCompanyPraises] = useState<Protocol[]>([]);
  const [apprenticeCount, setApprenticeCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchCompanies();
  }, []);

  // Limpar formulário ao trocar de papel (Role) para evitar dados cruzados
  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    // Limpar todos os estados de input
    setIdentifier('');
    setPassword('');
    setConfirmPassword('');
    setRegData({
      name: '',
      identifier: '',
      password: '',
      companyId: '',
      avatarUrl: ''
    });
  };

  const fetchCompanies = async () => {
    try {
      const data = await supabase.getCompanies();
      setCompanies(data);
    } catch (err) {
      console.error("Erro ao buscar empresas:", err);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) return showToast('A imagem deve ter no máximo 2MB.', 'error');
      const reader = new FileReader();
      reader.onloadend = () => setRegData(prev => ({ ...prev, avatarUrl: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) return showToast('Preencha todos os campos.', 'error');
    setLoading(true);
    try {
      const result = await supabase.login(identifier, password, role);
      if (result) {
        setUser(result);
        setView('dashboard');
        showToast(`Bem-vindo, ${result.name}!`);
        if (result.role === UserRole.COMPANY) {
          const stats = await supabase.getCompanyData(result.id);
          setCompanyPraises(stats.praises);
          setApprenticeCount(stats.apprenticeCount);
        } else {
          const data = await supabase.getProtocols(result.id);
          setProtocols(data);
        }
      } else {
        showToast('Credenciais inválidas. Verifique os dados.', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validations
    if (!regData.name || !regData.identifier || !regData.password || !confirmPassword) {
      return showToast('Preencha todos os campos obrigatórios.', 'error');
    }
    if (regData.password !== confirmPassword) {
      return showToast('As senhas não coincidem.', 'error');
    }
    if (regData.password.length < 6) {
      return showToast('A senha deve ter pelo menos 6 caracteres.', 'error');
    }
    if (role === UserRole.APPRENTICE) {
      if (!regData.companyId) return showToast('Selecione sua empresa de vínculo.', 'error');
      if (!/^\d+$/.test(regData.identifier)) return showToast('A matrícula deve conter apenas números.', 'error');
    }
    if (role === UserRole.COMPANY && !regData.avatarUrl) {
      return showToast('Envie uma imagem de identificação da empresa.', 'error');
    }

    setLoading(true);
    try {
      await supabase.register({ ...regData, role });
      showToast('Cadastro realizado com sucesso! Faça seu login.');
      setView('login');
      // Set values for login after registration
      setIdentifier(regData.identifier);
      setPassword(regData.password);
      if (role === UserRole.COMPANY) fetchCompanies();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateManifest = async (formData: any) => {
    if (!user) return;
    setLoading(true);
    try {
      await supabase.createProtocol({
        userId: user.id,
        targetCompanyId: user.companyId,
        ...formData
      });
      showToast('Manifestação enviada com sucesso!');
      setView('dashboard');
      const data = await supabase.getProtocols(user.id);
      setProtocols(data);
    } catch (e: any) {
      showToast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Auth Layout
  if (view === 'login' || view === 'register') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 mesh-gradient">
        <div className="glass-card w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl animate-in">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-indigo-300 mx-auto mb-6 transform rotate-3">
              <ShieldCheck size={40} />
            </div>
            <h1 className="text-4xl font-black text-slate-800 tracking-tighter uppercase italic">PJA 3.5</h1>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-2">Portal Jovem Aprendiz</p>
          </div>

          <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-8">
            <button 
              onClick={() => handleRoleChange(UserRole.APPRENTICE)} 
              className={`flex-1 py-4 rounded-xl text-xs font-black uppercase transition-all flex items-center justify-center gap-2 ${role === UserRole.APPRENTICE ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500'}`}
            >
              <Users size={18} /> Aprendiz
            </button>
            <button 
              onClick={() => handleRoleChange(UserRole.COMPANY)} 
              className={`flex-1 py-4 rounded-xl text-xs font-black uppercase transition-all flex items-center justify-center gap-2 ${role === UserRole.COMPANY ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500'}`}
            >
              <Building2 size={18} /> Empresa
            </button>
          </div>

          {view === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-6 animate-in">
              <div className="space-y-4">
                <Input 
                  icon={<Hash size={20} />}
                  placeholder={role === UserRole.APPRENTICE ? "Matrícula (Apenas números)" : "CNPJ da Empresa"} 
                  value={identifier} 
                  onChange={e => setIdentifier(e.target.value)}
                  type="text"
                  autoComplete="username"
                />
                <Input 
                  icon={<Lock size={20} />}
                  type="password" 
                  placeholder="Sua senha secreta" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  autoComplete="current-password"
                />
              </div>
              <Button type="submit" className="w-full py-5 uppercase tracking-widest text-xs" disabled={loading}>
                {loading ? 'Aguarde...' : 'Acessar Portal'}
              </Button>
              <div className="text-center">
                <button type="button" onClick={() => setView('register')} className="text-xs font-black text-indigo-600 uppercase tracking-wide hover:underline">Ainda não tenho acesso</button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-5 animate-in">
              <div className="max-h-[420px] overflow-y-auto pr-2 custom-scrollbar space-y-4">
                {role === UserRole.COMPANY && (
                  <div className="flex flex-col items-center gap-3 mb-2">
                    <label className="relative w-24 h-24 rounded-full bg-white border-2 border-dashed border-indigo-200 flex items-center justify-center cursor-pointer overflow-hidden group hover:border-indigo-400 transition-colors">
                      {regData.avatarUrl ? (
                        <img src={regData.avatarUrl} className="w-full h-full object-cover" alt="Avatar" />
                      ) : (
                        <Camera className="text-slate-300 group-hover:scale-110 transition-transform" />
                      )}
                      <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                    </label>
                    <p className="text-[9px] font-black uppercase text-indigo-400">Logotipo da Empresa</p>
                  </div>
                )}
                
                <Input placeholder="Nome Completo ou Razão Social" value={regData.name} onChange={e => setRegData({...regData, name: e.target.value})} />
                <Input placeholder={role === UserRole.APPRENTICE ? "Número de Matrícula" : "CNPJ"} value={regData.identifier} onChange={e => setRegData({...regData, identifier: e.target.value})} />
                
                {role === UserRole.APPRENTICE && (
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none">
                      <Building2 size={20} />
                    </div>
                    <select 
                      value={regData.companyId} 
                      onChange={e => setRegData({...regData, companyId: e.target.value})}
                      className="w-full pl-12 pr-5 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all bg-white text-slate-800 font-semibold appearance-none"
                    >
                      <option value="">Selecione sua Empresa</option>
                      {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                )}
                
                <div className="grid grid-cols-1 gap-4">
                  <Input 
                    icon={<Lock size={20} />} 
                    type="password" 
                    placeholder="Defina sua senha" 
                    value={regData.password} 
                    onChange={e => setRegData({...regData, password: e.target.value})} 
                    autoComplete="new-password"
                  />
                  <Input 
                    icon={<CheckCircle2 size={20} className={confirmPassword && confirmPassword === regData.password ? "text-emerald-500" : ""} />} 
                    type="password" 
                    placeholder="Confirme sua senha" 
                    value={confirmPassword} 
                    onChange={e => setConfirmPassword(e.target.value)} 
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full py-5 uppercase tracking-widest text-xs" disabled={loading}>
                {loading ? 'Processando...' : 'Criar minha conta'}
              </Button>
              <div className="text-center">
                <button type="button" onClick={() => { setView('login'); handleRoleChange(role); }} className="text-xs font-black text-indigo-600 uppercase tracking-wide hover:underline">Já tenho uma conta</button>
              </div>
            </form>
          )}
        </div>
        {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      </div>
    );
  }

  // Dashboard Layout
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50/50">
      <aside className="w-full md:w-72 glass-card border-r border-slate-200 p-8 z-40">
        <div className="flex items-center gap-4 mb-12">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100 transform -rotate-3"><ShieldCheck size={24} /></div>
          <div>
            <h2 className="font-black text-slate-800 tracking-tighter text-xl uppercase italic">PJA</h2>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Digital</p>
          </div>
        </div>

        <nav className="space-y-2">
          <button onClick={() => setView('dashboard')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-black text-xs uppercase tracking-wider ${view === 'dashboard' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-slate-400 hover:bg-white'}`}>
            <LayoutDashboard size={20} /> Dashboard
          </button>
          {user?.role === UserRole.APPRENTICE && (
            <>
              <button onClick={() => setView('new-manifest')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-black text-xs uppercase tracking-wider ${view === 'new-manifest' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-slate-400 hover:bg-white'}`}>
                <PlusCircle size={20} /> Manifestar
              </button>
              <button onClick={() => setView('history')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-black text-xs uppercase tracking-wider ${view === 'history' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-slate-400 hover:bg-white'}`}>
                <History size={20} /> Histórico
              </button>
            </>
          )}
        </nav>

        <div className="mt-auto pt-10">
          <div className="p-5 rounded-[2rem] bg-white border border-slate-100 shadow-sm mb-6 flex items-center gap-4">
            {user?.role === UserRole.COMPANY && user.avatarUrl ? (
              <img src={user.avatarUrl} className="w-12 h-12 rounded-full object-cover border-2 border-indigo-100 shadow-sm" alt="Logo" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-inner"><UserCircle size={28} /></div>
            )}
            <div className="overflow-hidden">
              <p className="text-[11px] font-black text-slate-800 truncate uppercase tracking-tighter leading-none">{user?.name}</p>
              <p className="text-[9px] text-indigo-500 font-black uppercase mt-1">ID: {user?.identifier}</p>
            </div>
          </div>
          <button onClick={() => {setUser(null); setView('login'); handleRoleChange(UserRole.APPRENTICE);}} className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-rose-500 hover:bg-rose-50 transition-all font-black text-xs uppercase tracking-widest">
            <LogOut size={20} /> Encerrar Sessão
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-12 overflow-y-auto pb-32">
        <div className="max-w-5xl mx-auto">
          {view === 'dashboard' && user?.role === UserRole.COMPANY && (
            <div className="animate-in space-y-12">
              <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                  <h1 className="text-4xl font-black text-slate-800 uppercase tracking-tighter italic">Mural da Empresa</h1>
                  <p className="text-slate-400 font-medium text-lg mt-2">Gestão de elogios e transparência.</p>
                </div>
                <div className="flex gap-4">
                  <div className="px-8 py-5 bg-white rounded-[2rem] shadow-sm border border-slate-100 text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Aprendizes</p>
                    <p className="text-4xl font-black text-indigo-600">{apprenticeCount}</p>
                  </div>
                </div>
              </header>

              <section className="space-y-6">
                <div className="flex items-center gap-4">
                  <Star className="text-amber-500 fill-amber-500" size={28} />
                  <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Reconhecimento</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {companyPraises.length > 0 ? companyPraises.map(p => (
                    <div key={p.id} className="glass-card p-8 rounded-[2.5rem] border border-white shadow-sm relative overflow-hidden group hover:shadow-xl transition-all">
                      <Quote className="absolute -top-4 -right-4 text-slate-50 opacity-10 group-hover:scale-150 transition-transform" size={120} />
                      <div className="relative z-10 space-y-4">
                        <div className="flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase tracking-widest">
                          <CheckCircle2 size={16} /> Elogio Validado
                        </div>
                        <p className="text-lg text-slate-700 font-semibold leading-relaxed italic">"{p.description}"</p>
                        <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase">
                          <span>{p.reason}</span>
                          <span>{new Date(p.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="col-span-full py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300">
                      <Quote size={60} className="mb-4 opacity-20" />
                      <p className="font-black uppercase tracking-widest text-sm">Sem elogios no momento.</p>
                    </div>
                  )}
                </div>
              </section>
            </div>
          )}

          {view === 'dashboard' && user?.role === UserRole.APPRENTICE && (
            <div className="animate-in space-y-10">
              <header>
                <h1 className="text-4xl font-black text-slate-800 uppercase tracking-tighter italic">Olá, {user.name.split(' ')[0]}</h1>
                <p className="text-slate-400 font-medium text-lg mt-1">Sua voz importa no Portal Jovem Aprendiz.</p>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-indigo-600 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-indigo-200 relative overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform" onClick={() => setView('new-manifest')}>
                  <div className="absolute -bottom-10 -right-10 opacity-20"><PlusCircle size={180} /></div>
                  <PlusCircle className="mb-6" size={40} />
                  <h3 className="text-2xl font-black uppercase tracking-tight leading-none mb-2">Criar<br/>Manifestação</h3>
                  <p className="text-xs font-bold opacity-70">Registre elogios ou feedbacks com suporte da IA.</p>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform" onClick={() => setView('history')}>
                  <History className="text-slate-400 mb-6" size={40} />
                  <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight leading-none mb-2">Meus<br/>Protocolos</h3>
                  <p className="text-xs font-bold text-slate-400">{protocols.length} registros ativos.</p>
                </div>
                <div className="bg-emerald-500 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-emerald-100 relative overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform">
                  <ShieldCheck className="mb-6" size={40} />
                  <h3 className="text-2xl font-black uppercase tracking-tight leading-none mb-2">Lei do<br/>Aprendiz</h3>
                  <p className="text-xs font-bold opacity-70">Acesse seus direitos (Lei 10.097/2000).</p>
                </div>
              </div>
            </div>
          )}

          {view === 'new-manifest' && (
             <ManifestForm onSubmit={handleCreateManifest} onCancel={() => setView('dashboard')} loading={loading} />
          )}

          {view === 'history' && (
            <div className="animate-in space-y-8">
              <header className="flex items-center gap-6">
                <button onClick={() => setView('dashboard')} className="p-4 bg-white rounded-2xl shadow-sm hover:bg-slate-50 transition-colors"><ArrowLeft size={24} /></button>
                <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tighter italic">Histórico</h1>
              </header>
              <div className="space-y-6">
                {protocols.map(p => (
                  <div key={p.id} className="glass-card p-8 rounded-[2.5rem] border border-white shadow-sm flex flex-col md:flex-row justify-between gap-6 hover:shadow-lg transition-all">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center gap-4">
                        <p className="font-black text-slate-800 uppercase text-lg tracking-tight">{p.reason}</p>
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${p.type === ManifestType.PRAISE ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{p.type}</span>
                      </div>
                      <p className="text-sm text-slate-500 leading-relaxed italic">"{p.description}"</p>
                      <div className="flex gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <span>PROTOCOLO: {p.id}</span>
                        <span>{new Date(p.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="shrink-0 flex items-start">
                      <div className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest border-2 ${p.status === ProtocolStatus.CONCLUDED ? 'border-emerald-500 text-emerald-600 bg-emerald-50' : 'border-amber-500 text-amber-600 bg-amber-50'}`}>
                        {p.status === ProtocolStatus.CONCLUDED ? 'Concluído' : 'Processando'}
                      </div>
                    </div>
                  </div>
                ))}
                {protocols.length === 0 && (
                  <div className="text-center py-20 text-slate-400">
                    <p className="font-black uppercase text-sm tracking-widest">Nenhum protocolo encontrado.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}

const ManifestForm: React.FC<{ onSubmit: (data: any) => void; onCancel: () => void; loading: boolean }> = ({ onSubmit, onCancel, loading }) => {
  const [data, setData] = useState({ type: ManifestType.COMPLAINT, reason: 'Ambiente de Trabalho', description: '' });
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const handleRefine = async () => {
    if (!data.description) return;
    setIsAiLoading(true);
    const res = await getAIAnalysis(data.description, data.reason);
    setAiAnalysis(res);
    setIsAiLoading(false);
  };

  return (
    <div className="animate-in space-y-8">
      <header className="flex items-center gap-6">
        <button onClick={onCancel} className="p-4 bg-white rounded-2xl shadow-sm"><ArrowLeft size={24} /></button>
        <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tighter italic">Nova Manifestação</h1>
      </header>
      
      <div className="glass-card p-10 rounded-[3rem] shadow-xl border border-white space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Tipo de Manifestação</label>
            <div className="flex bg-slate-100 p-1.5 rounded-2xl">
              {Object.values(ManifestType).map(t => (
                <button key={t} onClick={() => setData({...data, type: t})} className={`flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase transition-all ${data.type === t ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400'}`}>{t}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Assunto Principal</label>
            <select value={data.reason} onChange={e => setData({...data, reason: e.target.value})} className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-white font-bold text-sm outline-none appearance-none">
              <option>Ambiente de Trabalho</option>
              <option>Carga Horária / Horários</option>
              <option>Desvio de Função</option>
              <option>Relacionamento Equipe</option>
              <option>Remuneração / Benefícios</option>
              <option>Outros</option>
            </select>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Descrição Detalhada</label>
            <button onClick={handleRefine} disabled={isAiLoading || !data.description} className="text-[10px] font-black uppercase text-indigo-600 flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors disabled:opacity-50">
              {isAiLoading ? <Sparkles size={16} className="animate-spin" /> : <Sparkles size={16} />} Refinar com IA
            </button>
          </div>
          <textarea 
            value={data.description} 
            onChange={e => setData({...data, description: e.target.value})}
            placeholder="Relate aqui sua experiêncie..."
            className="w-full min-h-[180px] p-6 rounded-[2rem] border border-slate-200 outline-none focus:ring-4 focus:ring-indigo-100 transition-all font-medium text-slate-700 bg-white resize-none"
          />
        </div>

        {aiAnalysis && (
          <div className="p-8 rounded-[2.5rem] bg-indigo-600 text-white shadow-2xl shadow-indigo-200 space-y-6 animate-in">
            <div className="flex items-center gap-3 font-black uppercase text-xs tracking-widest">
              <Sparkles size={20} /> Análise Jurídica PJA
            </div>
            <div className="space-y-4">
              <div className="bg-white/10 p-5 rounded-2xl border border-white/20 italic text-sm">"{aiAnalysis.refinedText}"</div>
              <p className="text-[11px] font-bold opacity-80 leading-relaxed uppercase tracking-wide">{aiAnalysis.legalAnalysis}</p>
            </div>
            <Button variant="secondary" className="w-full py-4 text-[10px] uppercase tracking-widest" onClick={() => { setData({...data, description: aiAnalysis.refinedText}); setAiAnalysis(null); }}>Aplicar Sugestão</Button>
          </div>
        )}

        <Button className="w-full py-5 text-xs uppercase tracking-[0.2em]" onClick={() => onSubmit(data)} disabled={loading}>
          {loading ? 'Processando...' : 'Registrar Protocolo'}
        </Button>
      </div>
    </div>
  );
};
