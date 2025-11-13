# 🚀 Guia Completo - Supabase para Baile de Máscaras

## 📋 Índice
1. [Criar Projeto Supabase](#1-criar-projeto-supabase)
2. [Criar Tabelas](#2-criar-tabelas)
3. [Configurar Storage](#3-configurar-storage)
4. [Políticas de Segurança (RLS)](#4-políticas-de-segurança-rls)
5. [Integrar no Site](#5-integrar-no-site)
6. [Testar](#6-testar)

---

## 1. Criar Projeto Supabase (5 min)

### Passo 1: Criar Conta
```
1. Acesse: https://supabase.com
2. Clique em "Start your project"
3. Login com GitHub (recomendado) ou email
4. Verificar email se necessário
```

### Passo 2: Criar Projeto
```
1. Clique "New Project"
2. Nome: "baile-mascaras-thamires"
3. Database Password: baile2026thamires (GUARDE ESTA SENHA!)
4. Region: South America (São Paulo)
5. Pricing Plan: Free (R$ 0/mês)
6. Create new project
```

⏱️ **Aguardar 2-3 minutos** enquanto o projeto é provisionado.

---

## 2. Criar Tabelas (10 min)

### Opção A: SQL Editor (Recomendado - Copia e Cola)

No painel Supabase:
1. Menu lateral: **SQL Editor**
2. Click **+ New query**
3. Cole o SQL abaixo:

```sql
-- ===== TABELA: rsvps (Confirmações de Presença) =====
CREATE TABLE public.rsvps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  cpf TEXT NOT NULL UNIQUE,
  email TEXT,
  telefone TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== TABELA: dependentes (Acompanhantes) =====
CREATE TABLE public.dependentes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rsvp_id UUID REFERENCES public.rsvps(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('adulto', 'crianca')),
  idade INTEGER, -- Obrigatório para crianças
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== TABELA: looks (Fotos dos Trajes) =====
CREATE TABLE public.looks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  cpf TEXT NOT NULL UNIQUE,
  descricao TEXT,
  foto_url TEXT NOT NULL,
  votos INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== TABELA: votos (Registro de Votações) =====
CREATE TABLE public.votos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  look_id UUID REFERENCES public.looks(id) ON DELETE CASCADE,
  cpf_votante TEXT NOT NULL UNIQUE, -- 1 voto por CPF
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== TABELA: config (Configurações do Sistema) =====
CREATE TABLE public.config (
  chave TEXT PRIMARY KEY,
  valor TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir configuração de horário de liberação da votação
INSERT INTO public.config (chave, valor) VALUES
  ('votacao_liberada', 'false'),
  ('votacao_inicio', '2026-02-21T20:00:00-03:00');

-- ===== ÍNDICES para Performance =====
CREATE INDEX idx_rsvps_cpf ON public.rsvps(cpf);
CREATE INDEX idx_looks_cpf ON public.looks(cpf);
CREATE INDEX idx_votos_cpf ON public.votos(cpf_votante);
CREATE INDEX idx_votos_look ON public.votos(look_id);
CREATE INDEX idx_dependentes_rsvp ON public.dependentes(rsvp_id);
```

4. Clique **Run** (Ctrl + Enter)
5. Verificar: "Success. No rows returned"

---

## 3. Configurar Storage (5 min)

### Criar Bucket para Fotos

1. Menu lateral: **Storage**
2. Click **New bucket**
3. Name: `looks`
4. Public bucket: **✅ SIM** (para galeria pública)
5. Create bucket

### Políticas de Storage

No bucket `looks`, clique **Policies** e adicione:

```sql
-- Permitir upload (INSERT)
CREATE POLICY "Público pode fazer upload de fotos"
ON storage.objects FOR INSERT
TO public
WITH CHECK (
  bucket_id = 'looks' AND
  (storage.foldername(name))[1] = 'trajes'
);

-- Permitir visualização (SELECT)
CREATE POLICY "Público pode ver fotos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'looks');
```

---

## 4. Políticas de Segurança (RLS) (10 min)

### Ativar RLS (Row Level Security)

Para cada tabela:
1. Menu: **Database** > **Tables**
2. Selecionar tabela
3. **Enable RLS**

### Adicionar Políticas

No **SQL Editor**, execute:

```sql
-- ===== POLÍTICAS: rsvps =====

-- Qualquer pessoa pode criar RSVP
CREATE POLICY "Público pode criar RSVP"
ON public.rsvps FOR INSERT
TO public
WITH CHECK (true);

-- Qualquer pessoa pode ler RSVPs (para admin)
CREATE POLICY "Público pode ver RSVPs"
ON public.rsvps FOR SELECT
TO public
USING (true);

-- ===== POLÍTICAS: dependentes =====

CREATE POLICY "Público pode adicionar dependentes"
ON public.dependentes FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Público pode ver dependentes"
ON public.dependentes FOR SELECT
TO public
USING (true);

-- ===== POLÍTICAS: looks =====

-- Criar look (1 por CPF)
CREATE POLICY "Público pode enviar look"
ON public.looks FOR INSERT
TO public
WITH CHECK (true);

-- Ver looks (galeria pública)
CREATE POLICY "Público pode ver looks"
ON public.looks FOR SELECT
TO public
USING (true);

-- Atualizar contador de votos (via função)
CREATE POLICY "Sistema pode atualizar votos"
ON public.looks FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- ===== POLÍTICAS: votos =====

CREATE POLICY "Público pode votar"
ON public.votos FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Público pode ver votos"
ON public.votos FOR SELECT
TO public
USING (true);

-- ===== POLÍTICAS: config =====

CREATE POLICY "Público pode ver config"
ON public.config FOR SELECT
TO public
USING (true);

-- Apenas service_role pode alterar config
CREATE POLICY "Admin pode alterar config"
ON public.config FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);
```

---

## 5. Integrar no Site (15 min)

### Passo 1: Obter Credenciais

1. Menu: **Settings** > **API**
2. Copiar:
   - **Project URL**: `https://xyz.supabase.co`
   - **anon public key**: `eyJhbGc...` (chave longa)

### Passo 2: Criar arquivo de configuração

Criar `/js/supabase-config.js`:

```javascript
// ⚠️ COLE SUAS CREDENCIAIS AQUI
const SUPABASE_URL = 'https://SEU_PROJETO.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

// Inicializar Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

### Passo 3: Adicionar SDK do Supabase

Em **TODAS** as páginas HTML, adicionar no `<head>`:

```html
<!-- Supabase SDK -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="/js/supabase-config.js"></script>
```

### Passo 4: Criar funções de integração

Criar `/js/supabase-functions.js`:

```javascript
// ========== RSVP COM DEPENDENTES ==========

async function salvarRSVP(dados) {
  try {
    // 1. Inserir titular
    const { data: rsvp, error: rsvpError } = await supabase
      .from('rsvps')
      .insert([{
        nome: dados.nome,
        cpf: dados.cpf,
        email: dados.email,
        telefone: dados.telefone,
        observacoes: dados.observacoes
      }])
      .select()
      .single();

    if (rsvpError) {
      if (rsvpError.code === '23505') { // Unique violation
        throw new Error('Este CPF já confirmou presença!');
      }
      throw rsvpError;
    }

    // 2. Inserir dependentes se houver
    if (dados.dependentes && dados.dependentes.length > 0) {
      const dependentesData = dados.dependentes.map(dep => ({
        rsvp_id: rsvp.id,
        nome: dep.nome,
        tipo: dep.tipo,
        idade: dep.idade || null
      }));

      const { error: depError } = await supabase
        .from('dependentes')
        .insert(dependentesData);

      if (depError) throw depError;
    }

    return { success: true, data: rsvp };
  } catch (error) {
    console.error('Erro ao salvar RSVP:', error);
    return { success: false, error: error.message };
  }
}

// ========== VERIFICAR SE VOTAÇÃO ESTÁ LIBERADA ==========

async function verificarVotacaoLiberada() {
  try {
    const { data, error } = await supabase
      .from('config')
      .select('valor')
      .eq('chave', 'votacao_liberada')
      .single();

    if (error) throw error;

    return data.valor === 'true';
  } catch (error) {
    console.error('Erro ao verificar votação:', error);
    // Se falhar, verificar por horário
    const now = new Date();
    const eventDate = new Date('2026-02-21T20:00:00-03:00');
    return now >= eventDate;
  }
}

// ========== ENVIAR LOOK ==========

async function enviarLook(nome, cpf, descricao, file) {
  try {
    // 1. Verificar se votação está liberada
    const liberada = await verificarVotacaoLiberada();
    if (!liberada) {
      throw new Error('A galeria de looks será liberada apenas na noite do evento!');
    }

    // 2. Upload da foto
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `trajes/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('looks')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    // 3. Obter URL pública
    const { data: urlData } = supabase.storage
      .from('looks')
      .getPublicUrl(filePath);

    // 4. Salvar no banco
    const { data, error } = await supabase
      .from('looks')
      .insert([{
        nome,
        cpf,
        descricao,
        foto_url: urlData.publicUrl
      }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error('Este CPF já enviou um look!');
      }
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('Erro ao enviar look:', error);
    return { success: false, error: error.message };
  }
}

// ========== CARREGAR GALERIA ==========

async function carregarGaleria() {
  try {
    const { data: looks, error } = await supabase
      .from('looks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { success: true, looks };
  } catch (error) {
    console.error('Erro ao carregar galeria:', error);
    return { success: false, looks: [] };
  }
}

// ========== VOTAR EM LOOK ==========

async function votarEmLook(lookId, lookCPF, cpfVotante) {
  try {
    // Não pode votar em si mesmo
    if (lookCPF === cpfVotante) {
      throw new Error('Você não pode votar no seu próprio look!');
    }

    // Registrar voto
    const { error: votoError } = await supabase
      .from('votos')
      .insert([{
        look_id: lookId,
        cpf_votante: cpfVotante
      }]);

    if (votoError) {
      if (votoError.code === '23505') {
        throw new Error('Você já votou! Apenas 1 voto por CPF.');
      }
      throw votoError;
    }

    // Incrementar contador
    const { error: updateError } = await supabase.rpc('incrementar_votos', {
      look_id_param: lookId
    });

    if (updateError) {
      // Fallback: update manual
      const { data: look } = await supabase
        .from('looks')
        .select('votos')
        .eq('id', lookId)
        .single();

      await supabase
        .from('looks')
        .update({ votos: (look?.votos || 0) + 1 })
        .eq('id', lookId);
    }

    return { success: true };
  } catch (error) {
    console.error('Erro ao votar:', error);
    return { success: false, error: error.message };
  }
}

// ========== CARREGAR RSVPs (ADMIN) ==========

async function carregarRSVPs() {
  try {
    const { data: rsvps, error: rsvpError } = await supabase
      .from('rsvps')
      .select(`
        *,
        dependentes (*)
      `)
      .order('created_at', { ascending: false });

    if (rsvpError) throw rsvpError;

    return { success: true, rsvps };
  } catch (error) {
    console.error('Erro ao carregar RSVPs:', error);
    return { success: false, rsvps: [] };
  }
}

// ========== LIBERAR VOTAÇÃO MANUALMENTE (ADMIN) ==========

async function liberarVotacao() {
  try {
    const { error } = await supabase
      .from('config')
      .update({ valor: 'true', updated_at: new Date().toISOString() })
      .eq('chave', 'votacao_liberada');

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Erro ao liberar votação:', error);
    return { success: false, error: error.message };
  }
}
```

### Passo 5: Criar função SQL para incrementar votos

No **SQL Editor**:

```sql
-- Função para incrementar votos atomicamente
CREATE OR REPLACE FUNCTION incrementar_votos(look_id_param UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.looks
  SET votos = votos + 1
  WHERE id = look_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 6. Testar (5 min)

### Teste 1: Conexão

No console do navegador (F12):

```javascript
// Testar conexão
supabase.from('rsvps').select('count').then(console.log);
// Deve retornar: {data: [{count: 0}], error: null}
```

### Teste 2: RSVP

```javascript
salvarRSVP({
  nome: 'João Teste',
  cpf: '12345678901',
  email: 'joao@teste.com',
  telefone: '(11) 98888-7777',
  dependentes: [
    { nome: 'Maria Teste', tipo: 'adulto' },
    { nome: 'Pedro Teste', tipo: 'crianca', idade: 8 }
  ]
}).then(console.log);
```

### Teste 3: Ver dados no Supabase

1. Menu: **Table Editor**
2. Selecionar tabela `rsvps`
3. Ver registro criado
4. Verificar `dependentes` (filtrar por `rsvp_id`)

---

## 🔐 Senha Admin

**Rota**: `/pages/admin-supabase.html`  
**Senha**: `baile2026thamires`

(A senha é validada apenas no frontend para simplicidade)

---

## 📊 Painel Admin - Funcionalidades

1. **Ver Confirmações**
   - Nome + Telefone
   - Dependentes (adultos e crianças com idades)
   - Total de confirmados

2. **Liberar Votação Manualmente**
   - Botão para liberar antes do horário automático
   - Útil para testes ou ajustes

3. **Ver Resultados da Votação**
   - Ranking de looks por votos
   - Total de votos por participante

4. **Exportar CSV**
   - Lista completa para planilha

---

## 🎯 Vantagens do Supabase vs localStorage

| Recurso | localStorage | Supabase |
|---------|-------------|----------|
| Sincronização | ❌ Local | ✅ Tempo real |
| Backup | ❌ Nenhum | ✅ Automático |
| Segurança | ❌ Fraca | ✅ RLS + Policies |
| Fotos | Base64 (lento) | ✅ CDN otimizado |
| Admin | ⚠️ Limitado | ✅ Dashboard completo |
| Dependentes | ⚠️ Complexo | ✅ Relações SQL |
| Custo | Grátis | Grátis até 500MB |

---

## ⚠️ Limites do Plano Grátis

- **Storage**: 1 GB
- **Database**: 500 MB
- **Bandwidth**: 2 GB/mês
- **Requests**: Ilimitadas*

*Para um evento com 200 pessoas, sobra muito!

---

## 🚀 Deploy (Vercel)

Não precisa mudar nada! Supabase funciona 100% client-side.

```bash
git add .
git commit -m "Integração Supabase completa"
git push
```

---

## 📞 Troubleshooting

### Erro: "row-level security policy"
**Solução**: Verificar se RLS está ativado e políticas criadas.

### Erro: "JWT expired"
**Solução**: Chave ANON_KEY nunca expira. Verificar se copiou correta.

### Upload de foto falha
**Solução**: Verificar se bucket é público e políticas de storage estão ok.

### Votação não libera
**Solução**: Verificar tabela `config` ou usar botão manual no admin.

---

## ✅ Checklist Final

- [ ] Projeto Supabase criado
- [ ] 5 tabelas criadas (rsvps, dependentes, looks, votos, config)
- [ ] Bucket `looks` criado (público)
- [ ] RLS ativado em todas as tabelas
- [ ] Políticas de segurança aplicadas
- [ ] Credenciais copiadas para `supabase-config.js`
- [ ] SDK adicionado nos HTMLs
- [ ] Testado no console
- [ ] Senha admin documentada: `baile2026thamires`

---

**Próximo passo**: Atualizar os arquivos HTML/JS para usar essas funções! 🎭✨
