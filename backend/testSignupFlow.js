const axios = require('axios');

async function testSignup() {
    const uniqueId = Date.now().toString().slice(-4);
    const testUser = {
        name: `Test User ${uniqueId}`,
        email: `testuser${uniqueId}@example.com`,
        password: 'password123',
        confirmPassword: 'password123'
    };

    console.log(`Simulating signup for: ${testUser.email}`);

    try {
        const response = await axios.post('http://localhost:5000/api/auth/register', testUser);

        console.log('✅ Signup Successful!');
        console.log('User ID:', response.data.user.id);
        console.log('Enrollment:', response.data.user.enrollment);
        console.log('Role:', response.data.user.role);

        console.log('\nCheck the backend server logs for:');
        console.log('1. "Welcome email sent..."');
        console.log('2. "Admin notification sent..."');
    } catch (error) {
        console.error('❌ Signup Failed:', error.response ? error.response.data : error.message);
    }
}

// Wait for server to start, then run
setTimeout(testSignup, 5000);
