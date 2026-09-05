import React, { useEffect, useState, useRef } from 'react';
import api, { fmtDate } from '../../lib/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card, PageHeader, Empty, Button, Modal } from '../../components/ui';
import { LogOut, Target, Phone, Mail, Camera, CalendarCheck } from 'lucide-react';
import QRCodeAluna from '../../components/QRCodeAluna';

export default function Perfil() {
  const { user, logout, login } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [checkinHistory, setCheckinHistory] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  const [editModal, setEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone: '', birthDate: '', password: '' });
  const backendUrl = process.env.NODE_ENV === 'production' ? '' : (process.env.REACT_APP_BACKEND_URL || 'http://localhost:8002');

  const getImageUrl = (url) => {
    if (!url) return null;
    return url.startsWith('/uploads') ? `${backendUrl}/api/files${url.replace('/uploads', '')}` : `${backendUrl}${url}`;
  };

  useEffect(() => {
    api.get('/student/history').then((r) => setHistory(r.data)).catch(() => {});
    api.get('/checkin/history').then((r) => setCheckinHistory(r.data)).catch(() => {});
  }, []);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    setUploading(true);
    try {
      const res = await api.post('/uploads/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      // Atualizar o contexto com a nova URL
      const meRes = await api.get('/auth/me');
      if (meRes.data) {
        localStorage.setItem('user', JSON.stringify(meRes.data));
        window.location.reload();
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao enviar foto');
    } finally {
      setUploading(false);
    }
  };

  const openEditModal = () => {
    setEditForm({
      name: user?.name || '',
      phone: user?.phone || '',
      birthDate: user?.birthDate ? user.birthDate.substring(0, 10) : '',
      password: ''
    });
    setEditModal(true);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...editForm };
      if (!payload.password) delete payload.password;
      await api.put('/student/profile', payload);
      const meRes = await api.get('/auth/me');
      if (meRes.data) {
        localStorage.setItem('user', JSON.stringify(meRes.data));
        window.location.reload();
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao salvar perfil');
    }
  };

  return (
    <div data-testid="student-perfil-page">
      <PageHeader title="Perfil" subtitle="Seus dados e histórico de treinos" />

      {/* Info + Avatar */}
      <Card className="p-5 mb-6 fade-up" data-testid="perfil-info-card">
        <div className="flex items-start gap-4">
          <div className="relative group shrink-0">
            {user?.avatarUrl ? (
              <img src={getImageUrl(user.avatarUrl)} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-line" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center font-display text-2xl">
                {user?.name?.[0]?.toUpperCase() || '?'}
              </div>
            )}
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              data-testid="avatar-upload-button"
              disabled={uploading}
            >
              <Camera size={18} className="text-white" />
            </button>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarUpload} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-4">
              <h2 className="font-display text-3xl uppercase tracking-tight leading-none">{user?.name}</h2>
              <button onClick={openEditModal} className="text-xs uppercase tracking-wider text-accent border border-accent/30 rounded px-2 py-1">Editar</button>
            </div>
            <div className="space-y-2 text-sm">
              <p className="flex items-center gap-2 text-muted"><Mail size={14} aria-hidden="true" /> {user?.email}</p>
              {user?.phone && <p className="flex items-center gap-2 text-muted"><Phone size={14} aria-hidden="true" /> {user.phone}</p>}
              {user?.goal && <p className="flex items-center gap-2 text-muted"><Target size={14} aria-hidden="true" /> Objetivo: <span className="text-white">{user.goal}</span></p>}
            </div>
          </div>
        </div>
      </Card>

      {/* QR Code Check-in */}
      <div className="mb-6">
        <QRCodeAluna />
      </div>

      {/* Check-in History */}
      {checkinHistory.length > 0 && (
        <>
          <p className="text-xs uppercase tracking-[0.2em] text-muted mb-3">
            <CalendarCheck size={12} className="inline mr-1" />Check-ins recentes ({checkinHistory.length})
          </p>
          <div className="space-y-2 mb-6">
            {checkinHistory.slice(0, 10).map((c) => (
              <Card key={c.id} className="p-4 flex items-center justify-between" data-testid={`checkin-hist-${c.id}`}>
                <p className="text-sm font-medium">{fmtDate(c.date)}</p>
                <p className="text-xs text-muted">{c.time} · {c.method === 'qrcode' ? 'QR Code' : 'Manual'}</p>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Treinos Concluídos */}
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

      <Modal open={editModal} onClose={() => setEditModal(false)} title="Editar Perfil">
        <form onSubmit={handleSaveProfile} className="space-y-4 mt-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-muted mb-1">Nome Completo</label>
            <input
              type="text"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              className="w-full bg-surface border border-line rounded-lg px-4 py-3 text-white"
              required
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-muted mb-1">Telefone / WhatsApp</label>
            <input
              type="text"
              value={editForm.phone}
              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              className="w-full bg-surface border border-line rounded-lg px-4 py-3 text-white"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-muted mb-1">Data de Nascimento</label>
            <input
              type="date"
              value={editForm.birthDate}
              onChange={(e) => setEditForm({ ...editForm, birthDate: e.target.value })}
              className="w-full bg-surface border border-line rounded-lg px-4 py-3 text-white"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-muted mb-1">Nova Senha (opcional)</label>
            <input
              type="password"
              value={editForm.password}
              onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
              className="w-full bg-surface border border-line rounded-lg px-4 py-3 text-white"
              placeholder="Deixe em branco para manter"
            />
          </div>
          <div className="pt-2">
            <Button type="submit" variant="primary" className="w-full">
              Salvar Alterações
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
