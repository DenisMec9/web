import { getCollection } from "./store";
import { embed } from "../llm/openai";

export async function retrieve(question: string) {
  const collection = await getCollection();
  const qEmb = await embed(question);

  const res = await collection.query({
    queryEmbeddings: [qEmb],
    nResults: 3
  });

  return res.documents?.[0] || [];
}
