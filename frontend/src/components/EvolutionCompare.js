import React from 'react';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';

const FIELDS = [
  ['weight', 'Peso', 'kg'],
  ['chest', 'Peito', 'cm'],
  ['waist', 'Cintura', 'cm'],
  ['hip', 'Quadril', 'cm'],
  ['arm', 'Braço', 'cm'],
  ['thigh', 'Coxa', 'cm'],
];

export default function EvolutionCompare({ history }) {
  const rows = FIELDS.map(([key, label, unit]) => {
    const withValue = history.filter((m) => m[key] != null);
    if (withValue.length < 2) return null;
    const first = withValue[0][key];
    const last = withValue[withValue.length - 1][key];
    const delta = Math.round((last - first) * 10) / 10;
    return { key, label, unit, first, last, delta };
  }).filter(Boolean);

  if (rows.length === 0) return null;

  return (
    <div className="bg-surface border border-line rounded-lg p-4 fade-up" data-testid="evolution-compare-card">
      <p className="text-xs uppercase tracking-[0.2em] text-muted mb-3">Comparativo — primeira vs última avaliação</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {rows.map((r) => (
          <div key={r.key} className="border border-line rounded p-3" data-testid={`compare-${r.key}`}>
            <p className="text-[10px] uppercase tracking-[0.15em] text-muted mb-1">{r.label}</p>
            <p className="text-sm text-muted">{r.first}{r.unit} <span className="text-white">→ {r.last}{r.unit}</span></p>
            <p className={`flex items-center gap-1 font-display text-2xl leading-none mt-1 ${r.delta < 0 ? 'text-ok' : r.delta > 0 ? 'text-accent' : 'text-muted'}`}>
              {r.delta < 0 ? <TrendingDown size={16} aria-hidden="true" /> : r.delta > 0 ? <TrendingUp size={16} aria-hidden="true" /> : <Minus size={16} aria-hidden="true" />}
              {r.delta > 0 ? '+' : ''}{r.delta}{r.unit}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
