import React, { useEffect, useState, useRef } from 'react';
import api from '../../lib/api';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';
import { Card, PageHeader, Badge, Empty, Button, Field, Select, Th, Td, Modal, Input } from '../../components/ui';
import { QrCode, Camera, CameraOff, UserCheck, Filter, CalendarDays, Activity, BarChart3, Clock, Pencil, Trash2 } from 'lucide-react';

export default function CheckinAdmin() {
  const [alunos, setAlunos] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [manualId, setManualId] = useState('');
  const [lastResult, setLastResult] = useState(null);
  
  // Relatórios
  const [reports, setReports] = useState([]);
  const [period, setPeriod] = useState('hoje'); 
  const [studentFilter, setStudentFilter] = useState('');
  
  // KPIs globais
  const [kpis, setKpis] = useState({ hoje: 0, semana: 0, mes: 0 });

  const scannerRef = useRef(null);
  const html5QrRef = useRef(null);

  const loadBaseData = async () => {
    try {
      const res = await api.get('/users?role=aluno');
      setAlunos(res.data);
    } catch (e) {}
  };

  const loadReports = async () => {
    try {
      const today = new Date();
      let start = '';
      const end = today.toISOString().split('T')[0];

      if (period === 'hoje') start = end;
      else if (period === 'semana') {
        const d = new Date(); d.setDate(d.getDate() - 7);
        start = d.toISOString().split('T')[0];
      } else if (period === 'mes') {
        const d = new Date(); d.setDate(d.getDate() - 30);
        start = d.toISOString().split('T')[0];
      } else {
        start = '2000-01-01';
      }

      let url = `/checkin/report?start=${start}&end=${end}`;
      if (studentFilter) url += `&studentId=${studentFilter}`;

      const res = await api.get(url);
      setReports(res.data);

      // Carregar KPIs (só atualiza se o filtro de aluno não estiver ativo, ou calcula globalmente para consistência)
      const d30 = new Date(); d30.setDate(d30.getDate() - 30);
      const d7 = new Date(); d7.setDate(d7.getDate() - 7);
      
      const resKpi = await api.get(`/checkin/report?start=${d30.toISOString().split('T')[0]}&end=${end}`);
      const globais = resKpi.data;
      
      const tHoje = globais.filter(c => c.date === end).length;
      const tSemana = globais.filter(c => new Date(c.date) >= d7).length;
      const tMes = globais.length;

      setKpis({ hoje: tHoje, semana: tSemana, mes: tMes });
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadBaseData();
  }, []);

  useEffect(() => {
    loadReports();
    // eslint-disable-next-line
  }, [period, studentFilter]);


  const handleManualCheckin = async () => {
    try {
      const res = await api.post('/checkin/manual', { studentId: manualId });
      toast.success(`Check-in manual: ${res.data.student.name}`);
      setManualId('');
      loadReports();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao registrar check-in');
    }
  };

  const [editModal, setEditModal] = useState(null);
  const [editForm, setEditForm] = useState({ date: '', time: '' });

  const openEdit = (c) => {
    setEditModal(c);
    setEditForm({ date: c.date, time: c.time });
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/checkin/${editModal.id || editModal._id}`, editForm);
      toast.success('Check-in atualizado!');
      setEditModal(null);
      loadReports();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao atualizar');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este check-in?')) return;
    try {
      await api.delete(`/checkin/${id}`);
      toast.success('Check-in excluído');
      loadReports();
    } catch (err) {
      toast.error('Erro ao excluir');
    }
  };

  const formatDate = (iso) => {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  };

  return (
    <div className="space-y-6" data-testid="checkin-admin-page">
      <PageHeader
        title="Check-in & Acessos"
        subtitle="Gerencie entradas e visualize relatórios dinâmicos de frequência."
      />

      {/* KPIs Dinâmicos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 fade-up">
        <Card className="p-5 flex items-center justify-between border-l-4 border-l-ok bg-gradient-to-r from-ok/10 to-transparent">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted font-semibold mb-1">Check-ins Hoje</p>
            <p className="text-4xl font-display text-white">{kpis.hoje}</p>
          </div>
          <Activity size={32} className="text-ok/50" />
        </Card>
        <Card className="p-5 flex items-center justify-between border-l-4 border-l-accent bg-gradient-to-r from-accent/10 to-transparent">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted font-semibold mb-1">Últimos 7 Dias</p>
            <p className="text-4xl font-display text-white">{kpis.semana}</p>
          </div>
          <BarChart3 size={32} className="text-accent/50" />
        </Card>
        <Card className="p-5 flex items-center justify-between border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-500/10 to-transparent">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted font-semibold mb-1">Últimos 30 Dias</p>
            <p className="text-4xl font-display text-white">{kpis.mes}</p>
          </div>
          <CalendarDays size={32} className="text-blue-500/50" />
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Coluna Esquerda: Ações de Check-in */}
        <div className="space-y-6 lg:col-span-1 fade-up">
          {/* Scanner Card */}
          {/* QR Code Fixo Card */}
          <Card className="overflow-hidden shadow-xl" data-testid="qr-fixed-card">
            <div className="flex items-center justify-between px-5 py-4 bg-surface/50 border-b border-line">
              <p className="text-xs uppercase tracking-[0.2em] text-muted font-bold flex items-center gap-2">
                <QrCode size={14} className="text-accent" /> QR Code da Recepção
              </p>
            </div>
            <div className="p-5 flex flex-col items-center text-center">
              <p className="text-sm text-white/70 mb-6">
                Mostre este código para as alunas escanearem com o aplicativo e liberarem o treino do dia.
              </p>
              <div className="bg-white p-4 rounded-xl shadow-lg border border-white/10 mb-4 inline-block">
                <QRCodeSVG value="CHECKIN_CTSPARTAN" size={200} level="M" />
              </div>
              <p className="text-xs font-mono text-muted mt-2 tracking-widest bg-black/50 px-3 py-1 rounded">CHECKIN_CTSPARTAN</p>
            </div>
          </Card>

          {/* Manual Check-in Card */}
          <Card className="p-5 shadow-xl" data-testid="manual-checkin-card">
            <p className="text-xs uppercase tracking-[0.2em] text-muted font-bold flex items-center gap-2 mb-4">
              <UserCheck size={14} className="text-ok" /> Entrada Manual
            </p>
            <div className="space-y-4">
              <Select value={manualId} onChange={(e) => setManualId(e.target.value)}>
                <option value="">Buscar Aluna...</option>
                {alunos.filter((a) => a.active !== false).map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </Select>
              <Button onClick={handleManualCheckin} disabled={!manualId} className="w-full bg-surface hover:bg-ok hover:text-white border border-transparent transition-all">
                Registrar Acesso
              </Button>
            </div>
          </Card>
        </div>

        {/* Coluna Direita: Tabela e Relatórios Dinâmicos */}
        <div className="lg:col-span-2">
          <Card className="h-full flex flex-col shadow-xl fade-up" data-testid="reports-card">
            <div className="px-5 py-4 border-b border-line bg-surface/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted font-bold flex items-center gap-2">
                <Filter size={14} className="text-blue-500" /> Histórico de Acessos
              </p>
              
              {/* Filtros */}
              <div className="flex flex-col sm:flex-row gap-2">
                <Select value={period} onChange={(e) => setPeriod(e.target.value)} className="text-xs py-1 h-8 w-full sm:w-36 bg-surface">
                  <option value="hoje">Somente Hoje</option>
                  <option value="semana">Últimos 7 Dias</option>
                  <option value="mes">Últimos 30 Dias</option>
                  <option value="todos">Todo o Histórico</option>
                </Select>
                <Select value={studentFilter} onChange={(e) => setStudentFilter(e.target.value)} className="text-xs py-1 h-8 w-full sm:w-48 bg-surface">
                  <option value="">Todas as Alunas</option>
                  {alunos.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </Select>
              </div>
            </div>

            <div className="flex-1 overflow-x-auto min-h-[400px]">
              {reports.length === 0 ? (
                <div className="flex items-center justify-center h-full min-h-[300px]">
                  <Empty title="Nenhum acesso" subtitle="Não há check-ins registrados para este filtro." />
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-line/50 text-muted bg-surface/10">
                      <Th>Data e Hora</Th>
                      <Th>Aluna</Th>
                      <Th>Método</Th>
                      <Th className="text-right">Ações</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line/30">
                    {reports.map((c) => (
                      <tr key={c.id || c._id} className="hover:bg-surface/30 transition-colors">
                        <Td>
                          <div className="flex items-center gap-2">
                            <Clock size={13} className="text-muted" />
                            <span className="font-medium text-white/90">{formatDate(c.date)}</span>
                            <span className="text-muted text-xs">às {c.time}</span>
                          </div>
                        </Td>
                        <Td>
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-full bg-accent/20 border border-accent/20 flex items-center justify-center text-[10px] font-bold text-accent shrink-0">
                              {(c.studentId?.name || '?')[0]}
                            </div>
                            <span className="text-sm font-medium text-white/90 truncate">{c.studentId?.name || '—'}</span>
                          </div>
                        </Td>
                        <Td>
                          <Badge tone={c.method === 'qrcode' ? 'ok' : 'muted'}>
                            {c.method === 'qrcode' ? 'QR Scanner' : 'Manual'}
                          </Badge>
                        </Td>
                        <Td className="text-right flex justify-end gap-2">
                          <button onClick={() => openEdit(c)} className="p-1.5 text-muted hover:text-white transition-colors" title="Editar Data/Hora">
                            <Pencil size={16} />
                          </button>
                          <button onClick={() => handleDelete(c.id || c._id)} className="p-1.5 text-muted hover:text-accent transition-colors" title="Excluir">
                            <Trash2 size={16} />
                          </button>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </Card>
        </div>

      </div>

      <Modal open={!!editModal} onClose={() => setEditModal(null)} title="Editar Check-in">
        <form onSubmit={handleEdit} className="space-y-4">
          <Field label="Data">
            <Input type="date" value={editForm.date} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })} required />
          </Field>
          <Field label="Hora">
            <Input type="time" value={editForm.time} onChange={(e) => setEditForm({ ...editForm, time: e.target.value })} required />
          </Field>
          <Button type="submit" className="w-full">Salvar Alterações</Button>
        </form>
      </Modal>

    </div>
  );
}
