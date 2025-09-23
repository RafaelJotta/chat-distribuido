// src/components/RecentChats.tsx

import React from 'react';
import { User, Users } from 'lucide-react';
import { RecentChatItem } from '../types';

interface RecentChatsProps {
  chats: RecentChatItem[];
  onSelect: (chat: RecentChatItem) => void;
}

export const RecentChats: React.FC<RecentChatsProps> = ({ chats, onSelect }) => {
  return (
    <div className="space-y-1">
      {chats.map((chat) => (
        <div
          key={chat.id}
          onClick={() => onSelect(chat)}
          className="flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors hover:bg-slate-700/50"
        >
          {/* Ícone */}
          <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center flex-shrink-0">
            {chat.type === 'private' ? (
              <User className="w-4 h-4 text-gray-300" />
            ) : (
              <Users className="w-4 h-4 text-gray-300" />
            )}
          </div>

          {/* Nome e Última Mensagem */}
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-semibold text-white truncate">{chat.name}</p>
            <p className="text-xs text-gray-400 truncate">{chat.lastMessage}</p>
          </div>

          {/* Horário */}
          <span className="text-xs text-gray-500 self-start">{chat.timestamp}</span>
        </div>
      ))}
    </div>
  );
};