import Link from 'next/link';
import { PLANOS } from '@/types';
import { formatarMoeda } from '@/lib/utils';

const appName = process.env.NEXT_PUBLIC_APP_NAME ?? 'Meu SaaS';

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Navbar */}
      <header className="border-b border-gray-100 bg-white">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <span className="text-xl font-bold text-primary-600">{appName}</span>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900">
              Entrar
            </Link>
            <Link href="/signup" className="btn-primary">
              Começar grátis
            </Link>
          </div>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto max-w-7xl px-6 py-24 text-center">
          <h1 className="text-5xl font-bold tracking-tight text-gray-900">
            {/* PERSONALIZAR: título principal */}
            Sua solução em{' '}
            <span className="text-primary-600">um só lugar</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
            {/* PERSONALIZAR: subtítulo */}
            Automatize, gerencie e cresça com inteligência. Simples de usar, poderoso para o seu negócio.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link href="/signup" className="btn-primary text-base px-6 py-3">
              Criar conta grátis
            </Link>
            <Link href="#recursos" className="btn-secondary text-base px-6 py-3">
              Saiba mais
            </Link>
          </div>
        </section>

        {/* Recursos */}
        <section id="recursos" className="bg-gray-50 py-24">
          <div className="mx-auto max-w-7xl px-6">
            <h2 className="text-center text-3xl font-bold text-gray-900">
              Tudo que você precisa
            </h2>
            <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
              {/* PERSONALIZAR: adicione os recursos do seu SaaS */}
              {[
                { titulo: 'Recurso A', desc: 'Descrição do primeiro recurso principal do produto.', emoji: '⚡' },
                { titulo: 'Recurso B', desc: 'Descrição do segundo recurso principal do produto.', emoji: '🎯' },
                { titulo: 'Recurso C', desc: 'Descrição do terceiro recurso principal do produto.', emoji: '📊' },
              ].map((r) => (
                <div key={r.titulo} className="card text-center">
                  <div className="text-4xl">{r.emoji}</div>
                  <h3 className="mt-4 text-lg font-semibold text-gray-900">{r.titulo}</h3>
                  <p className="mt-2 text-gray-600">{r.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="precos" className="py-24">
          <div className="mx-auto max-w-7xl px-6">
            <h2 className="text-center text-3xl font-bold text-gray-900">Planos e preços</h2>
            <p className="mt-4 text-center text-gray-600">Comece grátis. Faça upgrade quando precisar.</p>
            <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
              {PLANOS.map((plano) => (
                <div
                  key={plano.id}
                  className={`card flex flex-col ${plano.destaque ? 'border-primary-500 ring-2 ring-primary-500' : ''}`}
                >
                  {plano.destaque && (
                    <span className="mb-4 self-start rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-700">
                      Mais popular
                    </span>
                  )}
                  <h3 className="text-xl font-bold text-gray-900">{plano.nome}</h3>
                  <p className="mt-1 text-sm text-gray-500">{plano.descricao}</p>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-gray-900">
                      {plano.preco === 0 ? 'Grátis' : formatarMoeda(plano.preco)}
                    </span>
                    {plano.preco > 0 && <span className="text-gray-500">/mês</span>}
                  </div>
                  <ul className="mt-6 flex-1 space-y-3">
                    {plano.recursos.map((r) => (
                      <li key={r} className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="text-green-500">✓</span> {r}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/signup"
                    className={`mt-8 ${plano.destaque ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    {plano.preco === 0 ? 'Começar grátis' : `Assinar ${plano.nome}`}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-100 py-8 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} {appName}. Todos os direitos reservados.
      </footer>
    </div>
  );
}
