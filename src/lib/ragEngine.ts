// src/lib/ragEngine.ts

let pipeline: any = null;
let env: any = null;

async function initTransformers() {
  if (pipeline && env) return { pipeline, env };
  
  // Dynamic import for aggressive lazy loading
  const transformers = await import('@xenova/transformers');
  pipeline = transformers.pipeline;
  env = transformers.env;
  
  // Disable local model checking to force HuggingFace hub download
  env.allowLocalModels = false;
  // Models will be cached by our Service Worker runtimeCaching
  return { pipeline, env };
}

let extractor: any = null;

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const { pipeline } = await initTransformers();
    if (!extractor) {
      // Lightweight feature extraction model (runs locally via WASM)
      extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
        quantized: true // 8-bit quantized for smaller memory footprint
      });
    }
    
    // Generate embedding vector
    const output = await extractor(text, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
  } catch (error) {
    console.error("Embedding generation failed", error);
    return [];
  }
}

// Compute Cosine Similarity between two vectors
export function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length !== b.length || a.length === 0) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Vector search against an array of decrypted journal entries
export async function vectorSearch(query: string, entries: any[], topK: number = 3) {
  const queryEmbedding = await generateEmbedding(query);
  if (queryEmbedding.length === 0) return [];

  const scored = entries.map(entry => {
    // entry.data.embedding contains the stored vector from IndexedDB
    const sim = entry.data.embedding ? cosineSimilarity(queryEmbedding, entry.data.embedding) : -1;
    return { ...entry, similarity: sim };
  });

  // Sort descending by relevance
  scored.sort((a, b) => b.similarity - a.similarity);
  return scored.slice(0, topK);
}
