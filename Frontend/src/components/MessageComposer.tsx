import React, { useState } from 'react';
import { Send, Zap, AlertTriangle, ChevronDown } from 'lucide-react';

interface MessageComposerProps {
  onSendMessage: (content: string, priority: 'normal' | 'urgent') => void;
}

export const MessageComposer: React.FC<MessageComposerProps> = ({ onSendMessage }) => {
  const [message, setMessage] = useState('');
  const [showUrgentOption, setShowUrgentOption] = useState(false);
  const [showModerationAlert, setShowModerationAlert] = useState(false);

  const inappropriateWords = ['badword', 'inappropriate', 'offensive'];

  const checkModeration = (text: string) => {
    return inappropriateWords.some(word => 
      text.toLowerCase().includes(word.toLowerCase())
    );
  };

  const handleInputChange = (value: string) => {
    setMessage(value);
    if (checkModeration(value)) {
      setShowModerationAlert(true);
    } else {
      setShowModerationAlert(false);
    }
  };

  const handleSend = (priority: 'normal' | 'urgent' = 'normal') => {
    if (!message.trim()) return;
    
    if (checkModeration(message)) {
      setShowModerationAlert(true);
      return;
    }

    onSendMessage(message, priority);
    setMessage('');
    setShowUrgentOption(false);
    setShowModerationAlert(false);
  };

  const getHighlightedText = (text: string) => {
    if (!checkModeration(text)) return text;

    let highlightedText = text;
    inappropriateWords.forEach(word => {
      const regex = new RegExp(`(${word})`, 'gi');
      highlightedText = highlightedText.replace(regex, '<mark class="bg-amber-500 bg-opacity-50 text-amber-200">$1</mark>');
    });
    
    return highlightedText;
  };

  return (
    <div className="relative">
      {showModerationAlert && (
        <div className="absolute -top-16 left-0 right-0 bg-amber-600 text-white p-3 rounded-lg mb-2 animate-fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm">
              A mensagem contém termos que violam a política da empresa. Corrija antes de enviar.
            </span>
          </div>
        </div>
      )}
      
      <div className="flex gap-2 bg-slate-700 rounded-lg p-4">
        <div className="flex-1 relative">
          <div className="relative">
            <textarea
              value={message}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="Digite seu aviso para a equipe..."
              className="w-full bg-slate-600 text-white placeholder-gray-400 rounded-lg p-3 pr-20 min-h-[44px] max-h-32 resize-none focus:outline-none focus:ring-2 focus:ring-teal-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend('normal');
                }
              }}
            />
            {checkModeration(message) && (
              <div 
                className="absolute inset-0 p-3 pointer-events-none text-transparent"
                dangerouslySetInnerHTML={{ __html: getHighlightedText(message) }}
              />
            )}
          </div>
        </div>
        
        <div className="relative">
          <div className="flex">
            <button
              onClick={() => handleSend('normal')}
              disabled={!message.trim() || checkModeration(message)}
              className="bg-teal-600 hover:bg-teal-700 disabled:bg-slate-500 disabled:cursor-not-allowed text-white p-3 rounded-l-lg transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
            
            <div className="relative">
              <button
                onClick={() => setShowUrgentOption(!showUrgentOption)}
                className="bg-teal-600 hover:bg-teal-700 text-white p-3 rounded-r-lg border-l border-teal-800 transition-colors"
              >
                <ChevronDown className={`w-4 h-4 transition-transform ${showUrgentOption ? 'rotate-180' : ''}`} />
              </button>
              
              {showUrgentOption && (
                <div className="absolute bottom-full right-0 mb-2 bg-slate-800 border border-slate-600 rounded-lg shadow-lg animate-fade-in">
                  <button
                    onClick={() => handleSend('urgent')}
                    disabled={!message.trim() || checkModeration(message)}
                    className="flex items-center gap-2 px-4 py-3 text-red-400 hover:bg-slate-700 disabled:text-gray-500 disabled:cursor-not-allowed rounded-lg whitespace-nowrap"
                  >
                    <Zap className="w-4 h-4" />
                    Aviso Urgente
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};