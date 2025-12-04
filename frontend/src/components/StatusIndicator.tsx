import React from 'react';
import { Circle, WifiOff, RotateCw } from 'lucide-react'; // Removido 'Wifi' não usado
import { SystemStatus } from '../types';

interface StatusIndicatorProps {
  status: SystemStatus;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status }) => {
  const getStatusIcon = () => {
    switch (status.status) {
      case 'connected':
        // Adicionei 'animate-pulse' para dar vida ao indicador
        return <Circle className="w-3 h-3 fill-teal-500 text-teal-500 animate-pulse" />;
      case 'reconnecting':
        return <RotateCw className="w-3 h-3 text-amber-500 animate-spin" />;
      case 'disconnected':
        return <WifiOff className="w-3 h-3 text-red-500" />;
    }
  };

  const getStatusColor = () => {
    switch (status.status) {
      case 'connected':
        return 'text-teal-500';
      case 'reconnecting':
        return 'text-amber-500';
      case 'disconnected':
        return 'text-red-500';
    }
  };

  const getBorderColor = () => {
     if (status.status === 'disconnected') return 'border-red-900/50 bg-red-900/10';
     if (status.status === 'reconnecting') return 'border-amber-900/50 bg-amber-900/10';
     return 'border-slate-700 bg-slate-800';
  }

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors duration-300 ${getBorderColor()}`}>
      {getStatusIcon()}
      <span className={`text-xs font-medium ${getStatusColor()}`}>
        {status.message}
      </span>
    </div>
  );
};