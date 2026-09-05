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
        className="fixed inset-0 z-[0] bg-cover bg-top bg-no-repeat"
        style={{ backgroundImage: 'url(/student-bg.png)' }}
      />
      {/* Overlay Escuro com Gradiente */}
      <div className="fixed inset-0 z-[1] bg-gradient-to-b from-black/40 via-black/80 to-[#0a0a0a]" />

      <div className="relative z-10 max-w-lg mx-auto min-h-screen flex flex-col">
        {/* Header Transparente */}
        <header className="px-5 pt-12 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#4a4a4a] flex items-center justify-center shrink-0 shadow-xl overflow-hidden border border-white/10" onClick={logout} title="Sair (Logout)">
              {user?.avatarUrl ? (
                <img src={`${backendUrl}${user.avatarUrl}`} alt="Perfil" className="w-full h-full object-cover" />
              ) : (
                <User size={24} className="text-white/50" />
              )}
            </div>
            <div className="leading-tight">
              <p className="text-[13px] text-white uppercase tracking-wider font-light">BEM-VINDO</p>
              <p className="text-[14px] text-white uppercase tracking-wide">AO <strong className="font-black">CT SPARTAN</strong> MOBILE</p>
            </div>
          </div>
          <div className="w-7 h-7 rounded-full bg-[#d9d9d9] shadow-lg relative"></div>
        </header>

        <main className="px-5 py-2 flex-1">{children}</main>

        {/* Bottom Nav Flutuante */}
        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-[400px] z-40 bg-[#1c1c1e]/80 backdrop-blur-xl border border-white/5 shadow-2xl rounded-2xl h-16 flex items-center justify-between px-2" data-testid="student-bottom-nav">
          <div className="flex items-center justify-around w-[40%]">
            {navLeft.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `flex flex-col items-center p-2 transition-colors ${isActive ? 'text-accent' : 'text-white/40 hover:text-white'}`}>
                <item.icon size={22} />
              </NavLink>
            ))}
          </div>

          {/* Botão Central Logo */}
          <div className="absolute left-1/2 -translate-x-1/2 -top-6 w-16 h-16 rounded-full bg-black border-[3px] border-[#1c1c1e] shadow-xl flex items-center justify-center overflow-hidden z-50">
            <div className="w-full h-full relative flex">
              <div className="w-1/2 h-full bg-white"></div>
              <div className="w-1/2 h-full bg-accent"></div>
              <img src="/logo.png" alt="CT Spartan" className="absolute inset-0 w-10 h-10 m-auto filter drop-shadow-md z-10 mix-blend-difference" style={{ filter: 'invert(1)' }} />
            </div>
          </div>

          <div className="flex items-center justify-around w-[40%]">
            {navRight.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `flex flex-col items-center p-2 transition-colors ${isActive ? 'text-accent' : 'text-white/40 hover:text-white'}`}>
                <item.icon size={22} />
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}
