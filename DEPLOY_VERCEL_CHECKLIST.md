# ✅ CHECKLIST PARA DEPLOY NA VERCEL

## 🎯 SIM, VAI FUNCIONAR NA VERCEL! MAS...

### ⚠️ ANTES DE FAZER PUSH, VOCÊ PRECISA:

## 1️⃣ EXECUTAR SQL NO SUPABASE (OBRIGATÓRIO!)

**Sem isso, o formulário VAI DAR ERRO!**

```sql
-- ========================================
-- COPIE E EXECUTE NO SUPABASE SQL EDITOR
-- ========================================

-- Adicionar coluna idade na tabela rsvps
ALTER TABLE public.rsvps 
  ADD COLUMN IF NOT EXISTS idade INTEGER;

-- Tornar CPF opcional
ALTER TABLE public.rsvps 
  ALTER COLUMN cpf DROP NOT NULL;

-- Remover constraint unique de CPF
ALTER TABLE public.rsvps 
  DROP CONSTRAINT IF EXISTS rsvps_cpf_key;

-- Adicionar coluna idade em dependentes
ALTER TABLE public.dependentes 
  ADD COLUMN IF NOT EXISTS idade INTEGER;

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_rsvps_telefone ON public.rsvps(telefone);
CREATE INDEX IF NOT EXISTS idx_rsvps_idade ON public.rsvps(idade);
CREATE INDEX IF NOT EXISTS idx_dependentes_idade ON public.dependentes(idade);

-- Verificar
SELECT 'Atualização completa! ✅' as status;
```

**Como executar:**
```
1. Abrir: https://supabase.com/dashboard
2. Seu projeto → SQL Editor
3. New query
4. Colar SQL acima
5. RUN (Ctrl + Enter)
6. Ver mensagem: "Atualização completa! ✅"
```

---

## 2️⃣ VERIFICAR CREDENCIAIS SUPABASE

**Arquivo:** `js/supabase-config.js`

```javascript
// Verificar se está preenchido:
const SUPABASE_URL = 'https://lvbgbadewkhmxzczptjy.supabase.co'; // ✅ OK
const SUPABASE_ANON_KEY = 'eyJhbG...'; // ✅ OK (chave longa)
```

✅ **Suas credenciais já estão corretas!**

---

## 3️⃣ FAZER COMMIT E PUSH

```bash
# 1. Ver o que mudou
git status

# 2. Adicionar tudo
git add .

# 3. Commit
git commit -m "Sistema completo: formulário com idade, admin responsivo, imagem do baile"

# 4. Push (Vercel detecta automaticamente)
git push
```

---

## 🚀 O QUE ACONTECE NA VERCEL

### Automático (Vercel faz sozinha):

✅ **Build do projeto**
- HTML/CSS/JS são otimizados
- Imagens são comprimidas
- Cache configurado

✅ **Deploy**
- Site fica online em ~30 segundos
- URL: `https://masquerade-ball.vercel.app` (ou seu domínio)

✅ **HTTPS automático**
- Certificado SSL grátis
- Domínio seguro

✅ **CDN global**
- Site rápido em qualquer lugar do mundo

---

## ✅ O QUE VAI FUNCIONAR

### Frontend (100% OK):
- ✅ Todas as páginas HTML
- ✅ CSS responsivo
- ✅ JavaScript (menu hamburger)
- ✅ Imagens (inclusive baile-hero.jpg)
- ✅ Fontes Google Fonts
- ✅ Ícones e SVGs

### Backend (Supabase - OK):
- ✅ Formulário de confirmação
- ✅ Upload de fotos
- ✅ Votação
- ✅ Admin panel
- ✅ Banco de dados
- ✅ Storage

**Supabase NÃO precisa de configuração extra na Vercel!**
Ele funciona direto do browser.

---

## ⚠️ O QUE PODE DAR ERRO

### ❌ Se NÃO executar o SQL:

**Erro ao confirmar presença:**
```
❌ Error: column "idade" of relation "rsvps" does not exist
```

**Solução:** Executar SQL no Supabase!

---

### ❌ Se credenciais Supabase erradas:

**Erro no console (F12):**
```
❌ Invalid API key
❌ supabase is not defined
```

**Solução:** Verificar `js/supabase-config.js`

---

### ❌ Se imagem muito grande:

**Site demora para carregar**

**Solução:**
```bash
# Comprimir imagem
# TinyPNG.com ou Squoosh.app
# Tamanho ideal: < 300KB
```

---

## 🧪 TESTE ANTES DO DEPLOY

### Local (AGORA):
```bash
# Site rodando em:
http://localhost:8000

# Testar:
1. Formulário com idade ✅
2. Admin panel ✅
3. Imagem do baile aparece ✅
4. Nome Thamires destacado ✅
5. Menu hamburger mobile ✅
```

### Produção (DEPOIS DO PUSH):
```bash
# Vercel vai dar URL tipo:
https://masquerade-ball-abc123.vercel.app

# Testar:
1. Abrir site ✅
2. Confirmar presença ✅
3. Ver no admin ✅
4. Testar no celular real ✅
```

