import { loadConfig } from '../utils/configLoader.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

// In-memory conversation store
const conversations = new Map();

// Gemini API integration
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function callGemini(prompt) {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        throw new Error(`Gemini API error: ${error.message}`);
    }
}

export async function handleChat(leadId, message, leadName) {
    // Load real estate config
    const config = loadConfig('real-estate');
    const questions = config.questions || [];
    let convo = conversations.get(leadId);

    // New conversation
    if (!convo) {
        convo = {
            currentQuestionIndex: 0,
            answers: {},
            leadName,
        };
        conversations.set(leadId, convo);

        // Send greeting
        let greeting = config.greeting || 'Hello {name}, welcome!';
        greeting = greeting.replace('{name}', leadName);
        return { response: greeting, state: convo };
    }

    // If greeting sent, ask first question
    if (convo.currentQuestionIndex === 0) {
        convo.currentQuestionIndex = 1;
        const firstQ = questions[0];
        return { response: firstQ.prompt, state: convo };
    }

    // Store answer to previous question
    const prevQIndex = convo.currentQuestionIndex - 1;
    if (questions[prevQIndex]) {
        const prevKey = questions[prevQIndex].key;
        convo.answers[prevKey] = message;
    }

    // If more questions, ask next
    if (convo.currentQuestionIndex < questions.length) {
        const nextQ = questions[convo.currentQuestionIndex];
        const prompt = nextQ.prompt;
        convo.currentQuestionIndex += 1;
        return { response: prompt, state: convo };
    }

    // No more questions: generate summary/thank you with Gemini
    const context = Object.entries(convo.answers)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ');
    const summaryPrompt = `Summarize the following real estate lead info in a friendly way and thank the user: ${context}`;
    const summary = await callGemini(summaryPrompt);

    // Optionally, clear conversation
    // conversations.delete(leadId);

    return { response: summary, state: convo };
}

// --- Temporary test block ---
if (process.env.NODE_ENV !== 'production') {
    (async () => {
        const leadId = 'test-lead-1';
        const leadName = 'Danish';

        // Simulate conversation
        let res;

        res = await handleChat(leadId, '', leadName);
        console.log('Bot:', res.response);

        res = await handleChat(leadId, 'Hi!', leadName);
        console.log('Bot:', res.response);

        res = await handleChat(leadId, 'Mumbai', leadName);
        console.log('Bot:', res.response);

        res = await handleChat(leadId, '1 crore', leadName);
        console.log('Bot:', res.response);

        res = await handleChat(leadId, '3 months', leadName);
        console.log('Bot:', res.response);

        console.log('Final State:', conversations.get(leadId));
    })();
}