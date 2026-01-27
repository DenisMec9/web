"use client";

import { useState } from "react";

type UploadResponse =
  | { ok: true; file: string; message: string }
  | { ok: false; error: string };

type UploadBoxProps = {
  apiBase: string;
  disabled?: boolean;
  onUploadedMessage?: (msg: string) => void;
};

export default function UploadBox({
  apiBase,
  disabled = false,
  onUploadedMessage
}: UploadBoxProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  async function handleUpload() {
    if (!file || uploading || disabled) return;

    setUploading(true);

    try {
      const form = new FormData();
      form.append("file", file); // 🔑 TEM que ser "file"

      console.log("API BASE:", apiBase);


      const res = await fetch(`${apiBase}/upload`, {
        method: "POST",
        body: form
      });

      const text = await res.text();

      let data: UploadResponse;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Servidor retornou resposta inválida (não é JSON)");
      }

      if (!data.ok) {
        throw new Error(data.error || "Falha no upload");
      }

      onUploadedMessage?.(
        `✅ Arquivo "${file.name}" enviado com sucesso! Agora clique em "Reindexar" para o chat aprender.`
      );

      setFile(null);
    } catch (err: any) {
      onUploadedMessage?.(
        `❌ Erro no upload: ${err?.message ?? "erro desconhecido"}`
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="border border-zinc-800 rounded-2xl p-3 bg-zinc-950/30">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-zinc-200">
            Upload de documento
          </div>
          <div className="text-xs text-zinc-400">
            Envie um arquivo .txt ou .pdf
          </div>
        </div>

        <button
          onClick={handleUpload}
          disabled={!file || uploading || disabled}
          className="shrink-0 px-3 py-2 rounded-xl bg-white text-black text-sm font-medium disabled:opacity-60"
        >
          {uploading ? "Enviando..." : "Enviar"}
        </button>
      </div>

      <div className="mt-3">
        <input
          type="file"
          accept=".txt,.pdf"
          onChange={e => setFile(e.target.files?.[0] ?? null)}
          className="text-sm text-zinc-400"
          disabled={uploading || disabled}
        />
      </div>
    </div>
  );
}
