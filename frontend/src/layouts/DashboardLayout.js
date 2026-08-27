import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Dumbbell, LogOut, Search, Bell, Instagram, Facebook, Youtube } from 'lucide-react';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

function initials(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
}

export default function DashboardLayout({ nav, children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const cargo = user?.role === 'admin' ? 'Administrador' : 'Personal Trainer';

  return (
    <div className="min-h-screen flex">
      <aside className="w-56 shrink-0 bg-card border-r border-line flex flex-col fixed inset-y-0 z-30" data-testid="sidebar">
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
          <p className="text-xs text-muted uppercase tracking-wider mb-3">{cargo}</p>
          <button
            onClick={async () => { await logout(); navigate('/login'); }}
            data-testid="logout-button"
            className="flex items-center gap-2 text-xs text-muted hover:text-accent transition-colors"
          >
            <LogOut size={14} aria-hidden="true" /> Sair
          </button>
        </div>
      </aside>
      <div className="flex-1 ml-56 flex flex-col">
        <header className="sticky top-0 z-20 h-16 bg-card/90 backdrop-blur-xl border-b border-line flex items-center justify-between px-6 gap-4" data-testid="dashboard-header">
          <div className="relative w-full max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input
              type="text"
              placeholder="Buscar..."
              data-testid="header-search-input"
              className="w-full bg-surface border border-line rounded-full pl-9 pr-4 py-2 text-sm placeholder-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
            />
          </div>
          <div className="flex items-center gap-5">
            <div className="hidden md:flex items-center gap-3 pr-5 border-r border-line">
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="text-muted hover:text-accent transition-colors" data-testid="header-instagram-link" aria-label="Instagram"><Instagram size={17} /></a>
              <a href="https://facebook.com" target="_blank" rel="noreferrer" className="text-muted hover:text-accent transition-colors" data-testid="header-facebook-link" aria-label="Facebook"><Facebook size={17} /></a>
              <a href="https://youtube.com" target="_blank" rel="noreferrer" className="text-muted hover:text-accent transition-colors" data-testid="header-youtube-link" aria-label="YouTube"><Youtube size={17} /></a>
            </div>
            <button className="relative text-muted hover:text-white transition-colors" data-testid="header-notifications-button" aria-label="Notificações">
              <Bell size={18} />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-accent rounded-full" aria-hidden="true" />
            </button>
            <div className="flex items-center gap-3" data-testid="header-user-info">
              <div className="text-right leading-tight">
                <p className="text-xs text-muted">{greeting()},</p>
                <p className="text-sm font-medium truncate max-w-[160px]">{user?.name}</p>
                <p className="text-[10px] uppercase tracking-[0.15em] text-accent">{cargo}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center font-display text-lg shrink-0" data-testid="header-avatar">
                {initials(user?.name)}
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
