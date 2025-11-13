# 🔧 Solução de Problemas - Sistema de Votação

## ❌ Erro: "column config.votacao_liberada does not exist"

### Causa
A tabela `config` não existe ou não tem a coluna `votacao_liberada` no seu banco Supabase.

### Solução

#### Opção 1: Executar SQL de Criação (Recomendado)

1. Acesse o Supabase Dashboard
2. Vá em **SQL Editor**
3. Execute o arquivo: `SQL_CRIAR_TABELA_CONFIG.sql`

```sql
-- Copie e cole este SQL no Supabase:

CREATE TABLE IF NOT EXISTS public.config (
    id BIGINT PRIMARY KEY DEFAULT 1,
    votacao_liberada BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO public.config (id, votacao_liberada, created_at)
VALUES (1, false, NOW())
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.config ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Permitir leitura pública da config"
ON public.config FOR SELECT
USING (true);

CREATE POLICY IF NOT EXISTS "Permitir modificação da config"
ON public.config FOR ALL
USING (true);
```

4. Clique em **Run**
5. Verifique se foi criado: `SELECT * FROM public.config;`

#### Opção 2: Criar Manualmente via Interface

1. Acesse **Table Editor** no Supabase
2. Clique em **New Table**
3. Nome: `config`
4. Adicione colunas:
   - `id` (int8, primary key, default: 1)
   - `votacao_liberada` (bool, default: false)
   - `created_at` (timestamptz, default: now())
5. Clique em **Save**
6. Vá em **Insert Row** e adicione:
   - id: 1
   - votacao_liberada: false
7. Habilite **RLS** na aba **Policies**
8. Adicione política para SELECT (público)

### Verificar se Funcionou

Após executar o SQL, teste no navegador:

1. Abra o Console (F12)
2. Digite:
```javascript
const { data } = await supabase.from('config').select('*');
console.log(data);
```

Deve retornar:
```javascript
[{ id: 1, votacao_liberada: false, created_at: "..." }]
```

---

## ❌ Menu de Votação Não Aparece/Desaparece

### Causa
O script `menu-votacao.js` não está conseguindo acessar a tabela config.

### Verificações

1. **Tabela config existe?**
   ```sql
   SELECT * FROM public.config;
   ```

2. **RLS está configurado?**
   - Deve permitir leitura pública (SELECT)
   
3. **Script está carregando?**
   - Abra Console (F12) → Network
   - Procure por `menu-votacao.js`
   - Deve carregar sem erro 404

4. **Supabase está configurado?**
   - Verifique `/js/supabase-config.js`
   - URL e KEY corretas?

### Teste Manual

No Console (F12):
```javascript
// Verificar se Supabase está disponível
console.log(typeof supabase); // Deve ser "object"

// Testar query
const { data, error } = await supabase
  .from('config')
  .select('votacao_liberada')
  .single();
  
console.log('Data:', data);
console.log('Error:', error);
```

---

## ❌ Votação Não Libera no Admin

### Causa
A função `liberarVotacaoManual()` não está definida ou há erro ao atualizar.

### Solução

Verifique se a função existe em `/js/supabase-functions.js`:

```javascript
async function liberarVotacaoManual() {
  try {
    const { error } = await supabase
      .from('config')
      .update({ votacao_liberada: true })
      .eq('id', 1);
    
    if (error) throw error;
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

### Liberar Manualmente via SQL

Se o botão não funcionar, execute no SQL Editor:

```sql
UPDATE public.config 
SET votacao_liberada = true 
WHERE id = 1;
```

Verificar:
```sql
SELECT votacao_liberada FROM public.config WHERE id = 1;
```

---

## ❌ Erro 400 (Bad Request)

### Causas Comuns

1. **Coluna não existe**
   - Execute `SQL_CRIAR_TABELA_CONFIG.sql`

2. **RLS bloqueando**
   - Verifique políticas em Table Editor → Policies
   - Deve ter política SELECT pública

3. **Credenciais erradas**
   - Verifique `/js/supabase-config.js`
   - URL e KEY devem ser do seu projeto

### Como Verificar Credenciais

1. Supabase Dashboard → Settings → API
2. Copie:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: `eyJhbGci...`
3. Cole em `/js/supabase-config.js`

---

## ✅ Checklist de Verificação

Antes de usar o sistema, confirme:

- [ ] Tabela `config` existe no Supabase
- [ ] Coluna `votacao_liberada` existe (tipo: boolean)
- [ ] Há um registro com id=1 na tabela
- [ ] RLS está habilitado com política SELECT pública
- [ ] Credenciais corretas em `supabase-config.js`
- [ ] Script `menu-votacao.js` carrega sem erro 404
- [ ] Console não mostra erros relacionados a Supabase

---

## 🆘 Ajuda Adicional

Se ainda tiver problemas:

1. **Verifique Console do Navegador (F12)**
   - Procure por erros em vermelho
   - Anote mensagens de erro completas

2. **Verifique Network Tab**
   - Procure por requests falhando (vermelho)
   - Verifique status code (400, 404, etc)

3. **Teste Queries Diretamente**
   ```javascript
   // No Console (F12)
   const { data, error } = await supabase.from('config').select('*');
   console.log({ data, error });
   ```

4. **Recrie a Tabela**
   ```sql
   -- CUIDADO: Apaga a tabela
   DROP TABLE IF EXISTS public.config CASCADE;
   
   -- Execute novamente SQL_CRIAR_TABELA_CONFIG.sql
   ```
