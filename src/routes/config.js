import express from 'express';
import { loadConfig } from '../utils/configLoader.js';

const router = express.Router();

// GET /config - Return the real estate configuration
router.get('/', async (req, res, next) => {
    try {
        const config = loadConfig('real-estate');
        res.status(200).json({ data: config });
    } catch (error) {
        next(error); // Pass to global error middleware
    }
});

export default router;