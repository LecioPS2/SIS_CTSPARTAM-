import React from 'react';
import ReactDOM from 'react-dom';
import { X } from 'lucide-react';

export function Button({ children, variant = 'primary', className = '', ...props }) {
  const styles = {
    primary: 'bg-accent hover:bg-accenth text-white',
    ghost: 'bg-transparent hover:bg-surface text-muted hover:text-white border border-line',
    danger: 'bg-transparent hover:bg-accent/10 text-accent border border-accent/40',
    ok: 'bg-ok hover:bg-ok/90 text-black',
  };
  return (
    <button
      className={`px-4 py-2 text-sm font-medium rounded transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Input({ className = '', ...props }) {
  return (
    <input
      className={`w-full bg-surface border border-line rounded px-3 py-2 text-sm text-white placeholder-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors ${className}`}
      {...props}
    />
  );
}

export function Textarea({ className = '', ...props }) {
  return (
    <textarea
      rows={3}
      className={`w-full bg-surface border border-line rounded px-3 py-2 text-sm text-white placeholder-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors resize-y ${className}`}
      {...props}
    />
  );
}

export function Select({ className = '', children, ...props }) {
  return (
    <select
      className={`w-full bg-surface border border-line rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

export function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs uppercase tracking-[0.2em] text-muted">{label}</label>
      {children}
    </div>
  );
}

export function Card({ children, className = '', ...props }) {
  return (
    <div className={`bg-card shadow-lg shadow-black/40 rounded-lg ${className}`} {...props}>
      {children}
    </div>
  );
}

export function StatCard({ label, value, icon: Icon, accent = false, testId }) {
  let colorClass = 'border-l-blue-500 from-blue-500/10 to-transparent';
  let iconClass = 'text-blue-500/50';

  if (accent) { // Receita
    colorClass = 'border-l-ok from-ok/10 to-transparent';
    iconClass = 'text-ok/50';
  } else if (label.includes('Pendências')) {
    colorClass = 'border-l-accent from-accent/10 to-transparent';
    iconClass = 'text-accent/50';
  } else if (label.includes('Personais')) {
    colorClass = 'border-l-purple-500 from-purple-500/10 to-transparent';
    iconClass = 'text-purple-500/50';
  }

  return (
    <Card className={`p-5 fade-up flex items-center justify-between border-l-4 bg-gradient-to-r ${colorClass}`} data-testid={testId}>
      <div>
        <p className="text-xs uppercase tracking-widest text-muted font-semibold mb-1">{label}</p>
        <p className="font-display text-4xl text-white">{value}</p>
      </div>
      {Icon && <Icon size={32} className={iconClass} aria-hidden="true" />}
    </Card>
  );
}

export function Badge({ children, tone = 'muted' }) {
  const tones = {
    ok: 'bg-ok/10 text-ok border-ok/30',
    warn: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
    danger: 'bg-accent/10 text-accent border-accent/30',
    muted: 'bg-surface text-muted border-line',
  };
  return (
    <span className={`inline-block px-2 py-0.5 text-xs uppercase tracking-wider border rounded ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function Modal({ open, onClose, title, children, wide = false }) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose} data-testid="modal-overlay">
      <div
        className={`bg-[#1c1c1e]/80 backdrop-blur-2xl border border-white/10 rounded-2xl w-full max-h-[90vh] flex flex-col shadow-2xl shadow-black/80 ${wide ? 'max-w-2xl' : 'max-w-md'} fade-up`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
          <h3 className="font-display text-2xl tracking-tight uppercase">{title}</h3>
          <button onClick={onClose} className="text-muted hover:text-white transition-colors" data-testid="modal-close-button" aria-label="Fechar">
            <X size={18} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>,
    document.body
  );
}

export function Th({ children }) {
  return <th className="text-left text-xs uppercase tracking-[0.15em] text-muted font-medium px-4 py-3">{children}</th>;
}

export function Td({ children, className = '' }) {
  return <td className={`px-4 py-3 text-sm border-t border-line ${className}`}>{children}</td>;
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-end justify-between mb-6 fade-up">
      <div>
        <h1 className="font-display text-4xl sm:text-5xl uppercase tracking-tight leading-none">{title}</h1>
        {subtitle && <p className="text-muted text-sm mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Empty({ text }) {
  return <div className="text-center py-12 text-muted text-sm border border-dashed border-line rounded-lg">{text}</div>;
}
