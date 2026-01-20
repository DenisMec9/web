export function buildPrompt(question: string, docs: string[]) {
  return `
Responda SOMENTE usando os textos abaixo.
Se não souber, diga: "Não encontrei essa informação nos documentos."

Pergunta:
${question}

Documentos:
${docs.join("\n---\n")}
`;
}
