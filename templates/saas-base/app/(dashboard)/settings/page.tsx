'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/types';
import type { Metadata } from 'next';

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Partial<Profile>>({});
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  useEffect(() => {
    async function carregarPerfil() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (data) setProfile(data);
      setCarregando(false);
    }
    carregarPerfil();
  }, [router]);

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setSucesso(false);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('profiles').update({ nome: profile.nome }).eq('id', user.id);
    setSucesso(true);
    setSalvando(false);
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  if (carregando) {
    return <div className="text-gray-500">Carregando...</div>;
  }

  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>

      {/* Perfil */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900">Perfil</h2>
        <form onSubmit={handleSalvar} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nome completo</label>
            <input
              type="text"
              value={profile.nome ?? ''}
              onChange={(e) => setProfile({ ...profile, nome: e.target.value })}
              className="input mt-1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input type="email" value={profile.email ?? ''} disabled className="input mt-1 bg-gray-50" />
          </div>
          {sucesso && (
            <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
              Perfil salvo com sucesso!
            </p>
          )}
          <button type="submit" disabled={salvando} className="btn-primary">
            {salvando ? 'Salvando...' : 'Salvar'}
          </button>
        </form>
      </div>

      {/* Plano */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900">Plano atual</h2>
        <p className="mt-2 capitalize text-gray-600">{profile.plano ?? 'gratuito'}</p>
        <button className="btn-secondary mt-4">Gerenciar assinatura</button>
      </div>

      {/* Sair */}
      <div className="card border-red-100">
        <h2 className="text-lg font-semibold text-gray-900">Conta</h2>
        <button onClick={handleLogout} className="mt-4 text-sm font-medium text-red-600 hover:text-red-700">
          Sair da conta
        </button>
      </div>
    </div>
  );
}
