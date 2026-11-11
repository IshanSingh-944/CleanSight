import React, { useState } from 'react';
import { ArrowLeft, Lock, Mail, User, ShieldCheck } from 'lucide-react';
import { API_BASE_URL } from '../config';

type Mode = 'login' | 'register';

interface AuthPageProps {
  onAuthSuccess: (user: { user_id: string; email: string; full_name?: string | null }) => void;
  onBack: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onAuthSuccess, onBack }) => {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Login failed.');
        onAuthSuccess(data.user);
      } else {
        const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, full_name: fullName || undefined }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Registration failed.');
        onAuthSuccess(data.user);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F7F4] text-[#252A2E] font-sans flex items-center justify-center px-6">
      <div className="max-w-md w-full space-y-6">
        <div className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4 text-[#69747D] hover:text-[#252A2E] cursor-pointer" onClick={onBack} />
          <span className="text-xs font-mono font-semibold text-[#252A2E]">CleanSight AI</span>
        </div>

        <div className="bg-white border border-[#E1E5E3] rounded-xl p-8 shadow-sm">
          <h2 className="text-2xl font-bold tracking-tight text-[#252A2E] mb-2">
            {mode === 'login' ? 'Welcome back' : 'Create an account'}
          </h2>
          <p className="text-sm text-[#69747D] mb-8">
            {mode === 'login'
              ? 'Sign in to access your datasets and cleaning history.'
              : 'Join CleanSight AI to profile and clean your data.'}
          </p>

          {error && (
            <div className="mb-6 p-3 rounded bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[#252A2E] uppercase tracking-wider">Email address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#69747D]" />
                <input
                  type="email"
                  autoComplete={mode === 'login' ? 'email' : 'new-email'}
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border border-[#E1E5E3] rounded-lg text-sm text-[#252A2E] focus:border-[#2868A6] focus:ring-1 focus:ring-[#2868A6] outline-none transition-colors"
                  placeholder="you@company.com"
                />
              </div>
            </div>

            {mode === 'register' && (
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[#252A2E] uppercase tracking-wider">Full name</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#69747D]" />
                  <input
                    type="text"
                    autoComplete="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 border border-[#E1E5E3] rounded-lg text-sm text-[#252A2E] focus:border-[#2868A6] focus:ring-1 focus:ring-[#2868A6] outline-none transition-colors"
                    placeholder="Jane Doe"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[#252A2E] uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#69747D]" />
                <input
                  type="password"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border border-[#E1E5E3] rounded-lg text-sm text-[#252A2E] focus:border-[#2868A6] focus:ring-1 focus:ring-[#2868A6] outline-none transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#252A2E] hover:bg-black text-white text-sm font-semibold rounded-lg transition-colors shadow-xs disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <p className="text-center text-xs text-[#69747D]">
            {mode === 'login'
              ? "Don't have an account? "
              : 'Already have an account? '}
            <button
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="font-semibold text-[#252A2E] hover:underline"
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>

          <div className="pt-6 border-t border-[#E1E5E3] flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-[#69747D]" />
            <span className="text-xs text-[#69747D]">Original data never mutated · Explicit approval required</span>
          </div>
        </div>
      </div>
    </div>
  );
};
