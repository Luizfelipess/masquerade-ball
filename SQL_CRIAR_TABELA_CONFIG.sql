-- ============================================
-- SQL PARA CRIAR TABELA CONFIG (Estrutura Chave-Valor)
-- Execute este SQL no Supabase SQL Editor
-- ============================================

-- 1. Dropar tabela existente (se houver)
DROP TABLE IF EXISTS public.config CASCADE;

-- 2. Criar tabela config com estrutura chave-valor
CREATE TABLE public.config (
    id BIGSERIAL PRIMARY KEY,
    chave TEXT NOT NULL UNIQUE,
    valor TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 4. Criar trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_config_updated_at ON public.config;
CREATE TRIGGER update_config_updated_at
    BEFORE UPDATE ON public.config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. Inserir configurações padrão
INSERT INTO public.config (chave, valor)
VALUES ('votacao_liberada', 'false')
ON CONFLICT (chave) DO NOTHING;

-- 6. Habilitar RLS (Row Level Security)
ALTER TABLE public.config ENABLE ROW LEVEL SECURITY;

-- 7. Políticas RLS

-- Política: Permitir leitura pública
DROP POLICY IF EXISTS "Permitir leitura pública da config" ON public.config;
CREATE POLICY "Permitir leitura pública da config"
ON public.config FOR SELECT
TO public
USING (true);

-- Política: Permitir modificação (para admin via API)
DROP POLICY IF EXISTS "Permitir modificação da config" ON public.config;
CREATE POLICY "Permitir modificação da config"
ON public.config FOR ALL
TO public
USING (true);

-- 8. Criar índice na coluna chave
CREATE INDEX IF NOT EXISTS idx_config_chave ON public.config(chave);

-- 9. Adicionar comentários
COMMENT ON TABLE public.config IS 'Configurações gerais do sistema em formato chave-valor';
COMMENT ON COLUMN public.config.chave IS 'Nome da configuração';
COMMENT ON COLUMN public.config.valor IS 'Valor da configuração (armazenado como texto)';

-- ============================================
-- VERIFICAÇÃO
-- ============================================
SELECT * FROM public.config;

-- Deve retornar:
-- id | chave              | valor | created_at         | updated_at
-- 1  | votacao_liberada   | false | (data/hora atual)  | (data/hora atual)

-- ============================================
-- COMANDOS ÚTEIS PARA ADMINISTRAÇÃO
-- ============================================

-- Liberar votação manualmente:
-- UPDATE public.config SET valor = 'true' WHERE chave = 'votacao_liberada';

-- Bloquear votação manualmente:
-- UPDATE public.config SET valor = 'false' WHERE chave = 'votacao_liberada';

-- Verificar status atual:
-- SELECT valor FROM public.config WHERE chave = 'votacao_liberada';

-- Adicionar nova configuração:
-- INSERT INTO public.config (chave, valor) VALUES ('nova_config', 'valor');

