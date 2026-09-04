import React, { useEffect, useState } from 'react';
import api, { fmtDate } from '../../lib/api';
import { toast } from 'sonner';
import { Button, Input, Select, Textarea, Field, Card, Modal, Th, Td, PageHeader, Badge, Empty } from '../../components/ui';
import { Plus, Pencil, Trash2, FileText, Printer, ClipboardCheck } from 'lucide-react';
import EvolutionCompare from '../../components/EvolutionCompare';

const empty = { paymentDueDate: '', name: '', email: '', password: '', phone: '', birthDate: '', personalId: '', planId: '', timeSlot: '', goal: '', healthConditions: '', medications: '', injuries: '', experienceLevel: '', trainingFrequency: '', anamnesisNotes: '' };
const emptyMeasure = { weight: '', height: '', chest: '', waist: '', hip: '', arm: '', thigh: '' };

export default function Alunos() {
  const [alunas, setAlunas] = useState([]);
  const [personais, setPersonais] = useState([]);
  const [plans, setPlans] = useState([]);
  const [classes, setClasses] = useState([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [step, setStep] = useState(1);
  const [contractModal, setContractModal] = useState(false);
  const [contractStudent, setContractStudent] = useState(null);
  const [activeTab, setActiveTab] = useState('TODAS');
  const [evalModal, setEvalModal] = useState(null);
  const [evalForm, setEvalForm] = useState(emptyMeasure);
  const [history, setHistory] = useState([]);

  const load = () => {
    api.get('/users?role=aluno').then((r) => setAlunas(r.data));
    api.get('/users?role=personal').then((r) => setPersonais(r.data));
    api.get('/plans').then((r) => setPlans(r.data));
    api.get('/users/classes').then((r) => setClasses(r.data)).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const open = (a) => {
    setEditing(a || null);
    setForm(a ? {
      name: a.name, email: a.email, password: '', phone: a.phone || '', birthDate: a.birthDate || '',
      personalId: a.personalId?.id || a.personalId || '', planId: a.planId?.id || a.planId || '', paymentDueDate: a.paymentDueDate || '',
      timeSlot: a.timeSlot || '',
      goal: a.goal || '', healthConditions: a.healthConditions || '', medications: a.medications || '',
      injuries: a.injuries || '', experienceLevel: a.experienceLevel || '', trainingFrequency: a.trainingFrequency || '',
      anamnesisNotes: a.anamnesisNotes || '',
    } : empty);
    setStep(1);
    setModal(true);
  };

  const save = async (e) => {
    e.preventDefault();
    const payload = { ...form, role: 'aluno', personalId: form.personalId || null, planId: form.planId || null, timeSlot: form.timeSlot || null };
    if (!payload.password) delete payload.password;
    try {
      if (editing) {
        await api.put(`/users/${editing.id}`, payload);
        toast.success('Aluna atualizada');
      } else {
        const r = await api.post('/users', payload);
        toast.success('Aluna cadastrada');
        setContractStudent({
          ...r.data,
          planId: plans.find(p => p.id === payload.planId) || null
        });
        setContractModal(true);
      }
      setModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao salvar');
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Excluir esta aluna?')) return;
    await api.delete(`/users/${id}`);
    toast.success('Aluna excluída');
    load();
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

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });
  const setEv = (k) => (e) => setEvalForm({ ...evalForm, [k]: e.target.value });

  const filteredAlunas = activeTab === 'TODAS' ? alunas : alunas.filter(a => a.timeSlot === activeTab);

  return (
    <div data-testid="admin-alunos-page">
      <PageHeader
        title="Alunas"
        subtitle="Gerencie o cadastro e planos das alunas"
        action={<Button onClick={() => open()} data-testid="new-aluno-button"><Plus size={16} className="inline mr-2" /> Nova Aluna</Button>}
      />

      <div className="mb-4">
        <div className="w-full max-w-xs">
          <Select 
            value={activeTab} 
            onChange={(e) => setActiveTab(e.target.value)}
            className="w-full bg-surface border-line"
          >
            <option value="TODAS">TODAS AS TURMAS</option>
            {classes.map(c => (
              <option key={c.time} value={c.time}>
                TURMA {c.time.replace(':00', ' H').replace(':', 'H')}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <Card>
        {filteredAlunas.length === 0 ? (
          <Empty title="Nenhuma aluna encontrada" subtitle={activeTab === 'TODAS' ? 'Cadastre a primeira aluna para começar.' : 'Nenhuma aluna nesta turma.'} />
        ) : (
          <table className="w-full text-left border-collapse" data-testid="alunos-table">
            <thead>
              <tr className="border-b border-line text-muted text-xs uppercase tracking-wider">
                <Th>Nome</Th>
                <Th>Email</Th>
                <Th>Turma</Th>
                <Th>Plano</Th>
                <Th>Vencimento</Th>
                <Th>Personal</Th>
                <Th className="text-right">Ações</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filteredAlunas.map((a) => (
                <tr key={a.id} className="hover:bg-surface/50 transition-colors" data-testid={`aluno-row-${a.id}`}>
                  <Td className="font-medium text-white">{a.name}</Td>
                  <Td className="text-muted">{a.email}</Td>
                  <Td>{a.timeSlot ? <Badge>{a.timeSlot}</Badge> : <span className="text-muted text-xs">-</span>}</Td>
                  <Td>{a.planId ? <Badge>{a.planId.name}</Badge> : <span className="text-muted text-xs">Sem plano</span>}</Td>
                    <Td>{a.paymentDueDate ? new Date(a.paymentDueDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : <span className="text-muted text-xs">-</span>}</Td>
                  <Td>{a.personalId ? <span className="text-sm text-white/90">{a.personalId.name}</span> : <span className="text-muted text-xs">Sem personal</span>}</Td>
                  <Td className="text-right flex items-center justify-end gap-1">
                    <button onClick={() => openEval(a)} className="p-2 text-muted hover:text-ok transition-colors" data-testid={`avaliacao-aluno-${a.id}`} title="Avaliação Física">
                      <ClipboardCheck size={16} />
                    </button>
                    <button onClick={() => { 
                      setContractStudent({ ...a, planId: plans.find(p => p.id === (a.planId?.id || a.planId)) }); 
                      setContractModal(true); 
                    }} className="p-2 text-muted hover:text-white transition-colors" title="Gerar Contrato">
                      <FileText size={16} />
                    </button>
                    <button onClick={() => open(a)} className="p-2 text-muted hover:text-accent transition-colors" data-testid={`edit-aluno-${a.id}`} title="Editar"><Pencil size={16} /></button>
                    <button onClick={() => remove(a.id)} className="p-2 text-muted hover:text-accent transition-colors" title="Excluir"><Trash2 size={16} /></button>
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
        }} className="space-y-6" data-testid="aluno-form">
          
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
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2 border-t border-line mt-2">
                <Field label="Turma / Horário">
                  <Select value={form.timeSlot} onChange={set('timeSlot')}>
                    <option value="">Sem horário fixo</option>
                    {classes.map(c => (
                      <option key={c.time} value={c.time} disabled={c.full && form.timeSlot !== c.time}>
                        {c.time} ({c.count}/{c.limit} vagas) {c.full && form.timeSlot !== c.time ? ' - LOTADA' : ''}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Vincular Personal">
                  <Select value={form.personalId} onChange={set('personalId')}>
                    <option value="">Sem personal</option>
                    {personais.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </Select>
                </Field>
                <Field label="Vincular Plano">
                  <Select value={form.planId} onChange={set('planId')}>
                    <option value="">Sem plano</option>
                    {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </Select>
                </Field>
                  <Field label="Vencimento"><Input type="date" value={form.paymentDueDate} onChange={set('paymentDueDate')} /></Field>
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

      {/* MODAL DE CONTRATO */}
      <Modal open={contractModal} onClose={() => setContractModal(false)} title="Contrato de Matrícula" wide>
        {contractStudent && (
          <>
            <div className="bg-white text-black p-8 rounded-lg shadow-inner max-h-[60vh] overflow-auto text-sm" id="print-contract">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b-2 border-black pb-4 mb-6">
                <div className="flex items-center gap-4">
                  <img src="/logo.png" alt="CT Spartan Logo" className="w-20 object-contain brightness-0" />
                  <div>
                    <h2 className="font-black text-xl uppercase tracking-tight">CT Spartan</h2>
                    <p className="text-gray-600 text-xs">Rua dos Espartanos, 300 - Centro</p>
                    <p className="text-gray-600 text-xs">Telefone: (11) 99999-9999</p>
                  </div>
                </div>
                <div className="text-left md:text-right mt-4 md:mt-0">
                  <h2 className="text-xl font-black uppercase tracking-tight">Contrato de Serviços</h2>
                  <p className="text-xs text-gray-500 mt-1">Data: {new Date().toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
              
              <h3 className="text-lg font-bold uppercase text-center mb-6">Contrato de Prestação de Serviços Esportivos</h3>
              
              <div className="space-y-4 text-justify">
                <p>
                  Pelo presente instrumento, a <strong>CT SPARTAN</strong>, doravante denominada CONTRATADA, e 
                  a aluna <strong>{contractStudent.name}</strong>, inscrita(o) sob o email <strong>{contractStudent.email}</strong>, 
                  telefone <strong>{contractStudent.phone || 'N/A'}</strong>, doravante denominada CONTRATANTE, 
                  celebram o presente Contrato de Prestação de Serviços Esportivos.
                </p>

                <p><strong>1. DO OBJETO:</strong> A CONTRATADA prestará à CONTRATANTE serviços de condicionamento físico 
                nas modalidades oferecidas no espaço físico da academia CT SPARTAN.</p>

                <p><strong>2. DO PLANO E PAGAMENTO:</strong> A CONTRATANTE opta pelo plano 
                <strong> {contractStudent.planId?.name || 'N/A'}</strong>, 
                obrigando-se a realizar o pagamento das mensalidades nas datas de vencimento acordadas.</p>

                <p><strong>3. DAS NORMAS DE USO:</strong> A CONTRATANTE compromete-se a respeitar as normas de convivência 
                e segurança da academia, zelando pelos equipamentos e pelo espaço comum, exclusivo para mulheres.</p>

                <p><strong>4. DA SAÚDE:</strong> A CONTRATANTE declara-se em plenas condições de saúde para a prática 
                de atividades físicas, isentando a CONTRATADA de responsabilidades decorrentes de problemas médicos não informados previamente.</p>
                
                <p className="pt-8 text-center text-xs text-gray-500">
                  Por estarem de acordo, firmam o presente contrato.
                </p>
              </div>

              <div className="flex justify-between mt-20 px-8">
                <div className="w-1/2 text-center border-t border-black pt-2 mr-4">
                  <p className="font-bold text-xs uppercase">CT SPARTAN</p>
                  <p className="text-[10px] text-gray-500">Contratada</p>
                </div>
                <div className="w-1/2 text-center border-t border-black pt-2 ml-4">
                  <p className="font-bold text-xs uppercase">{contractStudent.name}</p>
                  <p className="text-[10px] text-gray-500">Contratante</p>
                </div>
              </div>
            </div>

            {/* Print layout hidden on screen, only visible when printing */}
            <div className="hidden print:block fixed inset-0 z-[9999] bg-white text-black p-10 text-sm">
              {/* Cópia do contrato para preencher a folha A4 completa na impressão */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b-2 border-black pb-4 mb-6">
                <div className="flex items-center gap-4">
                  <img src="/logo.png" alt="CT Spartan Logo" className="w-24 object-contain brightness-0" />
                  <div>
                    <h2 className="font-black text-2xl uppercase tracking-tight">CT Spartan</h2>
                    <p className="text-gray-600 text-sm mt-1">Rua dos Espartanos, 300 - Centro</p>
                    <p className="text-gray-600 text-sm">Telefone: (11) 99999-9999</p>
                  </div>
                </div>
                <div className="text-right">
                  <h2 className="text-xl font-black uppercase tracking-tight">Contrato de Serviços</h2>
                  <p className="text-sm text-gray-500 mt-1">Data: {new Date().toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
              
              <h3 className="text-xl font-bold uppercase text-center mb-8">Contrato de Prestação de Serviços Esportivos</h3>
              
              <div className="space-y-6 text-justify text-base leading-relaxed">
                <p>
                  Pelo presente instrumento, a <strong>CT SPARTAN</strong>, doravante denominada CONTRATADA, e 
                  a aluna <strong>{contractStudent.name}</strong>, inscrita(o) sob o email <strong>{contractStudent.email}</strong>, 
                  telefone <strong>{contractStudent.phone || 'N/A'}</strong>, doravante denominada CONTRATANTE, 
                  celebram o presente Contrato de Prestação de Serviços Esportivos.
                </p>
                <p><strong>1. DO OBJETO:</strong> A CONTRATADA prestará à CONTRATANTE serviços de condicionamento físico nas modalidades oferecidas no espaço físico da academia CT SPARTAN.</p>
                <p><strong>2. DO PLANO E PAGAMENTO:</strong> A CONTRATANTE opta pelo plano <strong> {contractStudent.planId?.name || 'N/A'}</strong>, obrigando-se a realizar o pagamento das mensalidades nas datas de vencimento acordadas.</p>
                <p><strong>3. DAS NORMAS DE USO:</strong> A CONTRATANTE compromete-se a respeitar as normas de convivência e segurança da academia, zelando pelos equipamentos e pelo espaço comum, exclusivo para mulheres.</p>
                <p><strong>4. DA SAÚDE:</strong> A CONTRATANTE declara-se em plenas condições de saúde para a prática de atividades físicas, isentando a CONTRATADA de responsabilidades decorrentes de problemas médicos não informados previamente.</p>
                <p className="pt-12 text-center text-sm text-gray-500">Por estarem de acordo, firmam o presente contrato.</p>
              </div>

              <div className="flex justify-between mt-32 px-10">
                <div className="w-1/2 text-center border-t border-black pt-2 mr-8">
                  <p className="font-bold text-sm uppercase">CT SPARTAN</p>
                  <p className="text-xs text-gray-500">Contratada</p>
                </div>
                <div className="w-1/2 text-center border-t border-black pt-2 ml-8">
                  <p className="font-bold text-sm uppercase">{contractStudent.name}</p>
                  <p className="text-xs text-gray-500">Contratante</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="ghost" onClick={() => setContractModal(false)}>Fechar</Button>
              <Button onClick={() => { setContractModal(false); setTimeout(() => window.print(), 300); }}>
                <Printer size={16} className="inline mr-2" />
                Imprimir Contrato
              </Button>
            </div>
          </>
        )}
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





