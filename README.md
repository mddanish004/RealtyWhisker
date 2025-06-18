# Real Estate Lead Qualification Chatbot Backend

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.21.1-blue.svg)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-5.21.1-2D3748.svg)](https://www.prisma.io/)

> An intelligent chatbot backend that automates real estate lead capture, qualification, and classification using AI-powered conversation flow.

## 🎯 Overview

This Node.js backend powers a conversational chatbot designed specifically for real estate professionals. It guides potential clients through a structured qualification process, intelligently classifies leads based on predefined criteria, and generates personalized summaries using AI.

### ✨ Key Features

- **🤖 Intelligent Conversations** - Guided chat flow with context-aware responses
- **📊 Automatic Lead Classification** - Smart categorization as Hot, Cold, or Invalid leads
- **🧠 AI-Powered Summaries** - Generate friendly lead summaries using Groq's LLaMA3 model
- **💾 Persistent Data Storage** - Reliable data management with Supabase PostgreSQL
- **🔧 Configurable Logic** - Easy customization through JSON configuration files
- **📱 RESTful API** - Clean, well-documented endpoints for frontend integration

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │────│   Express API   │────│   Supabase DB   │
│   (React/Vue)   │    │   (Node.js)     │    │   (PostgreSQL)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                │
                       ┌─────────────────┐
                       │   Groq AI API   │
                       │   (LLaMA3)      │
                       └─────────────────┘
```

## 🛠️ Technology Stack

| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| **Runtime** | Node.js | 18+ | JavaScript runtime environment |
| **Framework** | Express | 4.21.1 | Web application framework |
| **Database** | Supabase | Latest | PostgreSQL cloud database |
| **ORM** | Prisma | 5.21.1 | Database toolkit and ORM |
| **AI** | Groq SDK | 0.7.0 | AI-powered text generation |
| **Environment** | dotenv | 16.4.5 | Environment variable management |

## 📋 Prerequisites

Before you begin, ensure you have the following installed and configured:

- **Node.js** (v18+) - [Download here](https://nodejs.org/)
- **npm** (v10+) - Comes with Node.js
- **Git** - [Download here](https://git-scm.com/)

You'll also need accounts for:
- **Supabase** - [Sign up](https://supabase.com/) for database hosting
- **Groq** - [Sign up](https://console.groq.com/) for AI API access

Optional but recommended:
- **VS Code** - [Download](https://code.visualstudio.com/) for development
- **Postman** - [Download](https://www.postman.com/) for API testing

## 🚀 Quick Start

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/your-username/real-estate-chatbot-backend.git
cd real-estate-chatbot-backend

# Install dependencies
npm install
```

### 2. Environment Configuration

Create a `.env` file in the project root:

```env
# Required Environment Variables
GROQ_API_KEY=your_groq_api_key_here
DATABASE_URL=your_supabase_database_url
SUPABASE_KEY=your_supabase_anon_key
PORT=3000
```

#### Getting Your API Keys

**Groq API Key:**
1. Visit [console.groq.com](https://console.groq.com)
2. Navigate to **API Keys** → **Generate new key**
3. Copy the key to your `.env` file

**Supabase Configuration:**
1. Visit [supabase.com](https://supabase.com) and create a project
2. Go to **Settings** → **Database** for `DATABASE_URL`
3. Go to **Settings** → **API** for `SUPABASE_KEY` (anon key)

> ⚠️ **Security Note**: Never commit your `.env` file. It's already included in `.gitignore`.

### 3. Database Setup

```bash
# Push database schema to Supabase
npx prisma db push

# Generate Prisma client
npx prisma generate

# Optional: Open database viewer
npx prisma studio
```

### 4. Start the Server

```bash
npm start
```

You should see:
```
Server running on port 3000
Database connected successfully
```

## 📡 API Reference

### Base URL
```
http://localhost:3000
```

### Endpoints

#### `POST /leads`
Create a new lead in the system.

**Request Body:**
```json
{
  "name": "Md Danish Ansari",
  "phone": "9876543210",
  "email": "danish.ansari@example.com",
  "source": "Website",
  "message": "Looking for a 3BHK apartment in Mumbai"
}
```

**Response (201):**
```json
{
  "id": 1,
  "name": "Md Danish Ansari",
  "phone": "9876543210",
  "email": "danish.ansari@example.com",
  "status": "New",
  "source": "Website",
  "message": "Looking for a 3BHK apartment in Mumbai",
  "createdAt": "2025-06-18T00:00:00.000Z",
  "updatedAt": "2025-06-18T00:00:00.000Z"
}
```

#### `POST /chat`
Handle conversational interactions with leads.

**Initial Request:**
```json
{
  "leadId": "1",
  "name": "Hassan",
  "message": ""
}
```

**Response:**
```json
{
  "data": {
    "message": "Hi Hassan! Thanks for reaching out about your property needs.",
    "state": {
      "id": 1,
      "leadId": 1,
      "currentQuestionIndex": 0,
      "answers": {},
      "leadName": "Hassan"
    }
  }
}
```

**Follow-up Messages:**
```json
{
  "leadId": "1",
  "message": "I'm looking for properties in Bangalore"
}
```

#### `GET /health`
Check server health status.

**Response (200):**
```json
{
  "status": "ok"
}
```

## 🗂️ Project Structure

```
real-estate-chatbot-backend/
├── 📁 config/
│   └── real-estate.json          # Chatbot configuration
├── 📁 prisma/
│   └── schema.prisma              # Database schema
├── 📁 src/
│   ├── 📁 routes/
│   │   ├── chat.js                # Chat endpoint logic
│   │   ├── config.js              # Configuration endpoints
│   │   └── leads.js               # Lead management endpoints
│   ├── 📁 services/
│   │   └── conversationService.js # Core conversation logic
│   ├── 📁 utils/
│   │   ├── configLoader.js        # Configuration file loader
│   │   └── prismaClient.js        # Database client
│   └── index.js                   # Express server setup
├── .env                           # Environment variables (local)
├── .gitignore                     # Git ignore rules
├── package.json                   # Dependencies and scripts
└── README.md                      # This file
```

## ⚙️ Configuration

The chatbot behavior is controlled by `config/real-estate.json`:

```json
{
  "industry": "real-estate",
  "greeting": "Hi {name}! Thanks for reaching out about your property needs.",
  "questions": [
    {
      "key": "location",
      "prompt": "Which city or location are you interested in?"
    },
    {
      "key": "budget",
      "prompt": "What is your budget range for the property?"
    },
    {
      "key": "timeline",
      "prompt": "What is your expected timeline for making a purchase?"
    }
  ],
  "rules": {
    "hot": {
      "budget": "greater than 1000000",
      "timeline": "less than 6 months",
      "intent": "high"
    },
    "cold": {
      "budget": "not specified or vague",
      "timeline": "not specified or more than 12 months",
      "intent": "browsing or unclear"
    },
    "invalid": {
      "response": "gibberish, non-serious, or irrelevant answers"
    }
  }
}
```

## 🧪 Testing

### Automated Testing
```bash
# Run the built-in conversation simulation
node src/services/conversationService.js
```

*This will simulate a conversation with a test lead (e.g., Hassan or Md Danish Ansari), showing classification (e.g., Hot) and AI-generated summary.*

### Manual Testing with curl

**Create a lead:**
```bash
curl -X POST http://localhost:3000/leads \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Md Danish Ansari",
    "phone": "9876543210",
    "email": "danish.ansari@example.com",
    "source": "API Test"
  }'
```

**Start a conversation:**
```bash
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "leadId": "1",
    "name": "Hassan",
    "message": ""
  }'
```

### Database Verification

Check your data in Supabase:
```sql
-- View all leads
SELECT * FROM "Lead";

-- View all conversations
SELECT * FROM "Conversation";
```

## 🐛 Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| **"Invalid GROQ_API_KEY"** | Verify your API key in `.env` and regenerate if needed |
| **"Database connection failed"** | Check `DATABASE_URL` format and Supabase project status |
| **"Config file not found"** | Ensure `config/real-estate.json` exists and is valid JSON |
| **"Port already in use"** | Change `PORT` in `.env` or kill existing processes |

### Debug Commands

```bash
# View database in browser
npx prisma studio

# Reset database schema
npx prisma db push --force-reset

# View detailed logs
DEBUG=* npm start
```

### Logging

The application logs important events:
- `[POST /leads]` - Lead creation events
- `[POST /chat]` - Chat interactions
- `[Groq]` - AI API calls
- `[Database error]` - Database issues



## 🔧 Development

### Available Scripts

```bash
npm start          # Start the server
npm run dev        # Start with nodemon (auto-restart)
npm run db:studio  # Open Prisma Studio
npm run db:reset   # Reset database
npm run test       # Run tests (when implemented)
```

### Code Style

This project follows JavaScript ES6+ standards. Key conventions:
- Use `const` and `let` instead of `var`
- Prefer async/await over promises
- Use meaningful variable names
- Add JSDoc comments for functions


