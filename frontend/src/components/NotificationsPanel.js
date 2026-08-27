import React, { useEffect, useState, useRef } from 'react';
import api, { brl, fmtDate } from '../lib/api';
import { Bell, AlertTriangle, Clock, X, Megaphone } from 'lucide-react';

export default function NotificationsPanel() {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  const load = () => {
    api.get('/notifications').then((r) => setNotifications(r.data)).catch(() => {});
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 60000); // atualiza a cada 60s
    return () => clearInterval(interval);
  }, []);

  // Fechar ao clicar fora
  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const count = notifications.length;

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative text-muted hover:text-white transition-colors"
        data-testid="header-notifications-button"
        aria-label="Notificações"
        aria-expanded={open}
      >
        <Bell size={18} />
        {count > 0 && (
          <span className="absolute -top-1 -right-1.5 min-w-[18px] h-[18px] bg-accent rounded-full flex items-center justify-center text-[10px] font-bold text-white px-1" aria-hidden="true">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-96 bg-card border border-line rounded-lg shadow-2xl overflow-hidden z-50 fade-up" data-testid="notifications-panel">
          <div className="flex items-center justify-between px-4 py-3 border-b border-line bg-surface/30">
            <h4 className="text-xs uppercase tracking-[0.2em] text-muted font-medium">Notificações / Avisos</h4>
            <button onClick={() => setOpen(false)} className="text-muted hover:text-white transition-colors" aria-label="Fechar">
              <X size={14} />
            </button>
          </div>
          <div className="overflow-y-auto max-h-80">
            {count === 0 ? (
              <p className="text-sm text-muted text-center py-8">Nenhuma notificação</p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className="flex items-start gap-3 px-4 py-3 border-b border-line/50 last:border-0 hover:bg-surface transition-colors"
                  data-testid={`notification-${n.id}`}
                >
                  <div className={`mt-0.5 shrink-0 ${n.type === 'aviso' ? 'text-blue-400' : n.type === 'atrasado' ? 'text-accent' : 'text-yellow-400'}`}>
                    {n.type === 'aviso' ? <Megaphone size={16} /> : n.type === 'atrasado' ? <AlertTriangle size={16} /> : <Clock size={16} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    {n.type === 'aviso' ? (
                      <>
                        <p className="text-sm font-semibold leading-snug text-white/90">{n.title}</p>
                        <p className="text-xs text-muted mt-1 leading-relaxed">{n.message}</p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm leading-snug text-white/80">{n.message}</p>
                        <p className="text-xs text-muted mt-1">
                          Venc. {fmtDate(n.dueDate)} — {brl(n.amount)}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
