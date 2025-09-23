// src/types/index.ts

export interface User {
  id: string;
  name: string;
  avatar: string;
  role: 'director' | 'manager' | 'supervisor';
  status: 'online' | 'away' | 'busy' | 'offline';
}

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

// ADICIONADO DE VOLTA: A interface Channel que estava faltando.
export interface Channel {
  id: string;
  name: string;
  type: 'announcement' | 'group' | 'private';
  members: string[];
  targetLevel: 'director' | 'manager' | 'supervisor' | 'user' | 'group'; 
  canSendMessage?: boolean;
}

export interface SystemStatus {
  status: 'connected' | 'reconnecting' | 'disconnected';
  message: string;
}

// CORRIGIDO: Removida a duplicata e mantida a versão completa com o 'status'.
export interface HierarchyNode {
  id: string;
  name: string;
  role: 'director' | 'manager' | 'supervisor';
  children?: HierarchyNode[];
  isExpanded?: boolean;
  status?: 'online' | 'away' | 'busy' | 'offline';
}