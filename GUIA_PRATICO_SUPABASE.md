# 🎯 GUIA PRÁTICO: CONFIGURAR SUPABASE (PASSO A PASSO)

## 📍 VOCÊ ESTÁ AQUI

Você já criou a **Storage** no Supabase e agora precisa:
1. ✅ Configurar políticas de acesso (quem pode fazer upload/download)
2. ✅ Pegar as credenciais (URL + Chave)
3. ✅ Executar os comandos SQL

---

## 🗄️ PARTE 1: POLÍTICAS DE STORAGE (O QUE É ISSO?)

### O que são políticas?

**RLS (Row Level Security)** = sistema de permissões do Supabase

Imagine a Storage como uma **caixa de fotos**:
- ❌ **SEM políticas**: Ninguém consegue colocar ou ver fotos
- ✅ **COM políticas**: Você define quem pode fazer o quê

### Por que preciso disso?

Por padrão, o Supabase **bloqueia tudo** por segurança. Você precisa dizer:
- ✅ "Qualquer pessoa pode fazer upload de fotos"
- ✅ "Qualquer pessoa pode ver as fotos"

---

## 🛠️ PARTE 2: COMO CONFIGURAR STORAGE (CLIQUE A CLIQUE)

### Passo 1: Acessar a Storage

```
1. Abra seu projeto Supabase
2. Menu lateral → **Storage**
3. Você vai ver o bucket "looks" que já criou
```

### Passo 2: Configurar Políticas de Storage

```
1. Clique no bucket "looks"
2. Clique na aba **Policies** (políticas)
3. Clique em **New Policy**
```

Agora você vai criar **2 políticas**:

---

### 📤 **POLÍTICA 1: Permitir Upload**

```
1. Clique em "New Policy"
2. Escolha template: "Custom policy"
3. Preencha:

Nome da política:
  public_upload

Target roles:
  ☑️ public (deixe marcado)

Policy command:
  ☑️ INSERT (deixe marcado)

Policy definition (campo SQL):
  true

4. Clique em "Review"
5. Clique em "Save policy"
```

**O que isso faz?** Permite que qualquer pessoa faça upload de fotos.

---

### 📥 **POLÍTICA 2: Permitir Download**

```
1. Clique em "New Policy" novamente
2. Escolha template: "Custom policy"
3. Preencha:

Nome da política:
  public_select

Target roles:
  ☑️ public (deixe marcado)

Policy command:
  ☑️ SELECT (deixe marcado)

Policy definition (campo SQL):
  true

4. Clique em "Review"
5. Clique em "Save policy"
```

**O que isso faz?** Permite que qualquer pessoa veja/baixe as fotos.

---

### ✅ Confirmar que está certo

Você deve ver **2 políticas** na aba Policies:
- ✅ `public_upload` - INSERT - Target: public
- ✅ `public_select` - SELECT - Target: public

---

## 📋 PARTE 3: EXECUTAR COMANDOS SQL (CRIAR TABELAS)

### Passo 1: Abrir SQL Editor

```
1. Menu lateral → **SQL Editor**
2. Clique em **New query**
3. Você vai ver um editor em branco
```

### Passo 2: Copiar e Executar SQL das Tabelas

```
1. Abra o arquivo: SUPABASE_SETUP_COMPLETO.md
2. Vá até a seção "PASSO 2: Criar Tabelas"
3. Copie TODO o SQL (desde CREATE TABLE rsvps até o final)
4. Cole no SQL Editor do Supabase
5. Clique em "RUN" (ou Ctrl + Enter)
```

**Você vai ver**:
```
Success. No rows returned.
```

✅ **Isso significa que deu certo!**

### Passo 3: Verificar se as tabelas foram criadas

```
1. Menu lateral → **Database** → **Tables**
2. Você deve ver 5 tabelas:
   - rsvps
   - dependentes
   - looks
   - votos
   - config
```

---

## 🔑 PARTE 4: PEGAR AS CREDENCIAIS

### Onde encontrar?

```
1. Menu lateral → **Settings** (ícone de engrenagem)
2. Clique em **API**
3. Você vai ver uma página com informações
```

### O que copiar?

Você precisa de **2 coisas**:

#### 1️⃣ **Project URL**
```
Aparece assim:
URL: https://abcdefghijk.supabase.co
```
**Copie essa URL completa!**

#### 2️⃣ **anon public key**
```
Aparece assim:
anon public: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJz...
(uma chave GIGANTE com ~300 caracteres)
```
**Copie essa chave INTEIRA!** (role a tela se precisar)

---

## 💻 PARTE 5: COLAR NO CÓDIGO

### Passo 1: Abrir o arquivo de configuração

No VS Code:
```
Abra o arquivo: js/supabase-config.js
```

### Passo 2: Substituir os valores

Você vai ver isso:

```javascript
// ⚠️ COLE SUAS CREDENCIAIS AQUI
const SUPABASE_URL = 'https://SEU_PROJETO.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGc...COLE_SUA_CHAVE_AQUI';
```

**SUBSTITUA**:

