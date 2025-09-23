export interface User {
  id: string;
  name: string;
  avatar: string;
  role: 'director' | 'manager' | 'supervisor';
  status: 'online' | 'away' | 'offline';
}

// Interface de mensagem agora tem um campo 'type' opcional para o WebSocket
export interface Message {
  type: 'message' | 'userJoined' | 'typing';
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'director' | 'manager' | 'supervisor';
  content: string;
  originalContent?: string;
  timestamp: Date;
  priority: 'normal' | 'urgent';
  isTranslated?: boolean;
  isSummarized?: boolean;
  fullContent?: string;
}

export interface Channel {
  id: string;
  name: string;
  type: 'announcement' | 'group';
  members: string[];
  targetLevel: 'director' | 'manager' | 'supervisor';
  canSendMessage?: boolean;
}

export interface SystemStatus {
  status: 'connected' | 'reconnecting' | 'disconnected';
  message: string;
}

export interface HierarchyNode {
  id: string;
  name: string;
  role: 'director' | 'manager' | 'supervisor';
  children?: HierarchyNode[];
  isExpanded?: boolean;
}