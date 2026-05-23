# Credenciais de Marketing

> **NUNCA commitar valores reais nesta pasta.** Apenas os arquivos README.md são versionados.

## Como usar

Crie um arquivo `.env` local nesta pasta com as credenciais reais:

```env
# Email marketing — Resend (gratuito até 3.000/mês)
RESEND_API_KEY=re_...

# Email marketing — Brevo (gratuito até 300/dia)
BREVO_API_KEY=

# Google Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Meta Pixel (Facebook Ads)
NEXT_PUBLIC_META_PIXEL_ID=

# Google Ads
GOOGLE_ADS_CONVERSION_ID=
GOOGLE_ADS_CONVERSION_LABEL=

# Hotjar (heatmaps)
NEXT_PUBLIC_HOTJAR_ID=

# Posthog (analytics produto — gratuito)
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

## Resend — email transacional gratuito

1. Acesse [resend.com](https://resend.com)
2. **API Keys → Create API Key**
3. Adicione e verifique seu domínio em **Domains**
4. Adicione registros DNS no Cloudflare (Resend fornece)

```typescript
// lib/email.ts
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function enviarEmail({
  para,
  assunto,
  html
}: { para: string; assunto: string; html: string }) {
  return resend.emails.send({
    from: 'Seu App <noreply@meuapp.com.br>',
    to: para,
    subject: assunto,
    html
  })
}
```

## PostHog — analytics de produto (gratuito até 1M eventos/mês)

1. Acesse [posthog.com](https://posthog.com)
2. Crie projeto
3. Copie **Project API Key** e **Host**

```typescript
// Em layout.tsx ou _app.tsx
import posthog from 'posthog-js'

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
  api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  capture_pageview: false // Controlar manualmente
})
```

## Google Analytics 4

1. [analytics.google.com](https://analytics.google.com)
2. Criar propriedade → copiar ID `G-XXXXXXXXXX`

```typescript
// components/GoogleAnalytics.tsx
export function GoogleAnalytics() {
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`} />
      <Script id="google-analytics">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}');
        `}
      </Script>
    </>
  )
}
```
