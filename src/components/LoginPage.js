import React, { useState } from 'react';
import { loginUser } from '../services/api';
// Importando ícones
import { FaUser, FaLock, FaApple, FaGoogle, FaMicrosoft } from 'react-icons/fa';
// Importe a imagem do seu mascote (crie a pasta assets se não tiver)
import mascot from '../assets/robot-mascot.png'; 

function LoginPage({ onLoginSuccess, onSwitchToRegister }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await loginUser(email, password);
            onLoginSuccess();
        } catch (error) {
            alert('Falha no login!');
        }
    };

    return (
        <div className="auth-container">
            <img src={mascot} alt="Mascote" className="auth-mascot" />
            <h2>Sign In</h2>
            <form className="auth-form" onSubmit={handleSubmit}>
                <div className="input-group">
                    <FaUser className="icon" />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Username" required />
                </div>
                <div className="input-group">
                    <FaLock className="icon" />
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required />
                </div>
                <button type="submit" className="primary-btn">Sign In</button>
            </form>
            
            <div className="divider">Or Sign In With</div>

            <div className="social-login">
                <button><FaApple /> Apple</button>
                <button><FaGoogle /> Google</button>
                <button><FaMicrosoft /> Microsoft</button>
            </div>

            <div className="switch-auth">
                Não tem uma conta? <button onClick={onSwitchToRegister}>Cadastre-se</button>
            </div>
        </div>
    );
}

export default LoginPage;