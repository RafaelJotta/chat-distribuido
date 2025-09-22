import React, { useState, useEffect } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { SystemNotification } from './components/SystemNotification';
import { useWebSocket } from './hooks/useWebSocket';
import { currentUser, hierarchyNodes, channels, mockMessages } from './data/mockData';
import { Message, Channel, HierarchyNode } from './types';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedNode, setSelectedNode] = useState<HierarchyNode | null>(null);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const { systemStatus, showNotification, setShowNotification } = useWebSocket();

  const handleLogin = (email: string, password: string) => {
    // Simple authentication check for demo
    if (email === 'adm@empresa.com' && password === 'adm') {
      setIsAuthenticated(true);
    } else {
      alert('Credenciais inválidas. Use: adm@empresa.com / adm');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setSelectedNode(null);
    setActiveChannel(null);
    setMessages(mockMessages);
  };
  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const handleNodeSelect = (node: HierarchyNode) => {
    setSelectedNode(node);
    
    // Determine what channel the current user can send to based on hierarchy
    let targetChannel: Channel | null = null;
    
    if (currentUser.role === 'director') {
      // Directors can send to managers or supervisors
      if (node.role === 'manager' || (node.role === 'director' && node.children)) {
        targetChannel = {
          id: 'announcements-managers',
          name: 'Canal de Avisos - Gerentes',
          type: 'announcement' as const,
          members: hierarchyNodes[0].children?.map(child => child.id) || [],
          targetLevel: 'manager' as const,
          canSendMessage: true,
        };
      } else if (node.role === 'supervisor') {
        targetChannel = {
          id: 'announcements-supervisors', 
          name: 'Canal de Avisos - Supervisores',
          type: 'announcement' as const,
          members: hierarchyNodes[0].children?.flatMap(child => 
            child.children?.map(grandchild => grandchild.id) || []
          ) || [],
          targetLevel: 'supervisor' as const,
          canSendMessage: true,
        };
      }
    } else if (currentUser.role === 'manager') {
      // Managers can send to their supervisors
      if (node.role === 'supervisor') {
        const currentManager = hierarchyNodes[0].children?.find(mgr => 
          mgr.children?.some(sup => sup.id === currentUser.id)
        );
        targetChannel = {
          id: `announcements-supervisors-${currentManager?.id}`,
          name: `Canal de Avisos - Supervisores (${currentManager?.name})`,
          type: 'announcement' as const,
          members: currentManager?.children?.map(child => child.id) || [],
          targetLevel: 'supervisor' as const,
          canSendMessage: true,
        };
      }
    } else {
      // Supervisors can only view, not send
      targetChannel = {
        id: 'view-only',
        name: `Avisos Recebidos`,
        type: 'announcement' as const,
        members: [currentUser.id],
        targetLevel: 'supervisor' as const,
        canSendMessage: false,
      };
    }
    
    setActiveChannel(targetChannel);
  };

  const handleSendMessage = (content: string, priority: 'normal' | 'urgent') => {
    if (!activeChannel?.canSendMessage) {
      alert('Você não tem permissão para enviar mensagens neste canal.');
      return;
    }

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      content,
      timestamp: new Date(),
      priority,
    };

    setMessages(prev => [...prev, newMessage]);

    // Simulate acknowledgment from subordinates
    if (currentUser.role === 'director' && activeChannel.targetLevel === 'manager') {
      setTimeout(() => {
        const aiResponse: Message = {
          id: `msg-${Date.now()}-ai`,
          senderId: 'mgr-1',
          senderName: 'Alessandro Augusto',
          senderRole: 'manager',
          content: 'Aviso recebido e compreendido. Vamos implementar as diretrizes.',
          originalContent: 'Notice received and understood. We will implement the guidelines.',
          timestamp: new Date(),
          priority: 'normal',
          isTranslated: true,
        };
        setMessages(prev => [...prev, aiResponse]);
      }, 2000);
    }
  };

  return (
    <div className="h-screen bg-slate-900 text-white flex">
      <Sidebar
        currentUser={currentUser}
        hierarchyNodes={hierarchyNodes}
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
        message="Conexão restaurada através de um nó temporário. O sistema permanece operacional."
        show={showNotification}
        onClose={() => setShowNotification(false)}
      />
    </div>
  );
}

export default App;