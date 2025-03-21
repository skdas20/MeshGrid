// CORS Proxy Helper
// This function can be used to make requests through a proxy if direct connection fails
const corsProxy = {
    apiUrl: 'https://web-production-f35ee.up.railway.app',
    
    async fetch(endpoint, options = {}) {
        try {
            // Try direct connection first
            const response = await fetch(`${this.apiUrl}${endpoint}`, options);
            return response;
        } catch (error) {
            console.error('Direct API call failed:', error);
            
            // If direct connection fails, try using a CORS proxy
            try {
                const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
                const proxyResponse = await fetch(`${proxyUrl}${this.apiUrl}${endpoint}`, options);
                return proxyResponse;
            } catch (proxyError) {
                console.error('Proxy API call failed:', proxyError);
                throw proxyError;
            }
        }
    }
};

// Alternative API call method if socket.io connection fails
async function makeApiRequest(endpoint, method = 'GET', data = null) {
    try {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        if (data && (method === 'POST' || method === 'PUT')) {
            options.body = JSON.stringify(data);
        }
        
        const response = await corsProxy.fetch(endpoint, options);
        return await response.json();
    } catch (error) {
        console.error('API request failed:', error);
        return null;
    }
} 