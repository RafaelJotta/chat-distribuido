import React, { useState } from 'react';
import LoginPage from './components/LoginPage';
import RegistrationPage from './components/RegistrationPage';
import ChatPage from './components/ChatPage';
import './App.css';

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('authToken'));
    const [currentPage, setCurrentPage] = useState('login'); // 'login', 'register'

    const handleLoginSuccess = () => {
        setIsLoggedIn(true);
    };

    const renderPage = () => {
        if (isLoggedIn) {
            return <ChatPage />;
        }

        switch (currentPage) {
            case 'login':
                return <LoginPage 
                            onLoginSuccess={handleLoginSuccess} 
                            onSwitchToRegister={() => setCurrentPage('register')} 
                        />;
            case 'register':
                return <RegistrationPage 
                            onSwitchToLogin={() => setCurrentPage('login')} 
                        />;
            default:
                return <LoginPage 
                            onLoginSuccess={handleLoginSuccess} 
                            onSwitchToRegister={() => setCurrentPage('register')} 
                        />;
        }
    };

    return (
        <div className="App">
            {renderPage()}
        </div>
    );
}

export default App;