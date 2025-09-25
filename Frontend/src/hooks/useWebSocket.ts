import { useEffect, useState, useRef, useCallback } from 'react';
import { Message, SystemStatus, User, HierarchyNode } from '../types';
import { DirectoryData } from '../components/DirectoryList';

type SetState<T> = React.Dispatch<React.SetStateAction<T>>;

const processHierarchyToDirectoryData = (nodes: HierarchyNode[]): DirectoryData => {
  const directory: DirectoryData = { director: undefined, managers: [], supervisors: [], employees: [] };
  const traverse = (nodeList: HierarchyNode[] = []) => {
    for (const node of nodeList) {
      if (node.role === 'director') directory.director = node;
      else if (node.role === 'manager') directory.managers.push(node);
      else if (node.role === 'supervisor') directory.supervisors.push(node);
      else if (node.role === 'employee') directory.employees.push(node);
      if (node.children) traverse(node.children);
    }
  };
  traverse(nodes);
  return directory;
};

interface UseWebSocketProps {
  currentUser: User | null;
  setDirectoryData: SetState<DirectoryData>;
  setMessages: SetState<Record<string, Message[]>>;
  openPrivateChat: (nodeId: string, nodeName: string) => void;
}

export const useWebSocket = ({ currentUser, setDirectoryData, setMessages, openPrivateChat }: UseWebSocketProps) => {
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({ status: 'reconnecting', message: 'Conectando...' });
  const [showNotification, setShowNotification] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  const retryTimeoutRef = useRef<number | null>(null);

  const connect = useCallback(() => {
    if (!currentUser || (ws.current && ws.current.readyState === WebSocket.OPEN)) return;
    if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);

    const wsUrl = `ws://${window.location.host}/ws`;
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('Conectado ao WebSocket');
      setSystemStatus({ status: 'connected', message: 'Conectado' });
      if (ws.current && currentUser) {
        ws.current.send(JSON.stringify({ type: 'user_connect', userId: currentUser.id }));
      }
    };

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'initialState') {
          const { hierarchy, messages } = data.payload;
          setDirectoryData(processHierarchyToDirectoryData(hierarchy));
          setMessages(prev => ({ ...prev, 'general-chat': messages.map((m: any) => ({...m, timestamp: new Date(m.timestamp)})) }));
        } else if (data.type === 'status_update') {
          const { userId, status } = data.payload;
          setDirectoryData(prev => {
            const updateList = (users: HierarchyNode[] = []) => users.map(u => u.id === userId ? { ...u, status } : u);
            const newDirector = (prev.director && prev.director.id === userId) ? { ...prev.director, status } : prev.director;
            return { director: newDirector, managers: updateList(prev.managers), supervisors: updateList(prev.supervisors), employees: updateList(prev.employees) };
          });
        } else if (data.type === 'message') {
          const message: Message = { ...data, timestamp: new Date(data.timestamp) };
          const { channelId, senderId, senderName } = message;
          
          setMessages(prev => {
            const oldMessages = prev[channelId] || [];
            const newChannelMessages = [...oldMessages, message];
            return { ...prev, [channelId]: newChannelMessages };
          });
          
          if (channelId.startsWith('private-') && senderId !== currentUser?.id) {
            openPrivateChat(senderId, senderName);
          }
        }
      } catch (error) { console.error("ERRO AO PROCESSAR MENSAGEM:", error, "DADOS:", event.data); }
    };

    ws.current.onerror = (error) => console.error('Erro no WebSocket:', error);
    
    ws.current.onclose = () => {
      console.log('WebSocket desconectado. Tentando reconectar em 5 segundos...');
      setSystemStatus({ status: 'reconnecting', message: 'Reconectando...' });
      if(retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = window.setTimeout(connect, 5000);
    };
  }, [currentUser, setDirectoryData, setMessages, openPrivateChat]);

  useEffect(() => {
    if (currentUser) {
      connect();
    }
    return () => {
      if(retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      if (ws.current) {
        ws.current.onclose = null; 
        ws.current.close();
      }
    };
  }, [currentUser, connect]);

  const sendMessage = useCallback((message: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    }
  }, []);

  return { systemStatus, showNotification, sendMessage, setShowNotification };
};