import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Standard express app initialization
const app = express();
app.use(express.json());

const PORT = 3000;

// Lazy client setup to prevent startup crashes if GEMINI_API_KEY is missing
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
    throw new Error("GEMINI_API_KEY is missing. Configure it in Settings > Secrets to enable active AI generation.");
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

// Fallback high-quality template database for immediate use/demo if API key is not yet set
const SYSTEM_TEMPLATES = [
  {
    name: "Agendamento Inteligente Pro",
    tagline: "SaaS de agendamento de consultas com triagem automática por IA",
    description: "Uma plataforma focada em clínicas de saúde e serviços recorrentes, fornecendo agendamento interativo com análise de sintomas inicial por IA para direcionamento de especialistas.",
    techStack: {
      frontend: ["React 19", "Vite", "Tailwind CSS", "Lucide Icons", "Motion (Animações)"],
      backend: ["Express.js", "Node.js (TypeScript)"],
      database: ["Firebase Firestore", "SQLite (Local Dev)"],
      aiTools: ["Gemini 3.5 Flash", "@google/genai SDK"]
    },
    modules: [
      {
        name: "Módulo 1: Visualizador de Agenda & Calendário",
        description: "Calendário interativo moderno com drag-and-drop para reserva e bloqueio de slots horários.",
        files: ["src/components/CalendarView.tsx", "src/hooks/useAppointments.ts", "src/types.ts"]
      },
      {
        name: "Módulo 2: Assistente de Triagem de Sintomas",
        description: "Chatbot de IA que interage amigavelmente com o paciente, mapeando queixas principais em formato estruturado antes de confirmar o agendamento.",
        files: ["src/components/TriagemChat.tsx", "src/services/aiSymptomAnalyzer.ts"]
      },
      {
        name: "Módulo 3: Painel de Controle de Especialistas",
        description: "Portal administrativo exibindo dashboards de ocupação, taxas de comparecimento e relatórios gerenciais.",
        files: ["src/components/DashboardStats.tsx", "src/components/SpecialistPanel.tsx"]
      }
    ],
    structuralPrompts: {
      systemInstruction: "Você é o Engenheiro de Software Sênior na AI SaaS Factory. Sua missão é estruturar os endpoints do calendário de reservas e a integração do chatbot utilizando o SDK oficial @google/genai no modelo 'gemini-3.5-flash'. Retorne respostas estritamente no formato de esquema pré-definido.",
      uiPrompt: "Desenhe uma interface clean do tipo 'Dashboard Médico', dominada por tons de azul cobalto e cinza alpino com bastante espaço negativo. Utilize grids responsivos para o calendário (`sm:grid-cols-1 md:grid-cols-7`). Adicione transições suaves do pacote `motion` ao alternar os meses do ano.",
      databaseSchema: "{\n  \"collections\": {\n    \"appointments\": {\n      \"id\": \"string\",\n      \"specialistId\": \"string\",\n      \"patientName\": \"string\",\n      \"dateTime\": \"timestamp\",\n      \"symptomsSummary\": \"string\",\n      \"estimatedUrgency\": \"LOW | MEDIUM | HIGH\"\n    },\n    \"specialists\": {\n      \"id\": \"string\",\n      \"name\": \"string\",\n      \"specialty\": \"string\",\n      \"availability\": \"array\"\n    }\n  }\n}",
      testsPrompt: "Escreva suites de teste usando Vitest para validar: 1) Se um agendamento colide com horários previamente reservados; 2) Se o chatbot de triagem lança erros claros quando a resposta do modelo `@google/genai` vier instável."
    },
    githubActions: "name: Deploy AI App\non:\n  push:\n    branches: [ main ]\njobs:\n  build-and-deploy:\n    runs-on: ubuntu-latest\n    steps:\n    - name: Checkout code\n      uses: actions/checkout@v4\n    - name: Use Node.js\n      uses: actions/setup-node@v4\n      with:\n        node-version: '20'\n    - name: Install Dependencies\n      run: npm install\n    - name: Run Code Linter\n      run: npm run lint\n    - name: Compile and Bundle\n      run: npm run build\n    - name: Register Service to Cloud Run\n      run: echo 'Deploying system container directly...'"
  },
  {
    name: "Finanças de Freelancer",
    tagline: "Controle financeiro com classificação inteligente de despesas",
    description: "Painel minimalista de conciliação bancária que analisa extratos exportados (como CSV/PDF) e automatiza o cálculo de previsão de impostos e classificação de categoria fiscal.",
    techStack: {
      frontend: ["React 19", "Recharts (Visualização)", "Tailwind CSS", "Lucide Icons"],
      backend: ["Express.js", "Node.js (TypeScript)"],
      database: ["SQLite com Prisma ORM", "Local State Cache"],
      aiTools: ["Gemini 3.5 Flash", "@google/genai SDK"]
    },
    modules: [
      {
        name: "Módulo 1: Parser Multi-Formato & Upload",
        description: "Mecanismo de drag-and-drop para arrastar extratos e processá-los estruturadamente utilizando regex e visão computacional.",
        files: ["src/components/StatementUpload.tsx", "src/services/statementParser.ts"]
      },
      {
        name: "Módulo 2: Painel Gráfico de Evolução de Caixa",
        description: "Dashboards interativos utilizando Recharts demonstrando receita líquida, custos recorrentes e provisão tributária.",
        files: ["src/components/FinanceCharts.tsx", "src/components/CashFlowDashboard.tsx"]
      },
      {
        name: "Módulo 3: Inteligência Tributária (Impostos)",
        description: "Motor de inteligência artificial que lê as descrições das faturas e categoriza em deduções fiscais aceitas.",
        files: ["src/services/taxCategorizer.ts", "src/hooks/useTaxProjections.ts"]
      }
    ],
    structuralPrompts: {
      systemInstruction: "Atue como auditor fiscal assistido por IA. Escreva utilitários em server/tax.ts para receber faturas de exportação, extraindo valores monetários brutos e aplicando regras locais de imposto.",
      uiPrompt: "Desenhe uma interface com vibe fintech - fundo off-white minimalista, tipografia mono para dados numéricos (JetBrains Mono) e tons verdes de destaque (#059669). O fluxo de caixa principal deve ocupar largura total com uma perspectiva fluida.",
      databaseSchema: "{\n  \"tables\": {\n    \"transactions\": {\n      \"id\": \"string (UUID)\",\n      \"date\": \"ISO DATEString\",\n      \"description\": \"string\",\n      \"amount\": \"float\",\n      \"category\": \"string\",\n      \"isDeductible\": \"boolean\"\n    }\n  }\n}",
      testsPrompt: "Implemente testes unitários em Jest para garantir que valores numéricos negativos sejam lidos corretamente como despesas, e que a conversão base64 de arquivos PDF de faturas não cause vazamento de memória do Node."
    },
    githubActions: "name: CI/CD Pipeline\non:\n  push:\n    branches: [ main ]\njobs:\n  tests:\n    runs-on: ubuntu-latest\n    steps:\n    - uses: actions/checkout@v4\n    - uses: actions/setup-node@v4\n      with:\n        node-version: 18\n    - run: npm ci\n    - run: npm test\n    - run: npm run build"
  }
];

