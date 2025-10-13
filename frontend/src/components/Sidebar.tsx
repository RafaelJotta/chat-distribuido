// frontend/src/components/Sidebar.tsx

import React, { useState } from 'react';
import { User as UserIcon, Settings, LogOut, Check, Search, Users, UserPlus } from 'lucide-react';
import { DirectoryList, DirectoryData } from './DirectoryList';
import { StatusIndicator } from './StatusIndicator';
// ✅ REMOVIDO: Não precisamos mais importar o RegisterUserModal aqui
// import { RegisterUserModal } from './RegisterUserModal';
import { RecentChats } from './RecentChats';
import { User, SystemStatus, HierarchyNode, RecentChatItem } from '../types/index';

interface SidebarProps {
  currentUser: User;
  directoryData: DirectoryData;
  recentChats: RecentChatItem[];
  systemStatus: SystemStatus;
  onNodeSelect: (node: HierarchyNode) => void;
  onOpenGroupChat: (channelType: 'managers' | 'supervisors' | 'employees') => void;
  onSelectRecentChat: (chat: RecentChatItem) => void;
  onLogout: () => void;
  onStatusChange: (status: 'online' | 'away' | 'busy' | 'offline') => void;
  // ✅ CORREÇÃO: onRegisterUser agora é apenas uma função que abre o modal, sem argumentos.
  onRegisterUser: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  directoryData,
  recentChats,
  systemStatus,
  onNodeSelect,
  onOpenGroupChat,
  onSelectRecentChat,
  onLogout,
  onStatusChange,
  onRegisterUser, // A função para abrir o modal agora é recebida aqui
}) => {
  const [showSettings, setShowSettings] = useState(false);
  // ✅ REMOVIDO: O estado do modal não pertence mais à Sidebar
  // const [isRegisterModalOpen, setRegisterModalOpen] = useState(false);

  const statusOptions = [
    { key: 'online' as const, label: 'Online', color: 'bg-teal-500' },
    { key: 'away' as const, label: 'Ausente', color: 'bg-amber-500' },
    { key: 'busy' as const, label: 'Ocupado', color: 'bg-red-500' },
    { key: 'offline' as const, label: 'Invisível', color: 'bg-gray-500' },
  ];

  return (
    <div className="w-80 bg-slate-900 border-r border-slate-700 flex flex-col">
      {/* ... (código do cabeçalho do usuário, que permanece o mesmo) ... */}
      <div className="p-4 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-600 rounded-full flex items-center justify-center">
            <UserIcon className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-white">{currentUser.name} (Você)</h3>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${currentUser.status === 'online' ? 'bg-teal-500' : 'bg-gray-500'}`} />
              <span className="text-sm text-gray-400 capitalize">{currentUser.role}</span>
            </div>
          </div>
          <div className="relative">
            <Settings className="w-4 h-4 text-gray-400 cursor-pointer hover:text-white" onClick={() => setShowSettings(!showSettings)} />
            {showSettings && (
              <div className="absolute top-full right-0 mt-2 w-56 bg-slate-800 border border-slate-600 rounded-lg shadow-lg z-50">
                <div className="p-2">
                  <p className="px-2 py-1 text-xs font-semibold text-gray-400">Definir status</p>
                  {statusOptions.map(status => (<button key={status.key} onClick={() => { onStatusChange(status.key); setShowSettings(false);}} className="flex items-center gap-3 w-full px-2 py-2 text-sm text-gray-300 hover:bg-slate-700 hover:text-white transition-colors rounded-md"><div className={`w-2.5 h-2.5 rounded-full ${status.color}`} />{status.label}{currentUser.status === status.key && <Check className="w-4 h-4 ml-auto text-teal-400" />}</button>))}
                </div>
                <hr className="my-1 border-slate-600" />
                {(currentUser.role === 'director' || currentUser.role === 'manager') && (
                  <div className="py-1">
                    {/* ✅ CORREÇÃO: O botão agora chama a prop onRegisterUser diretamente */}
                    <button onClick={() => { onRegisterUser(); setShowSettings(false); }} className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-300 hover:bg-slate-700">
                      <UserPlus className="w-4 h-4" /> Cadastrar Usuário
                    </button>
                  </div>
                )}
                <hr className="my-1 border-slate-600" />
                <div className="py-1">
                  <button onClick={onLogout} className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-400 hover:bg-slate-700">
                    <LogOut className="w-4 h-4" /> Sair
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* ... (resto do código da Sidebar, que permanece o mesmo) ... */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        <div className="p-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="search" placeholder="Buscar pessoas ou canais..." className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"/>
          </div>
          
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">Conversas Recentes</h4>
            <RecentChats chats={[]} onSelect={() => {}} />
          </div>

          <div className="border-t border-slate-700 pt-4">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">Canais</h4>
            <div className="space-y-1">
              {currentUser.role === 'director' && (<button onClick={() => onOpenGroupChat('managers')} className="w-full flex items-center gap-3 p-2 text-sm text-gray-300 hover:bg-slate-700/50 rounded-lg"><Users className="w-4 h-4 text-blue-400" /> Gerentes</button>)}
              {(currentUser.role === 'director' || currentUser.role === 'manager') && (<button onClick={() => onOpenGroupChat('supervisors')} className="w-full flex items-center gap-3 p-2 text-sm text-gray-300 hover:bg-slate-700/50 rounded-lg"><Users className="w-4 h-4 text-teal-400" /> Supervisores</button>)}
              {(currentUser.role === 'director' || currentUser.role === 'manager' || currentUser.role === 'supervisor') && (<button onClick={() => onOpenGroupChat('employees')} className="w-full flex items-center gap-3 p-2 text-sm text-gray-300 hover:bg-slate-700/50 rounded-lg"><Users className="w-4 h-4 text-green-400" /> Funcionários</button>)}
            </div>
          </div>
          
          <div className="border-t border-slate-700 pt-4">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">Diretório</h4>
            <DirectoryList data={directoryData} onNodeSelect={onNodeSelect} currentUser={currentUser} />
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-slate-700 mt-auto">
        <StatusIndicator status={systemStatus} />
      </div>
      
      {/* ✅ REMOVIDO: O modal não é mais renderizado aqui */}
    </div>
  );
};