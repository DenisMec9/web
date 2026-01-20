import "dotenv/config";
import express from "express";
import cors from "cors";

import { loadTextFiles } from "./ingest/loader";
import { chunkText } from "./ingest/chunker";
import { embed, openai } from "./llm/openai";
import { buildPrompt } from "./llm/prompt";
import { cosineSimilarity } from "./rag/similarity";
import { loadIndex, saveIndex, StoredChunk } from "./rag/localStore";

const app = express();
app.use(cors());
app.use(express.json());

async function ingestDocs() {
  const docs = loadTextFiles("docs");
  const index: StoredChunk[] = [];

  for (const d of docs) {
    const chunks = chunkText(d.text);
    for (let i = 0; i < chunks.length; i++) {
      const text = chunks[i];
      const embedding = await embed(text);
      index.push({ id: `${d.id}-${i}`, source: d.source, text, embedding });
    }
  }

  saveIndex(index);
  return { chunks: index.length };
}

async function retrieve(question: string, topK = 3) {
  const index = loadIndex();
  if (index.length === 0) return [];

  const qEmb = await embed(question);

  const ranked = index
    .map(item => ({ item, score: cosineSimilarity(qEmb, item.embedding) }))
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
    res.status(500).json({ ok: false, error: e?.message ?? "erro" });
  }
});

app.post("/ask", async (req, res) => {
  try {
    const question = String(req.body?.question ?? "").trim();
    if (!question) return res.status(400).json({ ok: false, error: "question vazia" });

    const ctx = await retrieve(question, 3);
    const bestScore = ctx[0]?.score ?? 0;

    if (bestScore < 0.25) {
      return res.json({ ok: true, answer: "Não encontrei essa informação nos documentos.", sources: [] });
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
      sources: ctx.map(c => ({ source: c.source, score: c.score }))
    });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message ?? "erro" });
  }
});

app.listen(3001, () => console.log("✅ Backend API: http://localhost:3001"));
