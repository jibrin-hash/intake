const http = require('http');
const https = require('https');
const url = require('url');
const fs = require('fs');
const path = require('path');

// Load .env.local manually since we aren't using next dev for this script
try {
    const envPath = path.resolve(__dirname, '../.env.local');
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim();
        }
    });
} catch (e) {
    console.log("Could not load .env.local, assuming variables are passed in env");
}

const API_KEY = process.env.SHOPIFY_API_KEY;
const API_SECRET = process.env.SHOPIFY_API_SECRET;
const SHOP = process.env.SHOPIFY_STORE_DOMAIN;
const PORT = 3000;
const REDIRECT_URI = `http://localhost:${PORT}/callback`;
const SCOPES = 'write_products,read_products';

if (!API_KEY || !API_SECRET || !SHOP) {
    console.error("❌ Missing Error: Please ensure SHOPIFY_API_KEY, SHOPIFY_API_SECRET, and SHOPIFY_STORE_DOMAIN are in .env.local");
    process.exit(1);
}

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);

    // 1. Callback Handler
    if (parsedUrl.pathname === '/callback') {
        const code = parsedUrl.query.code;
        const shop = parsedUrl.query.shop;

        if (!code) {
            res.end('Error: No code received.');
            return;
        }

        console.log(`✅ Received Code: ${code}`);
        console.log(`🔄 Exchanging for Access Token...`);

        // 2. Exchange Code for Token
        const postData = JSON.stringify({
            client_id: API_KEY,
            client_secret: API_SECRET,
            code: code
        });

        const tokenReq = https.request({
            hostname: shop,
            path: '/admin/oauth/access_token',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': postData.length
            }
        }, (tokenRes) => {
            let data = '';
            tokenRes.on('data', chunk => data += chunk);
            tokenRes.on('end', () => {
                const result = JSON.parse(data);
                if (result.access_token) {
                    console.log("\n✨ SUCCESS! HERE IS YOUR PERMANENT TOKEN: ✨\n");
                    console.log("SHOPIFY_ADMIN_TOKEN=" + result.access_token);
                    console.log("\n👉 Copy this line into your .env.local file!");

                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.end('<h1>Success! Check your terminal for the token.</h1>');

                    // Clean exit
                    setTimeout(() => {
                        server.close();
                        process.exit(0);
                    }, 1000);
                } else {
                    console.error("❌ Error exchanging token:", result);
                    res.end('Error exchanging token. Check terminal.');
                }
            });
        });

        tokenReq.write(postData);
        tokenReq.end();

    } else {
        res.end('RCE Intake Token Generator');
    }
});

server.listen(PORT, () => {
    const installUrl = `https://${SHOP}/admin/oauth/authorize?client_id=${API_KEY}&scope=${SCOPES}&redirect_uri=${REDIRECT_URI}`;
    console.log(`\n🚀 Server running on port ${PORT}`);
    console.log(`\n👉 CLICK THIS LINK TO INSTALL APP & GENERATE TOKEN:\n`);
    console.log(installUrl);
    console.log("\n(Waiting for you to click and approve...)");
});
