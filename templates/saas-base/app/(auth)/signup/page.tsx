'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function SignupPage() {
  const router = useRouter();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setCarregando(true);

    if (senha.length < 8) {
      setErro('A senha deve ter pelo menos 8 caracteres.');
      setCarregando(false);
      return;
    }

    const supabase = createClient();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';

    const { error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        data: { full_name: nome },
        emailRedirectTo: `${appUrl}/api/auth/callback`,
      },
    });

    if (error) {
      setErro(error.message === 'User already registered'
        ? 'Este email já está cadastrado.'
        : 'Erro ao criar conta. Tente novamente.');
      setCarregando(false);
      return;
    }

    setSucesso(true);
    setCarregando(false);
  }

  if (sucesso) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="card max-w-md w-full text-center">
          <div className="text-5xl">📧</div>
          <h2 className="mt-4 text-xl font-bold text-gray-900">Verifique seu email</h2>
          <p className="mt-2 text-gray-600">
            Enviamos um link de confirmação para <strong>{email}</strong>.
            Clique no link para ativar sua conta.
          </p>
          <Link href="/login" className="btn-secondary mt-6 inline-block">
            Ir para o login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="text-2xl font-bold text-primary-600">
            {process.env.NEXT_PUBLIC_APP_NAME ?? 'Meu SaaS'}
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">Criar conta grátis</h1>
          <p className="mt-2 text-gray-600">
            Já tem conta?{' '}
            <Link href="/login" className="font-medium text-primary-600 hover:text-primary-700">
              Entrar
            </Link>
          </p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="nome" className="block text-sm font-medium text-gray-700">
                Nome completo
              </label>
              <input
                id="nome"
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="input mt-1"
                placeholder="João Silva"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input mt-1"
                placeholder="seu@email.com.br"
              />
            </div>

            <div>
              <label htmlFor="senha" className="block text-sm font-medium text-gray-700">
                Senha
              </label>
              <input
                id="senha"
                type="password"
                required
                autoComplete="new-password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="input mt-1"
                placeholder="Mínimo 8 caracteres"
              />
            </div>

            {erro && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{erro}</p>
            )}

            <button type="submit" disabled={carregando} className="btn-primary w-full">
              {carregando ? 'Criando conta...' : 'Criar conta grátis'}
            </button>

            <p className="text-center text-xs text-gray-500">
              Ao criar uma conta você concorda com nossos{' '}
              <Link href="/termos" className="underline">Termos de Uso</Link> e{' '}
              <Link href="/privacidade" className="underline">Política de Privacidade</Link>.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
