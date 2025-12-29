const getBaseUrl = () => {
    // If running in Electron (file:// protocol), use absolute URL
    if (window.location.protocol === 'file:') {
        return 'http://127.0.0.1:3001/api';
    }
    // If in development (Vite proxy) or standard web deploy, use relative
    return '/api';
};

export const API_URL = getBaseUrl();
