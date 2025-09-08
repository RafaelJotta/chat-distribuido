import axios from 'axios';

// ATENÇÃO: Troque esta URL pela URL real do API Gateway que o Amando irá configurar.
const API_URL = 'http://localhost:3001/api'; // URL de exemplo para desenvolvimento

export const loginUser = async (email, password) => {
    const response = await axios.post(`${API_URL}/login`, { email, password });
    if (response.data.token) {
        localStorage.setItem('authToken', response.data.token);
    }
    return response.data;
};

export const sendMessage = async (messageText) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
        throw new Error("Usuário não autenticado.");
    }

    const config = {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    };

    await axios.post(`${API_URL}/messages`, { text: messageText }, config);
};

// ... (mantenha as funções loginUser e sendMessage)

export const registerUser = async (name, email, password) => {
    // Chama o serviço do Alessandro para registrar um novo usuário
    const response = await axios.post(`${API_URL}/register`, { name, email, password });
    return response.data;
};