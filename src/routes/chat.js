import express from 'express';
import { handleChat } from '../services/conversationService.js';
import prisma from '../utils/prismaClient.js';

const router = express.Router();

router.post('/', async (req, res, next) => {
    const { leadId, message, name } = req.body;
    console.log('[POST /chat] Request:', { leadId, message, name });

    if (message === undefined || typeof message !== 'string') {
        console.error('[POST /chat] Validation error: Invalid message');
        return res.status(400).json({ error: 'message is required and must be a string' });
    }
    if (name && typeof name !== 'string') {
        console.error('[POST /chat] Validation error: Invalid name');
        return res.status(400).json({ error: 'name must be a string if provided' });
    }

    let finalLeadId;
    
    if (leadId) {
        const parsedLeadId = parseInt(leadId);
        if (isNaN(parsedLeadId)) {
            console.error('[POST /chat] Validation error: Invalid leadId format');
            return res.status(400).json({ error: 'leadId must be a valid number' });
        }
        finalLeadId = parsedLeadId;
    } else {
        if (!name) {
            console.error('[POST /chat] Validation error: name required for new lead');
            return res.status(400).json({ error: 'name is required when leadId is not provided' });
        }
        try {
            const lead = await prisma.lead.create({
                data: {
                    name,
                    phone: 'unknown',
                    email: 'unknown@example.com',
                    status: 'New',
                    source: 'chat',
                    message,
                },
            });
            finalLeadId = lead.id;
            console.log('[POST /chat] Created new lead:', { id: finalLeadId, name });
        } catch (error) {
            console.error('[POST /chat] Database error (lead create):', error.message);
            return res.status(500).json({ error: `Database error: ${error.message}` });
        }
    }

    try {
        const result = await handleChat(finalLeadId.toString(), message, name);
        console.log('[POST /chat] handleChat result:', result);
        
        if (result.error) {
            console.error('[POST /chat] handleChat error:', result.error);
            return res.status(400).json({ error: result.error });
        }
        
        if (!result.response || !result.state) {
            console.error('[POST /chat] Invalid handleChat response');
            return res.status(500).json({ error: 'Invalid response from conversation service' });
        }

        res.status(200).json({ data: { message: result.response, state: result.state } });
    } catch (error) {
        console.error('[POST /chat] Server error:', error.message);
        res.status(500).json({ error: `Server error: ${error.message}` });
    }
});

export default router;
