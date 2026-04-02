const https = require('https');

const apiKey = 'AIzaSyCXro2IyzxnET3LFbdWobBR5MLyM41q3wI';
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            if (json.models) {
                console.log("AVAILABLE MODELS:");
                json.models.forEach(m => console.log(`- ${m.name} (${m.displayName})`));
            } else {
                console.log("API Error Response:", JSON.stringify(json, null, 2));
            }
        } catch (e) {
            console.error("Failed to parse response:", data);
        }
    });
}).on('error', (err) => {
    console.error("Request Error:", err.message);
});
