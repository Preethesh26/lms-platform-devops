const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Get response from Gemini based on lesson context
 */
exports.getChatResponse = async (transcript, question) => {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
    You are an AI learning assistant for an LMS platform. 
    Use the following lesson transcript as context to answer the student's question. 
    If the answer isn't in the transcript, use your general knowledge but emphasize what was covered in the lesson.
    
    Lesson Transcript/Content:
    ${transcript}
    
    Student Question:
    ${question}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
};

/**
 * Generate a summary of a lesson transcript
 */
exports.generateSummary = async (transcript) => {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
    Summarize the following lesson transcript into a concise bullet-point summary.
    Focus on key concepts and takeaways.
    
    Lesson Transcript:
    ${transcript}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
};

/**
 * Generate a practice quiz based on topic or lesson content
 */
exports.generatePracticeQuiz = async (topic, struggleAreas = "") => {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
    Generate a 5-question multiple choice quiz on the topic: "${topic}".
    ${struggleAreas ? `Focus more on these struggle areas: ${struggleAreas}.` : ''}
    
    Format the output as a JSON array of objects with the following structure:
    [
      {
        "questionText": "Question here",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctOptionIndex": 0,
        "explanation": "Brief explanation of why this answer is correct"
      }
    ]
    Return ONLY the valid JSON array.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Clean JSON response (sometimes AI adds markdown blocks)
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr);
};
