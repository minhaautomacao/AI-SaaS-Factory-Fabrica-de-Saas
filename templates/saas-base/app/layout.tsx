import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

const appName = process.env.NEXT_PUBLIC_APP_NAME ?? 'Meu SaaS';

export const metadata: Metadata = {
  title: { default: appName, template: `%s | ${appName}` },
  description: `${appName} — solução inteligente para o seu negócio`,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
