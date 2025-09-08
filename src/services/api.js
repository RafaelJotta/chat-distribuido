import axios from 'axios';
const API_URL = 'http://localhost:3001/api'; // Troque pela URL real do API Gateway
export const loginUser = async (email, password) => {
    const response = await axios.post(`${API_URL}/login`, { email, password });
    if (response.data.token) { localStorage.setItem('authToken', response.data.token); }
    return response.data;
};
export const sendMessage = async (messageText) => {
    const token = localStorage.getItem('authToken');
    const config = { headers: { 'Authorization': `Bearer ${token}` } };
    await axios.post(`${API_URL}/messages`, { text: messageText }, config);
};
export const registerUser = async (name, email, password) => {
    const response = await axios.post(`${API_URL}/register`, { name, email, password });
    return response.data;
};