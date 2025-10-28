// frontend/src/hooks/useWebSocket.ts

import { useEffect, useState, useRef, useCallback } from 'react';
import { Message, SystemStatus, User, HierarchyNode } from '../types';
import { DirectoryData } from '../components/DirectoryList';

type SetState<T> = React.Dispatch<React.SetStateAction<T>>;

// ... (funções processInitialMessages e processHierarchyToDirectoryData não mudam) ...
const processInitialMessages = (messages: Message[]): Record<string, Message[]> => {
  const messagesByChannel: Record<string, Message[]> = {};
  for (const message of messages) {
    const formattedMessage = { ...message, timestamp: new Date(message.timestamp) };
    if (!messagesByChannel[message.channelId]) {
      messagesByChannel[message.channelId] = [];
    }
    messagesByChannel[message.channelId].push(formattedMessage);
  }
  return messagesByChannel;
};
const processHierarchyToDirectoryData = (nodes: HierarchyNode[]): DirectoryData => {
  const directory: DirectoryData = { director: undefined, managers: [], supervisors: [], employees: [] };
  const traverse = (nodeList: HierarchyNode[] = []) => {
    for (const node of nodeList) {
      if (node.role === 'director') directory.director = node;
      else if (node.role === 'manager') directory.managers.push(node);
      else if (node.role === 'supervisor') directory.supervisors.push(node);
      else directory.employees.push(node);
      if (node.children) traverse(node.children);
    }
  };
  traverse(nodes);
  return directory;
};
// ... (fim das funções que não mudam) ...


interface UseWebSocketProps {
  currentUser: User | null;
  setDirectoryData: SetState<DirectoryData>;
  setMessages: SetState<Record<string, Message[]>>;
  // ✅ *** NOVO PASSO 3.A *** ✅
  ensureChatTabExists: (channelId: string, name: string, type?: 'private' | 'group') => void;
  activeChatId: string | null;
  setUnreadCounts: SetState<Record<string, number>>;
}

export const useWebSocket = ({
  currentUser,
  setDirectoryData,
  setMessages,
  ensureChatTabExists,
  activeChatId,
  setUnreadCounts
}: UseWebSocketProps) => {
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({ status: 'reconnecting', message: 'Conectando...' });
  const ws = useRef<WebSocket | null>(null);
  const retryTimeoutRef = useRef<number | null>(null);
  const activeChatIdRef = useRef(activeChatId);
  
  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  const connect = useCallback(() => {
    if (!currentUser || (ws.current && ws.current.readyState === WebSocket.OPEN)) return;
    if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);

    const wsUrl = `ws://${window.location.host}/ws`;
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('Conectado ao WebSocket');
      setSystemStatus({ status: 'connected', message: 'Conectado' });
      if (ws.current && currentUser) {
        ws.current.send(JSON.stringify({ 
          type: 'user_connect', 
          userId: currentUser.id,
          role: currentUser.role
        }));
      }
    };

    ws.current.onmessage = (event) => {
      console.log('[WebSocket-IN]:', event.data);
      
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'initialState') {
          const { hierarchy, messages, unreadCounts } = data.payload; // <--- Pega as contagens
          setDirectoryData(processHierarchyToDirectoryData(hierarchy));
          setMessages(processInitialMessages(messages));
          // ✅ *** NOVO PASSO 3.B *** ✅
          // Seta o estado de não lidos com os dados persistidos
          setUnreadCounts(unreadCounts || {}); 
        
        } else if (data.type === 'status_update') {
          const { userId, status } = data.payload;
          const updateStatus = (user: HierarchyNode) => user.id === userId ? { ...user, status } : user;
          setDirectoryData(prev => ({
              director: prev.director ? updateStatus(prev.director) : undefined,
              managers: prev.managers.map(updateStatus),
              supervisors: prev.supervisors.map(updateStatus),
              employees: prev.employees.map(updateStatus)
          }));

        } else if (data.type === 'message') {
          const message: Message = { ...data, timestamp: new Date(data.timestamp) };
          const { channelId, senderId, senderName } = message;
          
          setMessages(prev => {
            const oldMessages = prev[channelId] || [];
            const newChannelMessages = [...oldMessages, message];
            return { ...prev, [channelId]: newChannelMessages };
          });
          
          if (channelId !== activeChatIdRef.current && senderId !== currentUser?.id) {
            console.log(`INCREMENTANDO CONTAGEM PARA: ${channelId}`);
            setUnreadCounts(prevCounts => ({
              ...prevCounts,
              [channelId]: (prevCounts[channelId] || 0) + 1
            }));
          }
          
          if (channelId.startsWith("private-") && senderId !== currentUser?.id) {
            ensureChatTabExists(channelId, senderName, 'private');
          }
        }
      } catch (error) { console.error("ERRO AO PROCESSAR MENSAGEM:", error, "DADOS:", event.data); }
    };

    ws.current.onerror = (error) => console.error("Erro no WebSocket:", error);
    
    ws.current.onclose = () => {
      console.log('WebSocket desconectado. Tentando reconectar em 5 segundos...');
      setSystemStatus({ status: 'reconnecting', message: 'Reconectando...' });
      if(retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = window.setTimeout(connect, 5000);
    };
  }, [currentUser, setDirectoryData, setMessages, ensureChatTabExists, setUnreadCounts]);

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
      console.log('[WebSocket-OUT]:', JSON.stringify(message));
      ws.current.send(JSON.stringify(message));
    }
  }, []);
  
  // ✅ *** NOVO PASSO 3.C *** ✅
  // Nova função para ser chamada pelo App.tsx
  const markChannelAsRead = useCallback((channelId: string) => {
      if (ws.current?.readyState === WebSocket.OPEN) {
          const message = { type: 'mark_read', channelId: channelId };
          console.log('[WebSocket-OUT]:', JSON.stringify(message));
          ws.current.send(JSON.stringify(message));
      }
  }, []);

  // Retorna a nova função
  return { systemStatus, sendMessage, markChannelAsRead };
};