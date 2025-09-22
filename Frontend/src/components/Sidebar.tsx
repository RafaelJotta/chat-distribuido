import React from 'react';
import { User, Settings, LogOut, Bell, Shield, Palette } from 'lucide-react';
import { HierarchyTree } from './HierarchyTree';
import { StatusIndicator } from './StatusIndicator';
import { User as UserType, SystemStatus, HierarchyNode } from '../types';

interface SidebarProps {
  currentUser: UserType;
  hierarchyNodes: HierarchyNode[];
  systemStatus: SystemStatus;
  onNodeSelect: (node: HierarchyNode) => void;
  selectedNodeId?: string;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  hierarchyNodes,
  systemStatus,
  onNodeSelect,
  selectedNodeId,
  onLogout,
}) => {
  const [showSettings, setShowSettings] = React.useState(false);

  return (
    <div className="w-80 bg-slate-900 border-r border-slate-700 flex flex-col">
      {/* User Profile */}
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
                currentUser.status === 'away' ? 'bg-amber-500' : 'bg-gray-500'
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
              <div className="absolute top-full right-0 mt-2 w-48 bg-slate-800 border border-slate-600 rounded-lg shadow-lg z-50 animate-fade-in">
                <div className="py-2">
                  <button className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-300 hover:bg-slate-700 hover:text-white transition-colors">
                    <Bell className="w-4 h-4" />
                    Notificações
                  </button>
                  <button className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-300 hover:bg-slate-700 hover:text-white transition-colors">
                    <Shield className="w-4 h-4" />
                    Privacidade
                  </button>
                  <button className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-300 hover:bg-slate-700 hover:text-white transition-colors">
                    <Palette className="w-4 h-4" />
                    Aparência
                  </button>
                  <hr className="my-2 border-slate-600" />
                  <button 
                    onClick={onLogout}
                    className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-400 hover:bg-slate-700 hover:text-red-300 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sair
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hierarchy Section */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Hierarquia da Empresa
          </h4>
          <HierarchyTree
            nodes={hierarchyNodes}
            onNodeSelect={onNodeSelect}
            selectedNodeId={selectedNodeId}
          />
        </div>
      </div>

      {/* Status Indicator */}
      <div className="p-4 border-t border-slate-700">
        <StatusIndicator status={systemStatus} />
      </div>
    </div>
  );
};