import fs from "fs";
import path from "path";

export type StoredChunk = {
  id: string;
  source: string;
  text: string;
  embedding: number[];
};

const INDEX_PATH = path.join("data", "index.json");

export function loadIndex(): StoredChunk[] {
  if (!fs.existsSync(INDEX_PATH)) return [];
  return JSON.parse(fs.readFileSync(INDEX_PATH, "utf-8"));
}

export function saveIndex(items: StoredChunk[]) {
  fs.writeFileSync(INDEX_PATH, JSON.stringify(items, null, 2), "utf-8");
}
