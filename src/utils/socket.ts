export const getSocketUrl = () => {
    // If we're in production (Vercel), use the production server URL
    if (import.meta.env.PROD) {
        return import.meta.env.VITE_PROD_SERVER_URL;
    }
    // In development, use the local server URL
    return import.meta.env.VITE_SERVER_URL;
}; 