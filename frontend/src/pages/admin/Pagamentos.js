import React, { useEffect, useState } from 'react';
import api, { brl, fmtDate } from '../../lib/api';
import { toast } from 'sonner';
import { Button, Input, Select, Field, Card, Modal, Th, Td, PageHeader, Badge, Empty, StatCard } from '../../components/ui';
import { Plus, CheckCircle2, Trash2, Download, AlertCircle, CheckCircle, Clock, Printer, FileText, ArrowUpCircle, ArrowDownCircle, Wallet } from 'lucide-react';

const empty = { type: 'entrada', description: '', studentId: '', planId: '', amount: '', dueDate: '', status: 'pendente', method: '' };

export default function Financeiro() {
  const [payments, setPayments] = useState([]);
  const [alunos, setAlunos] = useState([]);
  const [plans, setPlans] = useState([]);
  const [modal, setModal] = useState(false);
  const [reportModal, setReportModal] = useState(false);
  const [form, setForm] = useState(empty);
  const [filter, setFilter] = useState('todos');

  const load = () => {
    api.get('/payments').then((r) => setPayments(r.data)).catch(console.error);
    api.get('/users?role=aluno').then((r) => setAlunos(r.data)).catch(console.error);
    api.get('/plans').then((r) => setPlans(r.data)).catch(console.error);
  };
  
  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault();
    try {
      const payload = { 
        ...form, 
        amount: Number(form.amount), 
        planId: form.type === 'entrada' && form.planId ? form.planId : null,
        studentId: form.type === 'entrada' && form.studentId ? form.studentId : null,
        description: form.type === 'saida' ? form.description : null
      };
      await api.post('/payments', payload);
      toast.success('Lançamento registrado');
      setModal(false);
      setForm(empty);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao salvar');
    }
  };

  const markPaid = async (id) => {
    await api.put(`/payments/${id}`, { status: 'pago' });
    toast.success('Lançamento baixado com sucesso');
    load();
  };

  const remove = async (id) => {
    if (!window.confirm('Excluir este lançamento?')) return;
    await api.delete(`/payments/${id}`);
    toast.success('Lançamento excluído');
    load();
  };

  const set = (k) => (e) => {
    const v = e.target.value;
    if (k === 'planId') {
      const plan = plans.find((p) => p.id === v);
      setForm({ ...form, planId: v, amount: plan ? plan.price : form.amount });
    } else {
      setForm({ ...form, [k]: v });
    }
  };

  const statusTone = { pago: 'ok', pendente: 'warn', atrasado: 'danger' };

  const exportCSV = () => {
    const token = localStorage.getItem('token');
    const baseUrl = process.env.REACT_APP_BACKEND_URL || '';
    
    let qs = '';
    if (filter === 'pagos') qs = '?status=pago';
    else if (filter === 'pendentes') qs = '?status=pendente';
    else if (filter === 'inadimplentes') qs = '?status=atrasado';

    const url = `${baseUrl}/api/reports/payments/csv${qs}`;
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.blob())
      .then((blob) => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        const name = filter === 'todos' ? 'geral' : filter;
        a.download = `relatorio_financeiro_${name}_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(a.href);
        toast.success(`Relatório exportado!`);
      })
      .catch(() => toast.error('Erro ao exportar'));
  };

  const totalEntradas = payments.filter(p => p.type === 'entrada' && p.status === 'pago').reduce((a, p) => a + p.amount, 0);
  const totalSaidas = payments.filter(p => p.type === 'saida' && p.status === 'pago').reduce((a, p) => a + p.amount, 0);
  const saldoLiquido = totalEntradas - totalSaidas;
  const totalInadimplente = payments.filter(p => p.type === 'entrada' && p.status === 'atrasado').reduce((a, p) => a + p.amount, 0);

  const filteredPayments = payments.filter((p) => {
    if (filter === 'todos') return true;
    if (filter === 'pagos') return p.status === 'pago';
    if (filter === 'pendentes') return p.status === 'pendente';
    if (filter === 'inadimplentes') return p.status === 'atrasado';
    return true;
  });

  return (
    <div data-testid="admin-financeiro-page" className="fade-up">
      <PageHeader
        title="Financeiro"
        subtitle="Controle de fluxo de caixa, mensalidades e despesas gerais"
        action={
          <div className="flex flex-wrap gap-3 justify-end">
            <Button variant="ghost" onClick={exportCSV}>
              <Download size={15} className="inline mr-2" />
              Exportar CSV
            </Button>
            <Button variant="ghost" onClick={() => setReportModal(true)}>
              <FileText size={15} className="inline mr-2" />
              Gerar Relatório
            </Button>
            <Button onClick={() => { setForm(empty); setModal(true); }}>
              <Plus size={15} className="inline mr-2" />
              Novo Lançamento
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard title="Entradas (Pagas)" value={brl(totalEntradas)} icon={<ArrowUpCircle />} tone="ok" />
        <StatCard title="Saídas (Pagas)" value={brl(totalSaidas)} icon={<ArrowDownCircle />} tone="danger" />
        <StatCard title="Saldo Líquido" value={brl(saldoLiquido)} icon={<Wallet />} tone={saldoLiquido >= 0 ? "ok" : "danger"} />
        <StatCard title="Inadimplentes (Atrasados)" value={brl(totalInadimplente)} icon={<AlertCircle />} tone="danger" />
      </div>

      <Card>
        <div className="flex gap-4 p-4 border-b border-line overflow-x-auto">
          {['todos', 'pagos', 'pendentes', 'inadimplentes'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 text-sm font-semibold rounded-lg uppercase tracking-wider transition-colors whitespace-nowrap ${filter === f ? 'bg-accent text-white' : 'text-muted hover:bg-surface'}`}
            >
              {f === 'todos' ? 'Todos os Lançamentos' : f.charAt(0).toUpperCase() + f.slice(1)}
              <span className="ml-2 text-xs bg-black/20 px-2 py-0.5 rounded-full">
                {f === 'todos' ? payments.length : payments.filter(p => p.status === (f === 'inadimplentes' ? 'atrasado' : f.slice(0,-1))).length}
              </span>
            </button>
          ))}
        </div>
        
        <div className="overflow-x-auto min-h-[300px]">
          {filteredPayments.length === 0 ? (
            <div className="flex items-center justify-center h-full min-h-[300px]">
              <Empty title="Nenhum registro" subtitle={`Nenhum registro encontrado em "${filter}".`} />
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-line/50 text-muted bg-surface/10">
                  <Th>Tipo</Th>
                  <Th>Referência</Th>
                  <Th>Valor</Th>
                  <Th>Vencimento</Th>
                  <Th>Status</Th>
                  <Th>Ações</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/30">
                {filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-surface/30 transition-colors">
                    <Td>
                      <Badge tone={p.type === 'saida' ? 'danger' : 'ok'} className="flex items-center gap-1 w-fit">
                        {p.type === 'saida' ? <ArrowDownCircle size={12} /> : <ArrowUpCircle size={12} />}
                        {p.type === 'saida' ? 'Saída' : 'Entrada'}
                      </Badge>
                    </Td>
                    <Td>
                      {p.type === 'entrada' ? (
                        <div>
                          <p className="font-semibold text-white/90">{p.studentId?.name || '—'}</p>
                          <p className="text-xs text-muted mt-0.5">{p.planId?.name || 'Mensalidade'}</p>
                        </div>
                      ) : (
                        <p className="font-semibold text-white/90">{p.description || 'Despesa Geral'}</p>
                      )}
                    </Td>
                    <Td>
                      <p className="font-bold">{brl(p.amount)}</p>
                    </Td>
                    <Td>
                      <p className="text-white/90">{fmtDate(p.dueDate)}</p>
                    </Td>
                    <Td>
                      <Badge tone={statusTone[p.status]} className="flex items-center gap-1 w-fit">
                        {p.status === 'pago' ? <CheckCircle size={12} /> : p.status === 'atrasado' ? <AlertCircle size={12} /> : <Clock size={12} />}
                        {p.status === 'atrasado' ? 'Inadimplente' : p.status}
                      </Badge>
                    </Td>
                    <Td>
                      <div className="flex gap-2">
                        {p.status !== 'pago' && (
                          <button onClick={() => markPaid(p.id)} className="p-2 text-ok hover:bg-ok/10 rounded-lg transition-colors" title="Marcar como Pago">
                            <CheckCircle2 size={16} />
                          </button>
                        )}
                        <button onClick={() => remove(p.id)} className="p-2 text-muted hover:text-accent hover:bg-accent/10 rounded-lg transition-colors" title="Excluir">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      <Modal open={modal} onClose={() => setModal(false)} title="Novo Lançamento">
        <form onSubmit={save} className="space-y-4">
          <div className="flex bg-surface p-1 rounded-lg gap-1 mb-4">
            <button type="button" onClick={() => setForm({ ...empty, type: 'entrada' })} className={`flex-1 py-2 text-sm font-bold uppercase tracking-wider rounded-md transition-colors ${form.type === 'entrada' ? 'bg-ok text-white shadow' : 'text-muted hover:text-white'}`}>
              Recebimento
            </button>
            <button type="button" onClick={() => setForm({ ...empty, type: 'saida' })} className={`flex-1 py-2 text-sm font-bold uppercase tracking-wider rounded-md transition-colors ${form.type === 'saida' ? 'bg-danger text-white shadow' : 'text-muted hover:text-white'}`}>
              Despesa
            </button>
          </div>

          {form.type === 'entrada' ? (
            <>
              <Field label="Aluna">
                <Select value={form.studentId} onChange={set('studentId')} required>
                  <option value="">Selecione...</option>
                  {alunos.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </Select>
              </Field>
              <Field label="Plano Vinculado (Opcional)">
                <Select value={form.planId} onChange={set('planId')}>
                  <option value="">Avulso / Nenhum</option>
                  {plans.map((p) => <option key={p.id} value={p.id}>{p.name} - {brl(p.price)}</option>)}
                </Select>
              </Field>
            </>
          ) : (
            <Field label="Descrição da Despesa">
              <Input value={form.description} onChange={set('description')} required placeholder="Ex: Conta de Luz, Manutenção..." />
            </Field>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Field label="Valor">
              <Input type="number" step="0.01" min="0" value={form.amount} onChange={set('amount')} required />
            </Field>
            <Field label={form.type === 'entrada' ? 'Vencimento' : 'Data da Despesa'}>
              <Input type="date" value={form.dueDate} onChange={set('dueDate')} required />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Status">
              <Select value={form.status} onChange={set('status')}>
                <option value="pendente">Pendente</option>
                <option value="pago">Pago</option>
                {form.type === 'entrada' && <option value="atrasado">Atrasado / Inadimplente</option>}
              </Select>
            </Field>
            <Field label="Método">
              <Select value={form.method} onChange={set('method')}>
                <option value="">Nenhum</option>
                <option value="Pix">Pix</option>
                <option value="Cartão">Cartão</option>
                <option value="Dinheiro">Dinheiro</option>
                <option value="Boleto">Boleto</option>
              </Select>
            </Field>
          </div>
          <Button type="submit" className="w-full">Salvar Lançamento</Button>
        </form>
      </Modal>

      {/* Relatório Imprimível / Preview Modal mantido simples para brevidade */}
      <Modal open={reportModal} onClose={() => setReportModal(false)} title="Relatório Financeiro" wide>
        <div className="bg-white text-black p-8 rounded-lg shadow-inner max-h-[60vh] overflow-auto text-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b-2 border-black pb-4 mb-6">
            <div className="flex items-center gap-4">
              <img src="/logo.png" alt="CT Spartan Logo" className="w-20 object-contain brightness-0" />
              <div>
                <h2 className="font-black text-xl uppercase tracking-tight">CT Spartan</h2>
                <p className="text-gray-600 text-xs">Relatório Gerencial de Fluxo de Caixa</p>
              </div>
            </div>
            <div className="text-left md:text-right mt-4 md:mt-0">
              <h2 className="text-xl font-black uppercase tracking-tight">Financeiro</h2>
              <p className="text-xs text-gray-500 mt-1">Data: {new Date().toLocaleDateString('pt-BR')}</p>
            </div>
          </div>
          
          <div className="flex gap-8 mb-8 flex-wrap">
            <div><p className="text-xs text-gray-500 uppercase">Entradas</p><p className="text-lg font-bold text-green-600">{brl(totalEntradas)}</p></div>
            <div><p className="text-xs text-gray-500 uppercase">Saídas</p><p className="text-lg font-bold text-red-600">{brl(totalSaidas)}</p></div>
            <div><p className="text-xs text-gray-500 uppercase">Saldo Líquido</p><p className="text-lg font-bold">{brl(saldoLiquido)}</p></div>
          </div>
          
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-black">
                <th className="py-2 font-bold uppercase text-xs">Tipo</th>
                <th className="py-2 font-bold uppercase text-xs">Referência</th>
                <th className="py-2 font-bold uppercase text-xs">Valor</th>
                <th className="py-2 font-bold uppercase text-xs">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map(p => (
                <tr key={p.id} className="border-b border-gray-300">
                  <td className="py-2">{p.type === 'entrada' ? 'Entrada' : 'Saída'}</td>
                  <td className="py-2">{p.type === 'entrada' ? p.studentId?.name : p.description}</td>
                  <td className="py-2">{brl(p.amount)}</td>
                  <td className="py-2 uppercase font-bold text-[10px]">{p.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={() => setReportModal(false)}>Fechar</Button>
          <Button onClick={() => { setReportModal(false); setTimeout(() => window.print(), 300); }}>
            <Printer size={16} className="inline mr-2" />
            Imprimir
          </Button>
        </div>
      </Modal>

    </div>
  );
}
