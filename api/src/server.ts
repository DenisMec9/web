import "dotenv/config";
import express from "express";
import cors from "cors";

// Importação das rotas
import uploadRoute from "./routes/upload";  
// IMPORTANTE: O nome aqui deve ser loadFiles para bater com o loader.ts
import { loadFiles } from "./ingest/loader"; 
import { chunkText } from "./ingest/chunker";  
import { embed, openai } from "./llm/openai";  
import { buildPrompt } from "./llm/prompt"; 
import { cosineSimilarity } from "./rag/similarity";  
import { loadIndex, saveIndex, StoredChunk } from "./rag/localStore"; 

const app = express();
app.use(cors());
app.use(express.json());

const MIN_SCORE = 0.25;

app.use("/upload", uploadRoute);

/**
 * Indexa documentos da pasta /docs (Suporta .txt e .pdf)
 */
async function ingestDocs() {
  // Agora usamos 'await' e o nome correto da função
  const docs = await loadFiles("docs"); 
  const index: StoredChunk[] = [];

  for (const d of docs) {
    const chunks = chunkText(d.text);

    for (let i = 0; i < chunks.length; i++) {
      const text = chunks[i];
      const embedding = await embed(text);

      index.push({
        id: `${d.id}-${i}`,
        source: d.source,
        text,
        embedding
      });
    }
  }

  saveIndex(index);
  return { chunks: index.length };
}

/**
 * Recupera os trechos mais relevantes com base na similaridade
 */
async function retrieve(question: string, topK = 3) {
  const index = loadIndex();
  if (index.length === 0) return [];

  const qEmb = await embed(question);

  const ranked = index
    .map(item => ({
      item,
      score: cosineSimilarity(qEmb, item.embedding)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return ranked.map(r => ({
    text: r.item.text,
    source: r.item.source,
    score: r.score
  }));
}

app.post("/ingest", async (_req, res) => {
  try {
    const result = await ingestDocs();
    res.json({ ok: true, ...result });
  } catch (e: any) {
    res.status(500).json({
      ok: false,
      error: e?.message ?? "Erro ao indexar documentos"
    });
  }
});

app.post("/ask", async (req, res) => {
  try {
    const question = String(req.body?.question ?? "").trim();

    if (!question) {
      return res.status(400).json({ ok: false, error: "Pergunta vazia" });
    }

    const ctx = await retrieve(question, 3);
    const bestScore = ctx[0]?.score ?? 0;

    if (ctx.length === 0 || bestScore < MIN_SCORE) {
      return res.json({
        ok: true,
        answer: "Eu só consigo responder com base nos documentos carregados.",
        sources: [],
        meta: { bestScore, minScore: MIN_SCORE }
      });
    }

    const docs = ctx.map(c => `[Fonte: ${c.source} | score: ${c.score.toFixed(3)}]\n${c.text}`);
    const prompt = buildPrompt(question, docs);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2
    });

    res.json({
      ok: true,
      answer: completion.choices[0].message.content ?? "",
      sources: ctx.map(c => ({
        source: c.source,
        score: c.score,
        preview: c.text.slice(0, 180) + "..."
      })),
      meta: { bestScore, minScore: MIN_SCORE }
    });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: "Erro ao processar pergunta" });
  }
});

app.listen(3001, () => {
  console.log("✅ Backend API rodando em http://localhost:3001");
});