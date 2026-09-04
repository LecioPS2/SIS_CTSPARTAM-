import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Search, Globe, Instagram, Phone, Smartphone, MessageCircle } from 'lucide-react';
import NotificationsPanel from '../components/NotificationsPanel';
import WhatsAppModal from '../components/WhatsAppModal';

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
  const cargo = user?.role === 'admin' ? 'Administrador' : user?.role === 'assessor' ? 'Assessor' : 'Personal Trainer';
  const backendUrl = process.env.REACT_APP_BACKEND_URL || '';

  const [social, setSocial] = useState({ site: '', instagram: '', whatsapp: '', tiktok: '' });
  const [waModal, setWaModal] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem('gym_social_settings');
    if (saved) setSocial(JSON.parse(saved));
  }, []);

  const socialLinks = [
    { id: 'site', label: 'SITE', icon: Globe, url: social.site },
    { id: 'instagram', label: 'INSTA', icon: Instagram, url: social.instagram },
    { id: 'whatsapp', label: 'WHATS', icon: Phone, url: social.whatsapp ? `https://wa.me/${social.whatsapp.replace(/\D/g, '')}` : '' },
    { id: 'tiktok', label: 'TIKTOK', icon: Smartphone, url: social.tiktok },
  ];

  const filteredNav = nav.filter(item => {
    if (user?.role === 'assessor') {
      return ['Visão Geral', 'Alunas', 'Financeiro', 'Check-in'].includes(item.label);
    }
    return true;
  });

  return (
    <div className="min-h-screen flex">
      {/* Sidebar de Acesso Rápido */}
      <aside className="fixed left-0 top-0 bottom-0 w-[64px] bg-black/40 backdrop-blur-md border-r border-white/5 hidden lg:flex flex-col items-center justify-center z-40 shadow-2xl print:hidden">
        <div className="flex flex-col w-full gap-3">
          {socialLinks.map(link => (
            <a 
              key={link.id}
              href={link.url || '#'} 
              target="_blank" 
              rel="noreferrer" 
              className={`flex flex-col items-center justify-center w-[64px] h-[64px] transition-all duration-300 ${link.url ? 'bg-accent text-white hover:bg-accent/80 hover:scale-[1.02] shadow-lg shadow-accent/20 z-10' : 'bg-white/5 text-white/20 cursor-not-allowed'}`}
              title={link.label}
              onClick={(e) => !link.url && e.preventDefault()}
            >
              <link.icon size={22} className="mb-1" />
              <span className="text-[7px] font-bold uppercase tracking-[0.1em]">
                {link.label}
              </span>
            </a>
          ))}
        </div>
      </aside>

      {/* Main Sidebar */}
      <aside className="w-56 shrink-0 bg-card shadow-lg shadow-black/40 rounded-xl flex flex-col fixed lg:left-[80px] left-4 top-4 bottom-4 z-30 overflow-hidden print:hidden" data-testid="sidebar">
        <div className="flex items-center gap-2 px-5 h-16 border-b border-line">
          <img src="/logo.png" alt="CT Spartan" className="w-8 h-8" />
          <span className="font-display text-2xl uppercase tracking-tight">CT Spartan</span>
        </div>
        <nav className="flex-1 py-4 space-y-0.5">
          {filteredNav.map((item) => (
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
          <button
            onClick={async () => { await logout(); navigate('/login'); }}
            data-testid="logout-button"
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-accent hover:bg-accent/80 text-white rounded-lg transition-all text-xs uppercase tracking-widest font-bold shadow-lg shadow-accent/20"
          >
            <LogOut size={15} aria-hidden="true" /> Sair do Sistema
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:ml-[320px] ml-64 flex flex-col px-6 pt-4">
        <header className="sticky top-4 z-20 h-16 bg-card/90 backdrop-blur-xl shadow-lg shadow-black/40 rounded-xl flex items-center justify-between px-6 gap-4 print:hidden" data-testid="dashboard-header">
          {/* Lado Esquerdo - Espaço reservado (Redes foram para a sidebar lateral) */}
          <div className="hidden md:flex flex-1"></div>

          {/* Centro - Busca */}
          <div className="flex-1 flex justify-center">
            <div className="relative w-full max-w-md">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
              <input
                type="text"
                placeholder="Buscar..."
                data-testid="header-search-input"
                className="w-full bg-surface border border-line rounded-full pl-9 pr-4 py-2 text-sm placeholder-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
              />
            </div>
          </div>

          {/* Lado Direito - Notificações e Perfil */}
          <div className="flex items-center justify-end gap-16 flex-1">
            <NotificationsPanel />
            <div className="flex items-center gap-3" data-testid="header-user-info">
              <div className="text-right leading-tight hidden sm:block">
                <p className="text-[11px] text-muted">
                  {greeting()}, <strong className="text-white font-medium capitalize">{user?.name}</strong>
                </p>
                <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-accent">{cargo}</p>
              </div>
              {user?.avatarUrl ? (
                <img src={`${backendUrl}${user.avatarUrl}`} alt="" className="w-10 h-10 rounded-full object-cover border border-line" data-testid="header-avatar" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center font-display text-lg shrink-0" data-testid="header-avatar">
                  {initials(user?.name)}
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="flex-1 py-8 px-2">{children}</main>
      </div>

      {/* Botões Flutuantes */}
      <div className="fixed bottom-6 right-6 flex items-center gap-4 z-50 print:hidden">
        {(user?.role === 'admin' || user?.role === 'personal') && (
          <button
            onClick={() => navigate(user?.role === 'admin' ? '/admin/montar-treino' : '/personal/treinos')}
            className="h-14 px-6 bg-ok text-white font-bold rounded-xl flex items-center justify-center shadow-2xl shadow-ok/30 hover:scale-105 hover:bg-ok/90 transition-all uppercase tracking-wider text-sm"
          >
            Montar Treino
          </button>
        )}
        <button
          onClick={() => setWaModal(true)}
          className="w-14 h-14 bg-ok text-white rounded-full flex items-center justify-center shadow-2xl shadow-ok/30 hover:scale-110 hover:bg-ok/90 transition-all group"
          title="Disparar Notificações via WhatsApp"
        >
          <MessageCircle size={28} className="group-hover:animate-bounce" />
        </button>
      </div>

      {/* Modal de Disparo */}
      <WhatsAppModal open={waModal} onClose={() => setWaModal(false)} />
    </div>
  );
}
