// frontend/src/components/DirectoryList.tsx

import React from 'react';
import { Crown, Shield, User, ChevronDown } from 'lucide-react';
import { HierarchyNode, User as UserType } from '../types';

export interface DirectoryData {
  director?: HierarchyNode;
  managers: HierarchyNode[];
  supervisors: HierarchyNode[];
  employees: HierarchyNode[];
}

interface DirectoryListProps {
  data: DirectoryData;
  onNodeSelect: (node: HierarchyNode) => void;
  currentUser: UserType;
  // ✅ *** NOVO PASSO (FEATURE): Adiciona a prop *** ✅
  userUnreadCounts: Record<string, number>;
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
        online: 'bg-teal-500', away: 'bg-amber-500',
        busy: 'bg-red-500', offline: 'bg-gray-500',
    }[status || 'offline'];
    return <div className={`w-2 h-2 rounded-full ${color} flex-shrink-0`}></div>;
};

// ✅ *** NOVO PASSO (FEATURE): DirectoryRow agora usa a contagem *** ✅
const DirectoryRow: React.FC<{
  node: HierarchyNode, 
  onNodeSelect: (node: HierarchyNode) => void,
  userUnreadCounts: Record<string, number>
}> = ({node, onNodeSelect, userUnreadCounts}) => {
    
    // Pega a contagem para este usuário específico
    const count = userUnreadCounts[node.id] || 0;

    return (
        <div
            className="flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors hover:bg-slate-700/50 group"
            onClick={() => onNodeSelect(node)}
        >
            {getRoleIcon(node.role)}
            <StatusIndicatorDot status={node.status} />
            <span className={`text-sm font-medium flex-1 truncate ${count > 0 ? 'text-white' : 'text-gray-200'}`} title={node.name}>
                {node.name}
            </span>
            
            {/* Renderiza o badge de contagem se for maior que 0 */}
            {count > 0 && (
              <span className="bg-red-600 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                {count}
              </span>
            )}
        </div>
    );
};

// ✅ *** NOVO PASSO (FEATURE): Repassa a prop *** ✅
const CategorySection: React.FC<{
  title: string, 
  users: HierarchyNode[], 
  currentUser: UserType, 
  onNodeSelect: (node: HierarchyNode) => void,
  userUnreadCounts: Record<string, number>
}> = ({title, users, currentUser, onNodeSelect, userUnreadCounts}) => {
  const filteredUsers = users.filter(user => user.id !== currentUser.id);
  if (filteredUsers.length === 0) return null;

  return (
    <details open className="text-gray-400">
      <summary className="font-semibold text-sm list-none flex items-center gap-1 cursor-pointer p-1 hover:bg-slate-800 rounded">
        <ChevronDown className="w-4 h-4 transition-transform details-open:rotate-0 -rotate-90" />
        {title}
      </summary>
      <div className="pl-2 pt-1 mt-1 border-l border-slate-700 space-y-1">
        {filteredUsers.map(node => (
            <DirectoryRow 
                key={node.id} 
                node={node} 
                onNodeSelect={onNodeSelect} 
                userUnreadCounts={userUnreadCounts} 
            />
        ))}
      </div>
    </details>
  );
};

// ✅ *** NOVO PASSO (FEATURE): Repassa a prop *** ✅
export const DirectoryList: React.FC<DirectoryListProps> = ({ data, onNodeSelect, currentUser, userUnreadCounts }) => {
  const { director, managers, supervisors, employees } = data;
  const role = currentUser.role;

  return (
    <div className="space-y-2">
      {/* Repassa 'userUnreadCounts' para cada Categoria */}
      {(role === 'director' || role === 'manager') && (
        <>
          {director && role === 'manager' && <CategorySection title="DIRETORIA" users={[director]} currentUser={currentUser} onNodeSelect={onNodeSelect} userUnreadCounts={userUnreadCounts} />}
          <CategorySection title="GERENTES" users={managers} currentUser={currentUser} onNodeSelect={onNodeSelect} userUnreadCounts={userUnreadCounts} />
          <CategorySection title="SUPERVISORES" users={supervisors} currentUser={currentUser} onNodeSelect={onNodeSelect} userUnreadCounts={userUnreadCounts} />
          <CategorySection title="FUNCIONÁRIOS" users={employees} currentUser={currentUser} onNodeSelect={onNodeSelect} userUnreadCounts={userUnreadCounts} />
        </>
      )}
      {role === 'supervisor' && (
        <>
          <CategorySection title="GERENTES" users={managers} currentUser={currentUser} onNodeSelect={onNodeSelect} userUnreadCounts={userUnreadCounts} />
          <CategorySection title="SUPERVISORES" users={supervisors} currentUser={currentUser} onNodeSelect={onNodeSelect} userUnreadCounts={userUnreadCounts} />
          <CategorySection title="FUNCIONÁRIOS" users={employees} currentUser={currentUser} onNodeSelect={onNodeSelect} userUnreadCounts={userUnreadCounts} />
        </>
      )}
      {role === 'employee' && (
        <>
          <CategorySection title="SUPERVISORES" users={supervisors} currentUser={currentUser} onNodeSelect={onNodeSelect} userUnreadCounts={userUnreadCounts} />
          <CategorySection title="FUNCIONÁRIOS" users={employees} currentUser={currentUser} onNodeSelect={onNodeSelect} userUnreadCounts={userUnreadCounts} />
        </>
      )}
    </div>
  );
};