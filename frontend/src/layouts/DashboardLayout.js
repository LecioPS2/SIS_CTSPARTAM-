import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Search, Globe, Instagram, Phone, Smartphone, MessageCircle, Menu, X } from 'lucide-react';
import NotificationsPanel from '../components/NotificationsPanel';
import WhatsAppModal from '../components/WhatsAppModal';
import { useSearch } from '../context/SearchContext';

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

  const { searchTerm, setSearchTerm } = useSearch();

  const [social, setSocial] = useState({ site: '', instagram: '', whatsapp: '', tiktok: '' });
  const [waModal, setWaModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
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

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-30 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Sidebar */}
      <aside className={`w-64 shrink-0 bg-card shadow-lg shadow-black/40 rounded-xl flex flex-col fixed lg:left-[80px] top-4 bottom-4 z-40 overflow-hidden print:hidden transition-transform duration-300 ${mobileMenuOpen ? 'left-4 translate-x-0' : '-translate-x-[150%] lg:translate-x-0'}`} data-testid="sidebar">
        <div className="flex items-center justify-between px-5 h-16 border-b border-line">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="CT Spartan" className="w-8 h-8" />
            <span className="font-display text-2xl uppercase tracking-tight">CT Spartan</span>
          </div>
          <button className="lg:hidden text-muted hover:text-white" onClick={() => setMobileMenuOpen(false)}>
            <X size={20} />
          </button>
        </div>
        <nav className="flex-1 py-4 space-y-0.5 overflow-y-auto custom-scrollbar">
          {filteredNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setMobileMenuOpen(false)}
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
      <div className="flex-1 lg:ml-[350px] ml-0 flex flex-col px-4 lg:px-6 pt-4 w-full min-w-0 transition-all duration-300">
        <header className="sticky top-4 z-20 h-16 bg-card/90 backdrop-blur-xl shadow-lg shadow-black/40 rounded-xl flex items-center justify-between px-4 lg:px-6 gap-3 print:hidden" data-testid="dashboard-header">
          {/* Hamburger Menu (Mobile) */}
          <button 
            className="lg:hidden p-2 -ml-2 text-white/70 hover:text-white"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu size={24} />
          </button>

          {/* Lado Esquerdo - Espaço reservado */}
          <div className="hidden md:flex flex-1"></div>

          {/* Centro - Busca */}
          <div className="flex-1 flex justify-center">
            <div className="relative w-full max-w-md hidden sm:block">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
              <input
                type="text"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="header-search-input"
                className="w-full bg-surface border border-line rounded-full pl-9 pr-4 py-2 text-sm placeholder-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
              />
            </div>
            {/* Search Icon for Mobile (opens search modal or just expands? We'll just leave it for now or make it simple) */}
            <div className="relative w-full sm:hidden">
              <input
                type="text"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-surface border border-line rounded-full px-4 py-2 text-sm placeholder-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
              />
            </div>
          </div>

          {/* Lado Direito - Notificações e Perfil */}
          <div className="flex items-center justify-end gap-3 lg:gap-16 flex-1">
            <NotificationsPanel />
            <div className="flex items-center gap-3" data-testid="header-user-info">
              <div className="text-right leading-tight hidden sm:block">
                <p className="text-[11px] text-muted">
                  {greeting()}, <strong className="text-white font-medium capitalize">{user?.name}</strong>
                </p>
                <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-accent">{cargo}</p>
              </div>
              {user?.avatarUrl ? (
                <img src={`${backendUrl}${user.avatarUrl}`} alt="" className="w-8 h-8 lg:w-10 lg:h-10 rounded-full object-cover border border-line" data-testid="header-avatar" />
              ) : (
                <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-accent flex items-center justify-center font-display text-sm lg:text-lg shrink-0" data-testid="header-avatar">
                  {initials(user?.name)}
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="flex-1 py-6 lg:py-8 px-1 lg:px-2 min-w-0">{children}</main>
      </div>

      {/* Botões Flutuantes */}
      <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 flex items-center gap-2 md:gap-4 z-50 print:hidden">
        {(user?.role === 'admin' || user?.role === 'personal') && (
          <button
            onClick={() => navigate(user?.role === 'admin' ? '/admin/montar-treino' : '/personal/treinos')}
            className="h-12 px-4 md:h-14 md:px-6 bg-ok text-white font-bold rounded-xl flex items-center justify-center shadow-2xl shadow-ok/30 hover:scale-105 hover:bg-ok/90 transition-all uppercase tracking-wider text-xs md:text-sm"
          >
            Montar Treino
          </button>
        )}
        <button
          onClick={() => setWaModal(true)}
          className="w-12 h-12 md:w-14 md:h-14 bg-ok text-white rounded-full flex items-center justify-center shadow-2xl shadow-ok/30 hover:scale-110 hover:bg-ok/90 transition-all group"
          title="Disparar Notificações via WhatsApp"
        >
          <MessageCircle size={24} className="group-hover:animate-bounce" />
        </button>
      </div>

      {/* Modal de Disparo */}
      <WhatsAppModal open={waModal} onClose={() => setWaModal(false)} />
    </div>
  );
}
