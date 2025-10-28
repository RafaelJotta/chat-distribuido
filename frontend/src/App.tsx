// frontend/src/App.tsx

import { useState, useMemo, useEffect, useCallback } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { SystemNotification } from './components/SystemNotification';
import { useWebSocket } from './hooks/useWebSocket';
import { Message, Channel, User, RecentChatItem } from './types/index';
import { DirectoryData } from './components/DirectoryList';
import { RegisterUserModal } from './components/RegisterUserModal'; 

const createPrivateChannelId = (userId1: string, userId2: string) => {
  const sortedIds = [userId1, userId2].sort();
  return `private-${sortedIds[0]}-${sortedIds[1]}`;
};

// ✅ *** CORREÇÃO PASSO 1: Carregar o usuário do localStorage ***
// Esta função roda UMA VEZ quando o App carrega
const getInitialUser = (): User | null => {
  try {
    const savedUser = localStorage.getItem('chat-user');
    if (savedUser) {
      return JSON.parse(savedUser) as User;
    }
    return null;
  } catch (error) {
    console.error("Falha ao carregar usuário do localStorage", error);
    return null;
  }
};


function App() {
  // ✅ *** CORREÇÃO PASSO 1.B: Usa a função para definir o estado inicial ***
  const [currentUser, setCurrentUser] = useState<User | null>(getInitialUser);
  
  const [openChats, setOpenChats] = useState<Channel[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [directoryData, setDirectoryData] = useState<DirectoryData>({
    director: undefined, managers: [], supervisors: [], employees: [],
  });
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [showNotification, setShowNotification] = useState(false);
  const [isRegisterModalOpen, setRegisterModalOpen] = useState(false);

  const ensureChatTabExists = useCallback((channelId: string, name: string, type: 'private' | 'group' = 'private') => {
    if (!openChats.some(chat => chat.id === channelId)) {
      console.log(`Criando aba para: ${name} (ID: ${channelId})`);
      const newChat: Channel = {
        id: channelId, name: name, type: type, canSendMessage: true, members: []
      };
      setOpenChats(prev => [newChat, ...prev]);
    }
  }, [openChats]);
  
  const { systemStatus, sendMessage, markChannelAsRead } = useWebSocket({
    currentUser,
    setDirectoryData,
    setMessages,
    ensureChatTabExists: ensureChatTabExists, 
    activeChatId: activeChatId,
    setUnreadCounts: setUnreadCounts,
  });

  const selectChat = useCallback((chatId: string) => {
      setActiveChatId(chatId);
      
      if (unreadCounts[chatId] && unreadCounts[chatId] > 0) {
          console.log(`Marcando ${chatId} como lido...`);
          markChannelAsRead(chatId);
      }
      
      setUnreadCounts(prevCounts => ({
          ...prevCounts,
          [chatId]: 0 
      }));
  }, [unreadCounts, markChannelAsRead]);

  const selectPrivateChat = useCallback((nodeId: string, nodeName: string) => {
    if (!currentUser || nodeId === currentUser.id) return;
    const privateChatId = createPrivateChannelId(currentUser.id, nodeId);
    
    ensureChatTabExists(privateChatId, nodeName, 'private');
    selectChat(privateChatId);
    
  }, [currentUser, ensureChatTabExists, selectChat]);
  
  const selectRecentChat = useCallback((chat: RecentChatItem) => {
    ensureChatTabExists(chat.id, chat.name, chat.type);
    selectChat(chat.id);
  }, [ensureChatTabExists, selectChat]);
  
  const handleRegisterUser = async (newUserData: Omit<User, 'id' | 'status'>): Promise<boolean> => {
    if (!currentUser) return false;
    const fullUserData = { ...newUserData, manager_id: currentUser.id };
    try {
      const response = await fetch('http://localhost:8080/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullUserData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Falha ao cadastrar usuário.');
      }
      alert('Usuário cadastrado com sucesso! A lista será atualizada em breve.');
      return true;
    } catch (error) {
      if (error instanceof Error) { alert(`Erro: ${error.message}`); } 
      else { alert('Ocorreu um erro desconhecido.'); }
      return false;
    }
  };

  useEffect(() => {
    if (currentUser && !openChats.some(c => c.id === 'general-chat')) {
      const generalChat: Channel = {
        id: 'general-chat', name: 'Geral', type: 'group', members: [], canSendMessage: true,
      };
      setOpenChats([generalChat]);
      // Se acabamos de carregar, 'activeChatId' pode ser nulo. Define 'Geral' como padrão.
      if (!activeChatId) {
        setActiveChatId('general-chat');
      }
    }
  }, [currentUser, activeChatId]); // Adiciona activeChatId

  const activeChannel = useMemo(() => openChats.find(chat => chat.id === activeChatId) || null, [openChats, activeChatId]);
  
  const allUsers = useMemo(() => {
    const users = new Map<string, {name: string, role: User['role']}>();
    if (directoryData.director) {
      users.set(directoryData.director.id, directoryData.director);
    }
    directoryData.managers.forEach(u => users.set(u.id, u));
    directoryData.supervisors.forEach(u => users.set(u.id, u));
    directoryData.employees.forEach(u => users.set(u.id, u));
    return users;
  }, [directoryData]);

  const userUnreadCounts = useMemo((): Record<string, number> => {
    const userCounts: Record<string, number> = {};
    if (!currentUser) return userCounts;
    Object.keys(unreadCounts).forEach(channelId => {
      const count = unreadCounts[channelId];
      if (count > 0 && channelId.startsWith('private-')) {
        const ids = channelId.replace('private-', '').split('-');
        const id1 = ids.slice(0, 2).join('-');
        const id2 = ids.slice(2).join('-');
        const otherUserId = id1 === currentUser.id ? id2 : id1;
        userCounts[otherUserId] = count;
      }
    });
    return userCounts;
  }, [unreadCounts, currentUser]);
  
  const recentChats = useMemo((): RecentChatItem[] => {
    const chatMap = new Map<string, RecentChatItem>();
    const groupNames: Record<string, string> = {
      'general-chat': 'Geral',
      'group-directors': 'Diretores',
      'group-managers': 'Gerentes',
      'group-supervisors': 'Supervisores',
      'group-employees': 'Funcionários'
    };
    Object.keys(messages).forEach(channelId => {
      const channelMessages = messages[channelId];
      if (channelMessages.length === 0) return;
      const lastMessage = channelMessages[channelMessages.length - 1];
      let messagePrefix = "";
      if (lastMessage.senderId === currentUser?.id) {
        messagePrefix = "Você: ";
      } else if (channelId.startsWith('group-') || channelId === 'general-chat') {
        messagePrefix = `${lastMessage.senderName}: `;
      }
      const finalMessageContent = messagePrefix + lastMessage.content;
      if (channelId.startsWith('group-') || channelId === 'general-chat') {
        chatMap.set(channelId, {
          id: channelId,
          name: groupNames[channelId] || 'Grupo Desconhecido',
          type: 'group',
          lastMessage: finalMessageContent,
          timestamp: new Date(lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
      } else if (channelId.startsWith('private-') && currentUser) {
        const ids = channelId.replace('private-', '').split('-');
        const id1 = ids.slice(0, 2).join('-');
        const id2 = ids.slice(2).join('-');
        const otherUserId = id1 === currentUser.id ? id2 : id1;
        const otherUser = allUsers.get(otherUserId);
        chatMap.set(channelId, {
          id: channelId,
          name: otherUser?.name || 'Conversa Privada',
          type: 'private',
          lastMessage: finalMessageContent,
          timestamp: new Date(lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
      }
    });
    const openChatIds = new Set(openChats.map(c => c.id));
    openChatIds.delete('general-chat');
    return Array.from(chatMap.values())
      .filter(chat => !openChatIds.has(chat.id))
      .sort((a, b) => {
          if (!messages[a.id] || messages[a.id].length === 0) return 1;
          if (!messages[b.id] || messages[b.id].length === 0) return -1;
          const timeA = messages[a.id][messages[a.id].length - 1].timestamp;
          const timeB = messages[b.id][messages[b.id].length - 1].timestamp;
          return new Date(timeB).getTime() - new Date(timeA).getTime();
      });
  }, [messages, allUsers, currentUser, openChats]);


  // ✅ *** CORREÇÃO PASSO 2: Salvar no localStorage ao logar ***
  const handleLogin = (user: User) => {
    try {
      localStorage.setItem('chat-user', JSON.stringify(user));
    } catch (error) {
      console.error("Falha ao salvar usuário no localStorage", error);
    }
    setCurrentUser(user);
  };

  // ✅ *** CORREÇÃO PASSO 3: Limpar o localStorage ao deslogar ***
  const handleLogout = () => {
    try {
      localStorage.removeItem('chat-user');
    } catch (error) {
      console.error("Falha ao remover usuário do localStorage", error);
    }
    setCurrentUser(null);
    setOpenChats([]);
    setActiveChatId(null);
    setUnreadCounts({});
  };
  
  const handleCloseChat = (chatId: string) => {
    setOpenChats(prev => {
      const updatedChats = prev.filter(chat => chat.id !== chatId);
      if (activeChatId === chatId) {
        setActiveChatId(updatedChats.find(c => c.id === 'general-chat') ? 'general-chat' : (updatedChats.length > 0 ? updatedChats[0].id : null));
      }
      return updatedChats;
    });
    setUnreadCounts(prevCounts => {
      const newCounts = { ...prevCounts };
      delete newCounts[chatId];
      return newCounts;
    });
  };

  const handleSendMessage = (content: string, priority: 'normal' | 'urgent') => {
    if (!currentUser || !activeChannel?.canSendMessage) return;
    const localMessage: Message = {
      id: `msg-local-${Date.now()}`,
      type: 'message',
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      channelId: activeChannel.id,
      content: content,
      priority: priority,
      timestamp: new Date()
    };
    setMessages(prev => {
      const oldMessages = prev[localMessage.channelId] || [];
      const newChannelMessages = [...oldMessages, localMessage];
      return { ...prev, [localMessage.channelId]: newChannelMessages };
    });
    sendMessage({ 
      type: 'message', 
      senderId: currentUser.id, 
      senderName: currentUser.name, 
      senderRole: currentUser.role, 
      channelId: activeChannel.id, 
      content, 
      priority 
    });
  };

  const handleStatusChange = (status: User['status']) => { 
    if (currentUser) setCurrentUser({ ...currentUser, status }); 
  };
  
  const handleOpenGroupChat = (channelType: 'directors' | 'managers' | 'supervisors' | 'employees') => {
    const channelId = `group-${channelType}`;
    const channelNames = { 
        directors: 'Canal dos Diretores',
        managers: 'Canal dos Gerentes', 
        supervisors: 'Canal dos Supervisores', 
        employees: 'Canal dos Funcionários' 
    };
    
    ensureChatTabExists(channelId, channelNames[channelType], 'group');
    selectChat(channelId);
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
        onNodeSelect={(node) => selectPrivateChat(node.id, node.name)}
        onOpenGroupChat={handleOpenGroupChat}
        onSelectRecentChat={selectRecentChat}
        onLogout={handleLogout}
        onStatusChange={handleStatusChange}
        onRegisterUser={() => setRegisterModalOpen(true)}
        unreadCounts={unreadCounts}
        userUnreadCounts={userUnreadCounts}
      />
      <ChatArea 
        activeChannel={activeChannel} 
        messages={messages} 
        currentUser={currentUser} 
        onSendMessage={handleSendMessage} 
        openChats={openChats} 
        activeChatId={activeChatId} 
        onSelectChat={selectChat}
        onCloseChat={handleCloseChat}
        unreadCounts={unreadCounts}
      />
      
      <RegisterUserModal
        isOpen={isRegisterModalOpen}
        onClose={() => setRegisterModalOpen(false)}
        onRegister={handleRegisterUser}
        currentUserRole={currentUser.role}
      />

      <SystemNotification message="Conexão restaurada." show={showNotification} onClose={() => setShowNotification(false)} />
    </div>
  );
}

export default App;