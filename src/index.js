import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import leadsRouter from './routes/leads.js';
import configRouter from './routes/config.js'
import chatRouter from './routes/chat.js'

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.use('/leads', leadsRouter);
app.use('/config', configRouter);
app.use('/chat', chatRouter);



app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
