import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Dumbbell, LogOut } from 'lucide-react';

export default function DashboardLayout({ nav, children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex">
      <aside className="w-56 shrink-0 bg-card border-r border-line flex flex-col fixed inset-y-0" data-testid="sidebar">
        <div className="flex items-center gap-2 px-5 h-16 border-b border-line">
          <div className="bg-accent p-1.5 rounded"><Dumbbell size={16} aria-hidden="true" /></div>
          <span className="font-display text-2xl uppercase tracking-tight">Iron Hub</span>
        </div>
        <nav className="flex-1 py-4 space-y-0.5">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              data-testid={`nav-${item.testId}`}
              className={({ isActive }) =>
                `flex items-center gap-3 px-5 py-2.5 text-sm transition-colors duration-200 border-l-2 ${
                  isActive
                    ? 'border-accent text-white bg-surface'
                    : 'border-transparent text-muted hover:text-white hover:bg-surface'
                }`
              }
            >
              <item.icon size={16} aria-hidden="true" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-line p-4">
          <p className="text-sm font-medium truncate">{user?.name}</p>
          <p className="text-xs text-muted uppercase tracking-wider mb-3">{user?.role === 'admin' ? 'Administrador' : 'Personal Trainer'}</p>
          <button
            onClick={async () => { await logout(); navigate('/login'); }}
            data-testid="logout-button"
            className="flex items-center gap-2 text-xs text-muted hover:text-accent transition-colors"
          >
            <LogOut size={14} aria-hidden="true" /> Sair
          </button>
        </div>
      </aside>
      <main className="flex-1 ml-56 p-8">{children}</main>
    </div>
  );
}
