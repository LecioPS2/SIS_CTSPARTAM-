import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import DashboardLayout from './layouts/DashboardLayout';
import StudentLayout from './layouts/StudentLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import Alunos from './pages/admin/Alunos';
import Personais from './pages/admin/Personais';
import Planos from './pages/admin/Planos';
import Pagamentos from './pages/admin/Pagamentos';
import Avisos from './pages/admin/Avisos';
import Exercicios from './pages/shared/Exercicios';
import PlanosAlimentares from './pages/shared/PlanosAlimentares';
import PersonalDashboard from './pages/personal/PersonalDashboard';
import MeusAlunos from './pages/personal/MeusAlunos';
import Treinos from './pages/personal/Treinos';
import Agenda from './pages/personal/Agenda';
import Hoje from './pages/student/Hoje';
import Evolucao from './pages/student/Evolucao';
import Mensalidade from './pages/student/Mensalidade';
import Perfil from './pages/student/Perfil';
import Dieta from './pages/student/Dieta';
import CheckinAdmin from './pages/admin/CheckinAdmin';
import Configuracoes from './pages/admin/Configuracoes';
import { LayoutDashboard, Users, UserCog, CreditCard, Wallet, Dumbbell, ClipboardList, CalendarDays, QrCode, Settings, Megaphone, Utensils } from 'lucide-react';

const adminNav = [
  { to: '/admin', label: 'Visão Geral', icon: LayoutDashboard, end: true, testId: 'admin-dashboard' },
  { to: '/admin/alunos', label: 'Alunas', icon: Users, testId: 'admin-alunos' },
  { to: '/admin/personais', label: 'Personais', icon: UserCog, testId: 'admin-personais' },
  { to: '/admin/planos', label: 'Planos', icon: CreditCard, testId: 'admin-planos' },
  { to: '/admin/pagamentos', label: 'Financeiro', icon: Wallet, testId: 'admin-pagamentos' },
  { to: '/admin/exercicios', label: 'Exercícios', icon: Dumbbell, testId: 'admin-exercicios' },
  { to: '/admin/dieta', label: 'Plano Alimentar', icon: Utensils, testId: 'admin-dieta' },
  { to: '/admin/checkin', label: 'Check-in', icon: QrCode, testId: 'admin-checkin' },
  { to: '/admin/avisos', label: 'Avisos', icon: Megaphone, testId: 'admin-avisos' },
  { to: '/admin/configuracoes', label: 'Configurações', icon: Settings, testId: 'admin-configuracoes' },
];

const personalNav = [
  { to: '/personal', label: 'Visão Geral', icon: LayoutDashboard, end: true, testId: 'personal-dashboard' },
  { to: '/personal/alunos', label: 'Minhas Alunas', icon: Users, testId: 'personal-alunos' },
  { to: '/personal/treinos', label: 'Treinos', icon: ClipboardList, testId: 'personal-treinos' },
  { to: '/personal/agenda', label: 'Agenda', icon: CalendarDays, testId: 'personal-agenda' },
  { to: '/personal/exercicios', icon: Dumbbell, testId: 'personal-exercicios' },
  { to: '/personal/dieta', label: 'Plano Alimentar', icon: Utensils, testId: 'personal-dieta' },
];

function Protected({ role, roles, children }) {
  const { user } = useAuth();
  if (user === null) {
    return <div className="min-h-screen flex items-center justify-center text-muted">Carregando...</div>;
  }
  if (user === false) return <Navigate to="/login" replace />;
  const allowedRoles = roles || [role];
  if (!allowedRoles.includes(user.role)) {
    const home = user.role === 'admin' || user.role === 'assessor' ? '/admin' : user.role === 'personal' ? '/personal' : '/aluno';
    return <Navigate to={home} replace />;
  }
  return children;
}

