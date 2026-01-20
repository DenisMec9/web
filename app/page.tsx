"use client";

import { useState } from "react";

type Msg = { role: "user" | "assistant"; content: string };

export default function Page() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Oi! Pergunta algo sobre os documentos 😊" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function send() {
    const q = input.trim();
    if (!q || loading) return;

    setInput("");
    setLoading(true);

    setMessages(prev => [...prev, { role: "user", content: q }]);

    try {
      const res = await fetch("http://localhost:3001/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q })
      });

      const data = await res.json();

      if (!data.ok) throw new Error(data.error || "Erro");

      setMessages(prev => [...prev, { role: "assistant", content: data.answer }]);
    } catch (e: any) {
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: `Deu erro: ${e?.message ?? "desconhecido"}` }
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-zinc-900/60 border border-zinc-800 rounded-2xl shadow p-4">
        <div className="flex items-center justify-between gap-2 mb-3">
          <h1 className="text-lg font-semibold">FAQ Bot</h1>
          <button
            onClick={async () => {
              setLoading(true);
              try {
                const res = await fetch("http://localhost:3001/ingest", { method: "POST" });
                const data = await res.json();
                setMessages(prev => [
                  ...prev,
                  { role: "assistant", content: data.ok ? `Index atualizado: ${data.chunks} chunks.` : `Erro: ${data.error}` }
                ]);
              } finally {
                setLoading(false);
              }
            }}
            className="text-sm px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700"
          >
            Reindexar
          </button>
        </div>

        <div className="h-[55vh] overflow-y-auto space-y-3 pr-1">
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
                {m.role === "user" ? "Você" : "Bot"}
              </div>
              <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
            </div>
          ))}
          {loading && (
            <div className="p-3 rounded-2xl border bg-zinc-950/40 border-zinc-800 mr-10 text-zinc-400">
              Digitando...
            </div>
          )}
        </div>

        <div className="mt-3 flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter") send();
            }}
            placeholder="Digite sua pergunta..."
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
      </div>
    </main>
  );
}
