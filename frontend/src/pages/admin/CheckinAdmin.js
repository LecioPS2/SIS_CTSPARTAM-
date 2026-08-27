import React, { useEffect, useState, useRef } from 'react';
import api from '../../lib/api';
import { toast } from 'sonner';
import { Card, PageHeader, Badge, Empty, Button, Field, Select, Th, Td } from '../../components/ui';
import { QrCode, Camera, CameraOff, UserCheck, Filter, CalendarDays, Activity, BarChart3, Clock } from 'lucide-react';

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

  useEffect(() => {
    return () => stopScanner();
  }, []);

  const startScanner = async () => {
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const scanner = new Html5Qrcode('qr-reader');
      html5QrRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          try {
            const res = await api.post('/checkin/validate', { token: decodedText });
            setLastResult({ success: true, name: res.data.student.name, time: res.data.checkin.time });
            toast.success(`Check-in: ${res.data.student.name}`);
            loadReports();
          } catch (err) {
            const msg = err.response?.data?.error || 'Erro ao validar';
            const name = err.response?.data?.student?.name;
            setLastResult({ success: false, name: name || '—', message: msg });
            toast.error(msg);
          }
          stopScanner();
          setScanning(false);
        },
        () => {}
      );
      setScanning(true);
      setLastResult(null);
    } catch (err) {
      toast.error('Erro ao acessar a câmera. Verifique as permissões.');
    }
  };

  const stopScanner = async () => {
    if (html5QrRef.current && html5QrRef.current.isScanning) {
      try { await html5QrRef.current.stop(); } catch (e) {}
    }
    setScanning(false);
  };

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
          <Card className="overflow-hidden shadow-xl" data-testid="scanner-card">
            <div className="flex items-center justify-between px-5 py-4 bg-surface/50 border-b border-line">
              <p className="text-xs uppercase tracking-[0.2em] text-muted font-bold flex items-center gap-2">
                <QrCode size={14} className="text-accent" /> Leitor QR
              </p>
              {!scanning ? (
                <Button onClick={startScanner} size="sm" data-testid="start-scanner-button">
                  <Camera size={14} className="mr-2 inline" /> Iniciar
                </Button>
              ) : (
                <Button onClick={stopScanner} variant="ghost" size="sm" className="text-accent hover:text-accent/80 hover:bg-accent/10">
                  <CameraOff size={14} className="mr-2 inline" /> Parar
                </Button>
              )}
            </div>
            <div className="p-5">
              <div
                id="qr-reader"
                className={`w-full overflow-hidden rounded-xl border-2 transition-all ${scanning ? 'border-accent shadow-lg shadow-accent/20 bg-black' : 'border-dashed border-line bg-surface/30'}`}
                style={{ minHeight: scanning ? '250px' : '200px' }}
                ref={scannerRef}
              >
                {!scanning && (
                  <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-muted gap-3">
                    <QrCode size={48} className="opacity-20" />
                    <p className="text-sm">Clique em "Iniciar" para escanear</p>
                  </div>
                )}
              </div>

              {lastResult && (
                <div className={`mt-4 p-4 rounded-lg border ${lastResult.success ? 'border-ok/40 bg-ok/10' : 'border-accent/40 bg-accent/10'}`}>
                  <div className="flex items-center gap-3">
                    <UserCheck size={20} className={lastResult.success ? 'text-ok' : 'text-accent'} />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate text-white">{lastResult.name}</p>
                      <p className="text-xs text-muted truncate">
                        {lastResult.success ? `Registrado às ${lastResult.time}` : lastResult.message}
                      </p>
                    </div>
                  </div>
                </div>
              )}
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
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line/30">
                    {reports.map((c) => (
                      <tr key={c.id} className="hover:bg-surface/30 transition-colors">
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
}
