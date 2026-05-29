import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { iniciais } from '@/lib/utils';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('nome, plano')
    .eq('id', user.id)
    .single();

  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? 'Meu SaaS';
  const nomeUsuario = profile?.nome ?? user.email ?? '';

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-10 flex w-64 flex-col border-r border-gray-200 bg-white">
        {/* Logo */}
        <div className="flex h-16 items-center border-b border-gray-100 px-6">
          <Link href="/dashboard" className="text-lg font-bold text-primary-600">
            {appName}
          </Link>
        </div>

        {/* Navegação — PERSONALIZAR: adicione links relevantes */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {[
              { href: '/dashboard', label: 'Início', emoji: '🏠' },
              { href: '/dashboard/settings', label: 'Configurações', emoji: '⚙️' },
              // PERSONALIZAR: adicione mais links aqui
            ].map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900"
                >
                  <span>{item.emoji}</span>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Usuário */}
        <div className="border-t border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
              {iniciais(nomeUsuario)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900">{nomeUsuario}</p>
              <p className="text-xs text-gray-500 capitalize">{profile?.plano ?? 'gratuito'}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Conteúdo */}
      <main className="ml-64 flex-1 p-8">
        {children}
      </main>
    </div>
  );
}
