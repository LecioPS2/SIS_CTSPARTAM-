import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { DAYS } from '../../lib/api';
import { toast } from 'sonner';
import { Card, Badge, Empty, Modal } from '../../components/ui';
import { CheckCircle2, Flame, Bell, TrendingUp, CreditCard, Utensils, ArrowRight, Dumbbell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Hoje() {
  const { user } = useAuth();
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
  const todayStr = `${today.getDate().toString().padStart(2, '0')} ${(today.toLocaleString('pt-BR', { month: 'short' })).toUpperCase().replace('.', '')} ${today.getFullYear()}.`;
  const firstName = user?.name ? user.name.split(' ')[0] : 'Aluna';

  const scrollToWorkouts = () => {
    document.getElementById('workouts-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div data-testid="student-hoje-page" className="pb-8">
      
      {/* Saudação */}
      <div className="mb-6 fade-up">
        <h1 className="font-display text-4xl font-light">Olá, <strong className="font-bold">{firstName}</strong></h1>
        <p className="text-sm font-medium">Bem-vindo a Dashboard da Aluna.</p>
      </div>

      {/* Card 1: TREINO DO DIA */}
      <div 
        onClick={scrollToWorkouts}
        className="w-full bg-[#202022]/80 backdrop-blur-md rounded-2xl p-5 mb-5 flex items-center justify-between shadow-xl cursor-pointer hover:bg-[#2a2a2c]/80 transition-colors fade-up border border-white/5"
      >
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-full bg-white text-black shadow-lg shrink-0 flex items-center justify-center">
            <Dumbbell size={22} />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-widest text-white/70">Dia, {todayStr}</p>
            <h2 className="text-xl font-bold uppercase tracking-wide text-white leading-tight">TREINO DO DIA</h2>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white">
          COMEÇAR <ArrowRight size={14} />
        </div>
      </div>

      {/* Card 2: EVOLUÇÃO */}
      <Link to="/aluno/evolucao" className="block relative w-full rounded-2xl overflow-hidden mb-5 shadow-xl fade-up" style={{ animationDelay: '0.1s' }}>
        <div className="absolute inset-0 bg-gradient-to-r from-[#1c212a] via-[#1c212a]/90 to-[#2c151a]/60 z-0"></div>
        {/* Placeholder image layer for the kicking woman */}
        <div className="absolute inset-y-0 right-0 w-2/3 bg-cover bg-center opacity-30 mix-blend-overlay z-0" style={{ transform: 'scaleX(-1)', backgroundImage: 'url(/student-bg.png)' }}></div>
        <div className="relative z-10 p-5 pr-16 h-32 flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-bold uppercase tracking-wide text-white">EVOLUÇÃO:</h2>
            <p className="text-sm text-white/90">Acompanhe aqui seu <strong className="font-bold">evolução</strong></p>
          </div>
          <p className="text-xs text-white/70">Veja todas as avaliações.</p>
          <div className="absolute bottom-5 right-5 w-8 h-8 rounded-full bg-[#bd1e2d] flex items-center justify-center text-white shadow-lg">
            <ArrowRight size={16} />
          </div>
        </div>
      </Link>

      {/* Grid: TREINOS e P. ALIMENTAR */}
      <div className="grid grid-cols-2 gap-4 mb-10 fade-up" style={{ animationDelay: '0.2s' }}>
        {/* TREINOS */}
        <div onClick={scrollToWorkouts} className="relative rounded-2xl overflow-hidden shadow-xl h-40 cursor-pointer">
          <div className="absolute inset-0 bg-gradient-to-br from-[#12428c] to-[#0a234f] z-0"></div>
          <div className="absolute inset-0 bg-cover bg-center opacity-20 mix-blend-overlay z-0" style={{ backgroundImage: 'url(/student-bg.png)' }}></div>
          <div className="relative z-10 p-4 h-full flex flex-col justify-between">
            <h2 className="text-lg font-bold uppercase tracking-wide text-white">TREINOS</h2>
            <div className="w-8 h-8 rounded-full bg-[#0a234f]/80 flex items-center justify-center text-white shadow-lg self-end border border-white/10">
              <ArrowRight size={16} />
            </div>
          </div>
        </div>

        {/* P. ALIMENTAR */}
        <Link to="/aluno/dieta" className="relative rounded-2xl overflow-hidden shadow-xl h-40 block">
          <div className="absolute inset-0 bg-gradient-to-br from-[#8c353f] to-[#4a1c22] z-0"></div>
          <div className="absolute inset-0 bg-cover bg-center opacity-20 mix-blend-overlay z-0" style={{ backgroundImage: 'url(/student-bg.png)' }}></div>
          <div className="relative z-10 p-4 h-full flex flex-col justify-between">
            <h2 className="text-lg font-bold uppercase tracking-wide text-white">P. ALIMENTAR</h2>
            <div className="w-8 h-8 rounded-full bg-[#bd1e2d] flex items-center justify-center text-white shadow-lg self-end">
              <ArrowRight size={16} />
            </div>
          </div>
        </Link>
      </div>

      <div id="workouts-section">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-xl uppercase tracking-wide">Workouts</h3>
          <button onClick={() => setAvisosModal(true)} className="flex items-center gap-2 text-xs uppercase tracking-wider text-accent border border-accent/30 rounded px-2 py-1">
            <Bell size={12} /> Avisos
          </button>
        </div>

        {data.todayWorkouts.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-md rounded-2xl text-center py-8 text-white/50 text-sm fade-up border border-white/5">
            Nenhum treino programado para hoje. Dia de descanso! ✌️
          </div>
        ) : (
          <div className="space-y-4">
            {data.todayWorkouts.map((w) => (
              <div key={w.id} className="bg-white/5 backdrop-blur-md border border-white/5 rounded-2xl p-5 fade-up" data-testid={`workout-card-${w.id}`}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="font-display text-2xl uppercase tracking-tight leading-none text-white">{w.name}</h2>
                    <p className="text-xs text-white/50 mt-1">Personal: {w.personalId?.name || '—'}</p>
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
                      <div key={i} className="flex items-center justify-between border-b border-white/10 pb-3 last:border-0">
                        <div>
                          <p className="text-sm font-medium text-white/90">{ex.name}</p>
                          <p className="text-xs text-white/50">{ex.muscleGroup}{ex.notes ? ` • ${ex.notes}` : ''}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-display text-xl leading-none text-white/90">{ex.sets}<span className="text-white/50 text-base">x</span>{ex.reps}</p>
                          <p className="text-[10px] text-white/50">{ex.load ? `${ex.load}kg` : ''}{ex.load && ex.timeSeconds ? ' • ' : ''}{ex.timeSeconds ? `${ex.timeSeconds}s` : ''}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-white/50 text-center py-2">Dia de descanso programado nesta ficha.</p>
                  )}
                </div>
                {!w.completedToday && (
                  <button
                    onClick={() => complete(w.id)}
                    data-testid={`complete-workout-${w.id}`}
                    className="w-full bg-accent hover:bg-accent/90 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-colors duration-200 uppercase tracking-widest text-xs"
                  >
                    <CheckCircle2 size={16} aria-hidden="true" /> Concluir Treino
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {data.allWorkouts.length > 0 && (
          <div className="mt-8">
            <p className="text-xs uppercase tracking-[0.2em] text-white/40 mb-3">Minha ficha completa</p>
            <div className="space-y-2">
              {data.allWorkouts.map((w) => (
                <div key={w.id} className="bg-white/5 backdrop-blur-md rounded-xl p-4 flex items-center justify-between border border-white/5" data-testid={`ficha-item-${w.id}`}>
                  <div>
                    <p className="text-sm font-medium text-white/90">{w.name}</p>
                    <p className="text-xs text-white/50">{w.exercises.length} exercício(s)</p>
                  </div>
                  <div className="flex gap-1">
                    {w.days.sort().map((d) => (
                      <span key={d} className="text-[10px] uppercase px-1.5 py-0.5 bg-white/10 rounded text-white/70">{DAYS[d]}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

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
    </div>
  );
}
