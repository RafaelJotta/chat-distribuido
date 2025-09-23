import React, { useState } from 'react';
// CORREÇÃO: Padronizada a capitalização dos nomes dos componentes para PascalCase (ex: Sidebar)
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
  
  const [selectedNode, setSelectedNode] = useState<HierarchyNode | null>(null);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);

  const { systemStatus, showNotification, setShowNotification, sendMessage } = useWebSocket(setHierarchy, setMessages, !!currentUser);

  const handleLogin = (loggedInUser: User) => {
    setCurrentUser(loggedInUser);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    // A lógica no hook useWebSocket irá lidar com a desconexão
  };

  const handleNodeSelect = (node: HierarchyNode) => {
    if (!currentUser) return;
    setSelectedNode(node);
    
    let targetChannel: Channel | null = null;
    if (currentUser.role === 'director') {
        targetChannel = { id: `avisos-${node.role}-${node.id}`, name: `Avisos para ${node.name}`, type: 'announcement', members: [], targetLevel: node.role, canSendMessage: true };
    } else if (currentUser.role === 'manager') {
        if(node.role === 'supervisor') {
            targetChannel = { id: `avisos-sup-${node.id}`, name: `Avisos para Supervisores`, type: 'announcement', members: [], targetLevel: 'supervisor', canSendMessage: true };
        }
    } else {
       targetChannel = { id: 'view-only', name: `Avisos Recebidos`, type: 'announcement', members: [], targetLevel: 'supervisor', canSendMessage: false };
    }
    setActiveChannel(targetChannel);
  };

  const handleSendMessage = (content: string, priority: 'normal' | 'urgent') => {
    if (!currentUser || !activeChannel?.canSendMessage) return;

    const newMessage = {
      type: 'message' as const,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      content,
      priority,
    };
    sendMessage(newMessage);
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
        selectedNodeId={selectedNode?.id}
        onLogout={handleLogout}
      />
      
      <ChatArea
        activeChannel={activeChannel}
        messages={messages}
        currentUserId={currentUser.id}
        onSendMessage={handleSendMessage}
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
