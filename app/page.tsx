"use client";

import { useMemo, useState } from "react";
import UploadBox from "./components/UploadBox";

type Msg = {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  meta?: {
    bestScore?: number;
    minScore?: number;
  };
};

type Source = {
  source: string;
  score: number;
  preview?: string;
};

type AskResponse =
  | {
      ok: true;
      answer: string;
      sources: Source[];
      meta?: { bestScore?: number; minScore?: number };
    }
  | { ok: false; error: string };

type IngestResponse =
  | { ok: true; chunks: number }
  | { ok: false; error: string };

export default function Page() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Oi! Eu respondo apenas com base nos documentos carregados (docs + uploads). " +
        "Se não houver contexto suficiente, eu vou recusar."
    }
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Ajuste aqui se você mudar a porta/host do backend
  const API_BASE = useMemo(() => "http://localhost:3001", []);

  function pushSystemMessage(content: string) {
    setMessages(prev => [...prev, { role: "assistant", content }]);
  }

  async function reindex() {
    if (loading) return;
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/ingest`, { method: "POST" });
      const data = (await res.json()) as IngestResponse;

      pushSystemMessage(
        data.ok
          ? `✅ Index atualizado com sucesso. Total de chunks: ${data.chunks}.`
          : `❌ Falha ao indexar: ${data.error}`
      );
    } catch (e: any) {
      pushSystemMessage(`❌ Falha ao indexar: ${e?.message ?? "erro desconhecido"}`);
    } finally {
      setLoading(false);
    }
  }

  async function send() {
    const q = input.trim();
    if (!q || loading) return;

    setInput("");
    setLoading(true);

    setMessages(prev => [...prev, { role: "user", content: q }]);

    try {
      const res = await fetch(`${API_BASE}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q })
      });

      const data = (await res.json()) as AskResponse;

      if (!data.ok) throw new Error(data.error || "Erro");

      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: data.answer,
          sources: data.sources,
          meta: data.meta
        }
      ]);
    } catch (e: any) {
      pushSystemMessage(`❌ Erro: ${e?.message ?? "desconhecido"}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-zinc-900/60 border border-zinc-800 rounded-2xl shadow p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h1 className="text-lg font-semibold">Document Assistant (RAG)</h1>
            <p className="text-sm text-zinc-400">
              Este chat responde <span className="text-zinc-200">somente</span>{" "}
              com base nos documentos carregados (pasta{" "}
              <code className="text-zinc-200">/docs</code> + uploads).
              Se não houver contexto suficiente, ele vai recusar.
            </p>
          </div>

          <button
            onClick={reindex}
            disabled={loading}
            className="shrink-0 text-sm px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 disabled:opacity-60"
            title="Reindexa os documentos da pasta /docs"
          >
            Reindexar
          </button>
        </div>

        {/* Upload */}
        <div className="mb-3">
          <UploadBox
            apiBase={API_BASE}
            disabled={loading}
            onUploadedMessage={(msg) => pushSystemMessage(msg)}
          />
        </div>

        {/* Chat */}
        <div className="h-[54vh] overflow-y-auto space-y-3 pr-1">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`p-3 rounded-2xl border ${
                m.role === "user"
                  ? "bg-zinc-800/70 border-zinc-700 ml-10"
                  : "bg-zinc-950/40 border-zinc-800 mr-10"
              }`}
            >
              <div className="text-xs text-zinc-400 mb-1">
                {m.role === "user" ? "Você" : "Assistente"}
              </div>

              <div className="whitespace-pre-wrap leading-relaxed">
                {m.content}
              </div>

              {/* Fontes */}
              {m.role === "assistant" && m.sources && (
                <SourcesBlock sources={m.sources} meta={m.meta} />
              )}
            </div>
          ))}

          {loading && (
            <div className="p-3 rounded-2xl border bg-zinc-950/40 border-zinc-800 mr-10 text-zinc-400">
              Digitando...
            </div>
          )}
        </div>

        {/* Input */}
        <div className="mt-3 flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter") send();
            }}
            placeholder="Pergunte algo sobre os documentos carregados..."
            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 outline-none focus:border-zinc-600"
          />
          <button
            onClick={send}
            className="px-4 py-2 rounded-xl bg-white text-black font-medium disabled:opacity-60"
            disabled={loading}
          >
            Enviar
          </button>
        </div>

        {/* Footer hint */}
        <p className="text-xs text-zinc-500 mt-2">
          Dica: você pode enviar <code className="text-zinc-200">.txt</code> pelo upload,
          ou colocar arquivos em <code className="text-zinc-200">/docs</code> e clicar em{" "}
          <span className="text-zinc-200">Reindexar</span>.
        </p>
      </div>
    </main>
  );
}

function SourcesBlock({
  sources,
  meta
}: {
  sources: Source[];
  meta?: { bestScore?: number; minScore?: number };
}) {
  if (!sources || sources.length === 0) {
    const best = meta?.bestScore;
    const min = meta?.minScore;

    return (
      <div className="mt-3 border-t border-zinc-800 pt-3">
        <div className="text-xs text-zinc-400">
          Sem fontes (sem contexto suficiente nos documentos).
          {typeof best === "number" && typeof min === "number" ? (
            <span className="ml-2 text-zinc-500">
              (bestScore: {best.toFixed(3)} | minScore: {min.toFixed(3)})
            </span>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 border-t border-zinc-800 pt-3">
      <div className="text-xs text-zinc-400 mb-2">Fontes utilizadas</div>

      <div className="space-y-2">
        {sources.map((s, idx) => (
          <div
            key={`${s.source}-${idx}`}
            className="rounded-xl border border-zinc-800 bg-zinc-950/30 p-2"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm text-zinc-200 truncate">
                {idx + 1}. {s.source}
              </div>

              <div className="text-xs text-zinc-400 shrink-0">
                confiança:{" "}
                <span className="text-zinc-200">{s.score.toFixed(3)}</span>
              </div>
            </div>

            {s.preview ? (
              <div className="text-xs text-zinc-400 mt-1 whitespace-pre-wrap">
                {s.preview}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
