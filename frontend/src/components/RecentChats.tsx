// frontend/src/components/RecentChats.tsx

import React from 'react';
import { User, Users } from 'lucide-react';
import { RecentChatItem } from '../types';

interface RecentChatsProps {
  chats: RecentChatItem[];
  // ✅ *** CORREÇÃO AQUI *** ✅
  // A função 'onSelect' agora espera o objeto RecentChatItem inteiro
  onSelect: (chat: RecentChatItem) => void;
  unreadCounts: Record<string, number>;
}

export const RecentChats: React.FC<RecentChatsProps> = ({ chats, onSelect, unreadCounts }) => {
  if (chats.length === 0) {
    return <p className="p-2 text-sm text-gray-500">Nenhuma conversa recente.</p>;
  }

  return (
    <div className="space-y-1">
      {chats.map((chat) => {
        const count = unreadCounts[chat.id] || 0; 
        
        return (
          <div
            key={chat.id}
            // ✅ *** CORREÇÃO AQUI *** ✅
            // Agora passa o 'chat' inteiro no clique
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
              <p className={`text-sm font-semibold truncate ${count > 0 ? 'text-white' : 'text-gray-300'}`}>
                {chat.name}
              </p>
              <p className={`text-xs truncate ${count > 0 ? 'text-teal-400' : 'text-gray-400'}`}>
                {chat.lastMessage}
              </p>
            </div>

            {/* Timestamp e Badge */}
            <div className="flex flex-col items-end self-start">
                <span className="text-xs text-gray-500">{chat.timestamp}</span>
                {count > 0 && (
                <span className="mt-1 bg-red-600 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                    {count}
                </span>
                )}
            </div>
          </div>
        );
      })}
    </div>
  );
};