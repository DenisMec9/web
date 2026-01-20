import "dotenv/config";
import { loadTextFiles } from "./ingest/loader";
import { chunkText } from "./ingest/chunker";
import { embed, openai } from "./llm/openai";
import { buildPrompt } from "./llm/prompt";
import { cosineSimilarity } from "./rag/similarity";
import { loadIndex, saveIndex, StoredChunk } from "./rag/localStore";

async function ingest() {
  const docs = loadTextFiles("docs");
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
  console.log(`✅ Documentos indexados localmente: ${index.length} chunk(s)`);
}

async function retrieve(question: string, topK = 3) {
  const index = loadIndex();
  if (index.length === 0) {
    throw new Error("Index vazio. Rode: npx ts-node src/cli.ts ingest");
  }

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

async function ask(question: string) {
  const ctx = await retrieve(question, 3);

  // filtro simples anti “alucinação”:
  // se as similaridades forem baixas, diz que não achou
  const bestScore = ctx[0]?.score ?? 0;
  if (bestScore < 0.25) {
    console.log("\nNão encontrei essa informação nos documentos.\n");
    return;
  }

  const docs = ctx.map(c => `[Fonte: ${c.source} | score: ${c.score.toFixed(3)}]\n${c.text}`);
  const prompt = buildPrompt(question, docs);

  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.2
  });

  console.log("\n" + res.choices[0].message.content + "\n");
}

const [, , cmd, ...args] = process.argv;

if (cmd === "ingest") ingest();
else if (cmd === "ask") ask(args.join(" "));
else {
  console.log(`Uso:
  npx ts-node src/cli.ts ingest
  npx ts-node src/cli.ts ask "sua pergunta"
`);
}
