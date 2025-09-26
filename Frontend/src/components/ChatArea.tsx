import React, { useEffect, useRef } from 'react';
import { Megaphone, AlertCircle, MessageSquare } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { MessageComposer } from './MessageComposer';
import { ChatTabs } from './ChatTabs';
import { Message, Channel, User } from '../types/index';

interface ChatAreaProps {
  activeChannel: Channel | null;
  messages: Record<string, Message[]>;
  currentUser: User;
  onSendMessage: (content: string, priority: 'normal' | 'urgent') => void;
  openChats: Channel[];
  activeChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onCloseChat: (chatId: string) => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  activeChannel,
  messages,
  currentUser,
  onSendMessage,
  openChats,
  activeChatId,
  onSelectChat,
  onCloseChat,
}) => {
  const messagesForChannel = activeChannel ? messages[activeChannel.id] || [] : [];
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messagesForChannel]);
  
  return (
    <div className="flex-1 flex flex-col bg-slate-800">
      {activeChannel ? (
        <>
          <div className="bg-slate-700 border-b border-slate-600 p-4 flex-shrink-0">
            <div className="flex items-center gap-3">
              {activeChannel.type === 'private' ? (
                 <MessageSquare className="w-5 h-5 text-teal-400" />
              ) : (
                 <Megaphone className="w-5 h-5 text-teal-400" />
              )}
              <div>
                <h2 className="font-semibold text-white">{activeChannel.name}</h2>
                <p className="text-sm text-gray-400">
                  {activeChannel.type === 'private' ? 'Conversa privada' : 'Canal de grupo'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messagesForChannel.map((message) => (
                <MessageBubble key={message.id} message={message} isOwn={message.senderId === currentUser.id} currentUserRole={currentUser.role}/>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* <<< A BARRA DE ABAS ESTÁ DE VOLTA AQUI! >>> */}
          <ChatTabs 
            openChats={openChats}
            activeChatId={activeChatId}
            onSelectChat={onSelectChat}
            onCloseChat={onCloseChat}
          />
          
          <div className="p-4 bg-slate-900 border-t border-slate-700 flex-shrink-0">
            {activeChannel.canSendMessage ? (
              <MessageComposer onSendMessage={onSendMessage} />
            ) : (
              <div className="text-center text-gray-500 text-sm"><AlertCircle className="w-4 h-4 mx-auto mb-2" />Canal somente leitura.</div>
            )}
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-400 mb-2">
              Nenhum chat aberto
            </h2>
            <p className="text-gray-500">
              Clique em um funcionário no diretório para iniciar uma conversa.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};