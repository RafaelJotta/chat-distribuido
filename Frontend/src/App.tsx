// src/App.tsx

import { useState, useMemo, useEffect } from 'react'; // Adicionado useEffect
import { LoginScreen } from './components/LoginScreen.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { ChatArea } from './components/ChatArea.tsx';
import { SystemNotification } from './components/SystemNotification.tsx';
import { useWebSocket } from './hooks/useWebSocket.ts';
import { Message, Channel, HierarchyNode, User } from './types/index.ts';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [hierarchy, setHierarchy] = useState<HierarchyNode[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  
  const [openChats, setOpenChats] = useState<Channel[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  const { systemStatus, showNotification, setShowNotification, sendMessage } = useWebSocket(setHierarchy, setMessages, !!currentUser);

  // MUDANÇA: useEffect para inicializar o chat geral
  useEffect(() => {
    if (currentUser && openChats.length === 0) {
      const generalChat: Channel = {
        id: 'general-chat',
        name: 'Geral',
        type: 'group',
        canSendMessage: true,
        members: [], // Todos os membros participam por padrão
        targetLevel: 'group',
      };
      setOpenChats([generalChat]);
      setActiveChatId(generalChat.id);
    }
  }, [currentUser]); // Executa sempre que o usuário loga

  const activeChannel = useMemo(() => {
    return openChats.find(chat => chat.id === activeChatId) || null;
  }, [openChats, activeChatId]);

  const handleLogin = (loggedInUser: User) => {
    setCurrentUser(loggedInUser);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setOpenChats([]);
    setActiveChatId(null);
  };

  const handleNodeSelect = (node: HierarchyNode) => {
    if (!currentUser || node.id === currentUser.id) return;

    const privateChatId = `private-${node.id}`;
    const existingChat = openChats.find(chat => chat.id === privateChatId);

    if (existingChat) {
      setActiveChatId(existingChat.id);
    } else {
      const newPrivateChat: Channel = {
        id: privateChatId,
        name: node.name,
        type: 'private',
        canSendMessage: true,
        members: [currentUser.id, node.id],
        targetLevel: 'user',
      };
      setOpenChats(prevChats => [...prevChats, newPrivateChat]);
      setActiveChatId(newPrivateChat.id);
    }
  };
  
  const handleSelectChat = (chatId: string) => {
    setActiveChatId(chatId);
  };
  
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

  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="h-screen bg-slate-900 text-white flex">
      <Sidebar
        currentUser={currentUser}
        hierarchyNodes={hierarchy}
        systemStatus={systemStatus}
        onNodeSelect={handleNodeSelect}
        onLogout={handleLogout}
        onStatusChange={handleStatusChange}
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
        message="Conexão restaurada. O sistema permanece operacional."
        show={showNotification}
        onClose={() => setShowNotification(false)}
      />
    </div>
  );
}

export default App;