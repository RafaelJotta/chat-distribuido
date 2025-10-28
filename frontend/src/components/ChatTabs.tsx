// frontend/src/components/ChatTabs.tsx

import React from 'react';
import { X, MessageSquare, Megaphone } from 'lucide-react';
import { Channel } from '../types';

interface ChatTabsProps {
  openChats: Channel[];
  activeChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onCloseChat: (chatId: string) => void;
  // ✅ *** NOVO PASSO 3.D *** ✅
  unreadCounts: Record<string, number>;
}

export const ChatTabs: React.FC<ChatTabsProps> = ({ 
  openChats, 
  activeChatId, 
  onSelectChat, 
  onCloseChat,
  // ✅ *** NOVO PASSO 3.E *** ✅
  unreadCounts
}) => {
  if (openChats.length === 0) {
    return null;
  }

  return (
    <div className="bg-slate-800 h-10 flex items-center px-2 gap-2 flex-shrink-0">
      {openChats.map((chat) => {
        const isActive = chat.id === activeChatId;
        // ✅ *** NOVO PASSO 3.F *** ✅
        // Pega a contagem para este chat específico
        const count = unreadCounts[chat.id] || 0;

        return (
          <div
            key={chat.id}
            onClick={() => onSelectChat(chat.id)}
            className={`flex items-center gap-2 h-full px-3 cursor-pointer border-b-2 transition-colors ${
              isActive
                ? 'bg-slate-700 text-white border-teal-500'
                : 'bg-transparent text-gray-400 hover:bg-slate-700/50 border-transparent'
            }`}
          >
            {chat.type === 'private' ? (
              <MessageSquare className="w-4 h-4 text-gray-400" />
            ) : (
              <Megaphone className="w-4 h-4 text-gray-400" />
            )}
            <span className="text-sm font-medium whitespace-nowrap">{chat.name}</span>
            
            {/* ✅ *** NOVO PASSO 3.G *** ✅
            // Renderiza o badge se a contagem for maior que 0 */}
            {count > 0 && (
              <span className="ml-2 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {count}
              </span>
            )}
            
            {chat.id !== 'general-chat' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseChat(chat.id);
                }}
                className="ml-2 text-gray-500 hover:text-white rounded-full p-0.5 hover:bg-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};