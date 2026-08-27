import React, { useEffect, useState } from 'react';
import api, { fmtDate } from '../../lib/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card, PageHeader, Empty } from '../../components/ui';
import { LogOut, Target, Phone, Mail } from 'lucide-react';

export default function Perfil() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);

  useEffect(() => {
    api.get('/student/history').then((r) => setHistory(r.data)).catch(() => {});
  }, []);

  return (
    <div data-testid="student-perfil-page">
      <PageHeader title="Perfil" subtitle="Seus dados e histórico de treinos" />
      <Card className="p-5 mb-6 fade-up" data-testid="perfil-info-card">
        <h2 className="font-display text-3xl uppercase tracking-tight leading-none mb-4">{user?.name}</h2>
        <div className="space-y-2 text-sm">
          <p className="flex items-center gap-2 text-muted"><Mail size={14} aria-hidden="true" /> {user?.email}</p>
          {user?.phone && <p className="flex items-center gap-2 text-muted"><Phone size={14} aria-hidden="true" /> {user.phone}</p>}
          {user?.goal && <p className="flex items-center gap-2 text-muted"><Target size={14} aria-hidden="true" /> Objetivo: <span className="text-white">{user.goal}</span></p>}
        </div>
      </Card>
      <p className="text-xs uppercase tracking-[0.2em] text-muted mb-3">Treinos concluídos ({history.length})</p>
      {history.length === 0 ? (
        <Empty text="Nenhum treino concluído ainda. Bora treinar! 💪" />
      ) : (
        <div className="space-y-2 mb-8">
          {history.map((h) => (
            <Card key={h.id} className="p-4 flex items-center justify-between" data-testid={`historico-item-${h.id}`}>
              <p className="text-sm font-medium">{h.workoutId?.name || 'Treino'}</p>
              <p className="text-xs text-muted">{fmtDate(h.date)}</p>
            </Card>
          ))}
        </div>
      )}
      <button
        onClick={async () => { await logout(); navigate('/login'); }}
        data-testid="student-logout-button"
        className="w-full border border-accent/40 text-accent hover:bg-accent/10 font-medium py-3 rounded flex items-center justify-center gap-2 transition-colors duration-200 mt-6"
      >
        <LogOut size={16} aria-hidden="true" /> Sair da conta
      </button>
    </div>
  );
}
