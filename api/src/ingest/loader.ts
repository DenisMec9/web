import fs from "fs";
import path from "path";
import * as pdfParse from "pdf-parse";

type LoadedDoc = {
  id: string;
  source: string;
  text: string;
};

export async function loadFiles(dirName: string): Promise<LoadedDoc[]> {
  const dirPath = path.resolve(dirName);
  
  if (!fs.existsSync(dirPath)) {
    console.log(`⚠️ Pasta não encontrada: ${dirPath}`);
    return [];
  }

  const files = fs.readdirSync(dirPath);
  const loadedDocs: LoadedDoc[] = [];

  for (const f of files) {
    const filePath = path.join(dirPath, f);
    const extension = path.extname(f).toLowerCase();

    // Tratamento para arquivos de TEXTO
    if (extension === ".txt") {
      const text = fs.readFileSync(filePath, "utf-8");
      loadedDocs.push({ id: f, source: f, text });
    }

    // Tratamento para arquivos PDF
    else if (extension === ".pdf") {
      try {
        const buffer = fs.readFileSync(filePath);
        
        // Uso do pdf-parse com cast para contornar problemas de tipagem CommonJS/ESM
        const data = await (pdfParse as unknown as any)(buffer);

        if (data?.text) {
          loadedDocs.push({
            id: f,
            source: f,
            text: data.text,
          });
        }
      } catch (err) {
        console.error(`❌ Erro ao ler o PDF ${f}:`, err);
      }
    }
  }

  return loadedDocs;
}