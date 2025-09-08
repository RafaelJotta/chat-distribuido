import React, { useState, useEffect, useRef } from 'react';
import { BsPaperclip, BsImage, BsCodeSlash, BsSendFill } from 'react-icons/bs';
import { connectWebSocket, disconnectWebSocket } from '../services/websocket';
import { sendMessage } from '../services/api';
import { moderateText } from '../utils/edge-intelligence';
import avatarImg from '../assets/ana_avatar.png';

function ChatPage() {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const messageListRef = useRef(null);

    // Efeito para conectar ao WebSocket e escutar por mensagens
    useEffect(() => {
        connectWebSocket((incomingMessage) => {
            setMessages(prevMessages => [...prevMessages, { ...incomingMessage, isMine: false }]);
        });

        // Limpa a conexão ao sair do componente
        return () => {
            disconnectWebSocket();
        };
    }, []);

    // Efeito para rolar a lista de mensagens para o final
    useEffect(() => {
        if (messageListRef.current) {
            messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (newMessage.trim() === '') return;

        const moderatedText = moderateText(newMessage);

        // Adiciona a mensagem à tela instantaneamente para o usuário ver
        const tempMessage = {
            sender: 'Você',
            text: moderatedText,
            isMine: true
        };
        setMessages(prevMessages => [...prevMessages, tempMessage]);

        // Tenta enviar a mensagem para o servidor
        try {
            await sendMessage(moderatedText);
            setNewMessage('');
        } catch (error) {
            console.error("Falha ao enviar mensagem:", error);
            // Opcional: Adicionar um indicador de falha na mensagem
        }
    };

    return (
        <div className="chat-container">
            <div className="chat-header">
                <img src={avatarImg} alt="Avatar" className="avatar" />
                <div className="info">
                    <h3>AI Chat</h3>
                    <p>Online</p>
                </div>
            </div>

            <div className="message-list" ref={messageListRef}>
                 {messages.map((msg, index) => (
                    <div key={index} className={`message-item ${msg.isMine ? 'sent' : 'received'}`}>
                        <div className="message-bubble">{msg.text}</div>
                    </div>
                ))}
            </div>

            <form className="message-input-form" onSubmit={handleSendMessage}>
                <button type="button" className="icon-btn"><BsPaperclip /></button>
                <button type="button" className="icon-btn"><BsImage /></button>
                <button type="button" className="icon-btn"><BsCodeSlash /></button>
                
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Ask me anything..."
                />
                <button type="submit" className="icon-btn send-btn"><BsSendFill /></button>
            </form>
        </div>
    );
}

export default ChatPage;