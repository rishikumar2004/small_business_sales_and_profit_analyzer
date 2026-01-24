
const http = require('http');

async function postJSON(path, data, token = null) {
    return new Promise((resolve, reject) => {
        const body = JSON.stringify(data);
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body)
            }
        };

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        const req = http.request(options, (res) => {
            let resData = '';
            res.on('data', (chunk) => resData += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(resData) });
                } catch (e) {
                    resolve({ status: res.statusCode, data: resData });
                }
            });
        });

        req.on('error', (e) => reject(e));
        req.write(body);
        req.end();
    });
}

async function runTest() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    console.log('Starting reproduction test...');

    const timestamp = Date.now();
    const user = {
        username: `testuser_${timestamp}`,
        password: 'password',
        businessName: 'BulkTestCorp',
        companyUsername: `bulktest_${timestamp}`
    };

    try {
        console.log('Registering test user...');
        await postJSON('/api/auth/register', user);

        console.log('Logging in...');
        const login = await postJSON('/api/auth/login', {
            username: user.username,
            password: 'password',
            companyUsername: user.companyUsername
        });

        if (!login.data.token) {
            console.log('Login failed.');
            console.log('Response:', login.data);
            return;
        }

        const token = login.data.token;
        console.log('Login successful. Sending bulk import of 500 items...');

        const items = [];
        for (let i = 0; i < 500; i++) {
            items.push({
                description: `Bulk Import Row ${i}`,
                amount: 100.50 + i,
                type: 'expense',
                date: new Date().toISOString()
            });
        }

        const startTime = Date.now();
        const res = await postJSON('/api/transactions/bulk', items, token);
        const endTime = Date.now();

        console.log('Time taken:', (endTime - startTime), 'ms');
        console.log('Status:', res.status);
        console.log('Response:', res.data);
    } catch (err) {
        console.error('Error during test:', err.message);
    }
}

runTest();
