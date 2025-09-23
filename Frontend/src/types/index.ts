// src/types/index.ts

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  avatar: string;
  role: 'director' | 'manager' | 'supervisor' | 'employee';
  status: 'online' | 'away' | 'busy' | 'offline';
}

export interface Message {
  type: 'message' | 'userJoined' | 'typing';
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'director' | 'manager' | 'supervisor' | 'employee';
  content: string;
  originalContent?: string;
  timestamp: Date;
  priority: 'normal' | 'urgent';
}

export interface Channel {
  id: string;
  name: string;
  type: 'announcement' | 'group' | 'private';
  members: string[];
  targetLevel: 'director' | 'manager' | 'supervisor' | 'employee' | 'user' | 'group'; 
  canSendMessage?: boolean;
}

export interface SystemStatus {
  status: 'connected' | 'reconnecting' | 'disconnected';
  message: string;
}

export interface HierarchyNode {
  id: string;
  name: string;
  // MUDANÇA: Adicionado o campo de email que estava faltando.
  email: string; 
  role: 'director' | 'manager' | 'supervisor' | 'employee';
  isExpanded?: boolean;
  status?: 'online' | 'away' | 'busy' | 'offline';
}

export interface RecentChatItem {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  type: 'private' | 'group';
  node?: HierarchyNode; 
}