import React from 'react';
import { Circle, Wifi, WifiOff, RotateCw } from 'lucide-react';
import { SystemStatus } from '../types';

interface StatusIndicatorProps {
  status: SystemStatus;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status }) => {
  const getStatusIcon = () => {
    switch (status.status) {
      case 'connected':
        return <Circle className="w-3 h-3 fill-teal-500 text-teal-500" />;
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

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-slate-800 rounded-lg">
      {getStatusIcon()}
      <span className={`text-xs font-medium ${getStatusColor()}`}>
        {status.message}
      </span>
    </div>
  );
};