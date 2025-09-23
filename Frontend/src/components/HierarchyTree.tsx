// src/components/HierarchyTree.tsx

import React, { useState, useEffect } from 'react';
// MUDANÇA: Importando novos ícones para moderação
import { ChevronRight, ChevronDown, Crown, Shield, User, MicOff, UserX } from 'lucide-react';
import { HierarchyNode, User as UserType } from '../types';

interface HierarchyTreeProps {
  nodes: HierarchyNode[];
  onNodeSelect: (node: HierarchyNode) => void;
  currentUser: UserType; // MUDANÇA: Recebe o usuário atual
}

const getRoleIcon = (role: string) => {
  // ... (função continua a mesma)
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

const TreeNode: React.FC<{
  node: HierarchyNode;
  level: number;
  onNodeSelect: (node: HierarchyNode) => void;
  onToggle: (nodeId: string) => void;
  currentUser: UserType;
}> = ({ node, level, onNodeSelect, onToggle, currentUser }) => {
  const hasChildren = node.children && node.children.length > 0;

  // Lógica de permissão para moderação
  const canModerate = 
    node.id !== currentUser.id && // Não pode moderar a si mesmo
    (currentUser.role === 'director' || 
     (currentUser.role === 'manager' && node.role === 'supervisor'));

  const handleMute = (e: React.MouseEvent) => {
    e.stopPropagation(); // Evita abrir o chat ao clicar no ícone
    alert(`Silenciar usuário: ${node.name}`);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    alert(`Remover usuário: ${node.name}`);
  };

  return (
    <div>
      {/* MUDANÇA: Adicionada a classe 'group' para habilitar o hover nos ícones filhos */}
      <div
        className="flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors hover:bg-slate-700/50 group"
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={() => onNodeSelect(node)}
      >
        {hasChildren ? (
          <button onClick={(e) => { e.stopPropagation(); onToggle(node.id); }} className="p-1 hover:bg-slate-600 rounded">
            {node.isExpanded ? <ChevronDown className="w-3 h-3 text-gray-400" /> : <ChevronRight className="w-3 h-3 text-gray-400" />}
          </button>
        ) : (
          <div className="w-5 flex-shrink-0" /> // Espaçador para alinhar
        )}
        
        {getRoleIcon(node.role)}
        
        {/* NOVO: Indicador de Status */}
        <StatusIndicatorDot status={node.status} />

        <span className="text-sm font-medium text-gray-200 flex-1 truncate" title={node.name}>
          {node.name}
        </span>

        {/* NOVO: Ícones de Moderação (aparecem no hover) */}
        {canModerate && (
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={handleMute} title="Silenciar usuário" className="p-1 text-gray-400 hover:text-white hover:bg-slate-600 rounded">
              <MicOff className="w-4 h-4" />
            </button>
            <button onClick={handleRemove} title="Remover usuário" className="p-1 text-red-500 hover:text-red-400 hover:bg-slate-600 rounded">
              <UserX className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
      
      {hasChildren && node.isExpanded && (
        <div>
          {node.children!.map((child) => (
            <TreeNode key={child.id} node={child} level={level + 1} onNodeSelect={onNodeSelect} onToggle={onToggle} currentUser={currentUser} />
          ))}
        </div>
      )}
    </div>
  );
};

export const HierarchyTree: React.FC<HierarchyTreeProps> = ({ nodes, onNodeSelect, currentUser }) => {
  const [treeData, setTreeData] = useState<HierarchyNode[]>([]);

  // MUDANÇA: Atualiza o estado da árvore quando os dados dos nós mudam (ex: status)
  useEffect(() => {
    // Mantém o estado de 'isExpanded' dos nós existentes ao receber novos dados
    const mergeExpandedState = (newNodes: HierarchyNode[], oldNodes: HierarchyNode[]): HierarchyNode[] => {
      return newNodes.map(newNode => {
        const oldNode = oldNodes.find(n => n.id === newNode.id);
        const children = newNode.children ? mergeExpandedState(newNode.children, oldNode?.children || []) : undefined;
        return { ...newNode, isExpanded: oldNode?.isExpanded || false, children };
      });
    };
    setTreeData(currentTreeData => mergeExpandedState(nodes, currentTreeData));
  }, [nodes]);

  const toggleNode = (nodeId: string) => {
    const updateNodes = (nodes: HierarchyNode[]): HierarchyNode[] =>
      nodes.map((node) => ({
        ...node,
        isExpanded: node.id === nodeId ? !node.isExpanded : node.isExpanded,
        children: node.children ? updateNodes(node.children) : undefined,
      }));
    setTreeData(updateNodes);
  };

  return (
    <div className="space-y-1">
      {treeData.map((node) => (
        <TreeNode key={node.id} node={node} level={0} onNodeSelect={onNodeSelect} onToggle={toggleNode} currentUser={currentUser} />
      ))}
    </div>
  );
};