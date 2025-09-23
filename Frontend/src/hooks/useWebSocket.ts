// src/hooks/useWebSocket.ts

import { useEffect, useState, useRef, useCallback } from 'react';
import { Message, SystemStatus } from '../types';
import { DirectoryData } from '../components/DirectoryList';

type SetState<T> = React.Dispatch<React.SetStateAction<T>>;

export const useWebSocket = (
  setDirectoryData: SetState<DirectoryData>,
  setMessages: SetState<Message[]>,
  isAuthenticated: boolean
) => {
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    status: 'reconnecting',
    message: 'Conectando...',
  });
  const [showNotification, setShowNotification] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  // MUDANÇA: Trocado 'NodeJS.Timeout' por 'number' para compatibilidade com o navegador.
  const retryTimeout = useRef<number | null>(null);

  const connect = useCallback(() => {
    if (!isAuthenticated || ws.current?.readyState === WebSocket.OPEN) {
      return;
    }

    if (retryTimeout.current) {
        clearTimeout(retryTimeout.current);
    }
    
    const wsUrl = `ws://${window.location.host}/ws`;
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('Conectado ao WebSocket');
      setSystemStatus({ status: 'connected', message: 'Conectado' });
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'directoryUpdate') {
        setDirectoryData(data.payload);
      } else if (data.type === 'message') {
        if (data.payload) {
            setMessages((prev) => [...prev, { ...data.payload, timestamp: new Date(data.payload.timestamp) }]);
        }
      }
    };

    ws.current.onerror = (error) => {
      console.error('Erro no WebSocket:', error);
      ws.current?.close();
    };

    ws.current.onclose = () => {
      console.log('WebSocket desconectado. Tentando reconectar em 3s...');
      setSystemStatus({
        status: 'reconnecting',
        message: 'Reconectando...',
      });
      
      // setTimeout no navegador retorna um 'number'
      retryTimeout.current = window.setTimeout(() => {
          connect();
      }, 3000);
    };
  }, [isAuthenticated, setDirectoryData, setMessages]);

  useEffect(() => {
    if (isAuthenticated) {
      connect();
    } else {
        ws.current?.close();
        if (retryTimeout.current) clearTimeout(retryTimeout.current);
    }

    return () => {
        // Limpa o timeout ao desmontar o componente para evitar vazamentos de memória
        if (retryTimeout.current) clearTimeout(retryTimeout.current);
        ws.current?.close();
    };
  }, [isAuthenticated, connect]);

  const sendMessage = useCallback((message: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    }
  }, []);

  return {
    systemStatus,
    showNotification,
    setShowNotification,
    sendMessage,
  };
};