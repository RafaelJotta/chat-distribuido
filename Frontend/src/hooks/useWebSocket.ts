import { useEffect, useState } from 'react';
import { Message, SystemStatus } from '../types';

export const useWebSocket = () => {
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    status: 'connected',
    message: 'Conectado',
  });
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    // Simulate connection issues and recovery
    const simulateConnectionIssues = () => {
      // After 10 seconds, simulate connection issues
      setTimeout(() => {
        setSystemStatus({
          status: 'reconnecting',
          message: 'Reconectando... Rota de comunicação instável.',
        });

        // After 5 more seconds, simulate recovery
        setTimeout(() => {
          setSystemStatus({
            status: 'connected',
            message: 'Conectado',
          });
          setShowNotification(true);
        }, 5000);
      }, 10000);
    };

    simulateConnectionIssues();
  }, []);

  return {
    systemStatus,
    showNotification,
    setShowNotification,
  };
};