import { createClient } from '@/lib/supabase/server';
import { formatarData } from '@/lib/utils';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Dashboard' };

// PERSONALIZAR: substitua por métricas reais do seu SaaS
const STATS_EXEMPLO = [
  { label: 'Métrica A', valor: '1.234', variacao: '+12%', positivo: true },
  { label: 'Métrica B', valor: 'R$ 8.900', variacao: '+5%', positivo: true },
  { label: 'Métrica C', valor: '98%', variacao: '-1%', positivo: false },
  { label: 'Métrica D', valor: '42', variacao: '+8', positivo: true },
];

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from('profiles')
    .select('nome, plano, criado_em')
    .eq('id', user!.id)
    .single();

  const primeiroNome = profile?.nome?.split(' ')[0] ?? 'usuário';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Olá, {primeiroNome} 👋</h1>
        <p className="mt-1 text-gray-500">
          Plano atual: <span className="font-medium capitalize text-primary-600">{profile?.plano ?? 'gratuito'}</span>
          {profile?.criado_em && ` · Membro desde ${formatarData(profile.criado_em)}`}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS_EXEMPLO.map((stat) => (
          <div key={stat.label} className="card">
            <p className="text-sm font-medium text-gray-500">{stat.label}</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{stat.valor}</p>
            <p className={`mt-1 text-sm font-medium ${stat.positivo ? 'text-green-600' : 'text-red-500'}`}>
              {stat.variacao} vs. mês anterior
            </p>
          </div>
        ))}
      </div>

      {/* Conteúdo principal — PERSONALIZAR */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900">Atividade recente</h2>
          <p className="mt-4 text-sm text-gray-500">
            {/* PERSONALIZAR: lista de atividades do seu SaaS */}
            Nenhuma atividade ainda. Comece a usar o sistema para ver dados aqui.
          </p>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900">Próximas ações</h2>
          <ul className="mt-4 space-y-3">
            {/* PERSONALIZAR: ações relevantes para o seu SaaS */}
            {['Configurar perfil', 'Explorar recursos', 'Fazer upgrade'].map((acao) => (
              <li key={acao} className="flex items-center gap-2 text-sm text-gray-600">
                <span className="h-2 w-2 rounded-full bg-primary-400" />
                {acao}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
