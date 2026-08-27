import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Flame, TrendingUp, CreditCard, User } from 'lucide-react';

const nav = [
  { to: '/aluno', label: 'Hoje', icon: Flame, end: true, testId: 'hoje' },
  { to: '/aluno/evolucao', label: 'Evolução', icon: TrendingUp, testId: 'evolucao' },
  { to: '/aluno/mensalidade', label: 'Mensalidade', icon: CreditCard, testId: 'mensalidade' },
  { to: '/aluno/perfil', label: 'Perfil', icon: User, testId: 'perfil' },
];

export default function StudentLayout({ children }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen max-w-lg mx-auto pb-24">
      <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-line px-5 h-14 flex items-center justify-between">
        <span className="font-display text-2xl uppercase tracking-tight">Iron <span className="text-accent">Hub</span></span>
        <span className="text-xs text-muted truncate max-w-[50%]">{user?.name}</span>
      </header>
      <main className="px-5 py-6">{children}</main>
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-black/80 backdrop-blur-xl border-t border-line" data-testid="student-bottom-nav">
        <div className="max-w-lg mx-auto grid grid-cols-4">
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
  );
}
