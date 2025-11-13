# ✅ Checklist de Deploy - Baile de Máscaras

## 📋 Antes do Deploy

### 1. Configuração do Supabase

- [ ] **Criar projeto** no [supabase.com](https://supabase.com)
- [ ] **Executar SQL principal** (SUPABASE_SQL.sql)
  - Cria tabelas: rsvps, dependentes, looks, votos, config
  - Configura RLS (políticas de segurança)
  - Cria bucket de storage
- [ ] **Executar SQL adicional** (SUPABASE_SQL_ADICIONAL.sql)
  - Função incrementar_votos()
  - Índices de performance
  - Ajustes de schema
- [ ] **Verificar bucket 'looks'**
  - Nome: `looks`
  - Público: ✅ Ativado
  - MIME types: `image/*`
- [ ] **Copiar credenciais**
  - URL do projeto
  - Anon/Public key
- [ ] **Configurar `/js/supabase-config.js`**
  ```javascript
  const SUPABASE_URL = 'https://seu-projeto.supabase.co';
  const SUPABASE_KEY = 'eyJhbGc...sua-key';
  ```

### 2. Verificações Locais

- [ ] **Testar modais**
  - Abrir console (F12)
  - Digitar: `showSuccess('Teste', 'Funcionou!')`
  - Deve aparecer modal verde
- [ ] **Verificar imagens**
  - `/images/baile-hero.jpg` existe
  - `/images/favicon.svg` existe
  - `/images/flourish.svg` existe
- [ ] **Checar links de menu**
  - Todas as páginas acessíveis
  - Menu hamburger funciona no mobile

### 3. Configurações do Sistema

- [ ] **Senha do admin**
  - Padrão: `baile2026thamires`
  - Alterar em `/js/admin-supabase.js` se necessário
- [ ] **Data do evento**
  - Padrão: 21/02/2026 20:00
  - Alterar countdown em `index.html` se necessário
- [ ] **Votação bloqueada**
  - Verificar no Supabase: `SELECT * FROM config;`
  - `votacao_liberada` deve ser `false`

## 🚀 Deploy no Vercel

### Opção 1: Via CLI

```bash
# 1. Instalar Vercel CLI (se não tiver)
npm i -g vercel

# 2. Login
vercel login

# 3. Deploy
cd /home/luizfelipe/Projects/Pessoal/baile/masquerade-ball
vercel

# 4. Deploy para produção
vercel --prod
```

### Opção 2: Via GitHub

- [ ] **Commit e push**
  ```bash
  git add .
  git commit -m "Sistema completo com modals e votação"
  git push origin main
  ```
- [ ] **Conectar no Vercel**
  - Acessar [vercel.com](https://vercel.com)
  - Import Git Repository
  - Selecionar repositório
  - Deploy automático

### Checklist Pós-Deploy

- [ ] **Acessar URL do Vercel**
- [ ] **Testar homepage**
  - Countdown funcionando
  - Imagem hero aparecendo
  - Nome "Thamires Feres" com efeito dourado
- [ ] **Testar menu**
  - Todas as páginas carregam
  - Menu hamburger funciona no mobile
- [ ] **Testar confirmação**
  - Acessar `/pages/confirmacao-simples.html`
  - Preencher formulário
  - Adicionar dependente
  - Enviar confirmação
  - Deve mostrar modal de sucesso
- [ ] **Testar admin**
  - Acessar `/pages/admin-supabase.html`
  - Login com senha
  - Ver estatísticas (deve mostrar 1 confirmação do teste)
  - Testar export CSV (deve baixar arquivo)
- [ ] **Testar votação (bloqueada)**
  - Acessar `/pages/votacao.html`
  - Deve mostrar mensagem "Votação bloqueada"
  - Botão de envio deve estar desabilitado
- [ ] **Testar responsividade**
  - Abrir DevTools (F12)
  - Toggle device toolbar (Ctrl+Shift+M)
  - Testar em iPhone, iPad, Desktop

## 📱 Testes no Mobile Real

- [ ] **iPhone/iOS**
  - Safari: formulários funcionam
  - Chrome iOS: modais aparecem
  - Tirar foto com câmera funciona
- [ ] **Android**
  - Chrome: tudo funciona
  - Samsung Internet: compatível
  - Tirar foto funciona

## 🎯 Na Noite do Evento

### Preparação (1 hora antes)

- [ ] **Admin faz login**
  - `/pages/admin-supabase.html`
  - Senha: `baile2026thamires`
- [ ] **Verificar confirmações**
  - Quantas pessoas confirmadas
  - Exportar CSV backup
- [ ] **Preparar anúncio**
  - Abrir tab com resultados
  - Manter em standby

### Durante o Evento

#### Parte 1: Liberação da Votação

- [ ] **Admin clica "Liberar Votação"**
- [ ] **Confirmar no modal**
- [ ] **Avisar convidados** (WhatsApp, anúncio, etc.)
  - "A votação está aberta!"
  - "Enviem seus looks em [URL]/pages/votacao.html"
  - "Votem nos melhores trajes!"

#### Parte 2: Acompanhamento

- [ ] **Monitorar galeria**
  - Verificar looks sendo enviados
  - Contadores de votos atualizando
- [ ] **Refresh periódico**
  - A cada 10-15 minutos
  - Ver ranking atualizado

#### Parte 3: Encerramento

- [ ] **Admin bloqueia votação**
  - Quando decidir encerrar
  - Clica "Bloquear Votação"
- [ ] **Ver resultado final**
  - Tab "Resultados"
  - Ordenado por votos (maior → menor)
  - 🥇🥈🥉 Top 3 destacados
- [ ] **Fazer anúncio oficial**
  - "O Diamante da Temporada é..."
  - Chamar vencedor(a)
  - Entregar prêmio

### Pós-Evento

- [ ] **Exportar CSV final**
  - Todas confirmações
  - Backup dos dados
- [ ] **Backup das fotos** (Supabase Storage)
  - Acessar Storage no Supabase
  - Bucket `looks`
  - Download de todas as fotos
- [ ] **Opcional: Deixar galeria aberta**
  - Para pessoas reverem as fotos
  - Bloquear envios/votos, mas deixar visualização

## 🐛 Troubleshooting

### Problema: "Erro ao conectar com Supabase"

**Solução**:
1. Verificar credenciais em `/js/supabase-config.js`
2. Confirmar que URL e KEY estão corretas
3. Testar no Supabase SQL Editor: `SELECT * FROM config;`

### Problema: "Looks não aparecem no admin"

**Solução**:
1. Abrir console (F12)
2. Executar:
   ```javascript
   const { data } = await supabase.from('looks').select('*');
   console.log(data);
   ```
3. Se vazio: nenhum look foi enviado ainda
4. Se erro: problema de RLS ou tabela

### Problema: "Não consigo votar"

**Solução**:
1. Verificar se votação está liberada:
   ```sql
   SELECT votacao_liberada FROM config WHERE id = 1;
   ```
2. Deve ser `true`
3. Se `false`, admin deve liberar pelo painel

### Problema: "CSV não baixa"

**Solução**:
1. Verificar bloqueador de popups do navegador
2. Permitir downloads do site
3. Tentar em navegador diferente (Chrome)
4. Verificar se há dados:
   ```javascript
   const { data } = await supabase.from('rsvps').select('*');
   console.log(data.length); // Deve ser > 0
   ```

### Problema: "Foto não envia"

**Solução**:
1. Verificar tamanho da foto (max 5MB recomendado)
2. Confirmar bucket 'looks' é público
3. Testar permissões do Storage no Supabase
4. Verificar MIME types permitidos

### Problema: "Modal não aparece"

**Solução**:
1. Verificar se `/js/modals.js` está carregando
2. Console (F12) → Network → procurar `modals.js`
3. Se 404: corrigir caminho do script
4. Testar manualmente: `showSuccess('Teste', 'OK')`

## 📞 Contatos de Emergência

### Durante o Evento

- **Admin principal**: [telefone]
- **Suporte técnico**: [telefone/email]
- **Backup de admin**: [telefone]

### Links Importantes

- **Site**: https://seu-site.vercel.app
- **Admin**: https://seu-site.vercel.app/pages/admin-supabase.html
- **Votação**: https://seu-site.vercel.app/pages/votacao.html
- **Supabase Dashboard**: https://app.supabase.com/project/seu-projeto

## ✨ Checklist Final

Antes de considerar PRONTO:

- [ ] ✅ Tudo testado localmente
- [ ] ✅ Deploy no Vercel funcionando
- [ ] ✅ Confirmações salvando no banco
- [ ] ✅ Admin consegue ver dados
- [ ] ✅ CSV exporta corretamente
- [ ] ✅ Votação bloqueada (para liberar depois)
- [ ] ✅ Site responsivo no mobile
- [ ] ✅ Modais funcionando em todas as páginas
- [ ] ✅ Fotos podem ser enviadas (quando liberado)
- [ ] ✅ Senha do admin definida
- [ ] ✅ Link compartilhado com convidados

---

## 🎉 Pronto para o Baile!

Sistema completo e testado.  
Senha admin: `baile2026thamires`  
Data: 21/02/2026 às 20:00  

🎭 **Que seja uma noite inesquecível!** 🎭
