import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from pinecone import Pinecone
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain.schema import HumanMessage, SystemMessage
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Pydantic models
class ChatRequest(BaseModel):
    query: str

class ChatResponse(BaseModel):
    response: str

router = APIRouter()

try:
    PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
    PINECONE_INDEX_NAME = os.getenv("INDEX_NAME")
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

    if not all([PINECONE_API_KEY, PINECONE_INDEX_NAME, OPENAI_API_KEY]):
        raise ValueError("Required environment variables are not set.")

    # Initialize Pinecone client and index
    pinecone_client = Pinecone(api_key=PINECONE_API_KEY)
    pinecone_index = pinecone_client.Index(PINECONE_INDEX_NAME)

    # Embeddings
    embeddings_model = OpenAIEmbeddings(model="text-embedding-3-large", openai_api_key=OPENAI_API_KEY)

    # LLM
    llm = ChatOpenAI(model="gpt-4o-mini", openai_api_key=OPENAI_API_KEY)

except Exception as e:
    raise HTTPException(status_code=500, detail=f"Initialization error: {e}")


def get_text_embedding(text: str):
    return embeddings_model.embed_query(text)


@router.post("/chat", response_model=ChatResponse)
async def chat_with_bot(request: ChatRequest):
    try:
        # 1. Embed the query
        query_embedding = get_text_embedding(request.query)

        # 2. Query Pinecone
        search_results = pinecone_index.query(
            vector=query_embedding,
            top_k=3,
            include_metadata=True
        )

        # 3. Build context
        context = "\n\n".join([m.metadata.get("text", "") for m in search_results.matches])

        if not context:
            return ChatResponse(response="I'm sorry, I couldn't find any relevant information.")

        # 4. Build prompt
        messages = [
            SystemMessage(
                content=(
                    "You are a helpful and friendly chatbot. Use the following context to "
                    "answer the user's question. If the information is not in the context, "
                    "politely say you don’t know.\n\n"
                    f"Context:\n{context}"
                )
            ),
            HumanMessage(content=request.query)
        ]

        # 5. Call GPT
        response_model = llm.invoke(messages)
        final_response = response_model.content

        return ChatResponse(response=final_response)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
