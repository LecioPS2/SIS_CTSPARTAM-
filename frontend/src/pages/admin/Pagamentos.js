import React, { useEffect, useState } from 'react';
import api, { brl, fmtDate } from '../../lib/api';
import { toast } from 'sonner';
import { Button, Input, Select, Field, Card, Modal, Th, Td, PageHeader, Badge, Empty, StatCard } from '../../components/ui';
import { Plus, CheckCircle2, Trash2, Download, AlertCircle, CheckCircle, Clock, Printer, FileText } from 'lucide-react';

const empty = { studentId: '', planId: '', amount: '', dueDate: '', status: 'pendente', method: '' };

export default function Pagamentos() {
  const [payments, setPayments] = useState([]);
  const [alunos, setAlunos] = useState([]);
  const [plans, setPlans] = useState([]);
  const [modal, setModal] = useState(false);
  const [reportModal, setReportModal] = useState(false);
  const [form, setForm] = useState(empty);
  const [filter, setFilter] = useState('todos');

  const load = () => {
    api.get('/payments').then((r) => setPayments(r.data));
    api.get('/users?role=aluno').then((r) => setAlunos(r.data));
    api.get('/plans').then((r) => setPlans(r.data));
  };
  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault();
    try {
      await api.post('/payments', { ...form, amount: Number(form.amount), planId: form.planId || null });
      toast.success('Pagamento registrado');
      setModal(false);
      setForm(empty);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao salvar');
    }
  };

  const markPaid = async (id) => {
    await api.put(`/payments/${id}`, { status: 'pago' });
    toast.success('Pagamento confirmado');
    load();
  };

  const remove = async (id) => {
    if (!window.confirm('Excluir este pagamento?')) return;
    await api.delete(`/payments/${id}`);
    toast.success('Pagamento excluído');
    load();
  };

  const set = (k) => (e) => {
    const v = e.target.value;
    if (k === 'planId') {
      const plan = plans.find((p) => p.id === v);
      setForm({ ...form, planId: v, amount: plan ? plan.price : form.amount });
    } else setForm({ ...form, [k]: v });
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
        a.download = `relatorio_pagamentos_${name}_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(a.href);
        toast.success(`Relatório (${name}) exportado!`);
      })
      .catch(() => toast.error('Erro ao exportar'));
  };

  const totalPago = payments.filter((p) => p.status === 'pago').reduce((acc, p) => acc + p.amount, 0);
  const totalPendente = payments.filter((p) => p.status === 'pendente').reduce((acc, p) => acc + p.amount, 0);
  const totalInadimplente = payments.filter((p) => p.status === 'atrasado').reduce((acc, p) => acc + p.amount, 0);

  const filteredPayments = payments.filter((p) => {
    if (filter === 'todos') return true;
    if (filter === 'pagos') return p.status === 'pago';
    if (filter === 'pendentes') return p.status === 'pendente';
    if (filter === 'inadimplentes') return p.status === 'atrasado';
    return true;
  });

  return (
    <div data-testid="admin-pagamentos-page">
      <PageHeader
        title="Financeiro"
        subtitle="Controle de mensalidades, inadimplentes e relatórios"
        action={
          <div className="flex flex-wrap gap-3 justify-end">
            <Button variant="ghost" onClick={exportCSV} data-testid="export-csv-button">
              <Download size={15} className="inline mr-2" />
              Exportar CSV
            </Button>
            <Button variant="ghost" onClick={() => setReportModal(true)} data-testid="open-report-button">
              <FileText size={15} className="inline mr-2" />
              Gerar Relatório
            </Button>
            <Button onClick={() => { setForm(empty); setModal(true); }} data-testid="add-pagamento-button">
              <Plus size={15} className="inline mr-2" />
              Novo Pagamento
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard label="Recebido (Pagos)" value={brl(totalPago)} icon={CheckCircle} accent testId="kpi-pago" />
        <StatCard label="A Receber (Pendentes)" value={brl(totalPendente)} icon={Clock} testId="kpi-pendente" />
        <StatCard label="Inadimplentes (Atrasados)" value={brl(totalInadimplente)} icon={AlertCircle} testId="kpi-inadimplente" />
      </div>

      <div className="flex gap-6 mb-4 border-b border-line pb-px mt-4">
        {[
          { id: 'todos', label: 'Todos os Lançamentos' },
          { id: 'pagos', label: 'Pagos' },
          { id: 'pendentes', label: 'Pendentes' },
          { id: 'inadimplentes', label: 'Inadimplentes' }
        ].map(t => (
          <button 
            key={t.id}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${filter === t.id ? 'border-accent text-white' : 'border-transparent text-muted hover:text-white'}`}
            onClick={() => setFilter(t.id)}
          >
            {t.label} ({payments.filter(p => t.id === 'todos' ? true : t.id === 'inadimplentes' ? p.status === 'atrasado' : p.status === t.id.slice(0, -1)).length})
          </button>
        ))}
      </div>

      <Card className="overflow-x-auto fade-up">
        {filteredPayments.length === 0 ? (
          <div className="p-8 text-center text-muted">
            <Empty text={`Nenhum registro encontrado em "${filter}".`} />
          </div>
        ) : (
          <table className="w-full" data-testid="pagamentos-table">
            <thead>
              <tr>
                <Th>Aluna</Th>
                <Th>Plano</Th>
                <Th>Valor</Th>
                <Th>Vencimento</Th>
                <Th>Pago em</Th>
                <Th>Status</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((p) => (
                <tr key={p.id} className="hover:bg-surface transition-colors border-b border-line/30 last:border-0">
                  <Td className="font-medium text-white">{p.studentId?.name || '—'}</Td>
                  <Td className="text-muted">{p.planId?.name || '—'}</Td>
                  <Td className="text-white font-medium">{brl(p.amount)}</Td>
                  <Td className="text-muted">{fmtDate(p.dueDate)}</Td>
                  <Td className="text-muted">{p.paidAt ? fmtDate(p.paidAt) : '—'}</Td>
                  <Td>
                    <Badge tone={statusTone[p.status]}>{p.status}</Badge>
                  </Td>
                  <Td>
                    <div className="flex gap-3 justify-end opacity-70 hover:opacity-100 transition-opacity">
                      {p.status !== 'pago' && (
                        <button onClick={() => markPaid(p.id)} className="text-accent hover:text-white transition-colors" title="Marcar como Pago">
                          <CheckCircle2 size={16} />
                        </button>
                      )}
                      <button onClick={() => remove(p.id)} className="text-muted hover:text-accent transition-colors" title="Excluir">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Modal open={modal} onClose={() => setModal(false)} title="Novo Pagamento">
        <form onSubmit={save} className="space-y-4" data-testid="pagamento-form">
          <Field label="Aluna">
            <Select value={form.studentId} onChange={set('studentId')} required>
              <option value="">Selecione...</option>
              {alunos.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </Select>
          </Field>
          <Field label="Plano">
            <Select value={form.planId} onChange={set('planId')} required>
              <option value="">Nenhum / Avulso</option>
              {plans.map((p) => <option key={p.id} value={p.id}>{p.name} - {brl(p.price)}</option>)}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Valor">
              <Input type="number" step="0.01" min="0" value={form.amount} onChange={set('amount')} required />
            </Field>
            <Field label="Vencimento">
              <Input type="date" value={form.dueDate} onChange={set('dueDate')} required />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Status">
              <Select value={form.status} onChange={set('status')}>
                <option value="pendente">Pendente</option>
                <option value="pago">Pago</option>
                <option value="atrasado">Atrasado (Inadimplente)</option>
              </Select>
            </Field>
            <Field label="Método">
              <Select value={form.method} onChange={set('method')}>
                <option value="">Nenhum</option>
                <option value="Pix">Pix</option>
                <option value="Cartão">Cartão</option>
                <option value="Dinheiro">Dinheiro</option>
              </Select>
            </Field>
          </div>
          <Button type="submit" className="w-full">Salvar Pagamento</Button>
        </form>
      </Modal>

      {/* MODAL DE PRÉ-VISUALIZAÇÃO DO RELATÓRIO */}
      <Modal open={reportModal} onClose={() => setReportModal(false)} title="Pré-visualização do Relatório" wide>
        <div className="bg-white text-black p-8 rounded-lg shadow-inner max-h-[60vh] overflow-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b-2 border-black pb-4 mb-6 gap-4">
            <div className="flex items-center gap-4">
              <img src="/logo.png" alt="CT Spartan Logo" className="w-20 object-contain brightness-0" />
              <div>
                <h2 className="font-black text-xl uppercase tracking-tight">CT Spartan</h2>
                <p className="text-gray-600 text-xs">Rua dos Espartanos, 300 - Centro</p>
                <p className="text-gray-600 text-xs">(11) 99999-9999 | contato@ctspartan.com</p>
              </div>
            </div>
            <div className="text-left md:text-right">
              <h2 className="text-xl font-black uppercase tracking-tight">Relatório Financeiro</h2>
              <p className="font-bold uppercase text-xs mt-1">Filtro: {filter === 'todos' ? 'Geral' : filter}</p>
              <p className="text-[10px] text-gray-500 mt-1">Data: {new Date().toLocaleDateString('pt-BR')}</p>
            </div>
          </div>
          
          <div className="flex gap-8 mb-8">
            <div><p className="text-xs text-gray-500 uppercase tracking-wider">Recebido</p><p className="text-lg font-bold">{brl(totalPago)}</p></div>
            <div><p className="text-xs text-gray-500 uppercase tracking-wider">A Receber</p><p className="text-lg font-bold">{brl(totalPendente)}</p></div>
            <div><p className="text-xs text-gray-500 uppercase tracking-wider">Inadimplentes</p><p className="text-lg font-bold text-red-600">{brl(totalInadimplente)}</p></div>
          </div>
          
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-black">
                <th className="py-2 font-bold uppercase text-xs">Aluna</th>
                <th className="py-2 font-bold uppercase text-xs">Plano</th>
                <th className="py-2 font-bold uppercase text-xs">Valor</th>
                <th className="py-2 font-bold uppercase text-xs">Vencimento</th>
                <th className="py-2 font-bold uppercase text-xs">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map(p => (
                <tr key={p.id} className="border-b border-gray-300">
                  <td className="py-2">{p.studentId?.name || '—'}</td>
                  <td className="py-2">{p.planId?.name || '—'}</td>
                  <td className="py-2">{brl(p.amount)}</td>
                  <td className="py-2">{fmtDate(p.dueDate)}</td>
                  <td className="py-2 uppercase font-bold text-[10px]">{p.status}</td>
                </tr>
              ))}
              {filteredPayments.length === 0 && (
                <tr><td colSpan="5" className="py-4 text-center text-gray-500">Nenhum registro para exibir neste relatório.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={() => setReportModal(false)}>Cancelar</Button>
          <Button onClick={() => { 
            setReportModal(false); 
            setTimeout(() => window.print(), 300); 
          }}>
            <Printer size={16} className="inline mr-2" />
            Imprimir / Salvar PDF
          </Button>
        </div>
      </Modal>

      {/* CONTEÚDO EXCLUSIVO PARA IMPRESSÃO (Oculto na tela normal, visível ao imprimir) */}
      <div className="hidden print:block fixed inset-0 z-[9999] bg-white text-black p-8 text-sm">
        <div className="flex justify-between items-end border-b-2 border-black pb-4 mb-6">
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="CT Spartan Logo" className="w-24 object-contain brightness-0" />
            <div>
              <h1 className="font-black text-2xl uppercase tracking-tight">CT Spartan</h1>
              <p className="text-gray-600 text-sm mt-1">Rua dos Espartanos, 300 - Centro</p>
              <p className="text-gray-600 text-sm">Telefone: (11) 99999-9999 | Email: contato@ctspartan.com</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-black uppercase tracking-tight">Relatório Financeiro</h2>
            <p className="font-bold uppercase text-sm mt-1">Filtro: {filter === 'todos' ? 'Geral' : filter}</p>
            <p className="text-xs text-gray-500 mt-1">Gerado em: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}</p>
          </div>
        </div>
        
        <div className="flex gap-12 mb-8">
          <div><p className="text-xs text-gray-500 uppercase tracking-wider">Recebido</p><p className="text-xl font-bold">{brl(totalPago)}</p></div>
          <div><p className="text-xs text-gray-500 uppercase tracking-wider">A Receber</p><p className="text-xl font-bold">{brl(totalPendente)}</p></div>
          <div><p className="text-xs text-gray-500 uppercase tracking-wider">Inadimplentes</p><p className="text-xl font-bold">{brl(totalInadimplente)}</p></div>
        </div>
        
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b-2 border-black">
              <th className="py-2 font-bold uppercase text-xs">Aluna</th>
              <th className="py-2 font-bold uppercase text-xs">Plano</th>
              <th className="py-2 font-bold uppercase text-xs">Valor</th>
              <th className="py-2 font-bold uppercase text-xs">Vencimento</th>
              <th className="py-2 font-bold uppercase text-xs">Pago em</th>
              <th className="py-2 font-bold uppercase text-xs">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayments.map(p => (
              <tr key={p.id} className="border-b border-gray-300">
                <td className="py-2">{p.studentId?.name || '—'}</td>
                <td className="py-2">{p.planId?.name || '—'}</td>
                <td className="py-2">{brl(p.amount)}</td>
                <td className="py-2">{fmtDate(p.dueDate)}</td>
                <td className="py-2">{p.paidAt ? fmtDate(p.paidAt) : '—'}</td>
                <td className="py-2 uppercase font-bold text-[10px]">{p.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
