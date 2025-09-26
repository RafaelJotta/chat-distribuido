// src/components/ChatTabs.tsx

import React from 'react';
import { X, MessageSquare, Megaphone } from 'lucide-react';
import { Channel } from '../types';

interface ChatTabsProps {
  openChats: Channel[];
  activeChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onCloseChat: (chatId: string) => void;
}

export const ChatTabs: React.FC<ChatTabsProps> = ({ 
  openChats, 
  activeChatId, 
  onSelectChat, 
  onCloseChat 
}) => {
  if (openChats.length === 0) {
    return null;
  }

  return (
    // MUDANÇA: Removida a borda superior daqui, pois agora fica entre componentes
    <div className="bg-slate-800 h-10 flex items-center px-2 gap-2 flex-shrink-0">
      {openChats.map((chat) => {
        const isActive = chat.id === activeChatId;
        return (
          <div
            key={chat.id}
            onClick={() => onSelectChat(chat.id)}
            // MUDANÇA: A borda agora é inferior no elemento ativo, para um visual melhor
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
            
            {/* MUDANÇA: O botão de fechar só aparece se o ID do chat não for 'general-chat' */}
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