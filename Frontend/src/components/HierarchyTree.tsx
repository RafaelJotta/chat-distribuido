import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Crown, Shield, User } from 'lucide-react';
import { HierarchyNode } from '../types';

interface HierarchyTreeProps {
  nodes: HierarchyNode[];
  onNodeSelect: (node: HierarchyNode) => void;
  selectedNodeId?: string;
}

const getRoleIcon = (role: string) => {
  switch (role) {
    case 'director':
      return <Crown className="w-4 h-4 text-amber-400" />;
    case 'manager':
      return <Shield className="w-4 h-4 text-blue-400" />;
    case 'supervisor':
      return <User className="w-4 h-4 text-teal-400" />;
    default:
      return <User className="w-4 h-4 text-gray-400" />;
  }
};

const TreeNode: React.FC<{
  node: HierarchyNode;
  level: number;
  onNodeSelect: (node: HierarchyNode) => void;
  onToggle: (nodeId: string) => void;
  selectedNodeId?: string;
}> = ({ node, level, onNodeSelect, onToggle, selectedNodeId }) => {
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = node.id === selectedNodeId;

  return (
    <div>
      <div
        className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
          isSelected 
            ? 'bg-slate-700 border border-teal-500/50' 
            : 'hover:bg-slate-700/50'
        }`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={() => onNodeSelect(node)}
      >
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle(node.id);
            }}
            className="p-1 hover:bg-slate-600 rounded"
          >
            {node.isExpanded ? (
              <ChevronDown className="w-3 h-3 text-gray-400" />
            ) : (
              <ChevronRight className="w-3 h-3 text-gray-400" />
            )}
          </button>
        ) : (
          <div className="w-5" />
        )}
        
        {getRoleIcon(node.role)}
        <span className="text-sm font-medium text-gray-200 flex-1">
          {node.name}
        </span>
        <div className="flex flex-col items-end">
          <span className="text-xs text-gray-400 capitalize">
            {node.role}
          </span>
          {isSelected && (
            <span className="text-xs text-teal-400">
              Selecionado
            </span>
          )}
        </div>
      </div>
      
      {hasChildren && node.isExpanded && (
        <div>
          {node.children!.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              onNodeSelect={onNodeSelect}
              onToggle={onToggle}
              selectedNodeId={selectedNodeId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const HierarchyTree: React.FC<HierarchyTreeProps> = ({
  nodes,
  onNodeSelect,
  selectedNodeId,
}) => {
  const [treeData, setTreeData] = useState<HierarchyNode[]>(nodes);

  const toggleNode = (nodeId: string) => {
    const updateNodes = (nodes: HierarchyNode[]): HierarchyNode[] =>
      nodes.map((node) => ({
        ...node,
        isExpanded: node.id === nodeId ? !node.isExpanded : node.isExpanded,
        children: node.children ? updateNodes(node.children) : undefined,
      }));

    setTreeData(updateNodes(treeData));
  };

  return (
    <div className="space-y-1">
      {treeData.map((node) => (
        <TreeNode
          key={node.id}
          node={node}
          level={0}
          onNodeSelect={onNodeSelect}
          onToggle={toggleNode}
          selectedNodeId={selectedNodeId}
        />
      ))}
    </div>
  );
};