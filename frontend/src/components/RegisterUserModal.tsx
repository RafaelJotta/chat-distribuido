// src/components/RegisterUserModal.tsx

import React, { useState, useEffect } from 'react';
import { X, UserPlus } from 'lucide-react';
import { User } from '../types';

interface RegisterUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  // ✅ *** CORREÇÃO BUG 1: A prop agora espera uma Promise<boolean> ***
  onRegister: (userData: Omit<User, 'id' | 'avatar' | 'status'>) => Promise<boolean>;
  currentUserRole: User['role'];
}

type NewUserRole = 'director' | 'manager' | 'supervisor' | 'employee';

export const RegisterUserModal: React.FC<RegisterUserModalProps> = ({ isOpen, onClose, onRegister, currentUserRole }) => {
  
  const getDefaultRole = (): NewUserRole => {
    if (currentUserRole === 'director') return 'manager';
    if (currentUserRole === 'manager') return 'supervisor';
    if (currentUserRole === 'supervisor') return 'employee';
    return 'employee'; // Fallback
  };
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<NewUserRole>(getDefaultRole());
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Adiciona estado de loading

  // ✅ *** CORREÇÃO BUG 1: Função para limpar o formulário ***
  const clearForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setError('');
    setRole(getDefaultRole());
  };

  // Limpa o formulário sempre que o modal for aberto
  useEffect(() => {
    if (isOpen) {
      clearForm();
    }
  }, [isOpen]); // Dependência 'isOpen' garante que rode ao abrir

  if (!isOpen) return null;

  // ✅ *** CORREÇÃO BUG 1 & 2: handleSubmit atualizado ***
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // BUG 2 (Validação): Usa trim() para evitar campos com espaços
    if (!name.trim() || !email.trim() || !password.trim() || !role) {
      setError('Todos os campos são obrigatórios.');
      return;
    }
    
    setError('');
    setIsLoading(true); // Ativa o loading

    try {
      // BUG 1 (Limpeza): Espera o resultado do onRegister
      const success = await onRegister({ 
        name: name.trim(), 
        email: email.trim(), 
        password, // A senha não deve ter trim()
        role 
      });
      
      if (success) {
        // clearForm(); // Não precisa mais, o useEffect cuida disso
        onClose(); // Fecha o modal
      }
      // Se 'success' for falso, o 'alert' no App.tsx cuidou do erro
      // e o modal permanece aberto para o usuário corrigir.

    } catch (e) {
      // O alert já foi mostrado no App.tsx
      console.error(e);
    } finally {
      setIsLoading(false); // Desativa o loading
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl w-full max-w-md p-6 animate-fade-in"
        onClick={e => e.stopPropagation()}
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
            
            <select id="role" value={role} onChange={e => setRole(e.target.value as NewUserRole)} className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-white">
              
              {/* Diretor pode cadastrar todos */}
              {currentUserRole === 'director' && (
                <>
                  <option value="director">Diretor</option>
                  <option value="manager">Gerente</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="employee">Funcionário</option>
                </>
              )}
              
              {/* Gerente pode cadastrar Supervisor e Funcionário */}
              {currentUserRole === 'manager' && (
                <>
                  <option value="supervisor">Supervisor</option>
                  <option value="employee">Funcionário</option>
                </>
              )}

              {/* Supervisor só pode cadastrar Funcionário */}
              {currentUserRole === 'supervisor' && (
                <option value="employee">Funcionário</option>
              )}

              {/* Funcionário não vê o botão, mas por segurança não mostramos nada */}
              {currentUserRole === 'employee' && (
                <option value="employee" disabled>Sem permissão</option>
              )}
            </select>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} disabled={isLoading} className="px-4 py-2 bg-slate-600 hover:bg-slate-500 rounded-md text-white disabled:opacity-50">Cancelar</button>
            <button type="submit" disabled={isLoading} className="px-4 py-2 bg-teal-600 hover:bg-teal-700 rounded-md text-white font-semibold disabled:opacity-50">
              {isLoading ? "Cadastrando..." : "Cadastrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};