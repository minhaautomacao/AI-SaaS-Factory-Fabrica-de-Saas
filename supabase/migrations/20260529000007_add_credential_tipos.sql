-- Adiciona tipo 'logistica' à constraint de workspace_credentials
-- Necessário para armazenar tokens de Melhor Envio e Correios

ALTER TABLE workspace_credentials
DROP CONSTRAINT IF EXISTS workspace_credentials_tipo_check;

ALTER TABLE workspace_credentials
ADD CONSTRAINT workspace_credentials_tipo_check
CHECK (tipo IN (
  'whatsapp',     -- Z-API ou outro provedor cloud
  'evolution',    -- Evolution API self-hosted
  'meta',         -- Instagram/Facebook Business
  'mercadopago',  -- Mercado Pago PIX/checkout
  'stripe',       -- Stripe subscriptions
  'openbanking',  -- Open Banking / extrato bancário
  'email',        -- Resend ou SMTP
  'logistica'     -- Melhor Envio, Correios
));

-- Rollback:
-- ALTER TABLE workspace_credentials DROP CONSTRAINT workspace_credentials_tipo_check;
-- ALTER TABLE workspace_credentials ADD CONSTRAINT workspace_credentials_tipo_check
--   CHECK (tipo IN ('whatsapp','evolution','meta','mercadopago','stripe','openbanking','email'));