// POST /api/generate-saas -> Real implementation calling GoogleGenAI
app.post("/api/generate-saas", async (req, res) => {
  try {
    const { idea } = req.body;
    if (!idea || typeof idea !== "string" || idea.trim() === "") {
      return res.status(400).json({ error: "Sua ideia ou conceito de SaaS não pode estar vazia." });
    }

    let ai;
    try {
      ai = getGeminiClient();
    } catch (err: any) {
      // If the actual API key is missing, return a informative custom prompt fallback response or error
      return res.status(401).json({ 
        error: err.message,
        isFallbackAvailable: true,
        fallbackSuggestions: SYSTEM_TEMPLATES.map(t => ({ name: t.name, tagline: t.tagline }))
      });
    }

    const systemPrompt = `Você é um Arquiteto de Software e Engenheiro de IA Sênior na 'AI SaaS Factory'.
O usuário fornecerá um conceito de Micro-SaaS ou aplicação web corporativa.
Sua missão é gerar um plano arquitetural completo estruturado em JSON estrito contendo:
- Nome ideal para o SaaS (curto, amigável)
- Um slogan impactante (tagline)
- Uma descrição detalhada e realista
- Uma pilha de tecnologia moderna ('techStack' com frontend, backend, database, aiTools)
- Módulos ou divisões de componentes de código principais com seus respectivos arquivos de desenvolvimento planejados
- Prompts de engenharia estrutural prontos para alimentar geradores automáticos de código (incluindo diretiva de sistema para backend, prompt de layout-UI p/ frontend, modelo de esquema de banco de dados, e requisitos de teste contínuo)
- Um arquivo sugestivo editado de pipeline GitHub Actions (.github/workflows/deploy.yml)

Retorne EXCLUSIVAMENTE o objeto JSON correspondente, sem explicações em markdown antes ou depois. Use o idioma Português do Brasil para todas as descrições.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Conceito do SaaS fornecido pelo usuário:\n"${idea}"`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "Nome moderno e comercial para o SaaS." },
            tagline: { type: Type.STRING, description: "Slogan motivador e funcional (máximo 12 palavras)." },
            description: { type: Type.STRING, description: "Descrição de 2 a 3 frases explicando o propósito e valor do SaaS." },
            techStack: {
              type: Type.OBJECT,
              properties: {
                frontend: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Bibliotecas de interface utilizadas." },
                backend: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Ambiente e frameworks de backend." },
                database: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Solução de banco de dados selecionada." },
                aiTools: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Soluções de Inteligência Artificial e SDKs." }
              },
              required: ["frontend", "backend", "database", "aiTools"]
            },
            modules: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "Nome do módulo estratégico de negócio." },
                  description: { type: Type.STRING, description: "Explicação breve do que esse módulo codifica e implementa." },
                  files: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Arquivos recomendados para esse módulo no projeto." }
                },
                required: ["name", "description", "files"]
              },
              description: "Grid com exatamente 3 módulos que organizam a arquitetura lógica do projeto."
            },
            structuralPrompts: {
              type: Type.OBJECT,
              properties: {
                systemInstruction: { type: Type.STRING, description: "Instruções de comportamento de IA para programar o backend/regras de negócio do SaaS." },
                uiPrompt: { type: Type.STRING, description: "Prompt detalhado explicando o layout, cores, grids e micro-interações do frontend." },
                databaseSchema: { type: Type.STRING, description: "Documentação do esquema de dados ou tabelas recomentadas no formato JSON ou SQL." },
                testsPrompt: { type: Type.STRING, description: "Prompt e cenários para implementar testes automatizados e validação contínua." }
              },
              required: ["systemInstruction", "uiPrompt", "databaseSchema", "testsPrompt"]
            },
            githubActions: { type: Type.STRING, description: "Script yaml de integração e entrega contínua (.github/workflows/deploy.yml)." }
          },
          required: ["name", "tagline", "description", "techStack", "modules", "structuralPrompts", "githubActions"]
        }
      }
    });

    const outputText = response.text;
    if (!outputText) {
      throw new Error("Não foi possível gerar dados de retorno a partir da inteligência artificial.");
    }

    const saasData = JSON.parse(outputText.trim());
    return res.json({ success: true, saas: saasData });

  } catch (error: any) {
    console.error("Erro na rota /api/generate-saas:", error);
    return res.status(500).json({ error: error.message || "Erro desconhecido ao processar sua proposta." });
  }
});

// GET /api/templates -> Returns fallback templates for clients to pre-populate or use immediately
app.get("/api/templates", (req, res) => {
  res.json({ templates: SYSTEM_TEMPLATES });
});

// Check if there is active API key configured
app.get("/api/config-status", (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const hasKey = !!(apiKey && apiKey !== "MY_GEMINI_API_KEY" && apiKey.trim() !== "");
  res.json({ hasAPIKey: hasKey });
});

// Serve static assets or mount Vite Developer server
async function configureServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite Developer Middleware montado com sucesso.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Servindo arquivos de produção estáticos de dist/.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AI SaaS Factory rodando em http://localhost:${PORT}`);
  });
}

configureServer();
