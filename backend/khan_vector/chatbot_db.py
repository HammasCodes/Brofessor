import os
import json
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

from pinecone import Pinecone, ServerlessSpec
from langchain_openai import OpenAIEmbeddings
from langchain_pinecone import Pinecone as LangchainPinecone
from langchain.document_loaders import PyPDFLoader, TextLoader, CSVLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter

# ------------------- CONFIG -------------------
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_ENV = os.getenv("PINECONE_ENV")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
INDEX_NAME = "raza"
DATA_FOLDER = Path(__file__).parent / "data"
UPLOADED_LOG = Path(__file__).parent / "uploaded_files.json"
DIMENSION = 3072  # text-embedding-3-large

# ------------------- INITIALIZE PINECONE -------------------
pc = Pinecone(api_key=PINECONE_API_KEY)

# Create index if not exists
if INDEX_NAME not in [idx.name for idx in pc.list_indexes()]:
    pc.create_index(
        name=INDEX_NAME,
        dimension=DIMENSION,
        spec=ServerlessSpec(cloud="aws", region=PINECONE_ENV),
        vector_type="dense"
    )
    print(f"Index '{INDEX_NAME}' created!")
else:
    print(f"Index '{INDEX_NAME}' already exists.")

# Connect to index
index = pc.Index(INDEX_NAME)
print("Connected to Pinecone index successfully!")

# ------------------- EMBEDDINGS -------------------
embeddings = OpenAIEmbeddings(model="text-embedding-3-large", openai_api_key=OPENAI_API_KEY)

# ------------------- TEXT SPLITTER -------------------
text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)

# ------------------- VECTORSTORE -------------------
vectorstore = LangchainPinecone.from_existing_index(index_name=INDEX_NAME, embedding=embeddings)

# ------------------- UPLOAD NEW DOCUMENTS -------------------
def update_vectorstore(data_folder: Path, vectorstore, text_splitter):
    all_files = list(data_folder.rglob("*.*"))

    # Load previously uploaded files
    if UPLOADED_LOG.exists():
        with open(UPLOADED_LOG, "r") as f:
            uploaded_files = set(json.load(f))
    else:
        uploaded_files = set()

    new_documents = []

    for file_path in all_files:
        if str(file_path) in uploaded_files:
            continue  # skip already uploaded

        # Load documents
        if file_path.suffix.lower() == ".pdf":
            loader = PyPDFLoader(str(file_path))
        elif file_path.suffix.lower() == ".txt":
            loader = TextLoader(str(file_path), encoding="utf-8")
        elif file_path.suffix.lower() == ".csv":
            loader = CSVLoader(str(file_path))
        else:
            continue

        docs = loader.load()
        docs = text_splitter.split_documents(docs)
        for d in docs:
            d.metadata["source"] = str(file_path)

        new_documents.extend(docs)
        uploaded_files.add(str(file_path))

    if new_documents:
        vectorstore.add_documents(new_documents)
        print(f"Added {len(new_documents)} new document chunks to Pinecone.")
    else:
        print("No new documents found. Vectorstore is up to date.")

    # Save updated log
    with open(UPLOADED_LOG, "w") as f:
        json.dump(list(uploaded_files), f)


# Run upload only once at startup
update_vectorstore(DATA_FOLDER, vectorstore, text_splitter)
