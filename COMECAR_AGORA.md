# 🚀 COMEÇAR AGORA - 3 PASSOS

## ✅ Está pronto para usar!

O servidor está rodando em: **http://localhost:8000**

---

## 1️⃣ EXECUTAR SQL NO SUPABASE (5 min)

### Copie este SQL:

```sql
-- Remover restrição de CPF único e torná-lo opcional
ALTER TABLE public.rsvps 
  ALTER COLUMN cpf DROP NOT NULL,
  DROP CONSTRAINT IF EXISTS rsvps_cpf_key;

-- Adicionar coluna idade na tabela dependentes
ALTER TABLE public.dependentes 
  ADD COLUMN IF NOT EXISTS idade INTEGER;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_rsvps_telefone ON public.rsvps(telefone);
CREATE INDEX IF NOT EXISTS idx_dependentes_idade ON public.dependentes(idade);

-- Verificar
SELECT 'Tabelas atualizadas com sucesso!' as status;
```

### Cole aqui:
```
1. Abrir: https://supabase.com/dashboard
2. Seu projeto → SQL Editor
3. New query
4. Colar SQL acima
5. RUN (Ctrl + Enter)
```

✅ **Resultado esperado:** `Tabelas atualizadas com sucesso!`

---

## 2️⃣ TESTAR O FORMULÁRIO (2 min)

### No navegador que abriu automaticamente:

1. **Preencher responsável:**
   ```
   Nome: Maria das Flores
   Telefone: (11) 98888-7777
   ```

2. **Clicar em "➕ Adicionar Pessoa"** (2 vezes)

3. **Preencher dependentes:**
   ```
   Pessoa 1:
     Nome: João Silva
     Idade: 8
   
   Pessoa 2:
     Nome: Ana Silva
     Idade: 28
   ```

4. **Clicar em "✅ Confirmar Presença"**

5. **Ver mensagem:**
   ```
   ✅ Confirmação registrada com sucesso!
   Nos vemos no baile! 🎭✨
   ```

---

## 3️⃣ VERIFICAR NO ADMIN (1 min)

### Abrir painel admin:
```
URL: http://localhost:8000/pages/admin-supabase.html
Senha: baile2026thamires
```

### Ver confirmações:
```
✅ Maria das Flores - (11) 98888-7777
   👤 João Silva (8 anos)
   👤 Ana Silva (28 anos)
```

---

## 🧪 TESTAR NO CONSOLE (OPCIONAL)

Pressione **F12** → aba **Console** → digite:

```javascript
// Ver todas as confirmações
supabase.from('rsvps').select('*, dependentes(*)').then(console.log)

// Contar total de pessoas
supabase.from('rsvps').select('id').then(rsvps => {
  supabase.from('dependentes').select('id').then(deps => {
    console.log(`Total: ${rsvps.data.length + deps.data.length} pessoas`);
  });
});
```

---

## 📱 FAZER DEPLOY (QUANDO QUISER)

```bash
git add .
git commit -m "Formulário simplificado com Supabase"
git push
```

Vercel atualiza automaticamente em ~30 segundos! 🚀

---

## ❓ PROBLEMAS?

### "supabase is not defined"
✅ Já resolvido! Use `/pages/confirmacao-simples.html` (não o index.html)

### Erro ao salvar no Supabase
1. Verifique se executou o SQL acima
2. Verifique se as credenciais estão corretas em `js/supabase-config.js`
3. Abra F12 → Console para ver erro detalhado

### Nada aparece no admin
1. Verifique se confirmou presença antes
2. Atualize a página (F5)
3. Veja se senha está correta: `baile2026thamires`

---

## 🎯 RESUMO DO QUE VOCÊ TEM

- ✅ Formulário simplificado (nome + telefone)
- ✅ Botão + para adicionar dependentes (nome + idade)
- ✅ Backend Supabase funcionando
- ✅ Admin panel com senha
- ✅ Servidor local rodando
- ✅ Todos os links atualizados

**Falta só:** Executar SQL no Supabase e testar! 🎉

---

## 📖 DOCUMENTAÇÃO COMPLETA

- **Explicação backend:** `EXPLICACAO_BACKEND.md`
- **SQL atualização:** `ATUALIZACAO_SIMPLIFICADA.md`  
- **Resumo mudanças:** `RESUMO_MUDANCAS.md`
- **Setup Supabase:** `SUPABASE_SETUP_COMPLETO.md`
- **Guia prático:** `GUIA_PRATICO_SUPABASE.md`

---

**Pronto para começar? Execute o SQL e teste! 🚀**
