import React, { useState } from 'react';
import { registerUser } from '../services/api';
import { FaUser, FaEnvelope, FaLock } from 'react-icons/fa';

function RegistrationPage({ onSwitchToLogin }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Lógica de cadastro...
    };

    return (
        <div className="auth-container">
            <h2>Criar Conta</h2>
            <form className="auth-form" onSubmit={handleSubmit}>
                <div className="input-group">
                    <FaUser className="icon" />
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome Completo" required />
                </div>
                <div className="input-group">
                    <FaEnvelope className="icon" />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required />
                </div>
                <div className="input-group">
                    <FaLock className="icon" />
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Senha" required />
                </div>
                <button type="submit" className="primary-btn">Cadastrar</button>
            </form>
            <div className="switch-auth">
                Já tem uma conta? <button onClick={onSwitchToLogin}>Faça o login</button>
            </div>
        </div>
    );
}

export default RegistrationPage;