import React, { useEffect, useState } from 'react';
import api, { fmtDate } from '../../lib/api';
import { toast } from 'sonner';
import { Button, Input, Select, Textarea, Field, Card, Modal, Th, Td, PageHeader, Badge, Empty } from '../../components/ui';
import { Plus, Pencil, ClipboardCheck } from 'lucide-react';
import EvolutionCompare from '../../components/EvolutionCompare';

const empty = { name: '', email: '', password: '', phone: '', birthDate: '', goal: '', healthConditions: '', medications: '', injuries: '', experienceLevel: '', trainingFrequency: '', anamnesisNotes: '' };
const emptyMeasure = { weight: '', height: '', chest: '', waist: '', hip: '', arm: '', thigh: '' };

export default function MeusAlunos() {
  const [alunas, setAlunas] = useState([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [evalModal, setEvalModal] = useState(null);
  const [evalForm, setEvalForm] = useState(emptyMeasure);
  const [history, setHistory] = useState([]);

  const load = () => api.get('/users').then((r) => setAlunas(r.data));
  useEffect(() => { load(); }, []);

  const open = (a) => {
    setEditing(a || null);
    setForm(a ? {
      name: a.name, email: a.email, password: '', phone: a.phone || '', birthDate: a.birthDate || '',
      goal: a.goal || '', healthConditions: a.healthConditions || '', medications: a.medications || '',
      injuries: a.injuries || '', experienceLevel: a.experienceLevel || '', trainingFrequency: a.trainingFrequency || '',
      anamnesisNotes: a.anamnesisNotes || '',
    } : empty);
    setModal(true);
  };

  const save = async (e) => {
    e.preventDefault();
    const payload = { ...form };
    if (!payload.password) delete payload.password;
    try {
      if (editing) { await api.put(`/users/${editing.id}`, payload); toast.success('Aluna atualizada'); }
      else { await api.post('/users', payload); toast.success('Aluna cadastrada e vinculada a você'); }
      setModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao salvar');
    }
  };

  const openEval = async (a) => {
    setEvalModal(a);
    setEvalForm(emptyMeasure);
    setHistory([]);
    try {
      const { data } = await api.get(`/measurements/${a.id}`);
      setHistory(data);
    } catch (err) {}
  };

  const saveEval = async (e) => {
    e.preventDefault();
    const payload = {};
    Object.entries(evalForm).forEach(([k, v]) => { if (v !== '') payload[k] = Number(v); });
    if (Object.keys(payload).length === 0) { toast.error('Preencha ao menos uma medida'); return; }
    try {
      await api.post(`/measurements/${evalModal.id}`, payload);
      toast.success('Avaliação física registrada');
      const { data } = await api.get(`/measurements/${evalModal.id}`);
      setHistory(data);
      setEvalForm(emptyMeasure);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao salvar avaliação');
    }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const setEv = (k) => (e) => setEvalForm({ ...evalForm, [k]: e.target.value });

  return (
    <div data-testid="personal-alunos-page">
      <PageHeader
        title="Minhas Alunas"
        subtitle={`${alunas.length} aluna(s) sob sua orientação`}
        action={<Button onClick={() => open(null)} data-testid="add-meu-aluno-button"><Plus size={14} className="inline mr-1" />Nova Aluna</Button>}
      />
      <Card className="overflow-x-auto fade-up">
        {alunas.length === 0 ? (
          <div className="p-6"><Empty text="Você ainda não tem alunas vinculadas" /></div>
        ) : (
          <table className="w-full" data-testid="meus-alunos-table">
            <thead><tr><Th>Nome</Th><Th>Email</Th><Th>Objetivo</Th><Th>Nível</Th><Th>Plano</Th><Th></Th></tr></thead>
            <tbody>
              {alunas.map((a) => (
                <tr key={a.id} className="hover:bg-surface transition-colors">
                  <Td className="font-medium">{a.name}</Td>
                  <Td className="text-muted">{a.email}</Td>
                  <Td>{a.goal || '—'}</Td>
                  <Td>{a.experienceLevel || '—'}</Td>
                  <Td>{a.planId?.name ? <Badge tone="ok">{a.planId.name}</Badge> : <Badge>Sem plano</Badge>}</Td>
                  <Td>
                    <div className="flex gap-3 justify-end">
                      <button onClick={() => openEval(a)} className="text-muted hover:text-ok transition-colors" data-testid={`avaliacao-aluno-${a.id}`} aria-label="Avaliação física" title="Avaliação física"><ClipboardCheck size={15} /></button>
                      <button onClick={() => open(a)} className="text-muted hover:text-white transition-colors" data-testid={`edit-meu-aluno-${a.id}`} aria-label="Editar"><Pencil size={15} /></button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Editar Aluna' : 'Nova Aluna'} wide>
        <form onSubmit={save} className="space-y-4" data-testid="meu-aluno-form">
          <p className="text-xs uppercase tracking-[0.2em] text-accent">Dados da aluna</p>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Nome"><Input value={form.name} onChange={set('name')} required data-testid="meu-aluno-name-input" /></Field>
            <Field label="Email"><Input type="email" value={form.email} onChange={set('email')} required data-testid="meu-aluno-email-input" /></Field>
            <Field label={editing ? 'Nova senha (opcional)' : 'Senha'}><Input type="password" value={form.password} onChange={set('password')} required={!editing} data-testid="meu-aluno-password-input" /></Field>
            <Field label="Telefone"><Input value={form.phone} onChange={set('phone')} data-testid="meu-aluno-phone-input" /></Field>
            <Field label="Data de nascimento"><Input type="date" value={form.birthDate} onChange={set('birthDate')} data-testid="meu-aluno-nascimento-input" /></Field>
            <Field label="Meta / Objetivo"><Input value={form.goal} onChange={set('goal')} placeholder="Ex: hipertrofia" data-testid="meu-aluno-goal-input" /></Field>
          </div>
          <p className="text-xs uppercase tracking-[0.2em] text-accent pt-2 border-t border-line">Questionário (Anamnese)</p>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Possui alguma doença?"><Input value={form.healthConditions} onChange={set('healthConditions')} placeholder="Ex: hipertensão, nenhuma" data-testid="meu-aluno-doencas-input" /></Field>
            <Field label="Faz uso de medicamentos?"><Input value={form.medications} onChange={set('medications')} placeholder="Ex: quais, ou nenhum" data-testid="meu-aluno-medicamentos-input" /></Field>
            <Field label="Lesões ou cirurgias"><Input value={form.injuries} onChange={set('injuries')} placeholder="Ex: lesão no joelho, nenhuma" data-testid="meu-aluno-lesoes-input" /></Field>
            <Field label="Nível de experiência">
              <Select value={form.experienceLevel} onChange={set('experienceLevel')} data-testid="meu-aluno-experiencia-select">
                <option value="">Selecione</option>
                <option value="iniciante">Iniciante</option>
                <option value="intermediaria">Intermediária</option>
                <option value="avancada">Avançada</option>
              </Select>
            </Field>
            <Field label="Frequência semanal desejada">
              <Select value={form.trainingFrequency} onChange={set('trainingFrequency')} data-testid="meu-aluno-frequencia-select">
                <option value="">Selecione</option>
                <option value="1-2x">1–2x por semana</option>
                <option value="3-4x">3–4x por semana</option>
                <option value="5-6x">5–6x por semana</option>
                <option value="todos os dias">Todos os dias</option>
              </Select>
            </Field>
            <Field label="Observações gerais"><Textarea value={form.anamnesisNotes} onChange={set('anamnesisNotes')} data-testid="meu-aluno-observacoes-input" /></Field>
          </div>
          <Button type="submit" className="w-full" data-testid="meu-aluno-save-button">Salvar</Button>
        </form>
      </Modal>

      <Modal open={!!evalModal} onClose={() => setEvalModal(null)} title={`Avaliação Física — ${evalModal?.name || ''}`} wide>
        <form onSubmit={saveEval} className="space-y-4" data-testid="avaliacao-form">
          <div className="grid grid-cols-3 gap-3">
            <Field label="Peso (kg)"><Input type="number" step="0.1" min="0" value={evalForm.weight} onChange={setEv('weight')} data-testid="avaliacao-peso-input" /></Field>
            <Field label="Altura (cm)"><Input type="number" step="0.5" min="0" value={evalForm.height} onChange={setEv('height')} data-testid="avaliacao-altura-input" /></Field>
            <Field label="Peito (cm)"><Input type="number" step="0.5" min="0" value={evalForm.chest} onChange={setEv('chest')} data-testid="avaliacao-peito-input" /></Field>
            <Field label="Cintura (cm)"><Input type="number" step="0.5" min="0" value={evalForm.waist} onChange={setEv('waist')} data-testid="avaliacao-cintura-input" /></Field>
            <Field label="Quadril (cm)"><Input type="number" step="0.5" min="0" value={evalForm.hip} onChange={setEv('hip')} data-testid="avaliacao-quadril-input" /></Field>
            <Field label="Braço (cm)"><Input type="number" step="0.5" min="0" value={evalForm.arm} onChange={setEv('arm')} data-testid="avaliacao-braco-input" /></Field>
            <Field label="Coxa (cm)"><Input type="number" step="0.5" min="0" value={evalForm.thigh} onChange={setEv('thigh')} data-testid="avaliacao-coxa-input" /></Field>
          </div>
          <Button type="submit" className="w-full" data-testid="avaliacao-save-button">Registrar Avaliação</Button>
        </form>
        <div className="mt-5">
          {history.length > 1 && <div className="mb-4"><EvolutionCompare history={history} /></div>}
          <p className="text-xs uppercase tracking-[0.2em] text-muted mb-3">Histórico de avaliações</p>
          {history.length === 0 ? (
            <Empty text="Nenhuma avaliação registrada ainda" />
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto" data-testid="avaliacao-historico">
              {[...history].reverse().map((m) => (
                <div key={m.id} className="bg-surface border border-line rounded p-3">
                  <p className="text-xs text-muted mb-1.5">{fmtDate(m.date)}</p>
                  <div className="grid grid-cols-4 gap-2 text-sm">
                    {m.weight != null && <div><span className="text-muted text-xs block">Peso</span>{m.weight}kg</div>}
                    {m.height != null && <div><span className="text-muted text-xs block">Altura</span>{m.height}cm</div>}
                    {m.chest != null && <div><span className="text-muted text-xs block">Peito</span>{m.chest}cm</div>}
                    {m.waist != null && <div><span className="text-muted text-xs block">Cintura</span>{m.waist}cm</div>}
                    {m.hip != null && <div><span className="text-muted text-xs block">Quadril</span>{m.hip}cm</div>}
                    {m.arm != null && <div><span className="text-muted text-xs block">Braço</span>{m.arm}cm</div>}
                    {m.thigh != null && <div><span className="text-muted text-xs block">Coxa</span>{m.thigh}cm</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
