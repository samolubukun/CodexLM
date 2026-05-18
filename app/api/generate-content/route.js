import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { queryVectors } from '@/lib/pinecone';
import { generateEmbeddings } from '@/lib/embeddings';
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

import { stackServerApp } from '@/stack';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

export async function POST(req) {
    try {
        const user = await stackServerApp.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { projectId, type, instructions, jobId } = await req.json();

        // Security: Verify project ownership
        const convexUser = await convex.query(api.users.getUserByStackId, { stackId: user.id });
        if (!convexUser) {
            return NextResponse.json({ error: "User not synced" }, { status: 403 });
        }

        const project = await convex.query(api.projects.getProjectById, { projectId });
        if (!project || project.userId !== convexUser._id) {
            return NextResponse.json({ error: "Unauthorized access to project" }, { status: 403 });
        }


        if (jobId) {
            await convex.mutation(api.studio_jobs.updateJobStatus, {
                jobId,
                status: "processing"
            });
        }

        // 1. Fetch Context from Pinecone (RAG)
        // We'll use the instructions as a query to find relevant chunks
        const vector = await generateEmbeddings(instructions || "General summary of the project");
        const matches = await queryVectors(vector, 10, { projectId });
        const context = matches.map(m => m.metadata.text).join("\n---\n");

        const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || "gemini-3.1-flash-lite-preview" });

        let prompt = "";
        
        switch (type) {
            case 'flashcards':
                prompt = `You are a dynamic and adaptive learning assistant. 
                First, identify the primary domain, difficulty level, and core theme of the following context. 
                Based on this discovery, generate a set of 5-10 highly relevant educational flashcards. 
                Adapt the vocabulary and depth of the questions to the complexity of the source material.
                Return the result strictly as a JSON array of objects with 'question' and 'answer' fields. Do not include any markdown format explanation outside the JSON.
                Context: ${context}`;
                break;
            case 'quiz':
                prompt = `You are a dynamic and adaptive assessment engine. 
                Analyze the provided context to identify the core arguments, scientific methodology, code concepts, or key findings. 
                Generate a 5-question multiple choice quiz testing deep understanding of the concepts rather than trivial facts, adapted to the technical level of the context.
                Return the result strictly as a JSON array of objects with 'question', 'options' (array of strings), and 'correctIndex' (number, 0-indexed) fields.
                Context: ${context}`;
                break;
            case 'prd':
                prompt = `You are a dynamic technology and business translator. 
                Analyze the provided context to identify its core domain (e.g., Academic Paper, Software Codebase, Financial Report, Creative Document).
                Based on this discovery, generate a professional Product Requirement Document (PRD) or Technical/Methodological Specification.
                
                Adapt the terminology dynamically:
                - If the context is an Academic/Scientific Paper: Translate "Product" to the "Proposed System/Methodology". Translate "User Stories" to "Researcher/Engineering Implementation Workflows".
                - If the context is a Software Codebase: Translate "Product" to the "System Architecture/Engine". Translate "User Stories" to "Developer Integration Workflows".
                - If the context is Creative/Narrative: Translate "Product" to the "Story World/Manuscript". Translate "User Stories" to "Audience/Reader Journeys".
                - If standard Business: Keep standard product management definitions.

                Return the result strictly as a JSON object with:
                - "title": string (descriptive, professional title of the core innovation/methodology)
                - "overview": string (detailed overview of the concept and its technical/methodological basis)
                - "targetAudience": string (who specifically benefits: researchers, developers, users, or businesses)
                - "userStories": array of strings (functional workflows or core scenarios appropriate to the domain)
                - "keyFeatures": array of { "feature": string, "description": string } (key elements, system components, or methodological steps)
                - "successMetrics": array of strings (validation metrics, scientific benchmarks, error rates, or business KPIs)

                Context: ${context}`;
                break;
            case 'report':
                prompt = `You are an elite, multi-disciplinary analyst. 
                Analyze the provided context and determine its domain. Generate a comprehensive Report or Analytical Brief based on the context.
                
                Adapt the terminology and tone dynamically:
                - Scientific/Academic Paper: Generate a "Scientific Impact & Critical Review" focusing on methodology, empirical findings, and future research directions.
                - Software Codebase: Generate an "Architecture & Maintenance Audit" focusing on scalability, technical debt, and system patterns.
                - Corporate/Financial: Generate a "Strategic Business Report".
                - Creative/Other: Generate an "Analytical & Thematic Evaluation".

                Return the result strictly as a JSON object with:
                - "title": string (domain-appropriate title of the analysis)
                - "executiveSummary": string (concise, high-impact summary of the material)
                - "keyAnalysis": array of { "point": string, "detail": string } (deep analysis of core aspects, methodologies, or modules)
                - "recommendations": array of strings (practical next steps, implementation extensions, or strategic advice)
                - "conclusion": string (definitive closing statement)

                Context: ${context}`;
                break;
            case 'diagram':
                prompt = `You are a visual architect. 
                Analyze the provided context and instructions: "${instructions}".
                Identify the core architecture, process, or logical sequence.
                Generate a Mermaid.js flowchart or sequence diagram that visualizes these core concepts.
                
                CRITICAL INSTRUCTIONS FOR MERMAID SYNTAX:
                1. Return ONLY the mermaid code block (starting with graph TD or similar). 
                2. Use multiple lines and proper indentation for the mermaid syntax.
                3. LIMIT THE DIAGRAM TO A MAXIMUM OF 15-20 HIGH-IMPACT NODES. Focus on key structural relationships.
                4. SAFE TEXT: Always wrap the text inside nodes with double quotes to prevent syntax errors caused by parentheses or special characters (e.g., A["Original Models (RNN)"] --> B{"Process Data"}).
                
                Context: ${context}`;
                break;
            case 'mindmap':
                prompt = `You are a dynamic structural mapper. 
                Analyze the provided context to map its logical landscape.
                Generate a Mermaid.js mindmap that provides a comprehensive, glanceable overview of the core topic.
                
                Content Instructions:
                - Identify the single core topic, system, or thesis as the root node.
                - Branch out into the major themes, chapters, system modules, or high-level arguments.
                - Add sub-branches that drill down into crucial details, functions, and evidence.
                - Focus on mapping the landscape of the document so the user can instantly understand how concepts relate.
                - LIMIT THE MINDMAP TO A MAXIMUM OF 15-20 HIGH-IMPACT NODES.
                
                CRITICAL INSTRUCTIONS FOR MERMAID SYNTAX:
                1. Start with "mindmap" on the first line.
                2. Use indentation (spaces) to show hierarchy.
                3. Do NOT use multiple strings or words separated by space on the same line if they are meant to be separate nodes. Each node MUST be on its own line.
                4. Keep node text simple, avoid special characters or excessive punctuation.
                5. Do NOT include any explanations, return ONLY the mermaid code block.
                
                Context: ${context}`;
                break;
            case 'infographic':
                prompt = `You are an elite data-visualization and design analyst.
                Analyze the context to extract key metrics, stages, goals, and takeaways. 
                Generate a visual infographic summary structured for this domain.
                
                Adapt terms dynamically:
                - Academic Paper: "stats" should extract scientific metrics, parameters, sample sizes, or error rates. "timeline" should represent the experimental methodology or algorithmic execution pipeline.
                - Codebase: "stats" should map to performance, code coverage, or complexity metrics. "timeline" should represent the compilation/execution flow or data pipeline.
                - Business: Standard KPI metrics and project/launch timeline.
                
                Return a JSON object with:
                - "title": string (compelling visual title)
                - "mainGoal": string (the primary objective of the methodology, system, or business)
                - "stats": array of { "label": string, "value": string, "icon": string } (key parameters, scientific findings, metrics, or performance indicators. Select standard Lucide icon names like "trending-up", "cpu", "database", "award", "zap", etc.)
                - "keyTakeaways": array of strings (the most important lessons, core principles, or key innovations)
                - "timeline": array of { "stage": string, "description": string } (chronological phases, algorithmic steps, or methodology pipeline)

                Context: ${context}`;
                break;
            case 'table':
                prompt = `You are a database and structured data designer.
                Analyze the provided context and generate a comprehensive data table comparing, cataloging, or organizing its core contents.
                
                Adapt content dynamically:
                - Academic Paper: Compare methodologies, baselines, hyperparameters, dataset metrics, or experimental variables.
                - Software Codebase: Catalog modules, routes, helper functions, state variables, or dependencies.
                - Business/General: Tabulate comparative items, market features, or operational datasets.

                Return a JSON object with:
                - "title": string (highly descriptive table title)
                - "columns": array of strings (specific column names, tailored to the dataset type rather than generic headers)
                - "rows": array of objects matching the columns
                
                Context: ${context}`;
                break;
            case 'slides':
                prompt = `You are a professional presentation designer.
                Analyze the provided context and generate a high-impact slide deck outline (6-8 slides) tailored to present this material to its natural audience.
                
                Adapt framing dynamically:
                - Scientific/Academic Paper: Frame for a scientific colloquium or conference presentation (focus on Abstract, Literature Gap, Methodology, Experiments, Results, and Future Directions).
                - Software Codebase: Frame for an engineering system demo or tech talk (focus on Architecture, Core Modules, Setup, Integrations, and Scaling).
                - Business: Frame for a pitch deck or business review.

                Return the result strictly as a JSON array of objects with 'title' and 'content' (bullet points array of strings) fields.
                
                Context: ${context}`;
                break;
            case 'marketing':
                prompt = `You are an elite developer relations and scientific communications specialist. 
                Analyze the provided context to identify its natural audience, scientific peers, or potential developer base.
                Generate an outreach and campaign pack designed to communicate these findings or product highlights.

                Adapt the communication channels dynamically:
                - Academic Paper: Design for scientific outreach, journal highlights, or sharing with peer research communities on LinkedIn/Twitter (focus on novel findings, mathematical impact, or paradigm shifts).
                - Codebase: Design for developer relations, open-source promotion, or engineering blogs (focus on developer experience, simplicity of API, and performance).
                - Business/Consumer: Design standard market positioning campaign.

                Return the result strictly as a JSON object with:
                - "targetAudience": string (who specifically cares about this innovation or product)
                - "campaignGoal": string (the primary communication objective)
                - "twitter": array of strings (3 channel-appropriate posts. For scientific/tech, include professional tags/hashtags and highlight actual findings or APIs)
                - "linkedin": string (a comprehensive, high-impact post describing the methodology, systemic impact, and significance)
                - "email": { 
                    "subject": string, (an engaging, professional subject line appropriate for peer review or developer adoption)
                    "body": string (a complete, beautifully structured outreach email tailored to your domain)
                  }

                Context: ${context}`;
                break;
            default:
                return NextResponse.json({ error: "Invalid content type" }, { status: 400 });
        }

        const result = await model.generateContent(prompt);
        let output = result.response.text();

        // If it's supposed to be JSON, try to parse it (minimal cleanup)
        if (['flashcards', 'quiz', 'slides', 'marketing', 'prd', 'report', 'infographic', 'table'].includes(type)) {
            try {
                const jsonMatch = output.match(/[\[\{][\s\S]*[\]\}]/);
                if (jsonMatch) output = JSON.parse(jsonMatch[0]);
            } catch (e) {
                console.error("Failed to parse JSON output", e);
            }
        }

        if (jobId) {
            await convex.mutation(api.studio_jobs.updateJobStatus, {
                jobId,
                status: "completed",
                output: output
            });
        }

        return NextResponse.json({ output });

    } catch (error) {
        console.error("Generation Error:", error);
        
        const errorStr = error.message?.toLowerCase() || "";
        const isGeminiOverload = errorStr.includes("503") || 
                               errorStr.includes("429") || 
                               errorStr.includes("overloaded") ||
                               errorStr.includes("capacity");

        let errorMessage = "Failed to generate content. Agent is overloaded. Please try again later. Apologies.";
        
        if (isGeminiOverload) {
            errorMessage = "Failed to generate content. Gemini is receiving high volume. Please try again later. Apologies.";
        } else if (errorStr.includes("quota") || errorStr.includes("limit")) {
            errorMessage = "Failed to generate content. API quota exceeded. Please try again later. Apologies.";
        }

        return NextResponse.json({ 
            error: errorMessage,
            isOverloaded: isGeminiOverload 
        }, { status: isGeminiOverload ? 503 : 500 });
    }
}
