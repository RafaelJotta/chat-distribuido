import { useEffect, useState, useRef, useCallback } from 'react';
import { Message, SystemStatus, User, HierarchyNode } from '../types';
import { DirectoryData } from '../components/DirectoryList';

type SetState<T> = React.Dispatch<React.SetStateAction<T>>;

// --- Funções Auxiliares (Mantidas iguais) ---
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

interface UseWebSocketProps {
  currentUser: User | null;
  setDirectoryData: SetState<DirectoryData>;
  setMessages: SetState<Record<string, Message[]>>;
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
  
  // ✅ NOVO: Contador de tentativas para Exponential Backoff
  const reconnectAttempts = useRef(0);

  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  const connect = useCallback(() => {
    if (!currentUser || (ws.current && ws.current.readyState === WebSocket.OPEN)) return;
    
    // Limpa timeout anterior se houver
    if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);

    // Ajusta URL para ambiente (Dev vs Prod/Docker)
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    console.log(`[WebSocket] Tentativa de conexão #${reconnectAttempts.current + 1}...`);
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('[WebSocket] Conectado com sucesso.');
      setSystemStatus({ status: 'connected', message: 'Conectado' });
      
      // ✅ Resetamos o contador de tentativas ao conectar com sucesso
      reconnectAttempts.current = 0; 

      if (ws.current && currentUser) {
        ws.current.send(JSON.stringify({ 
          type: 'user_connect', 
          userId: currentUser.id,
          role: currentUser.role
        }));
      }
    };

    ws.current.onmessage = (event) => {
      // console.log('[WebSocket-IN]:', event.data); // Comentado para limpar console, descomente se necessário
      
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'initialState') {
          const { hierarchy, messages, unreadCounts } = data.payload;
          setDirectoryData(processHierarchyToDirectoryData(hierarchy));
          setMessages(processInitialMessages(messages));
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
            // Evita duplicatas se o backend reenviar
            if (oldMessages.some(m => m.id === message.id)) return prev;
            return { ...prev, [channelId]: [...oldMessages, message] };
          });
          
          if (channelId !== activeChatIdRef.current && senderId !== currentUser?.id) {
            setUnreadCounts(prevCounts => ({
              ...prevCounts,
              [channelId]: (prevCounts[channelId] || 0) + 1
            }));
          }
          
          if (channelId.startsWith("private-") && senderId !== currentUser?.id) {
            ensureChatTabExists(channelId, senderName, 'private');
          }
        }
      } catch (error) { console.error("ERRO AO PROCESSAR MENSAGEM:", error); }
    };

    ws.current.onerror = (error) => {
        // Não logamos o erro completo para evitar poluição visual no console do navegador durante quedas
        console.warn("[WebSocket] Erro de conexão detectado.");
    };
    
    ws.current.onclose = () => {
      // ✅ Algoritmo de Exponential Backoff
      // Tenta em: 1s, 2s, 4s, 8s, 16s, max 30s.
      const baseDelay = 1000;
      const maxDelay = 30000;
      const delay = Math.min(maxDelay, Math.pow(2, reconnectAttempts.current) * baseDelay);
      
      console.log(`[WebSocket] Desconectado. Reconectando em ${delay}ms...`);
      setSystemStatus({ status: 'reconnecting', message: `Reconectando (${reconnectAttempts.current + 1})...` });
      
      reconnectAttempts.current += 1;
      
      if(retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = window.setTimeout(connect, delay);
    };

  }, [currentUser, setDirectoryData, setMessages, ensureChatTabExists, setUnreadCounts]); // Dependências

  useEffect(() => {
    if (currentUser) {
      connect();
    }
    return () => {
      if(retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      if (ws.current) {
        ws.current.onclose = null; // Evita loop ao desmontar
        ws.current.close();
      }
    };
  }, [currentUser, connect]);

  const sendMessage = useCallback((message: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    } else {
        console.warn("Tentativa de enviar mensagem sem conexão ativa.");
    }
  }, []);
  
  const markChannelAsRead = useCallback((channelId: string) => {
      if (ws.current?.readyState === WebSocket.OPEN) {
          const message = { type: 'mark_read', channelId: channelId };
          ws.current.send(JSON.stringify(message));
      }
  }, []);

  return { systemStatus, sendMessage, markChannelAsRead };
};