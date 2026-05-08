
<div align="center">
 
<img src="./public/logo.png" width="120" alt="CodexLM Logo" />
 
# CodexLM

### The Professional Agentic AI Research Platform

CodexLM is a high-performance research ecosystem designed to transform multi-modal data sources into structured, actionable knowledge. The platform provides a unified workspace for document ingestion, semantic search, and professional content generation.

[![Status](https://img.shields.io/badge/status-active-indigo.svg?style=flat-square)]()
[![Next.js](https://img.shields.io/badge/Next.js-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Convex](https://img.shields.io/badge/Convex-f97316?style=flat-square)](https://convex.dev/)
[![Gemini](https://img.shields.io/badge/Gemini-4285F4?style=flat-square&logo=google)](https://deepmind.google/technologies/gemini/)
[![Pinecone](https://img.shields.io/badge/Pinecone-00c1d4?style=flat-square)](https://www.pinecone.io/)
[![Deepgram](https://img.shields.io/badge/Deepgram-black?style=flat-square)](https://www.deepgram.com/)
[![Stack Auth](https://img.shields.io/badge/Stack_Auth-indigo?style=flat-square)](https://stack-auth.com/)

</div>

---

## Technical Overview
CodexLM leverages an agentic RAG (Retrieval-Augmented Generation) architecture to move beyond simple chat. It understands sources across text, audio, and web interfaces, then utilizes a specialized Studio to generate professional-grade assets.

## Key Features

### Multi-Modal Source Ingestion
The platform supports a wide range of data formats for comprehensive research:
*   Documents: Native support for PDF, DOCX, and PPTX with high-fidelity text extraction.
*   Audio: Automated transcription of research recordings and interviews powered by Deepgram Nova-2.
*   Web Access: Real-time URL scraping and YouTube transcript extraction for current event integration.
*   Direct Notes: Support for plain text input and persistent project-wide instructions.

### Agentic RAG Engine
A specialized research-first chat interface grounded in project-specific data:
*   Hybrid Search: Combines Pinecone vector semantic embeddings with traditional keyword matching.
*   Source Attribution: Automated citation generation with direct links to processed sources.
*   Project Context: System-level instructions that define tone, scope, and constraints for the AI agent.
*   Voice Interaction: High-fidelity speech-to-text for hands-free knowledge retrieval.

### Creative Studio Suite
The Studio transforms raw research into structured professional outputs across six specialized categories:

#### 1. Audio Briefings
*   **Podcast Overview**: Converts complex documents into a two-person dialogue script with high-quality audio synthesis powered by Deepgram Aura-2.

#### 2. Visual Architecture
*   **Flow Diagrams & Mind Maps**: Instantly visualize complex concepts and project hierarchies using fully interactive Mermaid.js rendering.
*   **Infographics**: Transform data points into visually engaging, structured summaries.

#### 3. Professional Documentation
*   **PRD & Business Reports**: Generate high-fidelity product requirements and strategic business analysis directly from your source material.
*   **Data Tables**: Extract and structure unstructured data into clean, exportable tabular formats.

#### 4. Learning & Mastery
*   **Flashcard Suite**: Interactive, 3D-rendered study cards optimized for rapid knowledge retention.
*   **Quiz Framework**: Automated assessments to verify knowledge and technical onboarding.

#### 5. Presentation & Marketing
*   **Slide Decks**: Ready-to-present visual layouts summarizing your project's core insights.
*   **Social Pack**: Tailored content for LinkedIn, Twitter, and email campaigns based on your research findings.


## Technical Stack

| Component | Technology |
|-----------|------------|
| Frontend | Next.js 15 (App Router), Framer Motion, Tailwind CSS v4 |
| Database | Convex (Real-time Backend-as-a-Service) |
| Authentication | Stack Auth |
| Vector Engine | Pinecone (Serverless) |
| Audio Intelligence | Deepgram Aura-2 (TTS) and Nova-2 (STT) |
| LLM Engine | Google Gemini 3.1 Flash Lite |
| File Storage | DigitalOcean Spaces (S3-Compatible) |

## Installation and Setup

### 1. Clone the Repository
```bash
git clone https://github.com/samolubukun/CodexLM.git
cd CodexLM
```

### 2. Prerequisites
*   Node.js 18 or higher
*   Convex CLI
*   DigitalOcean Spaces account
*   Required API Keys: Google Gemini, Deepgram, Pinecone, LangSearch

### 3. Environment Configuration
1.  Copy the provided example environment file:
    ```bash
    cp .env.example .env.local
    ```
2.  Populate `.env.local` with your respective API keys and configuration strings as detailed in the example file.

### 4. Local Development
1.  Install dependencies:
    ```bash
    npm install
    ```
2.  Initialize the Convex backend:
    ```bash
    npx convex dev
    ```
3.  Launch the development server:
    ```bash
    npm run dev
    ```

## Project Structure
*   `/app`: Next.js application routes and page logic.
*   `/convex`: Server-side functions, database schemas, and background jobs.
*   `/components`: Reusable UI components including the Studio and Chat interfaces.
*   `/lib`: Core utility functions for AI integration and data processing.
*   `/services`: Metrics tracking and global application state management.

## License
Copyright (c) 2026 CodexLM. Distributed under the MIT License.
