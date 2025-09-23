import React, { useState } from 'react';
import { Zap, MoreHorizontal } from 'lucide-react';
import { Message, User } from '../types';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  currentUserRole: User['role'];
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isOwn, currentUserRole }) => {
  const [showModMenu, setShowModMenu] = useState(false);

  const canModerate = (
    !isOwn &&
    (currentUserRole === 'director' || (currentUserRole === 'manager' && message.senderRole === 'supervisor'))
  );

  const handleMuteUser = () => {
    console.log(`Silenciando usuário: ${message.senderName}`);
    setShowModMenu(false);
  };

  const handleRemoveUser = () => {
    console.log(`Removendo usuário: ${message.senderName}`);
    setShowModMenu(false);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'director': return 'text-amber-400';
      case 'manager': return 'text-blue-400';
      case 'supervisor': return 'text-teal-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className={`flex gap-3 ${isOwn ? 'justify-end' : 'justify-start'} mb-4 group`}>
      {!isOwn && (
        <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-medium text-white">{message.senderName.charAt(0)}</span>
        </div>
      )}
      
      <div className={`max-w-xl w-full ${isOwn ? 'order-first' : ''}`}>
        {!isOwn && (
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-sm font-medium ${getRoleColor(message.senderRole)}`}>{message.senderName}</span>
            {message.priority === 'urgent' && <Zap className="w-4 h-4 text-red-500" />}
            <span className="text-xs text-gray-500">{new Date(message.timestamp).toLocaleTimeString()}</span>
          </div>
        )}
        
        <div className={`rounded-lg p-3 relative ${isOwn ? 'bg-teal-600 text-white' : message.priority === 'urgent' ? 'bg-slate-700 border-l-4 border-red-500' : 'bg-slate-700'}`}>
          {canModerate && (
            <div className="absolute top-1 right-1">
              <button 
                onClick={() => setShowModMenu(!showModMenu)} 
                className="opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-slate-600 transition-opacity"
                onBlur={() => setTimeout(() => setShowModMenu(false), 200)}
              >
                <MoreHorizontal className="w-4 h-4 text-gray-400" />
              </button>
              {showModMenu && (
                <div className="absolute top-full right-0 mt-1 w-40 bg-slate-800 border border-slate-600 rounded-lg shadow-lg z-10 animate-fade-in">
                  <button onClick={handleMuteUser} className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-slate-700 rounded-t-lg">Silenciar Usuário</button>
                  <button onClick={handleRemoveUser} className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-slate-700 rounded-b-lg">Remover do Canal</button>
                </div>
              )}
            </div>
          )}
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        </div>
        
        {isOwn && (
          <div className="text-xs text-gray-500 text-right mt-1">{new Date(message.timestamp).toLocaleTimeString()}</div>
        )}
      </div>
      
      {isOwn && (
        <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-medium text-white">Eu</span>
        </div>
      )}
    </div>
  );
};