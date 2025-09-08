// Moderação de texto antes do envio
export const moderateText = (text) => {
    const forbiddenWords = ["palavra_proibida1", "palavra_proibida2"]; // Exemplo
    let cleanText = text;
    forbiddenWords.forEach(word => {
        const regex = new RegExp(word, 'gi');
        cleanText = cleanText.replace(regex, '****');
    });
    return cleanText;
};

// Tradução de mensagens recebidas (simulação)
export const translateText = (text) => {
    // Para um projeto real, aqui entraria uma biblioteca ou API de tradução.
    if (text.startsWith("EN:")) {
        return `(Tradução) ${text.substring(3)}`;
    }
    return text;
};

// Resumo de mensagens longas recebidas (simulação)
export const summarizeText = (text) => {
    if (text.length > 150) {
        return `${text.substring(0, 147)}...`;
    }
    return text;
};