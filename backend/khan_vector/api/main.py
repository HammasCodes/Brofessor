from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from khan_vector.routers import chat, health
from pinecone import Pinecone, ServerlessSpec
from langchain_pinecone import PineconeVectorStore
from langchain_openai import OpenAIEmbeddings
import os

# Load environment variables
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_ENV = os.getenv("PINECONE_ENV")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
INDEX_NAME = "raza"

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Application startup: Initializing vectorstore...")

    # Initialize Pinecone client
    pc = Pinecone(api_key=PINECONE_API_KEY)

    # List existing indexes
    existing_indexes = pc.list_indexes()

    # Create index if it doesn't exist
    if INDEX_NAME not in existing_indexes:
        try:
            pc.create_index(
                name=INDEX_NAME,
                dimension=3072,
                spec=ServerlessSpec(cloud="aws", region=PINECONE_ENV),
                vector_type="dense"
            )
            print(f"Index '{INDEX_NAME}' created!")
        except Exception as e:
            print(f"Warning: Could not create index: {e}")
    else:
        print(f"Index '{INDEX_NAME}' already exists.")

    # Connect to Pinecone index
    index = pc.Index(INDEX_NAME)

    # Initialize embeddings
    embeddings = OpenAIEmbeddings(
        model="text-embedding-3-large",
        openai_api_key=OPENAI_API_KEY
    )

    # Initialize LangChain PineconeVectorStore
    app.state.vectorstore = PineconeVectorStore(
        index=index,      # Correct argument
        embedding=embeddings,
        text_key="text"   # Required parameter
    )

    print("Vectorstore initialized successfully.")
    yield
    print("Application shutdown: Cleaning up resources.")
    app.state.vectorstore = None

# Create FastAPI app
app = FastAPI(
    title="RAG Chatbot API",
    description="Backend for a Retrieval-Augmented Generation (RAG) chatbot.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS setup
origins = [
   "https://brofessor-three.vercel.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(chat.router, prefix="/api")
app.include_router(health.router, prefix="/api")

# Root endpoint
@app.get("/")
def read_root():
    return {"message": "Welcome to the RAG Chatbot API!"}
