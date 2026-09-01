import React from 'react';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';

const FIELDS = [
  ['weight', 'Peso', 'kg'],
  ['bodyFat', 'Gordura', '%'],
  ['muscleMass', 'Massa Magra', 'kg'],
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
    const pct = first > 0 ? Math.round((delta / first) * 1000) / 10 : 0;
    
    return { key, label, unit, first, last, delta, pct };
  }).filter(Boolean);

  if (rows.length === 0) return null;

  return (
    <div className="bg-surface border border-line rounded-lg p-4 fade-up" data-testid="evolution-compare-card">
      <p className="text-xs uppercase tracking-[0.2em] text-muted mb-3">Progresso Acumulado</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {rows.map((r) => {
          // For weight and body fat, down is good (ok), up is bad (accent)
          // For muscle mass, up is good (ok), down is bad (accent)
          let colorClass = 'text-muted';
          if (r.delta !== 0) {
            const isLossGood = ['weight', 'bodyFat', 'waist'].includes(r.key);
            if (isLossGood) {
              colorClass = r.delta < 0 ? 'text-ok' : 'text-accent';
            } else {
              colorClass = r.delta > 0 ? 'text-ok' : 'text-accent';
            }
          }

          return (
            <div key={r.key} className="border border-line rounded p-3" data-testid={compare- + r.key}>
              <p className="text-[10px] uppercase tracking-[0.15em] text-muted mb-1">{r.label}</p>
              <p className="text-sm text-muted">{r.first}{r.unit} <span className="text-white">→ {r.last}{r.unit}</span></p>
              
              <div className="flex items-center justify-between mt-2">
                <p className={lex items-center gap-1 font-display text-xl leading-none \}>
                  {r.delta < 0 ? <TrendingDown size={16} /> : r.delta > 0 ? <TrendingUp size={16} /> : <Minus size={16} />}
                  {r.delta > 0 ? '+' : ''}{r.delta}{r.unit}
                </p>
                {r.pct !== 0 && (
                  <span className={	ext-xs font-bold px-1.5 py-0.5 rounded \}>
                    {r.pct > 0 ? '+' : ''}{r.pct}%
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
