# Brofessor AI

Multilingual RAG chatbot built solo at a college hackathon.
Answers 1,000+ queries with 95%+ accuracy across 5 languages.

## Stack

**Backend:** FastAPI, LangChain, Pinecone (Vector DB), OpenAI Embeddings
**Frontend:** React, TypeScript, Vite, Shadcn UI, Tailwind CSS, Radix UI

## How It Works

1. Documents are chunked and embedded using OpenAI
2. Embeddings are indexed into Pinecone for semantic search
3. User query is converted to embedding and matched against the vector index
4. Top-k relevant chunks are retrieved (sub-300ms)
5. Retrieved chunks are fed to the LLM as context for grounded answers
6. Response includes source citations for verification

## Languages Supported

Hindi, English, Urdu, Hinglish, Bhojpuri

## Built By

Mohammad Hammas Ansari
Solo. 24-hour hackathon. Cold pizza and desperation.
