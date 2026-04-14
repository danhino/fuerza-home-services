const http = require('http');

const loginData = JSON.stringify({
    identifier: 'admin@fuerza.com',
    password: 'admin'
});

const loginOptions = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData)
    }
};

const loginReq = http.request(loginOptions, (res) => {
    let chunks = '';
    res.on('data', (d) => { chunks += d; });
    res.on('end', () => {
        const response = JSON.parse(chunks);
        if (response.token) {
            console.log('Logged in successfully, getting onboard URL...');
            testOnboard(response.token);
        } else {
            console.error('Login failed:', chunks);
        }
    });
});

loginReq.write(loginData);
loginReq.end();

function testOnboard(token) {
    const data = JSON.stringify({
        returnUrl: 'fuerza-home-services://profile',
        refreshUrl: 'fuerza-home-services://profile'
    });

    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/payments/connect/onboard',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Content-Length': Buffer.byteLength(data)
        }
    };

    const req = http.request(options, (res) => {
        let chunks = '';
        res.on('data', (d) => { chunks += d; });
        res.on('end', () => {
            console.log(`STATUS: ${res.statusCode}`);
            console.log(`BODY: ${chunks}`);
        });
    });

    req.write(data);
    req.end();
}
