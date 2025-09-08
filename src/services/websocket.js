// ATENÇÃO: Troque esta URL pela URL real do WebSocket API Gateway.
const WS_URL = 'ws://localhost:3001'; // URL de exemplo para desenvolvimento

let socket;

export const connectWebSocket = (onMessageCallback) => {
    socket = new WebSocket(WS_URL);

    socket.onopen = () => {
        console.log("WebSocket conectado com sucesso!");
        const token = localStorage.getItem('authToken');
        // Autentica a conexão WebSocket enviando o token
        socket.send(JSON.stringify({ type: 'auth', token }));
    };

    socket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        onMessageCallback(message); // Envia a mensagem recebida para o componente de chat
    };

    socket.onerror = (error) => {
        console.error("Erro no WebSocket: ", error);
    };
};

export const disconnectWebSocket = () => {
    if (socket) {
        socket.close();
    }
};