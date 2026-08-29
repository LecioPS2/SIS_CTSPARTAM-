import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { DAYS } from '../../lib/api';
import { toast } from 'sonner';
import { Card, Badge, Empty, Modal } from '../../components/ui';
import { CheckCircle2, Flame, Bell, TrendingUp, CreditCard, Utensils } from 'lucide-react';

const BANNER = 'https://images.pexels.com/photos/35540076/pexels-photo-35540076.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940';

export default function Hoje() {
  const [data, setData] = useState(null);
  const [avisosModal, setAvisosModal] = useState(false);
  const [avisos, setAvisos] = useState([]);

  const load = () => {
    api.get('/student/today').then((r) => setData(r.data)).catch(() => setData({ todayWorkouts: [], allWorkouts: [] }));
    api.get('/notifications').then((r) => setAvisos(r.data)).catch(() => setAvisos([]));
  };
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

      <div className="grid grid-cols-3 gap-3 mb-6 fade-up" style={{ animationDelay: '0.1s' }}>
        <button onClick={() => setAvisosModal(true)} className="bg-black/40 backdrop-blur-md shadow-md shadow-black/50 rounded-lg p-3 flex flex-col items-center justify-center gap-2 hover:border-accent transition-colors">
          <div className="w-10 h-10 rounded-full bg-accent/20 text-accent flex items-center justify-center">
            <Bell size={20} />
          </div>
          <span className="text-[10px] uppercase font-bold tracking-wider">Avisos</span>
        </button>

        <Link to="/aluno/evolucao" className="bg-black/40 backdrop-blur-md shadow-md shadow-black/50 rounded-lg p-3 flex flex-col items-center justify-center gap-2 hover:border-accent transition-colors">
          <div className="w-10 h-10 rounded-full bg-accent/20 text-accent flex items-center justify-center">
            <TrendingUp size={20} />
          </div>
          <span className="text-[10px] uppercase font-bold tracking-wider">Evolução</span>
        </Link>

        <Link to="/aluno/mensalidade" className="bg-black/40 backdrop-blur-md shadow-md shadow-black/50 rounded-lg p-3 flex flex-col items-center justify-center gap-2 hover:border-accent transition-colors">
          <div className="w-10 h-10 rounded-full bg-accent/20 text-accent flex items-center justify-center">
            <CreditCard size={20} />
          </div>
          <span className="text-[10px] uppercase font-bold tracking-wider">Mensalidade</span>
        </Link>
      </div>

      <Link to="/aluno/dieta" className="bg-black/40 backdrop-blur-md shadow-md shadow-black/50 rounded-lg p-4 flex items-center gap-4 hover:border-accent transition-colors mb-6 fade-up" style={{ animationDelay: '0.2s' }}>
        <div className="w-12 h-12 rounded-full bg-accent/20 text-accent flex items-center justify-center shrink-0">
          <Utensils size={24} />
        </div>
        <div>
          <h3 className="font-display text-lg tracking-wide uppercase text-white">Plano Alimentar</h3>
          <p className="text-xs text-muted">Acesse sua dieta e recomendações</p>
        </div>
      </Link>

      <Modal open={avisosModal} onClose={() => setAvisosModal(false)} title="Mural de Avisos">
        <div className="space-y-3 mt-4">
          {avisos.length === 0 ? (
            <p className="text-sm text-muted text-center py-4 border border-dashed border-line rounded-lg">Nenhum aviso no momento.</p>
          ) : (
            avisos.map(a => (
              <div key={a.id} className="p-4 rounded-lg border border-accent/20 bg-accent/5">
                <div className="flex items-center gap-2 mb-2">
                  <Bell size={16} className="text-accent" />
                  <h4 className="font-bold text-white text-sm">{a.title}</h4>
                </div>
                <p className="text-sm text-muted whitespace-pre-wrap">{a.content}</p>
                <p className="text-[10px] text-muted mt-3 uppercase tracking-wider">Publicado em {new Date(a.createdAt).toLocaleDateString('pt-BR')}</p>
              </div>
            ))
          )}
        </div>
      </Modal>

      {data.todayWorkouts.length === 0 ? (
        <div className="bg-black/40 backdrop-blur-md shadow-md shadow-black/50 rounded-lg text-center py-12 text-muted text-sm fade-up">
          Nenhum treino programado para hoje. Dia de descanso! 💤
        </div>
      ) : (
        <div className="space-y-4">
          {data.todayWorkouts.map((w) => (
            <div key={w.id} className="bg-black/40 backdrop-blur-md shadow-md shadow-black/50 rounded-lg p-5 fade-up" data-testid={`workout-card-${w.id}`}>
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
            </div>
          ))}
        </div>
      )}

      {data.allWorkouts.length > 0 && (
        <div className="mt-8">
          <p className="text-xs uppercase tracking-[0.2em] text-muted mb-3">Minha ficha completa</p>
          <div className="space-y-2">
            {data.allWorkouts.map((w) => (
              <div key={w.id} className="bg-black/40 backdrop-blur-md shadow-md shadow-black/50 rounded-lg p-4 flex items-center justify-between" data-testid={`ficha-item-${w.id}`}>
                <div>
                  <p className="text-sm font-medium">{w.name}</p>
                  <p className="text-xs text-muted">{w.exercises.length} exercício(s)</p>
                </div>
                <div className="flex gap-1">
                  {w.days.sort().map((d) => (
                    <span key={d} className="text-[10px] uppercase px-1.5 py-0.5 bg-white/10 border border-white/5 rounded text-white">{DAYS[d]}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
