// src/components/RegisterUserModal.tsx

import React, { useState } from 'react';
import { X, UserPlus } from 'lucide-react';
import { User } from '../types';

interface RegisterUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegister: (userData: Omit<User, 'id' | 'avatar' | 'status'>) => void;
  currentUserRole: User['role'];
}

export const RegisterUserModal: React.FC<RegisterUserModalProps> = ({ isOpen, onClose, onRegister, currentUserRole }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'manager' | 'supervisor' | 'employee'>(
    currentUserRole === 'director' ? 'manager' : 'supervisor'
  );
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !role) {
      setError('Todos os campos são obrigatórios.');
      return;
    }
    setError('');
    onRegister({ name, email, password, role });
  };

  return (
    // Fundo semi-transparente
    <div 
      className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      {/* Conteúdo do Modal */}
      <div 
        className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl w-full max-w-md p-6 animate-fade-in"
        onClick={e => e.stopPropagation()} // Impede que o clique dentro do modal o feche
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <UserPlus className="w-6 h-6 text-teal-400" />
            <h2 className="text-xl font-semibold text-white">Cadastrar Novo Usuário</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">Nome Completo</label>
            <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-white" />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">Email</label>
            <input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-white" />
          </div>
          <div>
            <label htmlFor="password"  className="block text-sm font-medium text-gray-300 mb-1">Senha Temporária</label>
            <input type="password" id="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-white" />
          </div>
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-300 mb-1">Cargo</label>
            <select id="role" value={role} onChange={e => setRole(e.target.value as any)} className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-white">
              {/* Diretor pode cadastrar Gerentes e Supervisores */}
              {currentUserRole === 'director' && (
                <>
                  <option value="manager">Gerente</option>
                  <option value="supervisor">Supervisor</option>
                </>
              )}
              {/* Gerente só pode cadastrar Supervisores */}
              {currentUserRole === 'manager' && (
                <option value="supervisor">Supervisor</option>
              )}
            </select>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-600 hover:bg-slate-500 rounded-md text-white">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-teal-600 hover:bg-teal-700 rounded-md text-white font-semibold">Cadastrar</button>
          </div>
        </form>
      </div>
    </div>
  );
};