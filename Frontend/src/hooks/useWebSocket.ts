import { useEffect, useState, useRef, useCallback } from 'react';
import { Message, SystemStatus, HierarchyNode, User } from '../types';

type SetState<T> = React.Dispatch<React.SetStateAction<T>>;

export const useWebSocket = (
setHierarchy: SetState<HierarchyNode[]>, setMessages: SetState<Message[]>, p0: boolean) => {
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    status: 'reconnecting',
    message: 'Conectando...',
  });
  const [showNotification, setShowNotification] = useState(false);
  const ws = useRef<WebSocket | null>(null);

  const connect = useCallback(() => {
    const wsUrl = `ws://${window.location.host}/ws`;
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('Conectado ao WebSocket via Gateway');
      setSystemStatus({ status: 'connected', message: 'Conectado' });
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'initialState') {
        setHierarchy(data.payload.hierarchy);
        setMessages(data.payload.messages.map((m: any) => ({...m, timestamp: new Date(m.timestamp)})));
      } else if (data.type === 'message' || data.type === 'userJoined') {
        setMessages((prev) => [...prev, {...data, timestamp: new Date(data.timestamp)}]);
      }
      // Adicionar lógica para outros tipos de mensagem aqui (ex: 'typing')
    };

    ws.current.onerror = (error) => {
      console.error('Erro no WebSocket:', error);
      setSystemStatus({ status: 'disconnected', message: 'Desconectado' });
    };

    ws.current.onclose = () => {
      console.log('WebSocket desconectado. Tentando reconectar em 3s...');
      setSystemStatus({
        status: 'reconnecting',
        message: 'Reconectando...',
      });
      setTimeout(connect, 3000);
    };
  }, [setHierarchy, setMessages]);
  
  useEffect(() => {
    connect();
    return () => {
      ws.current?.close();
    };
  }, [connect]);

  const sendMessage = useCallback((message: Omit<Message, 'id' | 'timestamp'>) => {
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