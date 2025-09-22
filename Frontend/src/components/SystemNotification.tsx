import React, { useEffect, useState } from 'react';
import { CheckCircle, X } from 'lucide-react';

interface SystemNotificationProps {
  message: string;
  show: boolean;
  onClose: () => void;
}

export const SystemNotification: React.FC<SystemNotificationProps> = ({
  message,
  show,
  onClose,
}) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-teal-600 text-white p-4 rounded-lg shadow-lg max-w-sm animate-slide-up">
      <div className="flex items-start gap-3">
        <CheckCircle className="w-5 h-5 text-teal-200 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium">Sistema Restaurado</p>
          <p className="text-sm text-teal-100 mt-1">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="text-teal-200 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};