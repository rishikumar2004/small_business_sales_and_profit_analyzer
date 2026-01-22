
const BASE_URL = 'http://localhost:3000';

async function testRegistration() {
    const timestamp = Date.now();
    const companyID = `test_company_${timestamp}`;
    const user1 = `user1_${timestamp}`;
    const user2 = `user2_${timestamp}`;

    console.log(`Testing with Company ID: ${companyID}`);

    // 1. Register First User (Should Success)
    console.log(`Attempting to register Admin 1 (${user1})...`);
    const res1 = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: user1,
            password: 'Password@123',
            businessName: 'Global Corp',
            companyUsername: companyID
        })
    });

    if (res1.status === 201) {
        console.log('✅ First registration successful.');
    } else {
        console.log('❌ First registration failed:', await res1.json());
        return; // Stop if first fails
    }

    // 2. Register Second User with SAME Company ID (Should Fail)
    console.log(`Attempting to register User 2 (${user2}) with SAME Company ID...`);
    const res2 = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: user2, // Different username
            password: 'Password@123',
            businessName: 'Global Corp',
            companyUsername: companyID // SAME Company ID
        })
    });

    if (res2.status === 400) {
        const data = await res2.json();
        console.log('✅ Second registration correctly blocked.');
        console.log('Error message received:', data.message);
    } else if (res2.status === 201) {
        console.log('❌ BUG CONFIRMED: Second registration succeeded! This should not happen.');
    } else {
        console.log(`❓ Unexpected status: ${res2.status}`, await res2.json());
    }
}

testRegistration();
