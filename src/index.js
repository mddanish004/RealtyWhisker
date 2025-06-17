import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON requests
app.use(express.json());

// GET /health endpoint
app.get('/health', (req, res) => {
    res.json({ status: "ok" });
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
