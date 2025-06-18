import { loadConfig } from '../utils/configLoader.js';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';
import prisma from '../utils/prismaClient.js';
dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function callGroq(prompt) {
    try {
        console.log('[Groq] Sending prompt:', prompt);
        const completion = await groq.chat.completions.create({
            model: 'llama3-8b-8192',
            messages: [
                { role: 'system', content: 'You are a helpful AI that summarizes real estate lead information in a friendly tone.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 500
        });
        const text = completion.choices[0]?.message?.content || '';
        console.log('[Groq] Response:', text);
        return text;
    } catch (error) {
        console.error('[Groq] Error:', error.message);
        throw new Error(`Groq API error: ${error.message}`);
    }
}

export async function handleChat(leadId, message, leadName) {
    console.log(`[handleChat] leadId="${leadId}", message="${message}", leadName="${leadName}"`);

    const parsedLeadId = parseInt(leadId);
    if (isNaN(parsedLeadId)) {
        console.error('[handleChat] Invalid leadId: not a number', { leadId });
        return { response: null, state: null, error: 'Invalid leadId: must be a number' };
    }

    let config;
    try {
        config = loadConfig('real-estate');
        if (!config || typeof config !== 'object') {
            throw new Error('Config not found or invalid');
        }
        console.log('[handleChat] Config loaded with', config.questions.length, 'questions');
    } catch (error) {
        console.error('[handleChat] Config error:', error.message);
        return { response: null, state: null, error: `Config error: ${error.message}` };
    }
    const questions = Array.isArray(config.questions) ? config.questions : [];

    let lead;
    try {
        lead = await prisma.lead.findUnique({ where: { id: parsedLeadId } });
        if (!lead) {
            console.error('[handleChat] Lead not found:', { id: parsedLeadId });
            return { response: null, state: null, error: 'Lead not found' };
        }
    } catch (error) {
        console.error('[handleChat] Database error (lead lookup):', error.message);
        return { response: null, state: null, error: `Database error: ${error.message}` };
    }

    let conversation;
    try {
        conversation = await prisma.conversation.findUnique({ where: { leadId: parsedLeadId } });
    } catch (error) {
        console.error('[handleChat] Database error (conversation lookup):', error.message);
        return { response: null, state: null, error: `Database error: ${error.message}` };
    }

    if (!conversation) {
        try {
            conversation = await prisma.conversation.create({
                data: {
                    leadId: parsedLeadId,
                    currentQuestionIndex: 0,
                    answers: {},
                    leadName: leadName || lead.name,
                },
            });
            let greeting = config.greeting || 'Hello {name}, welcome!';
            greeting = greeting.replace('{name}', leadName || lead.name || 'there');
            console.log(`[handleChat] New conversation for leadId=${parsedLeadId}, greeting: ${greeting}`);
            return { response: greeting, state: conversation, error: null };
        } catch (error) {
            console.error('[handleChat] Database error (conversation create):', error.message);
            return { response: null, state: null, error: `Database error: ${error.message}` };
        }
    }

    if (conversation.currentQuestionIndex === 0) {
        if (!questions.length) {
            console.error('[handleChat] No questions configured');
            return { response: null, state: conversation, error: 'No questions configured' };
        }
        try {
            await prisma.conversation.update({
                where: { id: conversation.id },
                data: { currentQuestionIndex: 1 },
            });
            const firstQuestion = questions[0];
            console.log(`[handleChat] Asking first question for leadId=${parsedLeadId}: ${firstQuestion.prompt}`);
            return {
                response: firstQuestion.prompt,
                state: { ...conversation, currentQuestionIndex: 1 },
                error: null,
            };
        } catch (error) {
            console.error('[handleChat] Database error (update after greeting):', error.message);
            return { response: null, state: null, error: `Database error: ${error.message}` };
        }
    }

    const currentQuestionIndex = conversation.currentQuestionIndex;
    const previousQuestionIndex = currentQuestionIndex - 1;
    let updatedAnswers = { ...conversation.answers };
    if (previousQuestionIndex >= 0 && previousQuestionIndex < questions.length) {
        const previousQuestion = questions[previousQuestionIndex];
        if (previousQuestion && previousQuestion.key) {
            updatedAnswers[previousQuestion.key] = message;
            console.log(`[handleChat] Stored answer for ${previousQuestion.key}: ${message}`);
        }
    }

    if (currentQuestionIndex < questions.length) {
        try {
            const nextQuestion = questions[currentQuestionIndex];
            await prisma.conversation.update({
                where: { id: conversation.id },
                data: {
                    currentQuestionIndex: currentQuestionIndex + 1,
                    answers: updatedAnswers,
                },
            });
            console.log(`[handleChat] Asking question ${currentQuestionIndex + 1} for leadId=${parsedLeadId}: ${nextQuestion.prompt}`);
            return {
                response: nextQuestion.prompt,
                state: {
                    ...conversation,
                    currentQuestionIndex: currentQuestionIndex + 1,
                    answers: updatedAnswers,
                },
                error: null,
            };
        } catch (error) {
            console.error('[handleChat] Database error (update for next question):', error.message);
            return { response: null, state: null, error: `Database error: ${error.message}` };
        }
    }

    let classification;
    try {
        classification = classifyLead(updatedAnswers, config);
        console.log(`[handleChat] Classified leadId=${parsedLeadId} as ${classification}`);
    } catch (error) {
        console.error('[handleChat] Classification error:', error.message);
        return { response: null, state: { ...conversation, answers: updatedAnswers }, error: `Classification error: ${error.message}` };
    }

    const context = Object.entries(updatedAnswers)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
    const summaryPrompt = `Summarize the following real estate lead info in a friendly way, mention the lead is ${classification}, and thank the user: ${context}`;
    
    let summary;
    try {
        summary = await callGroq(summaryPrompt);
    } catch (error) {
        console.error('[handleChat] Groq summary error:', error.message);
        return { response: null, state: { ...conversation, answers: updatedAnswers, classification }, error: `Groq error: ${error.message}` };
    }

    try {
        await prisma.conversation.update({
            where: { id: conversation.id },
            data: {
                answers: updatedAnswers,
                classification,
            },
        });
        await prisma.lead.update({
            where: { id: parsedLeadId },
            data: { status: classification },
        });
        console.log(`[handleChat] Updated conversation and lead for leadId=${parsedLeadId}`);
    } catch (error) {
        console.error('[handleChat] Database error (final update):', error.message);
        return { response: null, state: { ...conversation, answers: updatedAnswers, classification }, error: `Database error: ${error.message}` };
    }

    console.log(`[handleChat] Conversation complete for leadId=${parsedLeadId}, classification=${classification}`);
    return {
        response: summary,
        state: { ...conversation, answers: updatedAnswers, classification },
        error: null,
    };
}

export function classifyLead(answers, config) {
    console.log('[classifyLead] Answers:', answers);
    
    function parseBudget(budgetStr) {
        if (!budgetStr) return 0;
        let str = budgetStr.toLowerCase().replace(/,/g, '').trim();
        if (str.includes('not sure') || str.includes('unknown')) return 0;

        let num = 0;
        let croreMatch = str.match(/([\d.]+)\s*crore/);
        if (croreMatch) {
            num = parseFloat(croreMatch[1]) * 10000000;
        }

        let lakhMatch = str.match(/([\d.]+)\s*(lakh|lakhs|l|lac)/);
        if (lakhMatch) {
            num = parseFloat(lakhMatch[1]) * 100000;
        }

        let numMatch = str.match(/([\d,]+)/);
        if (numMatch && num === 0) {
            num = parseInt(numMatch[1].replace(/,/g, ''));
        }

        return isNaN(num) ? 0 : num;
    }

    function parseTimeline(timelineStr) {
        if (!timelineStr) return 0;
        let str = timelineStr.toLowerCase();
        if (str.includes('not sure') || str.includes('unknown')) return 0;

        let months = 0;
        let monthMatch = str.match(/(\d+)\s*(month|months)/);
        if (monthMatch) {
            months = parseInt(monthMatch[1]);
        }

        let yearMatch = str.match(/(\d+)\s*(year|years)/);
        if (yearMatch) {
            months = parseInt(yearMatch[1]) * 12;
        }

        return isNaN(months) ? 0 : months;
    }

    function isGibberish(str) {
        if (!str) return true;
        if (typeof str !== 'string') return true;
        if (/^[^a-zA-Z0-9]+$/.test(str)) return true;
        if (str.length < 2) return true;
        if (/([a-zA-Z])\1{4,}/.test(str)) return true;
        if (/asdf|qwer|zxcv|lol|test|dummy/i.test(str)) return true;
        return false;
    }

    const budget = parseBudget(answers.budget);
    const timeline = parseTimeline(answers.timeline);
    const budgetStr = answers.budget ? answers.budget.toLowerCase() : '';
    const timelineStr = answers.timeline ? answers.timeline.toLowerCase() : '';
    const allAnswers = Object.values(answers).join(' ').toLowerCase();

    console.log('[classifyLead] Parsed:', { budget, timeline });

    if (
        isGibberish(answers.budget) ||
        isGibberish(answers.timeline) ||
        /lol|asdf|qwer|zxcv|test|dummy/.test(allAnswers)
    ) {
        console.log('[classifyLead] Result: Invalid (gibberish detected)');
        return 'Invalid';
    }

    if (
        budget > 1000000 &&
        timeline > 0 &&
        timeline <= 6 &&
        !budgetStr.includes('not sure') &&
        !timelineStr.includes('not sure')
    ) {
        console.log('[classifyLead] Result: Hot');
        return 'Hot';
    }

    console.log('[classifyLead] Result: Cold (default)');
    return 'Cold';
}

if (import.meta.url === process.argv[1] || import.meta.url === `file://${process.argv[1]}`) {
    (async () => {
        console.log('Starting conversation test...\n');
        
        try {
            const leadName = 'Rohit Sharma';
            let lead;
            try {
                lead = await prisma.lead.create({
                    data: {
                        name: leadName,
                        phone: '1234567890',
                        email: 'rohit@example.com',
                        status: 'New',
                    },
                });
                console.log('Created lead:', { id: lead.id, name: lead.name });
            } catch (error) {
                console.error('Failed to create test lead:', error.message);
                return;
            }
            const leadId = lead.id; 

            let config;
            try {
                config = loadConfig('real-estate');
                console.log('Loaded config with', config.questions.length, 'questions');
            } catch (error) {
                console.error('Config loading error:', error.message);
                return;
            }
            const questions = config.questions || [];

            let responseObj;

            console.log('\n=== STEP 1: Initial greeting ===');
            responseObj = await handleChat(leadId.toString(), '', leadName);
            if (responseObj.error) {
                throw new Error(responseObj.error);
            }
            console.log('Bot:', responseObj.response);
            console.log('State:', responseObj.state);

            console.log('\n=== STEP 2: Get first question ===');
            responseObj = await handleChat(leadId.toString(), 'Hi!', leadName);
            if (responseObj.error) {
                throw new Error(responseObj.error);
            }
            console.log('Bot:', responseObj.response);
            console.log('State:', responseObj.state);

            const answers = ['Mumbai', '1 crore', '3 months'];
            for (let i = 0; i < answers.length; i++) {
                console.log(`\n=== STEP ${i + 3}: Answer question ${i + 1} ===`);
                console.log('User:', answers[i]);
                responseObj = await handleChat(leadId.toString(), answers[i], leadName);
                if (responseObj.error) {
                    throw new Error(responseObj.error);
                }
                console.log('Bot:', responseObj.response);
                console.log('State:', responseObj.state);
            }

            console.log('\n=== CONVERSATION COMPLETE ===');
            console.log('Final classification:', responseObj.state.classification);
            console.log('Final answers:', responseObj.state.answers);

            console.log('\nCleaning up test data...');
            await prisma.conversation.deleteMany({ where: { leadId } });
            await prisma.lead.delete({ where: { id: lead.id } });
            console.log('Test completed successfully!');
        } catch (error) {
            console.error('Test error:', error.message);
        } finally {
            await prisma.$disconnect();
            console.log('Prisma disconnected');
        }
    })();
}