---

## 📱 VERIFICAR NO CELULAR REAL

Depois do deploy:
```
1. Pegar URL da Vercel
2. Abrir no celular
3. Testar:
   - Menu hamburger funciona?
   - Formulário envia?
   - Imagens aparecem?
   - Tudo responsivo?
```

---

## 🎯 ESTRUTURA DO DEPLOY

```
Vercel (Frontend)
├─ index.html
├─ pages/
│  ├─ convite.html
│  ├─ confirmacao-simples.html
│  └─ admin-supabase.html
├─ css/styles.css
├─ js/
│  ├─ main.js
│  ├─ supabase-config.js
│  └─ admin-supabase.js
└─ images/
   └─ baile-hero.jpg ✅

         ↓ ↑
    (conexão HTTPS)
         ↓ ↑

Supabase (Backend)
├─ PostgreSQL
│  ├─ rsvps (com idade!)
│  ├─ dependentes
│  ├─ looks
│  └─ votos
└─ Storage
   └─ looks/
```

---

## 🚀 COMANDOS PARA DEPLOY

```bash
# 1. Verificar se está tudo OK
git status

# 2. Ver arquivos alterados
git diff

# 3. Adicionar tudo
git add .

# 4. Commit com mensagem descritiva
git commit -m "Sistema completo do Baile de Máscaras

- Formulário com idade do responsável
- Admin panel responsivo
- Imagem do baile adicionada
- Nome Thamires destacado com efeito sparkle
- Erro de recursão corrigido
- Mobile-first em todas as páginas"

# 5. Push para GitHub (Vercel detecta)
git push origin main

# 6. Aguardar ~30 segundos
# Vercel envia email quando deploy terminar
```

---

## ✅ AFTER DEPLOY CHECKLIST

Depois que Vercel terminar:

- [ ] Site abre na URL da Vercel?
- [ ] Imagens carregam?
- [ ] Formulário funciona?
- [ ] Admin abre com senha?
- [ ] Mobile menu funciona?
- [ ] Nome Thamires está destacado?
- [ ] Testar no celular real

---

## 🎯 DOMÍNIO PERSONALIZADO (OPCIONAL)

Se quiser URL bonita tipo `bailethamires.com.br`:

```
1. Comprar domínio (Registro.br, Hostinger)
2. Vercel → Settings → Domains
3. Add Domain → Digitar seu domínio
4. Copiar nameservers da Vercel
5. Colar no painel do domínio
6. Aguardar propagação (24h)
```

---

## 💰 CUSTOS

### Vercel:
- ✅ **GRÁTIS** para projetos pessoais
- Limite: 100GB bandwidth/mês
- Suficiente para: ~10.000 visitantes/mês

### Supabase:
- ✅ **GRÁTIS** até 500MB database
- Suficiente para: ~2.000 confirmações
- Storage: 1GB grátis

**Total: R$ 0/mês** 🎉

---

## ⚡ PERFORMANCE ESPERADA

Depois do deploy na Vercel:

- 🚀 **Load time**: < 2 segundos
- 🌍 **Global CDN**: Rápido em qualquer lugar
- 📱 **Mobile**: Otimizado
- 🔒 **HTTPS**: Seguro
- ⚡ **Lighthouse Score**: ~95/100

---

## 🆘 SE DER PROBLEMA NO DEPLOY

### Vercel mostra erro?

**Ver logs:**
```
1. Vercel dashboard
2. Seu projeto → Deployments
3. Clicar no deploy com erro
4. Ver "Build Logs"
```

**Erros comuns:**
- ❌ Build failed → Verificar vercel.json
- ❌ 404 → Verificar caminhos dos arquivos
- ❌ Timeout → Projeto muito grande

### Site não funciona depois do deploy?

**Verificar:**
```
1. F12 → Console → Ver erros JavaScript
2. Network → Ver se arquivos carregam (200 OK)
3. Supabase → Ver se credenciais estão corretas
```

---

## 📞 SUPORTE

### Vercel:
- Docs: https://vercel.com/docs
- Discord: https://vercel.com/discord

### Supabase:
- Docs: https://supabase.com/docs
- Discord: https://discord.supabase.com

---

## 🎭 RESUMO FINAL

### ✅ Vai funcionar na Vercel?
**SIM!** Seu projeto está 100% compatível.

### ⚠️ Mas ANTES precisa:
1. Executar SQL no Supabase (coluna idade)
2. Verificar credenciais em supabase-config.js

### 🚀 Depois disso:
```bash
git add .
git commit -m "Sistema completo"
git push
```

**E pronto!** Site online em 30 segundos! 🎉

---

## 🎯 AGORA FAÇA:

```bash
# 1. Executar SQL no Supabase ← FAÇA ISSO PRIMEIRO!
# 2. Testar local: http://localhost:8000
# 3. Se tudo OK, fazer push
# 4. Vercel faz o resto sozinha!
```

---

🎭✨ **Baile de Máscaras pronto para o mundo!** ✨🎭
