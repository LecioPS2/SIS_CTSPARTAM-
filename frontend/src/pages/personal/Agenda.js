import React, { useEffect, useState } from 'react';
import api, { fmtDate } from '../../lib/api';
import { toast } from 'sonner';
import { Button, Input, Select, Field, Card, Modal, Th, Td, PageHeader, Badge, Empty } from '../../components/ui';
import { Plus, CheckCircle2, XCircle, Trash2 } from 'lucide-react';

const empty = { studentId: '', date: '', time: '', durationMin: 60, notes: '' };

export default function Agenda() {
  const [sessions, setSessions] = useState([]);
  const [alunos, setAlunos] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(empty);

  const load = () => {
    api.get('/sessions').then((r) => setSessions(r.data));
    api.get('/users').then((r) => setAlunos(r.data));
  };
  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault();
    try {
      await api.post('/sessions', { ...form, durationMin: Number(form.durationMin) });
      toast.success('Sessão agendada');
      setModal(false);
      setForm(empty);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao agendar');
    }
  };

  const setStatus = async (id, status) => {
    await api.put(`/sessions/${id}`, { status });
    toast.success(status === 'concluida' ? 'Sessão concluída' : 'Sessão cancelada');
    load();
  };

  const remove = async (id) => {
    if (!window.confirm('Excluir esta sessão?')) return;
    await api.delete(`/sessions/${id}`);
    load();
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const tone = { agendada: 'warn', concluida: 'ok', cancelada: 'danger' };

  return (
    <div data-testid="personal-agenda-page">
      <PageHeader
        title="Agenda"
        subtitle="Sessões de treino agendadas"
        action={<Button onClick={() => { setForm(empty); setModal(true); }} data-testid="add-sessao-button"><Plus size={14} className="inline mr-1" />Nova Sessão</Button>}
      />
      <Card className="overflow-x-auto fade-up">
        {sessions.length === 0 ? (
          <div className="p-6"><Empty text="Nenhuma sessão agendada" /></div>
        ) : (
          <table className="w-full" data-testid="sessoes-table">
            <thead><tr><Th>Aluno</Th><Th>Data</Th><Th>Hora</Th><Th>Duração</Th><Th>Notas</Th><Th>Status</Th><Th></Th></tr></thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id} className="hover:bg-surface transition-colors">
                  <Td className="font-medium">{s.studentId?.name}</Td>
                  <Td>{fmtDate(s.date)}</Td>
                  <Td>{s.time}</Td>
                  <Td>{s.durationMin}min</Td>
                  <Td className="text-muted">{s.notes || '—'}</Td>
                  <Td><Badge tone={tone[s.status]}>{s.status}</Badge></Td>
                  <Td>
                    <div className="flex gap-2 justify-end">
                      {s.status === 'agendada' && (
                        <>
                          <button onClick={() => setStatus(s.id, 'concluida')} className="text-muted hover:text-ok transition-colors" data-testid={`concluir-sessao-${s.id}`} aria-label="Concluir" title="Concluir"><CheckCircle2 size={15} /></button>
                          <button onClick={() => setStatus(s.id, 'cancelada')} className="text-muted hover:text-yellow-400 transition-colors" data-testid={`cancelar-sessao-${s.id}`} aria-label="Cancelar" title="Cancelar"><XCircle size={15} /></button>
                        </>
                      )}
                      <button onClick={() => remove(s.id)} className="text-muted hover:text-accent transition-colors" data-testid={`delete-sessao-${s.id}`} aria-label="Excluir"><Trash2 size={15} /></button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
      <Modal open={modal} onClose={() => setModal(false)} title="Nova Sessão">
        <form onSubmit={save} className="space-y-4" data-testid="sessao-form">
          <Field label="Aluno">
            <Select value={form.studentId} onChange={set('studentId')} required data-testid="sessao-aluno-select">
              <option value="">Selecione o aluno</option>
              {alunos.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Data"><Input type="date" value={form.date} onChange={set('date')} required data-testid="sessao-data-input" /></Field>
            <Field label="Hora"><Input type="time" value={form.time} onChange={set('time')} required data-testid="sessao-hora-input" /></Field>
          </div>
          <Field label="Duração (minutos)"><Input type="number" min="15" step="15" value={form.durationMin} onChange={set('durationMin')} data-testid="sessao-duracao-input" /></Field>
          <Field label="Notas"><Input value={form.notes} onChange={set('notes')} placeholder="Ex: avaliação física" data-testid="sessao-notas-input" /></Field>
          <Button type="submit" className="w-full" data-testid="sessao-save-button">Agendar</Button>
        </form>
      </Modal>
    </div>
  );
}
