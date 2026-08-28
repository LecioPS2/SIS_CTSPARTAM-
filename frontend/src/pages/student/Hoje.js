import React, { useEffect, useState } from 'react';
import api, { DAYS } from '../../lib/api';
import { toast } from 'sonner';
import { Card, Badge, Empty } from '../../components/ui';
import { CheckCircle2, Flame } from 'lucide-react';

const BANNER = 'https://images.pexels.com/photos/35540076/pexels-photo-35540076.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940';

export default function Hoje() {
  const [data, setData] = useState(null);

  const load = () => api.get('/student/today').then((r) => setData(r.data)).catch(() => setData({ todayWorkouts: [], allWorkouts: [] }));
  useEffect(() => { load(); }, []);

  const complete = async (id) => {
    try {
      await api.post(`/student/complete/${id}`);
      toast.success('Treino concluído! 🔥 Bom trabalho!');
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao concluir');
    }
  };

  if (!data) return <p className="text-muted">Carregando...</p>;

  const today = new Date();

  return (
    <div data-testid="student-hoje-page">
      <div className="relative rounded-lg overflow-hidden mb-6 fade-up">
        <img src={BANNER} alt="Treino do dia" className="w-full h-40 object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-black/20" />
        <div className="absolute bottom-4 left-4">
          <p className="text-xs uppercase tracking-[0.2em] text-muted">{DAYS[today.getDay()]} · {today.toLocaleDateString('pt-BR')}</p>
          <h1 className="font-display text-4xl uppercase tracking-tight leading-none">Treino de <span className="text-accent">Hoje</span></h1>
        </div>
      </div>

      {data.todayWorkouts.length === 0 ? (
        <Empty text="Nenhum treino programado para hoje. Dia de descanso! 💤" />
      ) : (
        <div className="space-y-4">
          {data.todayWorkouts.map((w) => (
            <Card key={w.id} className="p-5 fade-up" data-testid={`workout-card-${w.id}`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="font-display text-3xl uppercase tracking-tight leading-none">{w.name}</h2>
                  <p className="text-xs text-muted mt-1">Personal: {w.personalId?.name || '—'}</p>
                </div>
                {w.completedToday ? (
                  <Badge tone="ok">Concluído</Badge>
                ) : (
                  <Flame size={20} className="text-accent" aria-hidden="true" />
                )}
              </div>
              <div className="space-y-3 mb-5">
                {w.exercises.filter(ex => ex.day === undefined || ex.day === today.getDay()).length > 0 ? (
                  w.exercises.filter(ex => ex.day === undefined || ex.day === today.getDay()).map((ex, i) => (
                    <div key={i} className="flex items-center justify-between border-b border-line pb-3 last:border-0">
                      <div>
                        <p className="text-sm font-medium">{ex.name}</p>
                        <p className="text-xs text-muted">{ex.muscleGroup}{ex.notes ? ` · ${ex.notes}` : ''}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-display text-2xl leading-none">{ex.sets}<span className="text-muted text-lg">x</span>{ex.reps}</p>
                        <p className="text-xs text-muted">{ex.load ? `${ex.load}kg` : ''}{ex.load && ex.timeSeconds ? ' · ' : ''}{ex.timeSeconds ? `${ex.timeSeconds}s` : ''}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted text-center py-2">Dia de descanso programado nesta ficha.</p>
                )}
              </div>
              {!w.completedToday && (
                <button
                  onClick={() => complete(w.id)}
                  data-testid={`complete-workout-${w.id}`}
                  className="w-full bg-accent hover:bg-accenth text-white font-medium py-3 rounded flex items-center justify-center gap-2 transition-colors duration-200"
                >
                  <CheckCircle2 size={18} aria-hidden="true" /> Concluir Treino
                </button>
              )}
            </Card>
          ))}
        </div>
      )}

      {data.allWorkouts.length > 0 && (
        <div className="mt-8">
          <p className="text-xs uppercase tracking-[0.2em] text-muted mb-3">Minha ficha completa</p>
          <div className="space-y-2">
            {data.allWorkouts.map((w) => (
              <Card key={w.id} className="p-4 flex items-center justify-between" data-testid={`ficha-item-${w.id}`}>
                <div>
                  <p className="text-sm font-medium">{w.name}</p>
                  <p className="text-xs text-muted">{w.exercises.length} exercício(s)</p>
                </div>
                <div className="flex gap-1">
                  {w.days.sort().map((d) => (
                    <span key={d} className="text-[10px] uppercase px-1.5 py-0.5 bg-surface border border-line rounded text-muted">{DAYS[d]}</span>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
