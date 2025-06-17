import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import leadsRouter from './routes/leads.js';

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON requests
app.use(express.json());

// Mount the leads router at /leads
app.use('/leads', leadsRouter);

// GET /health endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Global error-handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});