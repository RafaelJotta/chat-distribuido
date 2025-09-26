export interface User {
  id: string;
  name: string;
  email?: string;
  password?: string;
  avatar?: string;
  role: 'director' | 'manager' | 'supervisor' | 'employee';
  status: 'online' | 'away' | 'busy' | 'offline';
}

export interface Message {
  type: 'message' | 'userJoined' | 'typing';
  id: string;
  senderId: string;
  senderName: string;
  senderRole: User['role'];
  content: string;
  timestamp: Date;
  priority: 'normal' | 'urgent';
  channelId: string;
}

export interface Channel {
  id: string;
  name: string;
  type: 'group' | 'private';
  members: string[];
  targetLevel?: 'director' | 'manager' | 'supervisor' | 'employee' | 'user'; 
  canSendMessage?: boolean;
}

export interface SystemStatus {
  status: 'connected' | 'reconnecting' | 'disconnected';
  message: string;
}

export interface HierarchyNode {
  id: string;
  name: string;
  email?: string; 
  role: User['role'];
  status?: User['status'];
  children?: HierarchyNode[];
}

export interface RecentChatItem {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  type: 'private' | 'group';
  node?: HierarchyNode; 
}