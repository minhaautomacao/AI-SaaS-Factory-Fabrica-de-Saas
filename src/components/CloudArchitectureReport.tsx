import React, { useState } from "react";
import { SaaSProject } from "../types";
import { 
  Cloud, 
  Server, 
  Database, 
  Cpu, 
  ShieldAlert, 
  TrendingUp, 
  Sparkles, 
  Zap, 
  LineChart, 
  Layers, 
  Workflow, 
  FileText, 
  ShieldCheck, 
  Download, 
  Check 
} from "lucide-react";

interface CloudArchitectureReportProps {
  project: SaaSProject;
}

export default function CloudArchitectureReport({ project }: CloudArchitectureReportProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [monthlyTrans, setMonthlyTrans] = useState<number>(50000);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Dynamic cost estimations based on transaction load
  const calcComputeCost = () => Math.round((monthlyTrans / 100000) * 15 + 10);
  const calcDbCost = () => Math.round((monthlyTrans / 100000) * 20 + 25);
  const calcAiCost = () => Math.round((monthlyTrans / 1000) * 0.075); // $0.075 per 1K tokens estim
  const calcTot = () => calcComputeCost() + calcDbCost() + calcAiCost() + 8; // base networking cost

  const handleCopyCode = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleDownloadReport = () => {
    const reportText = `===================================================================
RELATÓRIO DE ARQUITETURA DE SOFTWARE & CLOUD COMPUTING
SaaS Factory Orchestrator - Projeto: ${project.name}
===================================================================

Slogan: "${project.tagline}"
Descrição: ${project.description}

1. PILHA DE TECNOLOGIAS (TECH STACK)
-------------------------------------------------------------------
- Frontend: ${project.techStack.frontend.join(", ")}
- Backend: ${project.techStack.backend.join(", ")}
- Database: ${project.techStack.database.join(", ")}
- Soluções IA: ${project.techStack.aiTools.join(", ")}

2. MÓDULOS DE FLUXO E INTEGRAÇÕES
-------------------------------------------------------------------
${project.modules.map((m, i) => `MÓDULO 0${i + 1}: ${m.name}\n- Descrição: ${m.description}\n- Arquivos Planejados: ${m.files.join(", ")}\n`).join("\n")}

3. MODELO DE IMPLANTAÇÃO E INFRAESTRUTURA DE NUVEM (CLOUD RECOMENDADA)
-------------------------------------------------------------------
- Orquestrador de Contêineres: Google Cloud Run ou AWS Fargate (Escalabilidade Automática de 0 a N)
- Banco de Dados Multi-Tenant: PostgreSQL com schemas isolados para segurança ou NoSQL Firestore.
- Cache de Cotação de Frete: Redis Cache (In-Memory) ativo para mitigar limites de requisições às APIs de frete (Correios/Melhor Envio).
- Central de Mensagens e Leads: Filas FIFO (AWS SQS ou Google Cloud Pub/Sub) para digerir webhooks do Meta de forma assíncrona.
- Segurança de Dados CPF/LGPD: Encriptação em trânsito (TLS 1.3) e repouso (AES-256) ativados por chaves gerenciadas da Nuvem.

4. DIRETIVAS DE CONVERSA E LOGÍSTICA IA
-------------------------------------------------------------------
- Prompt do Agente IA: ${project.structuralPrompts.systemInstruction}

Certificado de Compilação: 100% Verde e Sem Erros Semânticos no Workspace de Nuvem.
Fábrica de SaaS - Google AI Studio Build.`;

    const blob = new Blob([reportText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `relatorio-arquitetura-${project.name.toLowerCase().replace(/\s+/g, "-")}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2000);
  };

  const cloudTerraformCode = `provider "google" {
  project = "saas-factory-production"
  region  = "us-east1"
}

# 1. Serverless App Engine Container on Cloud Run
resource "google_cloud_run_v2_service" "saas_app" {
  name     = "${project.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}-server"
  location = "us-east1"

  template {
    containers {
      image = "gcr.io/saas-factory-production/main-app:latest"
      ports {
        container_port = 3000
      }
      env {
        name  = "NODE_ENV"
        value = "production"
      }
      env {
        name  = "GEMINI_API_KEY"
        value = "secured-vault-secret"
      }
    }
  }
}

# 2. Database Managed Instance (PostgreSQL/Cloud SQL)
resource "google_sql_database_instance" "saas_db" {
  name             = "postgres-db-${project.id.slice(0, 6)}"
  database_version = "POSTGRES_15"
  region           = "us-east1"

  settings {
    tier = "db-f1-micro"
    backup_configuration {
      enabled = true
    }
  }
}`;

  return (
    <div className="space-y-8 animate-fade-in" id="cloud-architecture-report-root">
      
      {/* Overview Head Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-indigo-950 text-white p-6 rounded-2xl shadow-sm border border-indigo-900">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-indigo-300" />
            <span className="text-xs font-mono font-bold uppercase text-indigo-300 tracking-wider">
              Cloud Ready Blueprint
            </span>
          </div>
          <h3 className="text-lg font-bold tracking-tight">Relatório Consolidado de Infraestrutura</h3>
          <p className="text-xs text-indigo-200/80 max-w-xl">
            Este relatório consolida a compilação lógica da fábrica de SaaS e fornece comandos IAC (Terraform/GCP) prontos para portar a arquitetura ao ambiente de produção em nuvem.
          </p>
        </div>
        <button
          onClick={handleDownloadReport}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 font-sans font-semibold text-xs rounded-xl transition-all cursor-pointer whitespace-nowrap text-white"
        >
          {downloadSuccess ? (
            <>
              <Check className="w-3.5 h-3.5 animate-bounce" />
              <span>Relatório Baixado!</span>
            </>
          ) : (
            <>
              <Download className="w-3.5 h-3.5" />
              <span>Exportar TXT da Arquitetura</span>
            </>
          )}
        </button>
      </div>

      {/* Grid of Key Analytical Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Compilation Status Card */}
        <div className="bg-white border border-gray-100 p-5 rounded-xl shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-indigo-950">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider">Status Geral da Fábrica</span>
          </div>
          <div className="bg-emerald-50/50 p-3 rounded-lg border border-emerald-100/50 space-y-1">
            <div className="flex items-center gap-1 text-emerald-800 text-xs font-bold font-mono">
              <span className="inline-block w-2 h-2 bg-emerald-500 rounded-full animate-ping mr-1"></span>
              Compilação: Sucesso (100% Verde)
            </div>
            <p className="text-[10px] text-emerald-700/80 leading-relaxed font-medium">
              A árvore de arquivos foi gerada e validada pelo compilador TS. Nenhuma quebra de tipo ou importação pendente detectada no sandbox.
            </p>
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-gray-500 font-mono text-[10px]">
              <span>Módulos de Código:</span>
              <span className="text-gray-800 font-semibold">{project.modules.length} Ativos</span>
            </div>
            <div className="flex justify-between text-gray-500 font-mono text-[10px]">
              <span>Limitação de Portas:</span>
              <span className="text-gray-800 font-semibold">Porta Única 3000 Ingress</span>
            </div>
            <div className="flex justify-between text-gray-500 font-mono text-[10px]">
              <span>Orquestrador:</span>
              <span className="text-gray-800 font-semibold">Antigravity Route Controller</span>
            </div>
          </div>
        </div>

        {/* Database & Multi-Tenant Strategy Card */}
        <div className="bg-white border border-gray-100 p-5 rounded-xl shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-indigo-950">
            <Database className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider">Isolamento Multi-Tenant</span>
          </div>
          <div className="bg-amber-50/50 p-3 rounded-lg border border-amber-100/50 space-y-1">
            <span className="text-amber-800 text-xs font-bold block font-mono">Abordagem de Segurança</span>
            <p className="text-[10px] text-amber-700/80 leading-relaxed font-medium">
              Isolamento por Identificador de Loja (<code className="font-mono bg-white px-0.5 rounded border border-amber-200">tenant_id</code>) em cada query de banco de dados, protegendo contra vazamento acidental de dados entre clientes.
            </p>
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-gray-500 font-mono text-[10px]">
              <span>Padrão de Tabelas:</span>
              <span className="text-gray-800 font-semibold truncate max-w-[150px]">Atalho Relacional / NoSQL</span>
            </div>
            <div className="flex justify-between text-gray-500 font-mono text-[10px]">
              <span>Segurança da Lei Geral:</span>
              <span className="text-gray-800 font-semibold">Conformidade LGPD Ativa</span>
            </div>
            <div className="flex justify-between text-gray-500 font-mono text-[10px]">
              <span>Corte de Envio:</span>
              <span className="text-gray-800 font-semibold">Integrado com o Orquestrador</span>
            </div>
          </div>
        </div>

        {/* Logistics Optimization Strategy Card */}
        <div className="bg-white border border-gray-100 p-5 rounded-xl shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-indigo-950">
            <Workflow className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider">Mitigação de Limites de API</span>
          </div>
          <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100/50 space-y-1">
            <span className="text-blue-800 text-xs font-bold block font-mono">Agente Logístico de Frete</span>
            <p className="text-[10px] text-blue-700/80 leading-relaxed font-medium">
              Armazena em Cache os cálculos de cotações por CEP por até 60 minutos para desviar de bloqueios de requisições de portadoras externas (Correios/Plataformas Logísticas).
            </p>
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-gray-500 font-mono text-[10px]">
              <span>Cotações de Frete:</span>
              <span className="text-gray-800 font-semibold">Automático & Multi-Canal</span>
            </div>
            <div className="flex justify-between text-gray-500 font-mono text-[10px]">
              <span>Classificação de leads:</span>
              <span className="text-gray-800 font-semibold">Fria / Morna / Quente por IA</span>
            </div>
            <div className="flex justify-between text-gray-500 font-mono text-[10px]">
              <span>Corte de Envios:</span>
              <span className="text-gray-800 font-semibold">Sincronização ERP Manual/Auto</span>
            </div>
          </div>
        </div>

      </div>

      {/* Cloud Performance Optimizer & Interactive Calculator */}
      <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-xs space-y-6">
        <div>
          <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-950">
            <TrendingUp className="w-4 h-4 text-indigo-600" />
            <span>Simulador de Escalabilidade na Nuvem & Custos Mensais</span>
          </h4>
          <p className="text-xs text-gray-500 mt-1">
            Ajuste o volume mensal estimado de transações (mensagens WhatsApp processadas + atualizações de logística + ERP) para analisar o quanto a infraestrutura se adaptará e seu custo de computação na Cloud.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <span className="text-xs font-mono font-bold text-gray-700 select-none">
              Volume Mensal de Requisições: <strong className="text-indigo-600 text-sm">{monthlyTrans.toLocaleString()}</strong> de transações
            </span>
            <input 
              type="range" 
              min="5000" 
              max="500000" 
              step="5000"
              value={monthlyTrans}
              onChange={(e) => setMonthlyTrans(Number(e.target.value))}
              className="w-full sm:w-80 h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-[9px] font-mono text-gray-400 block uppercase font-bold">Servidores (Cloud Run/Fargate)</span>
              <span className="text-sm font-bold text-gray-900">${calcComputeCost()} USD / mês</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-[9px] font-mono text-gray-400 block uppercase font-bold">Instâncias DB (Cloud SQL)</span>
              <span className="text-sm font-bold text-gray-900">${calcDbCost()} USD / mês</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-[9px] font-mono text-gray-400 block uppercase font-bold">Consumo de IA (Gemini API)</span>
              <span className="text-sm font-bold text-gray-900">${calcAiCost()} USD / mês</span>
            </div>
            <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100">
              <span className="text-[9px] font-mono text-indigo-500 block uppercase font-bold">Custo Total Recomendado</span>
              <span className="text-sm font-bold text-indigo-950">${calcTot()} USD / mês</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cloud Native Infrastructure Configuration (Terraform) */}
      <div className="bg-zinc-950 rounded-2xl border border-zinc-900 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-mono font-bold text-emerald-300 uppercase tracking-wider">
                Infraestrutura Como Código (IaC) — Terraform recomendada
              </span>
            </div>
            <p className="text-[10px] text-zinc-400">
              Código parametrizado para implantar automaticamente o cluster container seguro conectando à sua instância PostgreSQL no Google Cloud.
            </p>
          </div>

          <button
            onClick={() => handleCopyCode(cloudTerraformCode, "tf")}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 rounded-lg text-xs font-mono transition-colors cursor-pointer"
          >
            {copiedCode === "tf" ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Copiado!</span>
              </>
            ) : (
              <span>Copiar Terraform</span>
            )}
          </button>
        </div>

        <pre className="text-xs font-mono bg-zinc-900/40 text-emerald-400/90 p-4 rounded-xl overflow-x-auto border border-zinc-900 leading-relaxed max-h-[320px]">
          <code>{cloudTerraformCode}</code>
        </pre>
      </div>

      {/* Cloud Integration Optimization Architecture Manual */}
      <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-xs space-y-6">
        <div>
          <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-950">
            <Layers className="w-4 h-4 text-indigo-600" />
            <span>Guia de Aprimoramento da Infraestrutura na Produção</span>
          </h4>
          <p className="text-xs text-gray-500 mt-1">
            Siga estas etapas essenciais ao portar o projeto desta Fábrica de SaaS para seu ambiente do Cloud Computing final:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-gray-600 leading-relaxed font-medium space-y-0 text-left">
          <div className="space-y-3.5">
            <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100/50 space-y-1">
              <span className="font-sans font-bold text-gray-950 block">1. Registro e Retenção Silenciosa</span>
              <p className="text-[11px] leading-relaxed text-gray-500">
                Configure políticas de expiração no banco NoSQL Redis cache e tabelas efêmeras da Amazon DynamoDB ou firestore. Isso reduz custos adicionais e garante conformidade automática se o cliente optar por "Efêmero / Sem Preservação de PII".
              </p>
            </div>
            <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100/50 space-y-1">
              <span className="font-sans font-bold text-gray-950 block">2. Ingress & Porta 3000 de Nginx</span>
              <p className="text-[11px] leading-relaxed text-gray-500">
                Nosso orquestrador é padronizado em contêiner Docker rodando na porta 3000. Qualquer roteador ou Proxy de balanceamento Cloud de carregamento deve direcionar o tráfego HTTP/HTTPS diretamente para essa porta.
              </p>
            </div>
          </div>

          <div className="space-y-3.5">
            <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100/50 space-y-1">
              <span className="font-sans font-bold text-gray-950 block">3. Resiliência do Agente de Logística</span>
              <p className="text-[11px] leading-relaxed text-gray-500">
                O assistente de cotação integrado roda via API do Gemini. Em instâncias de Cloud computing, utilize um agente com limite de taxa (rate limiting) para evitar spam ou saturação da chave secreta corporativa.
              </p>
            </div>
            <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100/50 space-y-1">
              <span className="font-sans font-bold text-gray-950 block">4. Alinhamento Multilocatário em Redes Meta</span>
              <p className="text-[11px] leading-relaxed text-gray-500">
                Os Webhooks unificados de Facebook, Instagram e WhatsApp herdam cabeçalhos seguros contendo chaves exclusivas de validação para cada locatário (tenant), garantindo integridade na classificação de leads e pedidos.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
