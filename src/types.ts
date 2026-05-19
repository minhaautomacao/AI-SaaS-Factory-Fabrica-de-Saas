/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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
