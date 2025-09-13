import os
from pinecone import Pinecone, ServerlessSpec

# It's best practice to use environment variables for sensitive information.
# Make sure to set the PINECONE_API_KEY and PINECONE_ENVIRONMENT environment variables.
# You can set them in your terminal or a .env file.
# On macOS/Linux: export PINECONE_API_KEY="YOUR_API_KEY"
# On Windows: set PINECONE_API_KEY="YOUR_API_KEY"

# Retrieve API key and environment from environment variables
api_key = os.environ.get("PINECONE_API_KEY")

if not api_key:
    # A quick way to handle missing environment variables.
    # Replace this with your actual key if you're just testing, but
    # remove it before you commit to source control.
    print("WARNING: PINECONE_API_KEY environment variable is not set. Please set it to proceed.")
    exit()

# Initialize the Pinecone client.
# The Pinecone() call is a class constructor, which is why it's "callable".
try:
    pc = Pinecone(api_key=api_key)
    print("Successfully initialized Pinecone client!")
    
    # You can now proceed to manage indexes, like creating one:
    # index_name = "my-test-index"
    # if index_name not in pc.list_indexes().names:
    #     pc.create_index(
    #         name=index_name,
    #         dimension=8, # Replace with your model's dimension
    #         metric="cosine", # Or "dotproduct", "euclidean"
    #         spec=ServerlessSpec(cloud="aws", region="us-west-2")
    #     )
    #     print(f"Created index '{index_name}'")

except Exception as e:
    print(f"An error occurred: {e}")
    # Additional debugging information might be helpful here.
    # print(f"Type of Pinecone is: {type(Pinecone)}")
