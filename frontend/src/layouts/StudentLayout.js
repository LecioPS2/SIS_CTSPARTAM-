import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Flame, TrendingUp, CreditCard, User, LogOut, Bell } from 'lucide-react';
import NotificationsPanel from '../components/NotificationsPanel';

const navLeft = [
  { to: '/aluno', label: 'Hoje', icon: Flame, end: true, testId: 'hoje' },
  { to: '/aluno/evolucao', label: 'Evolução', icon: TrendingUp, testId: 'evolucao' },
];
const navRight = [
  { to: '/aluno/mensalidade', label: 'Mensal', icon: CreditCard, testId: 'mensalidade' },
  { to: '/aluno/perfil', label: 'Perfil', icon: User, testId: 'perfil' },
];

export default function StudentLayout({ children }) {
  const { user, logout } = useAuth();
  const backendUrl = process.env.REACT_APP_BACKEND_URL || '';

  return (
    <div className="min-h-screen pb-24 relative bg-black font-sans">
      {/* Imagem de fundo Full Screen */}
      <div 
        className="fixed inset-0 z-[0] bg-cover bg-center bg-no-repeat blur-[10px] scale-110 opacity-90"
        style={{ backgroundImage: 'url(/student-bg-v2.png)' }}
      />
      {/* Overlay Escuro com Gradiente */}
      <div className="fixed inset-0 z-[1] bg-gradient-to-b from-transparent via-black/50 to-black/90 pointer-events-none" />

      <div className="relative z-10 max-w-lg mx-auto min-h-screen flex flex-col">
        {/* Header Fixo */}
        <header className="sticky top-0 z-50 px-5 pt-12 pb-4 flex items-center justify-between bg-black/80 backdrop-blur-md border-b border-white/5 shadow-[0_4px_30px_rgba(0,0,0,0.8)]">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#4a4a4a] flex items-center justify-center shrink-0 shadow-xl overflow-hidden border border-white/10" onClick={logout} title="Sair (Logout)">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl.startsWith('/uploads') ? `${backendUrl}/api/files${user.avatarUrl.replace('/uploads', '')}` : `${backendUrl}${user.avatarUrl}`} alt="Perfil" className="w-full h-full object-cover" />
              ) : (
                <User size={24} className="text-white/50" />
              )}
            </div>
            <div className="leading-tight">
              <p className="text-[13px] text-white uppercase tracking-wider font-light">BEM-VINDO</p>
              <p className="text-[14px] text-white uppercase tracking-wide">AO <strong className="font-black">CT SPARTAN</strong> MOBILE</p>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-lg relative">
            <NotificationsPanel iconClass="text-[#bd1e2d] hover:text-[#a01925]" />
          </div>
        </header>

        <main className="px-5 py-6 flex-1">{children}</main>

        {/* Bottom Nav Fixo Vermelho */}
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg z-40 bg-[#bd1e2d] rounded-t-3xl h-[84px] flex items-center justify-between px-6 pb-2 shadow-[0_-4px_25px_rgba(0,0,0,0.5)]" data-testid="student-bottom-nav">
          <div className="flex items-center justify-between w-[42%] gap-1">
            {navLeft.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `w-12 h-12 rounded-xl flex items-center justify-center transition-all ${isActive ? 'bg-[#151515] text-[#bd1e2d] shadow-lg scale-105' : 'bg-[#222222] text-white/60 hover:bg-[#151515] hover:text-white'}`}>
                <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              </NavLink>
            ))}
          </div>

          {/* Botão Central Logo */}
          <div className="absolute left-1/2 -translate-x-1/2 -top-6 w-20 h-20 rounded-full bg-[#0a0a0a] shadow-2xl flex items-center justify-center z-50 overflow-hidden">
            <img src="/logo-menu.png" alt="CT Spartan" className="w-[85%] h-[85%] object-contain" />
          </div>

          <div className="flex items-center justify-between w-[42%] gap-1">
            {navRight.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `w-12 h-12 rounded-xl flex items-center justify-center transition-all ${isActive ? 'bg-[#151515] text-[#bd1e2d] shadow-lg scale-105' : 'bg-[#222222] text-white/60 hover:bg-[#151515] hover:text-white'}`}>
                <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}
