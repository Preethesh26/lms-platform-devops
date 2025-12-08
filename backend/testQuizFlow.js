const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

// Credentials
const ADMIN_EMAIL = 'kulalpreethesh20@gmail.com';
const ADMIN_PASS = 'admin123';
const STUDENT_EMAIL = 'videotest2@test.com';
const STUDENT_PASS = '123456';

async function runTest() {
    try {
        console.log('--- Starting Quiz Flow Test ---');

        // 1. Admin Login
        console.log('1. Logging in as Admin...');
        const adminLoginRes = await axios.post(`${API_URL}/auth/login`, {
            email: ADMIN_EMAIL,
            password: ADMIN_PASS
        });
        const adminToken = adminLoginRes.data.token;
        console.log('   Admin logged in. Token received.');

        // 2. Get Courses to find a course ID
        console.log('2. Fetching Courses...');
        const coursesRes = await axios.get(`${API_URL}/courses`);
        const courses = coursesRes.data.data;
        if (courses.length === 0) throw new Error('No courses found');
        const courseId = courses[0].id;
        console.log(`   Using Course ID: ${courseId} (${courses[0].title})`);

        // 3. Create Quiz
        console.log('3. Creating Quiz...');
        const quizData = {
            title: "API Test Quiz",
            course: courseId,
            timeLimit: 10,
            passingScore: 50,
            questions: [
                {
                    questionText: "Is API testing useful?",
                    options: ["No", "Yes", "Maybe", "Unknown"],
                    correctOptionIndex: 1,
                    explanation: "Yes it is."
                }
            ]
        };
        const createQuizRes = await axios.post(`${API_URL}/quizzes`, quizData, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        const quizId = createQuizRes.data.data._id;
        console.log(`   Quiz created. ID: ${quizId}`);

        // 4. Register New Student
        console.log('4. Registering New Student...');
        const uniqueEmail = `quizstudent_${Date.now()}@test.com`;
        const registerRes = await axios.post(`${API_URL}/auth/register`, {
            name: "Quiz Student",
            email: uniqueEmail,
            password: "password123",
            role: "user"
        });
        const studentToken = registerRes.data.token;
        console.log(`   Student registered (${uniqueEmail}). Token received.`);

        // 5. Get Quiz as Student
        console.log('5. Fetching Quiz as Student...');
        const getQuizRes = await axios.get(`${API_URL}/quizzes/${quizId}`, {
            headers: { Authorization: `Bearer ${studentToken}` }
        });
        // Verify correct answer is hidden? (Actually API returns sanitized object... need to check response)
        // console.log(getQuizRes.data.data.questions[0]); 
        console.log('   Quiz fetched.');

        // 6. Submit Quiz (Correct Answer)
        console.log('6. Submitting Quiz (Correct Answer)...');
        const submitRes = await axios.post(`${API_URL}/quizzes/${quizId}/submit`, {
            answers: [{ questionIndex: 0, selectedOptionIndex: 1 }]
        }, {
            headers: { Authorization: `Bearer ${studentToken}` }
        });

        console.log('   Submission Result:', submitRes.data.data);
        if (submitRes.data.data.passed !== true) throw new Error('Expected quiz to be passed');
        if (submitRes.data.data.score !== 1) throw new Error('Expected score 1');

        // 7. Submit Quiz (Wrong Answer)
        console.log('7. Submitting Quiz (Wrong Answer)...');
        const submitFailRes = await axios.post(`${API_URL}/quizzes/${quizId}/submit`, {
            answers: [{ questionIndex: 0, selectedOptionIndex: 0 }]
        }, {
            headers: { Authorization: `Bearer ${studentToken}` }
        });
        console.log('   Submission Result (Fail):', submitFailRes.data.data);
        if (submitFailRes.data.data.passed !== false) throw new Error('Expected quiz to fail');

        console.log('\n--- TEST PASSED: Quiz Flow works correctly via API ---');

    } catch (error) {
        console.error('\n--- TEST FAILED ---');
        console.error(error.response ? error.response.data : error.message);
    }
}

runTest();
