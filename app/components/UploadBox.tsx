"use client";

import { useState } from "react";

type UploadResponse =
  | { ok: true; file: string; chunks: number }
  | { ok: false; error: string };

export default function UploadBox({
  apiBase,
  disabled,
  onUploadedMessage
}: {
  apiBase: string;
  disabled?: boolean;
  onUploadedMessage?: (msg: string) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  async function upload() {
    if (!file || uploading || disabled) return;

    setUploading(true);

    try {
      const form = new FormData();
      form.append("file", file);

      const res = await fetch(`${apiBase}/upload`, {
        method: "POST",
        body: form
      });

      const data = (await res.json()) as UploadResponse;

      if (!data.ok) throw new Error(data.error || "Falha no upload");

      onUploadedMessage?.(`✅ Upload indexado: "${data.file}" (${data.chunks} chunks).`);

      setFile(null);
    } catch (e: any) {
      onUploadedMessage?.(`❌ Upload falhou: ${e?.message ?? "erro desconhecido"}`);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="border border-zinc-800 rounded-2xl p-3 bg-zinc-950/30">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-zinc-200">Upload de documento</div>
          <div className="text-xs text-zinc-400">
            Envie um <code className="text-zinc-200">.txt</code> para indexar e usar no chat.
          </div>
        </div>

        <button
          onClick={upload}
          disabled={!file || uploading || disabled}
          className="shrink-0 px-3 py-2 rounded-xl bg-white text-black text-sm font-medium disabled:opacity-60"
          title="Envia e indexa o arquivo enviado"
        >
          {uploading ? "Enviando..." : "Enviar"}
        </button>
      </div>

      <div className="mt-3">
        <input
          type="file"
          accept=".txt"
          onChange={e => setFile(e.target.files?.[0] ?? null)}
          className="text-sm text-zinc-400"
          disabled={uploading || disabled}
        />
      </div>

      <div className="mt-2 text-xs text-zinc-500">
        Obs: por enquanto aceitamos somente <span className="text-zinc-200">.txt</span>. (PDF é próximo passo)
      </div>
    </div>
  );
}
