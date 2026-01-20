import fs from "fs";
import path from "path";

export function loadTextFiles(dir: string) {
  const files = fs.readdirSync(dir);

  return files
    .filter(f => f.endsWith(".txt"))
    .map(f => ({
      id: f,
      source: f,
      text: fs.readFileSync(path.join(dir, f), "utf-8")
    }));
}
