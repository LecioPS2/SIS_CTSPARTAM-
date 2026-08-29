import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Flame, TrendingUp, CreditCard, User } from 'lucide-react';
import NotificationsPanel from '../components/NotificationsPanel';
import QRCodeAluna from '../components/QRCodeAluna';

const nav = [
  { to: '/aluno', label: 'Hoje', icon: Flame, end: true, testId: 'hoje' },
  { to: '/aluno/evolucao', label: 'Evolução', icon: TrendingUp, testId: 'evolucao' },
  { to: '/aluno/mensalidade', label: 'Mensalidade', icon: CreditCard, testId: 'mensalidade' },
  { to: '/aluno/perfil', label: 'Perfil', icon: User, testId: 'perfil' },
];

export default function StudentLayout({ children }) {
  const { user } = useAuth();

  return (
    <div className="min-h-screen pb-24 relative bg-background">
      {/* Imagem de fundo com 70% de transparência (opacity 30) */}
      <div 
        className="fixed inset-0 z-[0] bg-cover bg-center bg-no-repeat opacity-30 pointer-events-none"
        style={{ backgroundImage: 'url(/student-bg.png)' }}
      />
      <div className="relative z-10 max-w-lg mx-auto">
        <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-line px-5 h-14 flex items-center justify-between">
          <span className="flex items-center gap-2 font-display text-2xl uppercase tracking-tight">
            <img src="/logo.png" alt="CT Spartan" className="w-7 h-7" />
            CT <span className="text-accent">Spartan</span>
          </span>
          <div className="flex items-center gap-4">
            <QRCodeAluna inline />
            <NotificationsPanel />
            <span className="text-xs text-muted truncate max-w-[80px]">{user?.name}</span>
          </div>
        </header>
      <main className="px-5 py-6">{children}</main>
      <nav className="fixed bottom-5 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-[480px] z-40 bg-black/70 backdrop-blur-xl border border-white/10 shadow-xl shadow-black/50 rounded-2xl overflow-hidden" data-testid="student-bottom-nav">
        <div className="grid grid-cols-4">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              data-testid={`nav-${item.testId}`}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-3 text-[10px] uppercase tracking-wider transition-colors duration-200 ${
                  isActive ? 'text-accent' : 'text-muted hover:text-white'
                }`
              }
            >
              <item.icon size={20} aria-hidden="true" />
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
      </div>
    </div>
  );
}
