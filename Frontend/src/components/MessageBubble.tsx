import React, { useState, useEffect } from 'react';
import { Globe, Scissors, Zap, MoreHorizontal } from 'lucide-react';
import { Message } from '../types';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isOwn }) => {
  const [showTranslation, setShowTranslation] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    if (message.isTranslated && !showTranslation) {
      setIsTranslating(true);
      setTimeout(() => {
        setIsTranslating(false);
        setShowTranslation(true);
      }, 1500);
    }
  }, [message.isTranslated, showTranslation]);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'director':
        return 'text-amber-400';
      case 'manager':
        return 'text-blue-400';
      case 'supervisor':
        return 'text-teal-400';
      default:
        return 'text-gray-400';
    }
  };

  const displayContent = () => {
    if (message.isTranslated && showTranslation) {
      return message.content;
    }
    if (message.isSummarized && !isExpanded) {
      return message.content;
    }
    if (message.isSummarized && isExpanded && message.fullContent) {
      return message.fullContent;
    }
    return message.originalContent || message.content;
  };

  return (
    <div className={`flex gap-3 ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
      {!isOwn && (
        <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center">
          <span className="text-xs font-medium text-white">
            {message.senderName.charAt(0)}
          </span>
        </div>
      )}
      
      <div className={`max-w-md ${isOwn ? 'order-first' : ''}`}>
        {!isOwn && (
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-sm font-medium ${getRoleColor(message.senderRole)}`}>
              {message.senderName}
            </span>
            {message.priority === 'urgent' && (
              <Zap className="w-4 h-4 text-red-500" />
            )}
            <span className="text-xs text-gray-500">
              {message.timestamp.toLocaleTimeString()}
            </span>
          </div>
        )}
        
        <div
          className={`rounded-lg p-3 relative ${
            isOwn
              ? 'bg-teal-600 text-white'
              : message.priority === 'urgent'
              ? 'bg-slate-700 border-l-4 border-red-500'
              : 'bg-slate-700'
          } ${isTranslating ? 'animate-pulse' : ''}`}
        >
          {isTranslating ? (
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 animate-spin text-amber-500" />
              <span className="text-sm text-amber-500">Traduzindo localmente...</span>
            </div>
          ) : (
            <>
              <div className={`transform transition-all duration-500 ${
                message.isTranslated && showTranslation ? 'animate-fade-in' : ''
              }`}>
                <p className="text-sm leading-relaxed">
                  {displayContent()}
                </p>
              </div>
              
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                  {message.isTranslated && showTranslation && (
                    <div className="flex items-center gap-1 text-xs text-amber-400">
                      <Globe className="w-3 h-3" />
                      <span>Traduzido localmente</span>
                    </div>
                  )}
                  
                  {message.isSummarized && (
                    <div className="flex items-center gap-1 text-xs text-teal-400">
                      <Scissors className="w-3 h-3" />
                      <span>Resumido localmente</span>
                    </div>
                  )}
                </div>
                
                {message.isSummarized && (
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-xs text-teal-400 hover:text-teal-300 underline"
                  >
                    {isExpanded ? 'Ver menos' : 'Ver mais'}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
        
        {isOwn && (
          <div className="text-xs text-gray-500 text-right mt-1">
            {message.timestamp.toLocaleTimeString()}
          </div>
        )}
      </div>
      
      {isOwn && (
        <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center">
          <span className="text-xs font-medium text-white">Eu</span>
        </div>
      )}
    </div>
  );
};