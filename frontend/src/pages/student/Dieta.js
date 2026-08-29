import React from 'react';
import { Utensils } from 'lucide-react';
import { Empty } from '../../components/ui';

export default function Dieta() {
  return (
    <div className="fade-up" data-testid="student-dieta-page">
      <h1 className="font-display text-3xl uppercase tracking-tight mb-6 text-white">Plano <span className="text-accent">Alimentar</span></h1>
      
      <div className="bg-black/40 backdrop-blur-md shadow-md shadow-black/50 rounded-lg py-8">
        <Empty 
          title="Em breve" 
          text="Seu plano alimentar será disponibilizado aqui pelo seu Personal ou Administrador." 
        />
      </div>
    </div>
  );
}
