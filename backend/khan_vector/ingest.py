# khan_vector/ingest.py
import os
import json
from pathlib import Path
from dotenv import load_dotenv

from langchain_openai import OpenAIEmbeddings
from langchain_pinecone.vectorstores import Pinecone
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader, TextLoader, CSVLoader
from pinecone import Pinecone as PineconeClient, ServerlessSpec

# ------------------- Load Environment -------------------
load_dotenv()
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_ENV = os.getenv("PINECONE_ENV")  # e.g., "us-east1-gcp"
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
INDEX_NAME = "raza"  # your Pinecone index name
DATA_FOLDER = Path(__file__).parent / "data"
UPLOADED_LOG = Path(__file__).parent / "uploaded_files.json"

# ------------------- Initialize Pinecone -------------------
pc = PineconeClient(api_key=PINECONE_API_KEY)

# Create index if it doesn't exist
if INDEX_NAME not in [idx.name for idx in pc.list_indexes()]:
    pc.create_index(
        name=INDEX_NAME,
        dimension=3072,  # text-embedding-3-large dimension
        spec=ServerlessSpec(cloud="aws", region=PINECONE_ENV),
        vector_type="dense"
    )
    print(f"Index '{INDEX_NAME}' created!")
else:
    print(f"Index '{INDEX_NAME}' already exists.")

# ------------------- Initialize Embeddings -------------------
embeddings = OpenAIEmbeddings(
    model="text-embedding-3-large",
    openai_api_key=OPENAI_API_KEY
)

# ------------------- Text Splitter -------------------
text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=1000)

# ------------------- Load Previously Uploaded Files -------------------
if UPLOADED_LOG.exists():
    with open(UPLOADED_LOG, "r") as f:
        uploaded_files = set(json.load(f))
else:
    uploaded_files = set()

# ------------------- Collect New Documents -------------------
new_documents = []

for file_path in DATA_FOLDER.rglob("*.*"):
    if str(file_path) in uploaded_files:
        continue  # skip already uploaded files

    loader = None
    if file_path.suffix.lower() == ".pdf":
        loader = PyPDFLoader(str(file_path))
    elif file_path.suffix.lower() == ".txt":
        loader = TextLoader(str(file_path), encoding="utf-8")
    elif file_path.suffix.lower() == ".csv":
        loader = CSVLoader(str(file_path))
    else:
        continue  # unsupported type

    docs = loader.load()
    docs = text_splitter.split_documents(docs)
    for d in docs:
        d.metadata["source"] = str(file_path)

    new_documents.extend(docs)
    uploaded_files.add(str(file_path))
    print(f"Loaded {len(docs)} chunks from {file_path.name}")

# ------------------- Upload to Pinecone -------------------
if new_documents:
    vectorstore = Pinecone.from_documents(
        documents=new_documents,
        embedding=embeddings,
        index_name=INDEX_NAME
    )
    print(f"Uploaded {len(new_documents)} new document chunks to Pinecone.")
else:
    print("No new documents to upload. Vectorstore is up to date.")

# ------------------- Update Log -------------------
with open(UPLOADED_LOG, "w") as f:
    json.dump(list(uploaded_files), f)
