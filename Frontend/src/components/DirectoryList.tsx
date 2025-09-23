// src/components/DirectoryList.tsx

import React from 'react';
import { Crown, Shield, User, MicOff, UserX, ChevronDown } from 'lucide-react';
import { HierarchyNode, User as UserType } from '../types';

// O tipo de dados que este componente espera agora. Será um objeto com arrays para cada cargo.
export interface DirectoryData {
  managers: HierarchyNode[];
  supervisors: HierarchyNode[];
  employees: HierarchyNode[];
}

interface DirectoryListProps {
  data: DirectoryData;
  onNodeSelect: (node: HierarchyNode) => void;
  currentUser: UserType;
}

const getRoleIcon = (role: string) => {
    switch (role) {
        case 'director': return <Crown className="w-4 h-4 text-amber-400 flex-shrink-0" />;
        case 'manager': return <Shield className="w-4 h-4 text-blue-400 flex-shrink-0" />;
        case 'supervisor': return <User className="w-4 h-4 text-teal-400 flex-shrink-0" />;
        default: return <User className="w-4 h-4 text-gray-400 flex-shrink-0" />;
    }
};

const StatusIndicatorDot: React.FC<{ status?: UserType['status'] }> = ({ status }) => {
    const color = {
        online: 'bg-teal-500',
        away: 'bg-amber-500',
        busy: 'bg-red-500',
        offline: 'bg-gray-500',
    }[status || 'offline'];
    return <div className={`w-2 h-2 rounded-full ${color} flex-shrink-0`}></div>;
};

// Componente para uma única linha de usuário na lista
const DirectoryRow: React.FC<{node: HierarchyNode, currentUser: UserType, onNodeSelect: (node: HierarchyNode) => void}> = ({node, currentUser, onNodeSelect}) => {
    const canModerate = 
        node.id !== currentUser.id &&
        (currentUser.role === 'director' || (currentUser.role === 'manager' && node.role === 'supervisor'));

    return (
        <div
            className="flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors hover:bg-slate-700/50 group"
            onClick={() => onNodeSelect(node)}
        >
            {getRoleIcon(node.role)}
            <StatusIndicatorDot status={node.status} />
            <span className="text-sm font-medium text-gray-200 flex-1 truncate" title={node.name}>
                {node.name}
            </span>
            {canModerate && (
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); alert(`Silenciar ${node.name}`); }} title="Silenciar usuário" className="p-1 text-gray-400 hover:text-white hover:bg-slate-600 rounded"><MicOff className="w-4 h-4" /></button>
                    <button onClick={(e) => { e.stopPropagation(); alert(`Remover ${node.name}`); }} title="Remover usuário" className="p-1 text-red-500 hover:text-red-400 hover:bg-slate-600 rounded"><UserX className="w-4 h-4" /></button>
                </div>
            )}
        </div>
    );
};

// Componente principal que monta as seções
export const DirectoryList: React.FC<DirectoryListProps> = ({ data, onNodeSelect, currentUser }) => {
  // O CSS para a animação do <details> pode ser adicionado em index.css
  // summary::-webkit-details-marker { display: none }
  return (
    <div className="space-y-2">
        {/* Seção de Gerentes: visível apenas para Diretor */}
        {currentUser.role === 'director' && data.managers.length > 0 && (
            <details open className="text-gray-400">
                <summary className="font-semibold text-sm list-none flex items-center gap-1 cursor-pointer p-1 hover:bg-slate-800 rounded">
                    <ChevronDown className="w-4 h-4 transition-transform details-open:rotate-0 -rotate-90" />
                    GERENTES
                </summary>
                <div className="pl-2 pt-1 mt-1 border-l border-slate-700 space-y-1">
                    {data.managers.map(node => <DirectoryRow key={node.id} node={node} currentUser={currentUser} onNodeSelect={onNodeSelect} />)}
                </div>
            </details>
        )}

        {/* Seção de Supervisores: visível para Diretor e Gerentes */}
        {(currentUser.role === 'director' || currentUser.role === 'manager') && data.supervisors.length > 0 && (
            <details open className="text-gray-400">
                <summary className="font-semibold text-sm list-none flex items-center gap-1 cursor-pointer p-1 hover:bg-slate-800 rounded">
                    <ChevronDown className="w-4 h-4 transition-transform details-open:rotate-0 -rotate-90" />
                    SUPERVISORES
                </summary>
                <div className="pl-2 pt-1 mt-1 border-l border-slate-700 space-y-1">
                    {data.supervisors.map(node => <DirectoryRow key={node.id} node={node} currentUser={currentUser} onNodeSelect={onNodeSelect} />)}
                </div>
            </details>
        )}
    </div>
  );
};