import React, { useState, useEffect } from 'react';
import { Layers, LogOut } from 'lucide-react';
import LoginScreen from './components/LoginScreen';
import FactorySidebar from './components/layout/FactorySidebar';
import WorkspacesView from './components/factory/WorkspacesView';
import WorkspaceDetailView from './components/factory/WorkspaceDetailView';
import CredentialSetup from './components/credentials/CredentialSetup';
import ActivityMonitor from './components/monitor/ActivityMonitor';
import LogsViewer from './components/monitor/LogsViewer';
import SaaSPlannerForm from './components/SaaSPlannerForm';
import PedidosView from './components/floricultura/PedidosView';
import ProducaoScreen from './components/floricultura/ProducaoScreen';
import FloraInboxView from './components/floricultura/FloraInboxView';
import { Workspace, SimulationLog } from './types';

type View = 'workspaces' | 'workspace-detail' | 'credentials' | 'monitor' | 'logs' | 'planner' | 'pedidos' | 'atendimento';

export default function App() {
  // Tela de produção — sem login, abre em nova aba para monitor na floricultura
  if (window.location.pathname === '/producao') {
    return <ProducaoScreen />;
  }
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const auth = localStorage.getItem('saas_factory_authenticated');
    const expiry = localStorage.getItem('saas_factory_expiry');
    if (auth !== 'true' || !expiry) return false;
    if (Date.now() > Number(expiry)) {
      localStorage.removeItem('saas_factory_authenticated');
      localStorage.removeItem('saas_factory_expiry');
      localStorage.removeItem('saas_factory_token');
      return false;
    }
    return true;
  });
  const [view, setView] = useState<View>(() => {
    if (window.location.pathname === '/atendimento') return 'atendimento';
    if (window.location.pathname === '/pedidos') return 'pedidos';
    return 'workspaces';
  });
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
  const [hasAPIKey, setHasAPIKey] = useState(false);
  const [plannerLogs, setPlannerLogs] = useState<SimulationLog[]>([]);
  const [floraInboxCount, setFloraInboxCount] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetch('/api/config-status').then(r => r.json()).then(d => setHasAPIKey(d.hasAPIKey)).catch(() => {});
    carregarWorkspaces();
    const carregarFloraMetricas = () => fetch('/api/flora/metrics', { headers: { Authorization: `Bearer ${localStorage.getItem('saas_factory_token') ?? ''}` } })
      .then(r => r.json())
      .then(d => setFloraInboxCount(d.aguardando_humano ?? 0))
      .catch(() => {});
    carregarFloraMetricas();
    const floraTimer = window.setInterval(carregarFloraMetricas, 5000);
    return () => window.clearInterval(floraTimer);
  }, [isAuthenticated]);

  const carregarWorkspaces = () => {
    fetch('/api/workspaces')
      .then(r => r.json())
      .then(d => setWorkspaces(d.workspaces ?? []))
      .catch(() => {});
  };

  const navegar = (v: View) => {
    setView(v);
    if (v === 'atendimento') window.history.replaceState(null, '', '/atendimento');
    else if (v === 'pedidos') window.history.replaceState(null, '', '/pedidos');
    else window.history.replaceState(null, '', '/');
  };

  const addLog = (text: string, type: SimulationLog['type']) => {
    const timestamp = new Date().toLocaleTimeString();
    setPlannerLogs(prev => [...prev, { timestamp, text, type }]);
  };

  const handleLogout = () => {
    localStorage.removeItem('saas_factory_authenticated');
    localStorage.removeItem('saas_factory_token');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <LoginScreen onSuccess={() => setIsAuthenticated(true)} />;
  }

  const renderContent = () => {
    switch (view) {
      case 'workspaces':
        return <WorkspacesView workspaces={workspaces} onSelect={w => { setSelectedWorkspace(w); navegar('workspace-detail'); }} onRefresh={carregarWorkspaces} />;

      case 'workspace-detail':
        return selectedWorkspace
          ? <WorkspaceDetailView workspace={selectedWorkspace} onBack={() => navegar('workspaces')} />
          : null;

      case 'credentials':
        return selectedWorkspace
          ? <CredentialSetup workspace={selectedWorkspace} onClose={() => navegar('workspace-detail')} onSaved={() => {}} />
          : null;

      case 'monitor':
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">Monitor</h2>
            <ActivityMonitor />
            <LogsViewer />
          </div>
        );

      case 'logs':
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Logs do Orquestrador</h2>
            <LogsViewer full />
          </div>
        );

      case 'planner':
        return (
          <SaaSPlannerForm
            onSubmit={() => {}}
            isLoading={false}
            hasAPIKey={hasAPIKey}
            onSelectTemplate={() => {}}
          />
        );

      case 'pedidos':
        return <PedidosView />;

      case 'atendimento':
        return <FloraInboxView />;

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased text-gray-950 font-sans selection:bg-indigo-500 selection:text-white">
      <header className="bg-white border-b border-gray-100 py-4 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-tr from-indigo-500 to-indigo-700 text-white rounded-xl shadow-sm shadow-indigo-100">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-gray-900 flex items-center gap-2">
                Fábrica de SaaS
                <span className="text-[10px] font-mono bg-zinc-950 text-emerald-400 px-2 py-0.5 rounded tracking-widest font-bold">v2.0</span>
              </h1>
              <p className="text-xs text-gray-500">Orquestrador com 12 Agentes Claude</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/80 px-3 py-1.5 rounded-lg border border-rose-100 transition-colors font-medium"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sair
          </button>
        </div>
      </header>

      <main className="max-w-7xl w-full mx-auto px-4 md:px-8 mt-6 pb-12 flex flex-col lg:flex-row gap-6">
        <FactorySidebar
          view={view}
          onNavigate={navegar}
          workspaces={workspaces}
          selectedWorkspace={selectedWorkspace}
          onSelectWorkspace={w => { setSelectedWorkspace(w); navegar('workspace-detail'); }}
          floraInboxCount={floraInboxCount}
        />
        <div className="flex-1 min-w-0">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
