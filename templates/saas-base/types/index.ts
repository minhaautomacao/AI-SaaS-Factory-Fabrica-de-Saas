export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          nome: string | null;
          avatar_url: string | null;
          plano: 'gratuito' | 'basico' | 'pro';
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          criado_em: string;
          atualizado_em: string;
        };
        Insert: {
          id: string;
          email: string;
          nome?: string | null;
          avatar_url?: string | null;
          plano?: 'gratuito' | 'basico' | 'pro';
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
        };
        Update: {
          nome?: string | null;
          avatar_url?: string | null;
          plano?: 'gratuito' | 'basico' | 'pro';
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Plano = Profile['plano'];

export interface PlanoConfig {
  id: Plano;
  nome: string;
  preco: number;
  descricao: string;
  recursos: string[];
  destaque?: boolean;
  stripePrice?: string;
}

export const PLANOS: PlanoConfig[] = [
  {
    id: 'gratuito',
    nome: 'Gratuito',
    preco: 0,
    descricao: 'Para começar',
    recursos: ['Recurso A', 'Recurso B', 'Suporte por email'],
  },
  {
    id: 'basico',
    nome: 'Básico',
    preco: 49,
    descricao: 'Para crescer',
    recursos: ['Tudo do Gratuito', 'Recurso C', 'Recurso D', 'Suporte prioritário'],
    destaque: false,
    stripePrice: process.env.STRIPE_PRICE_BASICO,
  },
  {
    id: 'pro',
    nome: 'Pro',
    preco: 149,
    descricao: 'Para escalar',
    recursos: ['Tudo do Básico', 'Recurso E', 'Recurso F', 'API access', 'Suporte dedicado'],
    destaque: true,
    stripePrice: process.env.STRIPE_PRICE_PRO,
  },
];
