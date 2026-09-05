import React, { useEffect, useState } from 'react';
import { Dumbbell, Calendar } from 'lucide-react';
import api from '../../lib/api';

const DIAS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

export default function Treinos() {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/student/dashboard')
      .then(r => setWorkouts(r.data.allWorkouts || []))
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-white/50">Carregando treinos...</div>;
  }

  return (
    <div className="fade-up pb-8" data-testid="student-treinos-page">
      <h1 className="font-display text-3xl uppercase tracking-tight mb-6 text-white">
        Treinos da <span className="text-accent">Semana</span>
      </h1>

      {workouts.length === 0 ? (
        <div className="bg-white/5 backdrop-blur-md rounded-2xl text-center py-8 text-white/50 text-sm border border-white/5">
          Nenhum treino cadastrado.
        </div>
      ) : (
        <div className="space-y-6">
          {DIAS.map((dia, dow) => {
            const treinosDoDia = workouts.filter(w => w.days && w.days.includes(dow));
            
            if (treinosDoDia.length === 0) return null; // Não mostra dias sem treino
            
            return (
              <div key={dow} className="bg-white/5 backdrop-blur-md border border-white/5 rounded-2xl p-5 fade-up" style={{ animationDelay: `0.${dow + 1}s` }}>
                <div className="flex items-center gap-2 mb-4 border-b border-white/10 pb-3">
                  <Calendar size={18} className="text-accent" />
                  <h2 className="font-display text-xl uppercase tracking-tight text-white">{dia}</h2>
                </div>
                
                <div className="space-y-4">
                  {treinosDoDia.map(w => (
                    <div key={w._id} className="bg-black/30 rounded-xl p-4">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-bold uppercase tracking-wide text-white text-sm">{w.name}</h3>
                        <div className="bg-accent/20 text-accent text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
                          {w.exercises?.length || 0} Exercícios
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        {w.exercises?.filter(ex => ex.day === undefined || ex.day === dow).map((ex, i) => (
                          <div key={i} className="flex items-center justify-between text-xs text-white/70 border-b border-white/5 pb-2 last:border-0 last:pb-0">
                            <span>{ex.name}</span>
                            <span className="font-mono text-white/90">
                              {ex.sets}x {ex.reps} {ex.weight ? `(${ex.weight})` : ''}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
