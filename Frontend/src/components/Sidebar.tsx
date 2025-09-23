// src/components/Sidebar.tsx

import React from 'react';
import { User, Settings, LogOut, Check } from 'lucide-react'; // Ícones não usados foram removidos
import { HierarchyTree } from './HierarchyTree.tsx';
import { StatusIndicator } from './StatusIndicator.tsx';
import { User as UserType, SystemStatus, HierarchyNode } from '../types/index.ts';

interface SidebarProps {
  currentUser: UserType;
  hierarchyNodes: HierarchyNode[];
  systemStatus: SystemStatus;
  onNodeSelect: (node: HierarchyNode) => void;
  onLogout: () => void;
  onStatusChange: (status: 'online' | 'away' | 'busy' | 'offline') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  hierarchyNodes,
  systemStatus,
  onNodeSelect,
  onLogout,
  onStatusChange,
}) => {
  const [showSettings, setShowSettings] = React.useState(false);

  const statusOptions = [
      { key: 'online', label: 'Online', color: 'bg-teal-500' },
      { key: 'away', label: 'Ausente', color: 'bg-amber-500' },
      { key: 'busy', label: 'Ocupado', color: 'bg-red-500' },
      { key: 'offline', label: 'Invisível', color: 'bg-gray-500' },
  ] as const;

  return (
    <div className="w-80 bg-slate-900 border-r border-slate-700 flex flex-col">
      {/* ... (código do User Profile e Settings continua o mesmo) ... */}
      <div className="p-4 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-600 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-white">{currentUser.name}</h3>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                currentUser.status === 'online' ? 'bg-teal-500' :
                currentUser.status === 'away' ? 'bg-amber-500' :
                currentUser.status === 'busy' ? 'bg-red-500' : 'bg-gray-500'
              }`} />
              <span className="text-sm text-gray-400 capitalize">
                {currentUser.role}
              </span>
            </div>
          </div>
          <div className="relative">
            <Settings 
              className="w-4 h-4 text-gray-400 cursor-pointer hover:text-white transition-colors" 
              onClick={() => setShowSettings(!showSettings)}
            />
            {showSettings && (
              <div className="absolute top-full right-0 mt-2 w-56 bg-slate-800 border border-slate-600 rounded-lg shadow-lg z-50 animate-fade-in">
                <div className="p-2">
                    <p className="px-2 py-1 text-xs font-semibold text-gray-400">Definir status</p>
                    {statusOptions.map(status => (
                        <button key={status.key} onClick={() => { onStatusChange(status.key); setShowSettings(false);}} className="flex items-center gap-3 w-full px-2 py-2 text-sm text-gray-300 hover:bg-slate-700 hover:text-white transition-colors rounded-md">
                            <div className={`w-2.5 h-2.5 rounded-full ${status.color}`} />
                            {status.label}
                            {currentUser.status === status.key && <Check className="w-4 h-4 ml-auto text-teal-400" />}
                        </button>
                    ))}
                </div>
                <hr className="my-1 border-slate-600" />
                <div className="py-1">
                  <button onClick={onLogout} className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-400 hover:bg-slate-700 hover:text-red-300 transition-colors">
                    <LogOut className="w-4 h-4" /> Sair
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>


      <div className="flex-1 p-4 overflow-y-auto">
        <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
          Hierarquia da Empresa
        </h4>
        <HierarchyTree
          nodes={hierarchyNodes}
          onNodeSelect={onNodeSelect}
          // MUDANÇA: Passando o usuário atual para a árvore
          currentUser={currentUser}
        />
      </div>

      <div className="p-4 border-t border-slate-700">
        <StatusIndicator status={systemStatus} />
      </div>
    </div>
  );
};