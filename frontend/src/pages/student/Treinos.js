import React, { useEffect, useState } from 'react';
import { Dumbbell, Calendar } from 'lucide-react';
import api from '../../lib/api';
import { Modal } from '../../components/ui';

const DIAS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

export default function Treinos() {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedExercise, setSelectedExercise] = useState(null);
  
  const backendUrl = process.env.NODE_ENV === 'production' ? '' : (process.env.REACT_APP_BACKEND_URL || 'http://localhost:8002');
  const getImageUrl = (url) => {
    if (!url) return null;
    return url.startsWith('/uploads') ? `${backendUrl}/api/files${url.replace('/uploads', '')}` : `${backendUrl}${url}`;
  };

  useEffect(() => {
    api.get('/student/today')
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
                      
                      <div className="space-y-3 mt-4">
                        {w.exercises?.filter(ex => ex.day === undefined || ex.day === dow).map((ex, i) => (
                          <div key={i} className="flex items-center gap-3 border-b border-white/10 pb-3 last:border-0">
                            {ex.exerciseId?.imageUrl && (
                              <img 
                                src={getImageUrl(ex.exerciseId.imageUrl)} 
                                alt="" 
                                className="w-12 h-12 rounded-lg object-cover border border-white/10 shadow-sm cursor-pointer hover:opacity-80 transition-opacity" 
                                onClick={() => setSelectedExercise(ex)}
                              />
                            )}
                            <div className="flex-1">
                              <p className="text-sm font-medium text-white/90">{ex.name}</p>
                              <p className="text-xs text-white/50">{ex.muscleGroup}{ex.notes ? ` • ${ex.notes}` : ''}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-display text-xl leading-none text-white/90">{ex.sets}<span className="text-white/50 text-base mx-1">x</span>{ex.reps}</p>
                              <p className="text-[10px] text-white/50">{ex.load ? `${ex.load}kg` : ''}{ex.load && ex.timeSeconds ? ' • ' : ''}{ex.timeSeconds ? `${ex.timeSeconds}s` : ''}</p>
                            </div>
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

      <Modal open={!!selectedExercise} onClose={() => setSelectedExercise(null)} title={selectedExercise?.name || 'Detalhes'}>
        {selectedExercise && (
          <div className="mt-2 flex flex-col items-center">
            {selectedExercise.exerciseId?.videoUrl ? (
              <video 
                src={getImageUrl(selectedExercise.exerciseId.videoUrl)} 
                controls 
                autoPlay 
                playsInline
                className="w-full max-h-[60vh] rounded-xl shadow-lg border border-white/10 mb-4 object-contain bg-black/50" 
              />
            ) : selectedExercise.exerciseId?.imageUrl ? (
              <img 
                src={getImageUrl(selectedExercise.exerciseId.imageUrl)} 
                alt={selectedExercise.name} 
                className="w-full max-h-[60vh] rounded-xl shadow-lg border border-white/10 mb-4 object-contain" 
              />
            ) : null}
            <div className="w-full flex justify-between items-center text-sm">
              <div className="font-medium text-white/90 uppercase tracking-widest">{selectedExercise.muscleGroup}</div>
              <div className="font-display text-xl text-accent">
                {selectedExercise.sets}<span className="text-white/50 text-base mx-1">x</span>{selectedExercise.reps}
              </div>
            </div>
            {selectedExercise.notes && (
              <div className="w-full mt-3 p-3 bg-white/5 rounded-lg border border-white/10 text-white/70 text-sm">
                <strong className="text-white/90">Dica:</strong> {selectedExercise.notes}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
