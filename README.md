🤖 FAQ Bot com RAG (Node.js + TypeScript + Next.js)

Um FAQ Bot inteligente que utiliza o conceito de **RAG (Retrieval-Augmented Generation)** para responder perguntas **exclusivamente com base em documentos locais**.  
O projeto conta com backend em Node.js, integração com OpenAI, armazenamento vetorial local e uma **interface web estilo chat** para interação em tempo real.

O foco do projeto é demonstrar, de forma prática, a construção de um sistema de RAG **sem frameworks prontos como LangChain**, priorizando entendimento de arquitetura, embeddings, similaridade semântica e construção manual de prompts.

---

🚀 Funcionalidades

- Indexação de documentos locais (`.txt`)
- Geração de embeddings utilizando OpenAI
- Busca por similaridade semântica (Cosine Similarity)
- Recuperação de contexto relevante (RAG)
- Construção manual de prompt com contexto recuperado
- Interface web estilo chat
- Reindexação de documentos via interface
- Interface CLI para uso via terminal
- Separação clara entre backend e frontend
- Gerenciamento seguro de variáveis de ambiente

---

🛠️ Tecnologias Utilizadas

Backend:
- Node.js
- TypeScript
- Express
- OpenAI API
- Implementação manual de RAG

Frontend:
- Next.js (App Router)
- React
- Tailwind CSS

---

📦 Pré-requisitos

Antes de começar, você precisará de:

- Node.js instalado (versão 18+ recomendada)
- Uma API Key válida da OpenAI

---

⚙️ Instalação e Configuração

Siga os passos abaixo para rodar o projeto localmente.

1. Clone o repositório
```bash
git clone https://github.com/SEU_USUARIO/faq-bot-rag.git
cd faq-bot-rag
Instale as dependências do backend

bash
Copiar código
npm install
Configure as variáveis de ambiente
Crie um arquivo .env na raiz do projeto e adicione sua chave da OpenAI:

env
Copiar código
OPENAI_API_KEY=sk-sua-chave-aqui
⚠️ O arquivo .env não deve ser versionado.

▶️ Como rodar o projeto

Rodar o backend (API)

bash
Copiar código
npx ts-node src/server.ts
A API ficará disponível em:

arduino
Copiar código
http://localhost:3001
Rodar o frontend (interface web)

bash
Copiar código
cd web
npm install
npm run dev
A aplicação ficará disponível em:

arduino
Copiar código
http://localhost:3000
💬 Como usar

Adicione arquivos .txt na pasta docs/

Acesse a interface web

Clique no botão Reindexar

Faça perguntas relacionadas ao conteúdo dos documentos

Exemplo:

arduino
Copiar código
Qual o horário de gravação do podcast?
🖥️ Uso via Terminal (CLI)

Indexar documentos:

bash
Copiar código
npx ts-node src/cli.ts ingest
Fazer uma pergunta:

bash
Copiar código
npx ts-node src/cli.ts ask "Sua pergunta aqui"
📁 Estrutura do Projeto

php
Copiar código
faq-bot/
├── src/                    # Backend (Node.js + TypeScript)
│   ├── ingest/             # Leitura e chunking dos documentos
│   ├── llm/                # Integração com OpenAI
│   ├── rag/                # Similaridade e armazenamento vetorial
│   ├── cli.ts              # Interface via terminal
│   └── server.ts           # API HTTP (Express)
│
├── docs/                   # Documentos utilizados pelo bot
├── data/                   # Índice vetorial local (ignorado no git)
│
├── web/                    # Frontend (Next.js)
│   ├── app/
│   └── public/
│
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
🧠 Como funciona (Deep Dive)

O funcionamento do bot segue o fluxo clássico de RAG:

Os documentos são carregados e divididos em pequenos blocos de texto (chunks)

Cada chunk é convertido em embedding

As embeddings são armazenadas localmente

A pergunta do usuário também é convertida em embedding

É realizada uma busca por similaridade semântica

Os trechos mais relevantes são selecionados como contexto

Um prompt é construído manualmente com esse contexto

A resposta é gerada pelo modelo de linguagem com base apenas nos dados recuperados

💡 Por que RAG manual?

A implementação manual do RAG permite:

Entendimento profundo de embeddings

Controle total da lógica de recuperação

Evitar dependência de abstrações prontas

Facilitar evolução futura do projeto


