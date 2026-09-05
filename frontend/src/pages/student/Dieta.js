import React, { useEffect, useState } from 'react';
import { Utensils, Droplets, Info } from 'lucide-react';
import { Empty, Card } from '../../components/ui';
import api from '../../lib/api';

export default function Dieta() {
  const [diet, setDiet] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/diets/my-diet')
      .then(r => setDiet(r.data))
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-muted">Carregando plano...</div>;
  }

  if (!diet) {
    return (
      <div className="fade-up" data-testid="student-dieta-page">
        <h1 className="font-display text-3xl uppercase tracking-tight mb-6 text-white">Plano <span className="text-accent">Alimentar</span></h1>
        <div className="bg-white/10 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.2)] rounded-3xl p-8">
          <Empty 
            title="Nenhum plano" 
            text="Seu plano alimentar será disponibilizado aqui pelo seu Personal ou Administrador." 
          />
        </div>
      </div>
    );
  }

  return (
    <div className="fade-up pb-8" data-testid="student-dieta-page">
      <h1 className="font-display text-3xl uppercase tracking-tight mb-2 text-white">
        Plano <span className="text-accent">Alimentar</span>
      </h1>
      
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h2 className="text-lg font-bold text-white">{diet.title}</h2>
          {diet.goal && <p className="text-xs text-muted uppercase tracking-wider">Objetivo: {diet.goal}</p>}
        </div>
        <div className="text-[10px] text-muted">Atualizado: {new Date(diet.updatedAt).toLocaleDateString('pt-BR')}</div>
      </div>

      {diet.notes && (
        <div className="bg-white/10 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.2)] border-l-4 border-accent rounded-r-3xl p-5 mb-6 text-sm text-white/90">
          <div className="flex gap-2 items-center mb-1 text-accent font-bold uppercase text-xs tracking-wider">
            <Info size={16} /> Recomendações Gerais
          </div>
          <p className="whitespace-pre-wrap leading-relaxed">{diet.notes}</p>
        </div>
      )}

      <div className="space-y-4">
        {diet.meals?.map((meal, idx) => (
          <div key={idx} className="bg-white/10 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.2)] rounded-3xl p-6 relative overflow-hidden" style={{ animationDelay: `0.${idx + 2}s` }}>
            <div className="absolute top-0 left-0 w-1.5 h-full bg-accent"></div>
            
            <div className="flex justify-between items-center mb-5 border-b border-white/10 pb-4">
              <h3 className="font-display text-xl text-white uppercase tracking-tight">{meal.name}</h3>
              {meal.time && (
                <span className="bg-white/10 text-white px-3 py-1 rounded-full text-xs font-bold font-mono">
                  {meal.time}
                </span>
              )}
            </div>

            <ul className="space-y-2">
              {meal.items?.map((item, iIdx) => (
                <li key={iIdx} className="flex justify-between items-center py-2">
                  <span className="text-[13px] font-medium text-white/90 uppercase tracking-wide">{item.food}</span>
                  <span className="text-xs text-accent font-bold uppercase">{item.quantity}</span>
                </li>
              ))}
              {(!meal.items || meal.items.length === 0) && (
                <li className="text-xs text-muted">Nenhum alimento cadastrado</li>
              )}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
