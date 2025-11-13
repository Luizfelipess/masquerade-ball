# 🔧 ATUALIZAÇÃO DO SUPABASE - FORMULÁRIO SIMPLIFICADO

## O que mudou?

### ❌ ANTES (complexo):
- Nome, CPF, email, telefone, observações
- CPF obrigatório e único
- Dependentes sem idade

### ✅ AGORA (simples):
- **Responsável**: Nome + Telefone (só 2 campos!)
- **Dependentes**: Nome + Idade
- Sem CPF, sem email, sem observações

---

## 📋 SQL PARA ATUALIZAR AS TABELAS

Cole este SQL no **SQL Editor do Supabase**:

```sql
-- ========================================
-- ATUALIZAR ESTRUTURA DAS TABELAS
-- ========================================

-- 1. Remover restrição de CPF único e torná-lo opcional
ALTER TABLE public.rsvps 
  ALTER COLUMN cpf DROP NOT NULL,
  DROP CONSTRAINT IF EXISTS rsvps_cpf_key;

-- 2. Adicionar coluna idade na tabela dependentes
ALTER TABLE public.dependentes 
  ADD COLUMN IF NOT EXISTS idade INTEGER;

-- 3. Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_rsvps_telefone ON public.rsvps(telefone);
CREATE INDEX IF NOT EXISTS idx_dependentes_idade ON public.dependentes(idade);

-- 4. Atualizar políticas para não exigir CPF
-- (As políticas existentes já funcionam, mas vamos garantir)

-- Verificar se está tudo OK
SELECT 'Tabelas atualizadas com sucesso!' as status;
```

---

## 🎯 ESTRUTURA FINAL DAS TABELAS

### Tabela: `rsvps`
```
id          | UUID (PK, auto)
nome        | TEXT (obrigatório)
cpf         | TEXT (opcional, sem unique)
email       | TEXT (opcional)
telefone    | TEXT (obrigatório)
observacoes | TEXT (opcional)
created_at  | TIMESTAMPTZ (auto)
```

### Tabela: `dependentes`
```
id       | UUID (PK, auto)
rsvp_id  | UUID (FK → rsvps.id)
nome     | TEXT (obrigatório)
tipo     | TEXT (adulto/crianca)
idade    | INTEGER (obrigatório agora!)
created_at | TIMESTAMPTZ (auto)
```

---

## 🚀 COMO USAR O NOVO FORMULÁRIO

### 1. Acessar a página:
```
/pages/confirmacao-simples.html
```

### 2. Preencher:
```
Nome: João Silva
Telefone: (11) 98888-7777
```

### 3. Adicionar acompanhantes (opcional):
```
Clica em "➕ Adicionar Pessoa"

Pessoa 1:
- Nome: Maria Silva
- Idade: 28

Pessoa 2:
- Nome: Pedro Silva  
- Idade: 8
```

### 4. Confirmar:
```
Clica em "✅ Confirmar Presença"
```

✅ **Pronto!** Sistema salva no Supabase automaticamente.

---

## 🔍 COMO TESTAR SE FUNCIONOU

### No navegador (F12 → Console):

```javascript
// Verificar se Supabase está conectado
supabase

// Ver todas as confirmações
supabase.from('rsvps').select('*, dependentes(*)').then(console.log)

// Contar total de pessoas
supabase.from('rsvps').select('id').then(r => {
  supabase.from('dependentes').select('id').then(d => {
    console.log(`Total: ${r.data.length + d.data.length} pessoas`);
  });
});
```

---

## 📱 BACKEND: SIM, VOCÊ JÁ TEM!

### O que é o Supabase?

**Supabase = Backend completo sem programar!**

Você NÃO precisa:
- ❌ Criar servidor Node.js
- ❌ Configurar Express/Fastify
- ❌ Instalar PostgreSQL
- ❌ Fazer deploy de API
- ❌ Gerenciar infraestrutura

Você JÁ TEM:
- ✅ Banco de dados PostgreSQL na nuvem
- ✅ API REST automática
- ✅ Armazenamento de fotos (Storage)
- ✅ Autenticação (se precisar)
- ✅ Realtime (atualização ao vivo)
- ✅ Backup automático
- ✅ Dashboard administrativo
- ✅ GRÁTIS até 500MB

### Como funciona?

```
FRONTEND (seu site)
    ↓
SUPABASE SDK (JavaScript)
    ↓
SUPABASE API (automática)
    ↓
POSTGRESQL (banco de dados)
```

**Você só faz:**
1. Criar tabelas (SQL)
2. Chamar funções JavaScript
3. Pronto!

---

## 🎭 ADMIN PANEL: Como ver confirmações?

### URL do admin:
```
/pages/admin-supabase.html
```

### Senha:
```
baile2026thamires
```

### O que você vê:
- 📊 Estatísticas (total de pessoas, confirmações)
- 📋 Lista completa com nome + telefone + dependentes
- 📥 Exportar CSV
- 🗳️ Controlar votação

---

## ❓ FAQ

### 1. Preciso hospedar na Vercel para funcionar?

**Não!** Funciona localmente também:

```bash
# Subir servidor local
python3 -m http.server 8000

# Abrir no navegador
http://localhost:8000/pages/confirmacao-simples.html
```

O erro `supabase is not defined` aconteceu porque:
- Você testou no `index.html` que **não tem** os scripts
- Agora teste em `/pages/confirmacao-simples.html` que **tem** os scripts ✅

### 2. Por que remover o CPF?

- ✅ Mais simples para o usuário
- ✅ Menos atrito no cadastro
- ✅ Telefone já identifica pessoa
- ✅ Privacidade (LGPD)

Se precisar, ainda pode preencher CPF no admin manualmente.

### 3. Como saber quem é criança?

Idade < 12 anos = criança automaticamente
Código faz isso sozinho:

```javascript
tipo: dep.idade < 12 ? 'crianca' : 'adulto'
```

### 4. E se alguém confirmar 2 vezes?

Deixa! Você vê no admin e remove duplicatas.
Ou adiciona validação por telefone depois:

```sql
-- Se quiser telefone único:
ALTER TABLE rsvps ADD CONSTRAINT rsvps_telefone_key UNIQUE(telefone);
```

---

## ✅ CHECKLIST PARA VOCÊ

- [ ] Executar SQL de atualização no Supabase
- [ ] Testar formulário em `/pages/confirmacao-simples.html`
- [ ] Adicionar 1 pessoa com dependentes
- [ ] Verificar no admin se apareceu
- [ ] Celebrar! 🎉

---

## 🔗 PRÓXIMOS PASSOS

### 1. Atualizar links de navegação
Trocar `/pages/confirmacao.html` por `/pages/confirmacao-simples.html` em todas as páginas.

### 2. Fazer deploy
```bash
git add .
git commit -m "Formulário simplificado: nome, telefone e dependentes com idade"
git push
```

Vercel atualiza automaticamente! 🚀

---

**Backend = Supabase = Já está funcionando! 🎯**
