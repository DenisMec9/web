import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = Router();

// Define o caminho absoluto para a pasta 'docs'
const docsDir = path.resolve("docs");

// Cria a pasta docs se ela não existir
if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true });
}

// Configuração de armazenamento para manter o nome original
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, docsDir);
  },
  filename: (req, file, cb) => {
    // Mantém o nome original para que o loader (.txt) funcione
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } 
});

router.post("/", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ ok: false, error: "Nenhum arquivo enviado" });
  }

  res.json({
    ok: true,
    file: req.file.filename,
    message: "Arquivo recebido com sucesso em /docs."
  });
});

export default router;