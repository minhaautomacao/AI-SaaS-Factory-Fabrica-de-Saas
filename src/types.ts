export interface Workspace {
  id: string;
  nome: string;
  slug: string;
  descricao?: string;
  status: 'configurando' | 'ativo' | 'pausado' | 'encerrado';
  segmento?: string;
  logo_url?: string;
  owner_email?: string;
  criado_em: string;
  credentials_count: number;
  credentials_configuradas: number;
}

export interface WorkspaceCredential {
  id: string;
  workspace_id: string;
  tipo: string;
  chave: string;
  ativo: boolean;
  testado_em?: string;
  teste_status?: 'ok' | 'erro' | 'pendente';
  teste_detalhe?: string;
}

export interface OrchestratorLog {
  id: string;
  task_id: string;
  escopo: string;
  agente: string;
  tipo_evento: string;
  urgencia?: string;
  erro?: string;
  duracao_ms?: number;
  criado_em: string;
  workspace_id?: string;
}

export interface ActivityMetric {
  hora: string;
  eventos: number;
  erros: number;
}

export interface SaaSProject {
  id: string;
  createdAt: string;
  name: string;
  tagline: string;
  description: string;
  techStack: {
    frontend: string[];
    backend: string[];
    database: string[];
    aiTools: string[];
  };
  modules: Array<{
    name: string;
    description: string;
    files: string[];
  }>;
  structuralPrompts: {
    systemInstruction: string;
    uiPrompt: string;
    databaseSchema: string;
    testsPrompt: string;
  };
  githubActions: string;
  currentSimStep: number; // 0 to 5: 1=Interface, 2=Orquestração, 3=Planejamento, 4=Execução Dev, 5=GitHub
}

export interface SimulationLog {
  timestamp: string;
  text: string;
  type: "info" | "success" | "warning" | "error" | "command";
}
