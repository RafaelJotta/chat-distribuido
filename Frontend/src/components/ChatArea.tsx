import React from 'react';
import { Megaphone, Users, AlertCircle } from 'lucide-react';
// CORREÇÃO: Adicionada a extensão .tsx nos imports dos componentes
import { MessageBubble } from './MessageBubble.tsx';
import { MessageComposer } from './MessageComposer.tsx';
import { Message, Channel } from '../types/index.ts';

interface ChatAreaProps {
  activeChannel: Channel | null;
  messages: Message[];
  currentUserId: string;
  onSendMessage: (content: string, priority: 'normal' | 'urgent') => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  activeChannel,
  messages,
  currentUserId,
  onSendMessage,
}) => {
  if (!activeChannel) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-800">
        <div className="text-center">
          <Megaphone className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-400 mb-2">
            Selecione um nível hierárquico
          </h2>
          <p className="text-gray-500">
            Escolha um nível na hierarquia para enviar avisos ou visualizar comunicados
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-800">
      {/* Chat Header */}
      <div className="bg-slate-700 border-b border-slate-600 p-4">
        <div className="flex items-center gap-3">
          {activeChannel.canSendMessage ? (
            <Megaphone className="w-5 h-5 text-teal-400" />
          ) : (
            <Users className="w-5 h-5 text-gray-400" />
          )}
          <div>
            <h2 className="font-semibold text-white">{activeChannel.name}</h2>
            <p className="text-sm text-gray-400">
              {activeChannel.canSendMessage 
                ? `Canal de comunicação hierárquica` 
                : 'Visualização de avisos recebidos'
              }
            </p>
          </div>
          {!activeChannel.canSendMessage && (
            <div className="ml-auto flex items-center gap-2 text-amber-400">
              <AlertCircle className="w-4 h-4" />
              <span className="text-xs">Somente leitura</span>
            </div>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-gray-500">Nenhum aviso ainda</p>
              <p className="text-sm text-gray-600 mt-1">
                {activeChannel.canSendMessage 
                  ? 'Envie o primeiro aviso para sua equipe!' 
                  : 'Aguardando comunicados da hierarquia superior.'
                }
              </p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isOwn={message.senderId === currentUserId}
            />
          ))
        )}
      </div>

      {/* Message Composer */}
      {activeChannel.canSendMessage ? (
        <div className="p-4 bg-slate-900 border-t border-slate-700">
          <MessageComposer onSendMessage={onSendMessage} />
        </div>
      ) : (
        <div className="p-4 bg-slate-900 border-t border-slate-700">
          <div className="text-center text-gray-500 text-sm">
            <AlertCircle className="w-4 h-4 mx-auto mb-2" />
            Você não tem permissão para enviar avisos neste canal.
          </div>
        </div>
      )}
    </div>
  );
};