import React from 'react';
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
    <div className={`bg-card border border-line rounded-lg ${className}`} {...props}>
      {children}
    </div>
  );
}

export function StatCard({ label, value, icon: Icon, accent = false, testId }) {
  return (
    <Card className="p-5 fade-up" data-testid={testId}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted mb-2">{label}</p>
          <p className={`font-display text-4xl leading-none ${accent ? 'text-accent' : 'text-white'}`}>{value}</p>
        </div>
        {Icon && <Icon size={20} className="text-muted" aria-hidden="true" />}
      </div>
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
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 backdrop-blur-sm p-4 pt-12" onClick={onClose} data-testid="modal-overlay">
      <div
        className={`bg-card border border-line rounded-lg w-full ${wide ? 'max-w-2xl' : 'max-w-md'} fade-up`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <h3 className="font-display text-2xl tracking-tight uppercase">{title}</h3>
          <button onClick={onClose} className="text-muted hover:text-white transition-colors" data-testid="modal-close-button" aria-label="Fechar">
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
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
