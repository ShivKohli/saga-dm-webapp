import os
import fitz                 # PyMuPDF
import openai
import supabase
from tqdm import tqdm

# ─── Configuration ──────────────────────────────────────────────
openai.api_key = os.getenv("OPENAI_API_KEY")
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase_client = supabase.create_client(supabase_url, supabase_key)

DATA_DIR = "./data"  # Folder containing PDFs
CHUNK_SIZE = 500
CHUNK_OVERLAP = 50
EMBED_MODEL = "text-embedding-3-small"

# ─── Helper Functions ───────────────────────────────────────────

def extract_text_from_pdf(pdf_path):
    """Extract plain text from a PDF using PyMuPDF."""
    text_pages = []
    with fitz.open(pdf_path) as doc:
        for page_number, page in enumerate(doc, start=1):
            text = page.get_text("text")
            if text.strip():
                text_pages.append((page_number, text))
    return text_pages


def chunk_text(text, chunk_size=CHUNK_SIZE, overlap=CHUNK_OVERLAP):
    """Split text into overlapping chunks."""
    words = text.split()
    chunks = []
    for i in range(0, len(words), chunk_size - overlap):
        chunk = " ".join(words[i:i + chunk_size])
        chunks.append(chunk)
    return chunks


def embed_text(text):
    """Generate an embedding vector for a given text chunk."""
    response = openai.embeddings.create(
        model=EMBED_MODEL,
        input=text
    )
    return response.data[0].embedding


def upload_to_supabase(content, embedding, source_file, chunk_index, page_number):
    """Insert a chunk and its embedding into Supabase."""
    supabase_client.table("saga_knowledge").insert({
        "content": content,
        "embedding": embedding,
        "source_file": source_file,
        "chunk_index": chunk_index,
        "page_number": page_number
    }).execute()


# ─── Main Loader ────────────────────────────────────────────────

def process_all_pdfs():
    for file_name in os.listdir(DATA_DIR):
        if not file_name.lower().endswith(".pdf"):
            continue

        file_path = os.path.join(DATA_DIR, file_name)
        print(f"\n📘 Processing {file_name}...")
        pages = extract_text_from_pdf(file_path)

        for page_number, page_text in tqdm(pages, desc="Embedding pages"):
            chunks = chunk_text(page_text)
            for idx, chunk in enumerate(chunks):
                embedding = embed_text(chunk)
                upload_to_supabase(chunk, embedding, file_name, idx, page_number)

        print(f"✅ Uploaded all chunks for {file_name}")


if __name__ == "__main__":
    process_all_pdfs()
    print("\n🎉 All PDFs processed and uploaded to Supabase successfully!")