```javascript
// ✅ SUAS CREDENCIAIS REAIS
const SUPABASE_URL = 'https://abcdefghijk.supabase.co'; // Cole sua URL aqui
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJz...'; // Cole sua chave COMPLETA aqui

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

### Passo 3: Salvar

```
Ctrl + S ou Cmd + S
```

---

## 🧪 PARTE 6: TESTAR SE FUNCIONOU

### Teste 1: Abrir Console do Navegador

```
1. Abra seu site localmente: http://localhost:8000
2. Pressione F12 (Ferramentas do Desenvolvedor)
3. Vá na aba "Console"
4. Digite e pressione Enter:

supabase
```

**Se aparecer** um objeto com várias propriedades = ✅ **Conectado!**

**Se aparecer** "supabase is not defined" = ❌ Recarregue a página

---

### Teste 2: Verificar Storage

No console, digite:

```javascript
supabase.storage.from('looks').list()
```

Pressione Enter.

**Se aparecer**:
```javascript
Promise { <pending> }
▶ {data: Array(0), error: null}
```

✅ **Storage funcionando!** (array vazio é normal, ainda não tem fotos)

**Se aparecer erro** com "Invalid API key":
- Verifique se copiou as credenciais certinho
- Verifique se não tem espaço em branco extra

---

### Teste 3: Testar Inserção de RSVP

No console, digite:

```javascript
supabase.from('rsvps').insert({
  nome: 'Teste',
  cpf: '12345678901',
  telefone: '11999999999',
  email: 'teste@teste.com'
}).then(r => console.log(r))
```

**Se aparecer**:
```javascript
{data: [{id: "uuid-aqui", nome: "Teste", ...}], error: null}
```

✅ **Banco de dados funcionando!**

**Para limpar o teste**:
```
1. Menu Supabase → Database → Tables
2. Clique em "rsvps"
3. Encontre a linha "Teste"
4. Clique no ícone de lixeira 🗑️
```

---

## 📊 VISUAL: RESUMO DO FLUXO

```
VOCÊ → Faz upload de foto
  ↓
NAVEGADOR → Envia para Supabase Storage
  ↓
SUPABASE → Verifica políticas
  ↓
  Tem política "public_upload"? ✅ SIM
  ↓
SUPABASE → Salva a foto
  ↓
SUPABASE → Retorna URL pública
  ↓
JAVASCRIPT → Salva URL no banco de dados (tabela looks)
  ↓
GALERIA → Mostra a foto para todos
```

---

## ❓ FAQ - DÚVIDAS COMUNS

### 1. "Política" é necessária mesmo?

**Sim!** Sem política, você vai ter erros tipo:
```
Error: new row violates row-level security policy
```

### 2. Por que `true` na política?

```sql
Policy definition: true
```

Significa: **sempre permitir** (sem condições)

Se você quisesse restringir, poderia fazer:
```sql
-- Exemplo: só fotos menores que 5MB
(storage.foldername(name))[1] = 'trajes' AND 
octet_length(content) < 5000000
```

Mas para simplificar, usamos `true` = permitir tudo.

### 3. Qual a diferença entre Storage e Database?

**Storage** = guarda **arquivos** (fotos, PDFs, vídeos)
- Bucket "looks" → fotos dos trajes

**Database** = guarda **dados** (texto, números)
- Tabela "rsvps" → nome, CPF, telefone
- Tabela "looks" → URL da foto, votos

### 4. E se eu quiser bloquear a galeria depois?

Você pode **deletar a política** `public_select`:
```
1. Storage → looks → Policies
2. Clique no ícone de lixeira ao lado de "public_select"
```

Assim ninguém mais consegue ver as fotos (mas já votados permanecem).

### 5. Como apagar todas as fotos da Storage?

```
1. Storage → looks
2. Pasta "trajes" → selecionar todas
3. Botão "Delete" no topo
```

---

## 🎯 CHECKLIST FINAL

Antes de continuar, confirme:

- [ ] Storage "looks" criado e **público**
- [ ] 2 políticas de Storage criadas (upload + select)
- [ ] 5 tabelas criadas via SQL (rsvps, dependentes, looks, votos, config)
- [ ] Políticas RLS das tabelas criadas via SQL
- [ ] Credenciais copiadas (URL + anon key)
- [ ] `js/supabase-config.js` atualizado com suas credenciais
- [ ] Teste no console: `supabase` retorna objeto ✅
- [ ] Teste de inserção funcionou ✅

---

## 🚀 PRÓXIMOS PASSOS

Agora que o Supabase está configurado, você pode:

1. **Testar o formulário de confirmação**:
   - Abrir `/pages/confirmacao-nova.html`
   - Preencher e enviar
   - Verificar se salvou no Supabase (Database → Tables → rsvps)

2. **Acessar o admin**:
   - Abrir `/pages/admin-supabase.html`
   - Senha: `baile2026thamires`
   - Ver as confirmações

3. **Fazer deploy na Vercel**:
   ```bash
   git add .
   git commit -m "Configuração Supabase completa"
   git push
   ```

---

## 📞 PRECISA DE AJUDA?

Se algo não funcionar, me mande:
1. ✅ Print da aba **Policies** da Storage
2. ✅ Print da aba **Tables** (mostrando as 5 tabelas)
3. ✅ Mensagem de erro no console (F12 → Console)

Assim consigo te ajudar rapidinho! 🎯
