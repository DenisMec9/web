import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = Router();

// garante que a pasta uploads exista
const uploadDir = path.resolve("uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage });

router.post("/", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ ok: false, error: "Nenhum arquivo enviado" });
  }

  return res.json({
    ok: true,
    file: req.file.originalname
  });
});

export default router;
