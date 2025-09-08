import React, { useState, useEffect, useRef } from 'react';
import { BsPaperclip, BsImage, BsCodeSlash, BsSendFill } from 'react-icons/bs';
// CORREÇÃO APLICADA NAS LINHAS ABAIXO (REMOVIDO O .js):
import { connectWebSocket, disconnectWebSocket } from '../services/websocket';
import { sendMessage } from '../services/api';
import { moderateText } from '../utils/edge-intelligence';
import avatarImg from '../assets/ana_avatar.png';

function ChatPage() {
    // O resto do seu código permanece exatamente o mesmo
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const messageListRef = useRef(null);

    useEffect(() => {
        connectWebSocket((incomingMessage) => {
            setMessages(prevMessages => [...prevMessages, { ...incomingMessage, isMine: false }]);
        });
        return () => {
            disconnectWebSocket();
        };
    }, []);

    useEffect(() => {
        if (messageListRef.current) {
            messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (newMessage.trim() === '') return;
        const moderatedText = moderateText(newMessage);
        const tempMessage = {
            sender: 'Você',
            text: moderatedText,
            isMine: true
        };
        setMessages(prevMessages => [...prevMessages, tempMessage]);
        try {
            await sendMessage(moderatedText);
            setNewMessage('');
        } catch (error) {
            console.error("Falha ao enviar mensagem:", error);
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