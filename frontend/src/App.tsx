// frontend/src/App.tsx

import { useState, useMemo, useEffect, useCallback } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { SystemNotification } from './components/SystemNotification';
import { useWebSocket } from './hooks/useWebSocket';
import { Message, Channel, User } from './types/index';
import { DirectoryData } from './components/DirectoryList';
// ✅ NOVO: Importa o componente do modal
import { RegisterUserModal } from './components/RegisterUserModal'; 

// Função helper para criar um ID de canal privado consistente
const createPrivateChannelId = (userId1: string, userId2: string) => {
  const sortedIds = [userId1, userId2].sort();
  return `private-${sortedIds[0]}-${sortedIds[1]}`;
};

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [openChats, setOpenChats] = useState<Channel[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [directoryData, setDirectoryData] = useState<DirectoryData>({
    director: undefined, managers: [], supervisors: [], employees: [],
  });
  
  const [showNotification, setShowNotification] = useState(false);
  // ✅ NOVO: Estado para controlar a visibilidade do modal de registro
  const [isRegisterModalOpen, setRegisterModalOpen] = useState(false);

  const openPrivateChat = useCallback((nodeId: string, nodeName: string) => {
    if (!currentUser || nodeId === currentUser.id) return;
    const privateChatId = createPrivateChannelId(currentUser.id, nodeId);
    if (!openChats.some(chat => chat.id === privateChatId)) {
      const newPrivateChat: Channel = {
        id: privateChatId,
        name: nodeName,
        type: 'private',
        canSendMessage: true,
        members: [currentUser.id, nodeId]
      };
      setOpenChats(prev => [...prev, newPrivateChat]);
    }
    setActiveChatId(privateChatId);
  }, [currentUser, openChats]); 
  
  const { systemStatus, sendMessage } = useWebSocket({
    currentUser,
    setDirectoryData,
    setMessages,
    openPrivateChat,
  });

  // ✅ NOVO: Função para lidar com o registro de um novo usuário
  const handleRegisterUser = async (newUserData: Omit<User, 'id' | 'status'>) => {
    if (!currentUser) return;

    // Adiciona o ID do usuário atual como o 'manager_id' do novo usuário
    const fullUserData = {
      ...newUserData,
      manager_id: currentUser.id,
    };

    try {
      const response = await fetch('http://localhost:8080/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fullUserData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Falha ao cadastrar usuário.');
      }

      alert('Usuário cadastrado com sucesso! A lista será atualizada em breve.');
      setRegisterModalOpen(false); // Fecha o modal
      // Em uma aplicação mais robusta, você poderia forçar a atualização da hierarquia aqui.
      
    } catch (error) {
      if (error instanceof Error) {
        alert(`Erro: ${error.message}`);
      } else {
        alert('Ocorreu um erro desconhecido.');
      }
    }
  };

  useEffect(() => {
    if (currentUser && !openChats.some(c => c.id === 'general-chat')) {
      const generalChat: Channel = {
        id: 'general-chat', name: 'Geral', type: 'group', members: [], canSendMessage: true,
      };
      setOpenChats([generalChat]);
      setActiveChatId(generalChat.id);
    }
  }, [currentUser, openChats]);

  const activeChannel = useMemo(() => openChats.find(chat => chat.id === activeChatId) || null, [openChats, activeChatId]);
  
  const handleLogin = (user: User) => setCurrentUser(user);
  const handleLogout = () => {
    setCurrentUser(null);
    setOpenChats([]);
    setActiveChatId(null);
  };
  
  const handleSelectChat = (chatId: string) => setActiveChatId(chatId);
  const handleCloseChat = (chatId: string) => {
    setOpenChats(prev => {
      const updatedChats = prev.filter(chat => chat.id !== chatId);
      if (activeChatId === chatId) {
        setActiveChatId(updatedChats.length > 0 ? updatedChats[0].id : null);
      }
      return updatedChats;
    });
  };

  const handleSendMessage = (content: string, priority: 'normal' | 'urgent') => {
    if (!currentUser || !activeChannel?.canSendMessage) return;
    sendMessage({ type: 'message', senderId: currentUser.id, senderName: currentUser.name, senderRole: currentUser.role, channelId: activeChannel.id, content, priority });
  };

  const handleStatusChange = (status: User['status']) => { 
    if (currentUser) setCurrentUser({ ...currentUser, status }); 
  };
  
  const handleOpenGroupChat = (channelType: 'managers' | 'supervisors' | 'employees') => {
    const channelId = `group-${channelType}`;
    if (!openChats.some(chat => chat.id === channelId)) {
      const channelNames = { managers: 'Canal dos Gerentes', supervisors: 'Canal dos Supervisores', employees: 'Canal dos Funcionários' };
      const newGroupChat: Channel = {
        id: channelId, name: channelNames[channelType], type: 'group', canSendMessage: true, members: [],
        targetLevel: channelType.slice(0, -1) as any,
      };
      setOpenChats(prev => [...prev, newGroupChat]);
    }
    setActiveChatId(channelId);
  };
  
  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="h-screen bg-slate-900 text-white flex">
      <Sidebar
        currentUser={currentUser}
        directoryData={directoryData}
        recentChats={[]}
        systemStatus={systemStatus}
        onNodeSelect={(node) => openPrivateChat(node.id, node.name)}
        onOpenGroupChat={handleOpenGroupChat}
        onSelectRecentChat={() => {}}
        onLogout={handleLogout}
        onStatusChange={handleStatusChange}
        // ✅ NOVO: Passa a função para abrir o modal
        onRegisterUser={() => setRegisterModalOpen(true)}
      />
      <ChatArea activeChannel={activeChannel} messages={messages} currentUser={currentUser} onSendMessage={handleSendMessage} openChats={openChats} activeChatId={activeChatId} onSelectChat={handleSelectChat} onCloseChat={handleCloseChat} />
      
      {/* ✅ NOVO: Renderiza o modal condicionalmente */}
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