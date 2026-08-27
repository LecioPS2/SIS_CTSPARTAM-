import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
const BG = '/login-hero.webp';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'personal') navigate('/personal');
      else navigate('/aluno');
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao entrar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:block lg:w-1/2 relative">
        <img src={BG} alt="Atleta treinando" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-bg" />
        <div className="absolute bottom-12 left-12">
          <p className="font-display text-6xl uppercase leading-none tracking-tight">Treine.<br /><span className="text-accent">Evolua.</span><br />Domine.</p>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center px-6">
        <form onSubmit={submit} className="w-full max-w-sm fade-up" data-testid="login-form">
          <div className="flex items-center gap-2 mb-10">
            <img src="/logo.png" alt="CT Spartan" className="w-11 h-11" />
            <span className="font-display text-3xl uppercase tracking-tight">CT Spartan</span>
          </div>
          <h1 className="font-display text-4xl uppercase tracking-tight mb-1">Acesse sua conta</h1>
          <p className="text-muted text-sm mb-8">Painel de gestão da academia</p>
          <div className="space-y-4">
            <div>
              <label className="text-xs uppercase tracking-[0.2em] text-muted block mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="seu@email.com"
                data-testid="login-email-input"
                className="w-full bg-surface border border-line rounded px-3 py-2.5 text-sm placeholder-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.2em] text-muted block mb-1.5">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                data-testid="login-password-input"
                className="w-full bg-surface border border-line rounded px-3 py-2.5 text-sm placeholder-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
              />
            </div>
            {error && <p className="text-accent text-sm" data-testid="login-error-message">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              data-testid="login-submit-button"
              className="w-full bg-accent hover:bg-accenth text-white font-medium py-2.5 rounded transition-colors duration-200 disabled:opacity-50"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
