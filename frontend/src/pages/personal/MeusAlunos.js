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
  const [step, setStep] = useState(1);
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
    setStep(1);
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

      <Modal open={modal} onClose={() => { setModal(false); setStep(1); }} title={editing ? 'Editar Aluna' : 'Nova Aluna'} wide>
        {/* Indicador de Passos */}
        <div className="flex justify-between items-center mb-8 relative px-4">
          <div className="absolute top-1/2 left-8 right-8 h-[2px] bg-line -z-10 -translate-y-1/2"></div>
          {[
            { id: 1, label: 'Dados Básicos' },
            { id: 2, label: 'Saúde & Restrições' },
            { id: 3, label: 'Metas & Treino' }
          ].map((s) => (
            <div key={s.id} className="flex flex-col items-center gap-2 bg-card px-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step >= s.id ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'bg-surface text-muted border border-line'}`}>
                {s.id}
              </div>
              <span className={`text-[10px] uppercase tracking-wider font-semibold ${step >= s.id ? 'text-white' : 'text-muted'}`}>{s.label}</span>
            </div>
          ))}
        </div>

        <form onSubmit={(e) => {
          e.preventDefault();
          if (step < 3) setStep(step + 1);
          else save(e);
        }} className="space-y-6" data-testid="meu-aluno-form">
          
          {/* PASSO 1: DADOS BÁSICOS */}
          {step === 1 && (
            <div className="space-y-4 fade-up">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Nome"><Input value={form.name} onChange={set('name')} required autoFocus /></Field>
                <Field label="Email"><Input type="email" value={form.email} onChange={set('email')} required /></Field>
                <Field label={editing ? 'Nova senha (opcional)' : 'Senha'}><Input type="password" value={form.password} onChange={set('password')} required={!editing} /></Field>
                <Field label="Telefone"><Input value={form.phone} onChange={set('phone')} /></Field>
                <Field label="Data de nascimento"><Input type="date" value={form.birthDate} onChange={set('birthDate')} /></Field>
              </div>
            </div>
          )}

          {/* PASSO 2: SAÚDE E RESTRIÇÕES */}
          {step === 2 && (
            <div className="space-y-4 fade-up">
              <p className="text-xs uppercase tracking-[0.2em] text-accent mb-4">Anamnese de Saúde</p>
              <div className="grid grid-cols-1 gap-4">
                <Field label="Possui alguma doença? (Hipertensão, Diabetes, etc)">
                  <Input value={form.healthConditions} onChange={set('healthConditions')} placeholder="Detalhe se houver..." autoFocus />
                </Field>
                <Field label="Faz uso contínuo de medicamentos?">
                  <Input value={form.medications} onChange={set('medications')} placeholder="Quais medicamentos?" />
                </Field>
                <Field label="Lesões ou cirurgias recentes?">
                  <Input value={form.injuries} onChange={set('injuries')} placeholder="Joelho, coluna, ombro..." />
                </Field>
              </div>
            </div>
          )}

          {/* PASSO 3: METAS E TREINO */}
          {step === 3 && (
            <div className="space-y-4 fade-up">
              <p className="text-xs uppercase tracking-[0.2em] text-accent mb-4">Plano de Ação</p>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Meta / Objetivo Principal">
                  <Input value={form.goal} onChange={set('goal')} placeholder="Ex: Hipertrofia, emagrecimento..." autoFocus />
                </Field>
                <Field label="Nível de experiência">
                  <Select value={form.experienceLevel} onChange={set('experienceLevel')}>
                    <option value="">Selecione</option>
                    <option value="iniciante">Iniciante</option>
                    <option value="intermediaria">Intermediária</option>
                    <option value="avancada">Avançada</option>
                  </Select>
                </Field>
                <Field label="Frequência semanal desejada">
                  <Select value={form.trainingFrequency} onChange={set('trainingFrequency')}>
                    <option value="">Selecione</option>
                    <option value="1-2x">1–2x por semana</option>
                    <option value="3-4x">3–4x por semana</option>
                    <option value="5-6x">5–6x por semana</option>
                    <option value="todos os dias">Todos os dias</option>
                  </Select>
                </Field>
              </div>
              <Field label="Observações gerais e restrições extras">
                <Textarea value={form.anamnesisNotes} onChange={set('anamnesisNotes')} placeholder="Outras informações relevantes para o Personal..." rows={3} />
              </Field>
            </div>
          )}

          {/* Botões de Navegação */}
          <div className="flex gap-4 pt-6 mt-4 border-t border-line">
            {step > 1 && (
              <Button type="button" variant="ghost" onClick={() => setStep(step - 1)} className="flex-1">
                Voltar
              </Button>
            )}
            <Button type="submit" className="flex-1 shadow-lg shadow-accent/20">
              {step < 3 ? 'Próximo Passo' : 'Salvar Aluna'}
            </Button>
          </div>
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
