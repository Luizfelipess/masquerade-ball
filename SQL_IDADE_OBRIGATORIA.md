# 🔧 SQL ATUALIZAÇÃO FINAL - IDADE PARA TODOS

Execute este SQL no **Supabase SQL Editor**:

```sql
-- ========================================
-- ATUALIZAÇÃO FINAL: IDADE OBRIGATÓRIA
-- ========================================

-- 1. Adicionar coluna idade na tabela rsvps
ALTER TABLE public.rsvps 
  ADD COLUMN IF NOT EXISTS idade INTEGER;

-- 2. Tornar CPF opcional (se ainda não foi feito)
ALTER TABLE public.rsvps 
  ALTER COLUMN cpf DROP NOT NULL;

-- 3. Remover constraint unique de CPF (se existir)
ALTER TABLE public.rsvps 
  DROP CONSTRAINT IF EXISTS rsvps_cpf_key;

-- 4. Adicionar coluna idade em dependentes (se ainda não tem)
ALTER TABLE public.dependentes 
  ADD COLUMN IF NOT EXISTS idade INTEGER;

-- 5. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_rsvps_telefone ON public.rsvps(telefone);
CREATE INDEX IF NOT EXISTS idx_rsvps_idade ON public.rsvps(idade);
CREATE INDEX IF NOT EXISTS idx_dependentes_idade ON public.dependentes(idade);

-- 6. Verificar estrutura final
SELECT 'Atualização completa! ✅' as status;

-- 7. Ver estrutura das tabelas
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name IN ('rsvps', 'dependentes')
ORDER BY table_name, ordinal_position;
```

---

## ✅ ESTRUTURA FINAL

### Tabela `rsvps`
```
┌──────────────┬──────────┬─────────────┐
│ Coluna       │ Tipo     │ Obrigatório │
├──────────────┼──────────┼─────────────┤
│ id           │ UUID     │ ✅          │
│ nome         │ TEXT     │ ✅          │
│ idade        │ INTEGER  │ ✅ (NOVO!)  │
│ telefone     │ TEXT     │ ✅          │
│ cpf          │ TEXT     │ ❌          │
│ email        │ TEXT     │ ❌          │
│ observacoes  │ TEXT     │ ❌          │
│ created_at   │ TIMESTAMP│ ✅ (auto)   │
└──────────────┴──────────┴─────────────┘
```

### Tabela `dependentes`
```
┌──────────────┬──────────┬─────────────┐
│ Coluna       │ Tipo     │ Obrigatório │
├──────────────┼──────────┼─────────────┤
│ id           │ UUID     │ ✅          │
│ rsvp_id      │ UUID     │ ✅ (FK)     │
│ nome         │ TEXT     │ ✅          │
│ idade        │ INTEGER  │ ✅          │
│ tipo         │ TEXT     │ ✅          │
│ created_at   │ TIMESTAMP│ ✅ (auto)   │
└──────────────┴──────────┴─────────────┘
```

---

## 🎯 MUDANÇAS NO FORMULÁRIO

### ✅ Antes:
```
Responsável:
├─ Nome
└─ Telefone

Dependentes:
├─ Nome
└─ Idade
```

### ✅ Agora:
```
Responsável:
├─ Nome
├─ Idade (NOVO!)
└─ Telefone

Dependentes:
├─ Nome
└─ Idade
```

**Agora TODOS têm idade registrada!** 🎉

---

## 📊 EXEMPLO DE DADOS

```javascript
// Confirmação de Maria (30 anos) com 2 dependentes
{
  rsvp: {
    id: "uuid-123",
    nome: "Maria das Flores",
    idade: 30,  // ← NOVO!
    telefone: "(11) 98888-7777"
  },
  dependentes: [
    {
      nome: "João Silva",
      idade: 8,
      tipo: "crianca"
    },
    {
      nome: "Ana Silva",
      idade: 28,
      tipo: "adulto"
    }
  ]
}
```

**Total: 3 pessoas com idades completas!**

---

## 🚀 PRÓXIMO PASSO

1. **Executar SQL acima** no Supabase
2. **Testar formulário** em: http://localhost:8000/pages/confirmacao-simples.html
3. **Verificar no admin** se idade aparece

Pronto! ✅
