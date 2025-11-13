-- ============================================
-- SQL ADICIONAL PARA SISTEMA DE VOTAÇÃO
-- Execute este SQL no Supabase SQL Editor
-- ============================================

-- 1. Função para incrementar votos de forma atômica
-- Esta função evita race conditions ao incrementar votos

-- Primeiro, dropar qualquer versão existente da função
DROP FUNCTION IF EXISTS incrementar_votos;

-- Criar a função
CREATE OR REPLACE FUNCTION incrementar_votos(look_id_param BIGINT)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.looks
  SET votos = votos + 1
  WHERE id = look_id_param;
END;
$$;

-- 2. Garantir que a coluna 'idade' existe na tabela rsvps
ALTER TABLE public.rsvps 
ADD COLUMN IF NOT EXISTS idade INTEGER;

-- 3. Garantir que a coluna 'idade' existe na tabela dependentes
ALTER TABLE public.dependentes 
ADD COLUMN IF NOT EXISTS idade INTEGER;

-- 4. Tornar CPF opcional (remover constraint NOT NULL)
ALTER TABLE public.rsvps 
ALTER COLUMN cpf DROP NOT NULL;

-- 5. Remover constraint UNIQUE do CPF (se existir)
ALTER TABLE public.rsvps 
DROP CONSTRAINT IF EXISTS rsvps_cpf_key;

-- 6. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_looks_votos ON public.looks(votos DESC);
CREATE INDEX IF NOT EXISTS idx_votos_cpf ON public.votos(cpf_votante);
CREATE INDEX IF NOT EXISTS idx_votos_look ON public.votos(look_id);
CREATE INDEX IF NOT EXISTS idx_dependentes_rsvp ON public.dependentes(rsvp_id);

-- 7. Adicionar comentários para documentação
COMMENT ON FUNCTION incrementar_votos(BIGINT) IS 'Incrementa atomicamente o contador de votos de um look';
COMMENT ON COLUMN public.rsvps.idade IS 'Idade do responsável pela confirmação';
COMMENT ON COLUMN public.dependentes.idade IS 'Idade do dependente';

-- ============================================
-- VERIFICAÇÃO DO SISTEMA
-- Execute estas queries para verificar se tudo está OK
-- ============================================

-- Verificar estrutura das tabelas
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name IN ('rsvps', 'dependentes', 'looks', 'votos', 'config')
ORDER BY table_name, ordinal_position;

-- Verificar se a função foi criada
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'incrementar_votos';

-- Verificar políticas RLS (Row Level Security)
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('rsvps', 'dependentes', 'looks', 'votos', 'config');

-- ============================================
-- DADOS DE TESTE (OPCIONAL)
-- Descomente para inserir dados de teste
-- ============================================

/*
-- Limpar dados existentes (CUIDADO: apaga tudo!)
DELETE FROM public.votos;
DELETE FROM public.looks;
DELETE FROM public.dependentes;
DELETE FROM public.rsvps;
UPDATE public.config SET votacao_liberada = false;

-- Inserir configuração inicial
INSERT INTO public.config (id, votacao_liberada, created_at)
VALUES (1, false, NOW())
ON CONFLICT (id) DO NOTHING;

-- Inserir RSVPs de teste
INSERT INTO public.rsvps (nome, idade, telefone, cpf, email)
VALUES 
  ('Ana Silva', 30, '(11) 98765-4321', '123.456.789-00', 'ana@email.com'),
  ('Carlos Santos', 35, '(11) 91234-5678', '987.654.321-00', 'carlos@email.com'),
  ('Maria Oliveira', 28, '(11) 99999-8888', NULL, 'maria@email.com');

-- Inserir dependentes de teste
INSERT INTO public.dependentes (rsvp_id, nome, idade, tipo)
SELECT 
  r.id,
  'João Silva',
  8,
  'crianca'
FROM public.rsvps r
WHERE r.nome = 'Ana Silva';

-- Inserir looks de teste (você precisa usar URLs reais de imagens)
INSERT INTO public.looks (nome, cpf, descricao, foto_url, votos)
VALUES 
  ('Ana Silva', '123.456.789-00', 'Vestido vitoriano inspirado em Daphne Bridgerton', 'https://exemplo.com/foto1.jpg', 0),
  ('Carlos Santos', '987.654.321-00', 'Traje de época com cartola e bengala', 'https://exemplo.com/foto2.jpg', 0);

-- Liberar votação para teste
UPDATE public.config SET votacao_liberada = true WHERE id = 1;
*/

-- ============================================
-- FIM DO SQL ADICIONAL
-- ============================================

-- 🎭 Seu sistema de Baile de Máscaras está pronto!
-- 
-- Próximos passos:
-- 1. Execute este SQL no Supabase
-- 2. Faça deploy no Vercel
-- 3. Teste todas as funcionalidades
-- 4. Libere a votação na noite do evento!
