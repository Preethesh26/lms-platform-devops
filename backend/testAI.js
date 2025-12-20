const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function testAI() {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
        console.error('❌ Error: GEMINI_API_KEY is not set in .env file');
        return;
    }

    console.log('Testing Gemini API with key starting with:', apiKey.substring(0, 5) + '...');

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        console.log('Sending test prompt...');
        const result = await model.generateContent("Hello, are you working?");
        const response = await result.response;
        console.log('✅ Success! AI Response:', response.text());
    } catch (error) {
        console.error('❌ AI Test Failed:');
        console.error(error.message);
        if (error.message.includes('API_KEY_INVALID')) {
            console.error('Tip: Your API key appears to be invalid. Double check it in Google AI Studio.');
        }
    }
}

testAI();
