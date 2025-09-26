// src/components/LoginScreen.tsx

import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Shield, ArrowRight } from 'lucide-react';
import { User } from '../types';

interface LoginScreenProps {
  onLogin: (user: User) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Esta lógica agora se comunicará com seu backend real
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const userData: User = await response.json();
        onLogin(userData);
      } else {
        setError('Credenciais inválidas. Verifique seu email e senha.');
      }
    } catch (err) {
      setError('Não foi possível conectar ao servidor. Tente novamente.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 relative overflow-hidden flex items-center justify-center">
      {/* Fundo Animado */}
      <div className="absolute inset-0">
        <div className="particles-container">{Array.from({ length: 50 }).map((_, i) => (<div key={i} className="particle" style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 20}s`, animationDuration: `${15 + Math.random() * 10}s` }} />))}</div>
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-slate-800/95 to-slate-900/90" />
      </div>

      {/* Card de Login */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-600/20 rounded-full mb-4">
              <Shield className="w-8 h-8 text-teal-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Chat Empresarial</h1>
            <p className="text-sm text-gray-400">Comunicação e Hierarquia</p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-6">
            <div className="text-center mb-6"><h2 className="text-xl font-semibold text-white mb-1">Acesse sua Conta</h2><p className="text-sm text-gray-400">Entre com suas credenciais corporativas</p></div>
            <div className="space-y-2"><label htmlFor="email" className="block text-sm font-medium text-gray-300">Email Corporativo</label><div className="relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Mail className="h-5 w-5 text-gray-400" /></div><input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="block w-full pl-10 pr-3 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="seu.email@empresa.com" required /></div></div>
            <div className="space-y-2"><label htmlFor="password" className="block text-sm font-medium text-gray-300">Senha</label><div className="relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Lock className="h-5 w-5 text-gray-400" /></div><input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="block w-full pl-10 pr-12 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="Digite sua senha" required /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-300">{showPassword ? (<EyeOff className="h-5 w-5" />) : (<Eye className="h-5 w-5" />)}</button></div></div>
            {error && <p className="text-center text-sm text-red-400">{error}</p>}
            <button type="submit" disabled={isLoading} className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-teal-800 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2 group">{isLoading ? (<><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Autenticando...</>) : (<>Entrar<ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>)}</button>
          </form>
        </div>
      </div>
    </div>
  );
};