function Home() {
  const { user } = useAuth();
  if (user === null) return <div className="min-h-screen flex items-center justify-center text-muted">Carregando...</div>;
  if (user === false) return <Navigate to="/login" replace />;
  const home = user.role === 'admin' || user.role === 'assessor' ? '/admin' : user.role === 'personal' ? '/personal' : '/aluno';
  return <Navigate to={home} replace />;
}

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-6">
          <p className="font-display text-4xl uppercase">Algo deu errado</p>
          <button onClick={() => window.location.reload()} className="bg-accent hover:bg-accenth text-white px-5 py-2 rounded transition-colors" data-testid="error-reload-button">Recarregar</button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ErrorBoundary>
        <Toaster theme="dark" position="bottom-right" toastOptions={{ style: { background: '#0a1428', border: '1px solid #1c2a45', color: '#fff' } }} />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<Protected roles={['admin', 'assessor']}><DashboardLayout nav={adminNav}><AdminDashboard /></DashboardLayout></Protected>} />
          <Route path="/admin/alunos" element={<Protected roles={['admin', 'assessor']}><DashboardLayout nav={adminNav}><Alunos /></DashboardLayout></Protected>} />
          <Route path="/admin/personais" element={<Protected role="admin"><DashboardLayout nav={adminNav}><Personais /></DashboardLayout></Protected>} />
          <Route path="/admin/planos" element={<Protected role="admin"><DashboardLayout nav={adminNav}><Planos /></DashboardLayout></Protected>} />
          <Route path="/admin/pagamentos" element={<Protected roles={['admin', 'assessor']}><DashboardLayout nav={adminNav}><Pagamentos /></DashboardLayout></Protected>} />
          <Route path="/admin/exercicios" element={<Protected role="admin"><DashboardLayout nav={adminNav}><Exercicios /></DashboardLayout></Protected>} />
          <Route path="/admin/dieta" element={<Protected role="admin"><DashboardLayout nav={adminNav}><PlanosAlimentares /></DashboardLayout></Protected>} />
          <Route path="/admin/montar-treino" element={<Protected role="admin"><DashboardLayout nav={adminNav}><Treinos /></DashboardLayout></Protected>} />
          <Route path="/admin/checkin" element={<Protected roles={['admin', 'assessor']}><DashboardLayout nav={adminNav}><CheckinAdmin /></DashboardLayout></Protected>} />
          <Route path="/admin/avisos" element={<Protected role="admin"><DashboardLayout nav={adminNav}><Avisos /></DashboardLayout></Protected>} />
          <Route path="/admin/configuracoes" element={<Protected role="admin"><DashboardLayout nav={adminNav}><Configuracoes /></DashboardLayout></Protected>} />
          <Route path="/personal" element={<Protected role="personal"><DashboardLayout nav={personalNav}><PersonalDashboard /></DashboardLayout></Protected>} />
          <Route path="/personal/alunos" element={<Protected role="personal"><DashboardLayout nav={personalNav}><MeusAlunos /></DashboardLayout></Protected>} />
          <Route path="/personal/treinos" element={<Protected role="personal"><DashboardLayout nav={personalNav}><Treinos /></DashboardLayout></Protected>} />
          <Route path="/personal/agenda" element={<Protected role="personal"><DashboardLayout nav={personalNav}><Agenda /></DashboardLayout></Protected>} />
          <Route path="/personal/exercicios" element={<Protected role="personal"><DashboardLayout nav={personalNav}><Exercicios /></DashboardLayout></Protected>} />
          <Route path="/personal/dieta" element={<Protected role="personal"><DashboardLayout nav={personalNav}><PlanosAlimentares /></DashboardLayout></Protected>} />
          <Route path="/aluno" element={<Protected role="aluno"><StudentLayout><Hoje /></StudentLayout></Protected>} />
          <Route path="/aluno/evolucao" element={<Protected role="aluno"><StudentLayout><Evolucao /></StudentLayout></Protected>} />
          <Route path="/aluno/mensalidade" element={<Protected role="aluno"><StudentLayout><Mensalidade /></StudentLayout></Protected>} />
          <Route path="/aluno/perfil" element={<Protected role="aluno"><StudentLayout><Perfil /></StudentLayout></Protected>} />
          <Route path="/aluno/dieta" element={<Protected role="aluno"><StudentLayout><Dieta /></StudentLayout></Protected>} />
          <Route path="*" element={<Home />} />
        </Routes>
        </ErrorBoundary>
      </BrowserRouter>
    </AuthProvider>
  );
}

