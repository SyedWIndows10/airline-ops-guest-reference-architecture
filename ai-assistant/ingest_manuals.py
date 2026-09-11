"""
Chunks the mock SOP documents by section, computes a deterministic local
"embedding" for each chunk, and writes a JSON vector store consumed by
query_api/. No external embedding API call is made — see guardrails.md
("what's mocked vs. real") for why, and llmClient.js for the single place
a real embedding/completion API would be wired in.
"""
import hashlib
import json
import os
import re

MOCK_SOPS_DIR = os.path.join(os.path.dirname(__file__), "mock_sops")
STORE_PATH = os.path.join(os.path.dirname(__file__), "_store", "vector_store.json")
EMBEDDING_DIMS = 64


def chunk_document(text: str, source: str) -> list:
    """Splits a markdown doc into chunks at '## Section ...' headers."""
    sections = re.split(r"\n(?=## )", text.strip())
    chunks = []
    for section in sections:
        section = section.strip()
        if not section:
            continue
        header_match = re.match(r"##\s*(.+)", section)
        title = header_match.group(1).strip() if header_match else source
        chunks.append({"source": source, "title": title, "text": section})
    return chunks


def deterministic_embedding(text: str, dims: int = EMBEDDING_DIMS) -> list:
    """
    A hashing-trick bag-of-words embedding: deterministic, dependency-free,
    good enough to demonstrate retrieval-by-cosine-similarity. Not a substitute
    for a real embedding model — swap this function out for a live API call
    when wiring up a production version (see guardrails.md).
    """
    vector = [0.0] * dims
    words = re.findall(r"[a-zA-Z]+", text.lower())
    for word in words:
        h = int(hashlib.md5(word.encode("utf-8")).hexdigest(), 16)
        vector[h % dims] += 1.0
    norm = sum(v * v for v in vector) ** 0.5
    if norm > 0:
        vector = [v / norm for v in vector]
    return vector


def main():
    all_chunks = []
    for filename in sorted(os.listdir(MOCK_SOPS_DIR)):
        if not filename.endswith(".md"):
            continue
        with open(os.path.join(MOCK_SOPS_DIR, filename), "r", encoding="utf-8") as f:
            text = f.read()
        for chunk in chunk_document(text, filename):
            chunk["embedding"] = deterministic_embedding(chunk["text"])
            all_chunks.append(chunk)

    os.makedirs(os.path.dirname(STORE_PATH), exist_ok=True)
    with open(STORE_PATH, "w", encoding="utf-8") as f:
        json.dump({"dims": EMBEDDING_DIMS, "chunks": all_chunks}, f, indent=2)

    print(f"[ingest_manuals] wrote {len(all_chunks)} chunks from "
          f"{len(os.listdir(MOCK_SOPS_DIR))} document(s) to {STORE_PATH}")


if __name__ == "__main__":
    main()
