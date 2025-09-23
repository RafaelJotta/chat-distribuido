// src/App.tsx

import { useState, useMemo, useEffect } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { SystemNotification } from './components/SystemNotification';
import { useWebSocket } from './hooks/useWebSocket';
import { Message, Channel, HierarchyNode, User, RecentChatItem } from './types/index';
import { DirectoryData } from './components/DirectoryList';

// DADOS DE EXEMPLO PARA O HISTÓRICO DE CONVERSAS (serão substituídos pelos dados do backend)
const MOCK_RECENT_CHATS: RecentChatItem[] = [
  {
    id: 'group-supervisors',
    name: 'Canal dos Supervisores',
    lastMessage: 'Pessoal, reunião amanhã às 10h.',
    timestamp: '18:32',
    type: 'group',
  },
  {
    id: 'private-user-manager-01',
    name: 'Gerente Silva',
    lastMessage: 'Ok, estarei lá!',
    timestamp: '18:30',
    type: 'private',
    node: { id: 'user-manager-01', name: 'Gerente Silva', role: 'manager', email: 'gerente@empresa.com' }
  }
];


function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [directoryData, setDirectoryData] = useState<DirectoryData>({
    managers: [], supervisors: [], employees: [],
  });
  const [openChats, setOpenChats] = useState<Channel[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [recentChats, setRecentChats] = useState<RecentChatItem[]>([]);


  const { systemStatus, showNotification, setShowNotification, sendMessage } = useWebSocket(
    setDirectoryData, setMessages, !!currentUser
  );

  useEffect(() => {
    if (currentUser && openChats.length === 0) {
      const generalChat: Channel = {
        id: 'general-chat', name: 'Geral', type: 'group', canSendMessage: true, members: [], targetLevel: 'group',
      };
      setOpenChats([generalChat]);
      setActiveChatId(generalChat.id);
      // Carrega o histórico de exemplo quando o usuário loga
      setRecentChats(MOCK_RECENT_CHATS); 
    }
  }, [currentUser, openChats.length]);

  const activeChannel = useMemo(() => {
    return openChats.find(chat => chat.id === activeChatId) || null;
  }, [openChats, activeChatId]);

  const handleLogin = (loggedInUser: User) => { setCurrentUser(loggedInUser); };

  const handleLogout = () => {
    setCurrentUser(null);
    setOpenChats([]);
    setActiveChatId(null);
    setDirectoryData({ managers: [], supervisors: [], employees: [] });
    setRecentChats([]); // Limpa o histórico ao deslogar
  };

  const handleNodeSelect = (node: HierarchyNode) => {
    if (!currentUser || node.id === currentUser.id) return;
    const privateChatId = `private-${node.id}`;
    const existingChat = openChats.find(chat => chat.id === privateChatId);
    if (existingChat) {
      setActiveChatId(existingChat.id);
    } else {
      const newPrivateChat: Channel = {
        id: privateChatId, name: node.name, type: 'private', canSendMessage: true, members: [currentUser.id, node.id], targetLevel: 'user',
      };
      setOpenChats(prevChats => [...prevChats, newPrivateChat]);
      setActiveChatId(newPrivateChat.id);
    }
  };
  
  const handleSelectChat = (chatId: string) => { setActiveChatId(chatId); };
  
  const handleCloseChat = (chatId: string) => {
    const updatedChats = openChats.filter(chat => chat.id !== chatId);
    setOpenChats(updatedChats);
    if (activeChatId === chatId) {
      setActiveChatId(updatedChats.length > 0 ? updatedChats[updatedChats.length - 1].id : null);
    }
  };

  const handleSendMessage = (content: string, priority: 'normal' | 'urgent') => {
    if (!currentUser || !activeChannel?.canSendMessage) return;
    const payload = { type: 'message' as const, senderId: currentUser.id, senderName: currentUser.name, senderRole: currentUser.role, channelId: activeChannel.id, content, priority };
    sendMessage(payload);
  };

  const handleStatusChange = (newStatus: 'online' | 'away' | 'busy' | 'offline') => {
    if (currentUser) {
      setCurrentUser({ ...currentUser, status: newStatus });
    }
  };

  const handleOpenGroupChat = (channelType: 'managers' | 'supervisors' | 'employees') => {
    const channelId = `group-${channelType}`;
    const existingChat = openChats.find(chat => chat.id === channelId);
    if (existingChat) {
      setActiveChatId(existingChat.id);
    } else {
      const channelNames = { managers: 'Canal dos Gerentes', supervisors: 'Canal dos Supervisores', employees: 'Canal dos Funcionários' };
      const targetLevels = { managers: 'manager', supervisors: 'supervisor', employees: 'employee' } as const;
      const newGroupChat: Channel = {
        id: channelId, name: channelNames[channelType], type: 'group', canSendMessage: true, members: [], targetLevel: targetLevels[channelType] as any,
      };
      setOpenChats(prev => [...prev, newGroupChat]);
      setActiveChatId(newGroupChat.id);
    }
  };

  const handleRegisterUser = (userData: Omit<User, 'id' | 'avatar' | 'status'>) => {
    console.log("Enviando dados do novo usuário para o backend:", userData);
    sendMessage({ type: 'registerUser', payload: userData });
  };

  const handleSelectRecentChat = (chat: RecentChatItem) => {
    if (chat.type === 'private' && chat.node) {
      handleNodeSelect(chat.node);
    } else {
      handleOpenGroupChat(chat.id.replace('group-', '') as any);
    }
  };

  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="h-screen bg-slate-900 text-white flex">
      <Sidebar
        currentUser={currentUser}
        directoryData={directoryData}
        recentChats={recentChats}
        systemStatus={systemStatus}
        onNodeSelect={handleNodeSelect}
        onOpenGroupChat={handleOpenGroupChat}
        onSelectRecentChat={handleSelectRecentChat}
        onLogout={handleLogout}
        onStatusChange={handleStatusChange}
        onRegisterUser={handleRegisterUser}
      />
      <ChatArea
        activeChannel={activeChannel}
        messages={messages}
        currentUser={currentUser}
        onSendMessage={handleSendMessage}
        openChats={openChats}
        activeChatId={activeChatId}
        onSelectChat={handleSelectChat}
        onCloseChat={handleCloseChat}
      />
      <SystemNotification
        message="Conexão restaurada."
        show={showNotification}
        onClose={() => setShowNotification(false)}
      />
    </div>
  );
}

export default App;