import express from 'express';
import { handleChat } from '../services/conversationService.js';

const router = express.Router();

// POST /chat - Handle user message and return bot response
router.post('/', async (req, res, next) => {
    const { leadId, message, name } = req.body;

    // Input validation
    if (!leadId || typeof leadId !== 'string') {
        return res.status(400).json({ error: 'leadId is required and must be a string' });
    }
    if (message === undefined || typeof message !== 'string') {
        return res.status(400).json({ error: 'message is required and must be a string' });
    }
    if (name && typeof name !== 'string') {
        return res.status(400).json({ error: 'name must be a string if provided' });
    }

    try {
        const { response, state } = await handleChat(leadId, message, name);
        res.status(200).json({ data: { message: response, state } });
    } catch (error) {
        next(error); // Pass to global error middleware
    }
});

export default router;