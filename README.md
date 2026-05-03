<div align="center">

# 🧠 CodexLM

### *The Professional Agentic AI Research Platform*

CodexLM is a high-performance research ecosystem that transforms raw data into actionable knowledge. Move beyond simple chat with an agentic workspace that understands your sources across text, audio, and web, then generates professional-grade assets.

[![Status](https://img.shields.io/badge/status-active-indigo.svg?style=for-the-badge)]()
[![Next.js](https://img.shields.io/badge/Next.js-15+-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Database](https://img.shields.io/badge/Database-Convex-f97316?style=for-the-badge)](https://convex.dev/)
[![AI](https://img.shields.io/badge/AI-Gemini_2.5_Flash_Lite-4285F4?style=for-the-badge&logo=google)](https://deepmind.google/technologies/gemini/)

</div>

---

## 🚀 Core Features

### 📡 Multi-Modal Source Ingestion
CodexLM isn't just for PDFs. It's a unified brain for all your research:
*   **Documents**: Full support for PDF, DOCX, and PPTX with high-fidelity text extraction.
*   **Audio**: Deepgram-powered transcription for interviews and research recordings.
*   **Web**: Real-time URL scraping and YouTube transcript ingestion.
*   **Direct**: Plain text and project notes integration.

### 🤖 Agentic RAG Chat
A research-first chat interface grounded in your specific data:
*   **Hybrid Search**: Combines Pinecone vector semantic search with exact keyword matching.
*   **Transparent Citations**: Every AI response includes clickable badges showing the exact source filename.
*   **Project Memory**: Set project-wide instructions (tone, focus, constraints) that persist across every chat.
*   **Voice Search**: Hands-free interaction with high-fidelity voice recognition.

### 🎨 The Studio (Content Production)
Transform your research into ready-to-use professional assets:
*   **🎙️ Audio Overview**: Generate a 2-person podcast dialogue script and high-quality audio synthesis.
*   **🎓 Learning Suite**: Instant creation of Flash Cards and Interactive Quizzes from your sources.
*   **📄 Document Engine**: Draft technical PRDs, Business Reports, and Slide Deck outlines.
*   **📐 Visual Design**: Generate Mermaid.js flow diagrams and architectural visualizations.
*   **📣 Marketing Pack**: Create social media threads and email templates tailored to your data.

---

## 🛠️ Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 15 (Turbo), Framer Motion, Tailwind CSS v4 |
| **Backend** | Convex (Real-time Database), Stack Auth |
| **Intelligence** | Google Gemini 2.5 Flash Lite (LLM), Cloudflare Qwen (Embeddings) |
| **Search** | Pinecone (Vector DB) |
| **Audio** | Deepgram Aura-2 (TTS) & Deepgram Nova-2 (STT) |
| **Storage** | DigitalOcean Spaces (S3-Compatible) |

---

## 🏁 Getting Started

### 1. Prerequisites
*   Node.js 18+
*   Convex Account
*   Pinecone API Key
*   Google Gemini API Key
*   Deepgram API Key
*   DigitalOcean Spaces Credentials

### 2. Environment Setup
Create a `.env.local` file in the root:
```env
# Backend (Convex)
CONVEX_DEPLOYMENT=...
NEXT_PUBLIC_CONVEX_URL=...

# AI & Search
GEMINI_API_KEY=...
PINECONE_API_KEY=...
PINECONE_INDEX=...

# Audio & Storage
DEEPGRAM_API_KEY=...
DO_SPACES_KEY=...
DO_SPACES_SECRET=...
DO_SPACES_ENDPOINT=...
DO_SPACES_BUCKET=...

# Auth
NEXT_PUBLIC_STACK_PROJECT_ID=...
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=...
STACK_SECRET_SERVER_KEY=...
```

### 3. Installation
```bash
# Install dependencies
npm install

# Start the Convex backend
npx convex dev

# Start the Next.js development server
npm run dev
```

---

## 🔒 Security & Persistence
*   **Stack Auth Integration**: Multi-user support with isolated project environments.
*   **Cloud Persistence**: All jobs, sources, and generated assets are stored in the cloud (Convex/DO) and are accessible from any device.
*   **Data Integrity**: Checksums and metadata tracking for every ingested source.

---

<div align="center">
Built with ❤️ for the future of Agentic Research.
</div>
