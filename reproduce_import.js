const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args)).catch(() => globalThis.fetch(...args));

async function reproduction() {
    try {
        console.log("1. Logging in...");
        // Login requires companyUsername
        const loginRes = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'admin_one',
                password: 'Safe@123',
                companyUsername: 'tech_solutions'
            })
        });

        if (!loginRes.ok) {
            console.error('Login failed:', await loginRes.text());
            return;
        }

        const { token } = await loginRes.json();
        console.log("Login successful. Token acquired.");

        console.log("2. Testing Bulk Import API...");
        const testData = [
            { description: 'Test Import Expense', amount: 100, type: 'expense', date: new Date().toISOString() },
            { description: 'Test Import Income', amount: 500, type: 'income', date: new Date().toISOString() }
        ];

        const importRes = await fetch('http://localhost:3000/api/transactions/bulk', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(testData)
        });

        if (!importRes.ok) {
            console.error('Import failed:', await importRes.text());
        } else {
            console.log('Import successful:', await importRes.json());
        }

    } catch (err) {
        console.error('Script error:', err);
    }
}

reproduction();
