# 🔥 Guia de Integração Firebase
## Sistema de Votação e RSVP para o Baile de Máscaras

### ⚡ Por que Firebase?
- ✅ **Grátis** para eventos pequenos/médios (50k leituras/dia)
- ✅ **Funciona na Vercel** (serverless, sem VPS)
- ✅ **Storage de imagens** incluído
- ✅ **Tempo real** (atualizações automáticas)
- ✅ **Seguro** (regras de acesso configuráveis)
- ✅ **Zero infraestrutura** para gerenciar

### 📋 Passo a Passo

#### 1. Criar Projeto Firebase (5 min)
```bash
1. Acesse: https://console.firebase.google.com/
2. Clique em "Adicionar projeto"
3. Nome: "baile-mascaras-thamires"
4. Desabilitar Google Analytics (não precisa)
5. Criar projeto
```

#### 2. Ativar Firestore Database (2 min)
```bash
1. No menu lateral: "Firestore Database"
2. Clique "Criar banco de dados"
3. Escolha "Iniciar no modo de teste" (por enquanto)
4. Localização: "southamerica-east1" (São Paulo)
5. Ativar
```

#### 3. Ativar Storage (2 min)
```bash
1. No menu lateral: "Storage"
2. Clique "Começar"
3. Modo de teste (por enquanto)
4. Mesma localização (São Paulo)
5. Concluir
```

#### 4. Configurar Regras de Segurança (5 min)

**Firestore Rules** (em Firestore > Regras):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // RSVPs: qualquer pessoa pode criar, apenas admin pode ler todos
    match /rsvps/{rsvpId} {
      allow create: if request.auth == null; // Público pode criar
      allow read: if request.auth != null; // Apenas autenticados (admin) podem ler
    }
    
    // Looks: qualquer pessoa pode criar e ler
    match /looks/{lookId} {
      allow create: if request.auth == null;
      allow read: if true; // Público pode ver galeria
      allow update, delete: if false; // Ninguém pode editar/deletar
    }
    
    // Votos: público pode criar, admin pode ler
    match /votos/{votoId} {
      allow create: if request.auth == null;
      allow read: if request.auth != null;
    }
  }
}
```

**Storage Rules** (em Storage > Regras):
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /looks/{fileName} {
      allow create: if request.resource.size < 5 * 1024 * 1024 // Max 5MB
                    && request.resource.contentType.matches('image/.*');
      allow read: if true; // Público pode ver fotos
    }
  }
}
```

#### 5. Obter Configuração do Firebase (3 min)
```bash
1. Ícone de engrenagem (⚙️) > "Configurações do projeto"
2. Rolar até "Seus aplicativos"
3. Clicar no ícone "</>" (Web)
4. Nome do app: "baile-web"
5. NÃO marcar Firebase Hosting
6. Copiar o objeto de configuração:
```

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123..."
};
```

#### 6. Adicionar Firebase ao Site (10 min)

**a) Adicionar scripts no HTML** (em todas as páginas que usam Firebase):

```html
<!-- No <head> de votacao.html e confirmacao.html -->
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-storage-compat.js"></script>
```

**b) Criar `/js/firebase-config.js`**:

```javascript
// Configuração Firebase - COLE AQUI OS DADOS DO SEU PROJETO
const firebaseConfig = {
  apiKey: "SUA_API_KEY_AQUI",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto-id",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789",
  appId: "seu-app-id"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Exports
const db = firebase.firestore();
const storage = firebase.storage();
```

**c) Criar `/js/firebase-voting.js`** (substitui localStorage):

```javascript
// Sistema de votação com Firebase
(function(){
  'use strict';
  
  const db = firebase.firestore();
  const storage = firebase.storage();
  
  /* Upload de Look para Firebase */
  async function uploadLook(nome, cpf, descricao, file){
    try {
      // 1. Upload da foto para Storage
      const storageRef = storage.ref(`looks/${Date.now()}_${file.name}`);
      const snapshot = await storageRef.put(file);
      const fotoURL = await snapshot.ref.getDownloadURL();
      
      // 2. Salvar dados no Firestore
      await db.collection('looks').add({
        nome,
        cpf,
        descricao,
        fotoURL,
        votos: 0,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      alert('✨ Look enviado com sucesso!');
      return true;
    } catch(error){
      console.error('Erro ao enviar look:', error);
      alert('Erro ao enviar. Tente novamente.');
      return false;
    }
  }
  
  /* Renderizar galeria do Firebase */
  async function renderGallery(){
    const galeria = document.querySelector('#galeria-looks');
    if(!galeria) return;
    
    try {
      const snapshot = await db.collection('looks')
        .orderBy('timestamp', 'desc')
        .get();
      
      if(snapshot.empty){
        galeria.innerHTML = '<p style="text-align:center;color:var(--muted);padding:40px 0">🎭 Ainda não há looks enviados!</p>';
        return;
      }
      
      galeria.style.display = 'grid';
      galeria.innerHTML = snapshot.docs.map(doc => {
        const look = doc.data();
        return `
          <div class="gallery-item">
            <img src="${look.fotoURL}" alt="Look de ${look.nome}" loading="lazy">
            <div class="gallery-info">
              <h3>${look.nome}</h3>
              <p>${look.descricao || '<em>Sem descrição</em>'}</p>
              <button class="btn primary" onclick="votarEmLook('${doc.id}', '${look.cpf}', '${look.nome}')">
                ⭐ Votar neste Look
              </button>
              <p style="font-size:0.85rem;margin-top:10px">💎 ${look.votos || 0} votos</p>
            </div>
          </div>
        `;
      }).join('');
      
    } catch(error){
      console.error('Erro ao carregar galeria:', error);
    }
  }
  
  /* Votar em look */
  window.votarEmLook = async function(lookId, lookCPF, lookNome){
    const votanteCPF = prompt('Digite seu CPF para votar:');
    if(!votanteCPF) return;
    
    const cpf = votanteCPF.replace(/\D/g, '');
    
    try {
      // Verificar se já votou
      const votoExistente = await db.collection('votos')
        .where('cpfVotante', '==', cpf)
        .get();
      
      if(!votoExistente.empty){
        alert('⚠️ Você já votou! Apenas 1 voto por CPF.');
        return;
      }
      
      // Não pode votar em si mesmo
      if(cpf === lookCPF){
        alert('⚠️ Você não pode votar no seu próprio look!');
        return;
      }
      
      // Registrar voto
      await db.collection('votos').add({
        lookId,
        cpfVotante: cpf,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      // Incrementar contador de votos
      await db.collection('looks').doc(lookId).update({
        votos: firebase.firestore.FieldValue.increment(1)
      });
      
      alert(`✨ Voto confirmado para ${lookNome}!`);
      renderGallery(); // Atualizar
      
    } catch(error){
      console.error('Erro ao votar:', error);
      alert('Erro ao votar. Tente novamente.');
    }
  };
  
  // Init
  document.addEventListener('DOMContentLoaded', renderGallery);
  
  // Expor função de upload
  window.uploadLook = uploadLook;
})();
```

#### 7. Atualizar Formulário de Votação

Em `/pages/votacao.html`, adicionar antes de `</body>`:

```html
<script src="/js/firebase-config.js"></script>
<script src="/js/firebase-voting.js"></script>
```

E modificar o submit do form para usar Firebase:

```javascript
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const nome = form.querySelector('[name="nome"]').value.trim();
  const cpf = form.querySelector('[name="cpf"]').value.replace(/\D/g, '');
  const descricao = form.querySelector('[name="descricao"]').value.trim();
  const file = form.querySelector('#foto-traje').files[0];
  
  if(!file || !nome || !cpf){
    alert('Preencha todos os campos!');
    return;
  }
  
  const success = await window.uploadLook(nome, cpf, descricao, file);
  if(success){
    form.reset();
    document.querySelector('#foto-preview').style.display = 'none';
  }
});
```

### 🎯 Benefícios vs localStorage

| Recurso | localStorage | Firebase |
|---------|-------------|----------|
| **Persistência** | ❌ Local (só no navegador) | ✅ Cloud (permanente) |
| **Multiplataforma** | ❌ Dados isolados | ✅ Sincronizado |
| **Galeria** | ⚠️ Base64 (lento) | ✅ URLs otimizadas |
| **Segurança** | ❌ Pode ser editado | ✅ Regras no servidor |
| **Admin** | ⚠️ Limitado | ✅ Console completo |
| **Backup** | ❌ Manual | ✅ Automático |
| **Custo** | Grátis | Grátis (até 50k/dia) |

### 📊 Visualizar Resultados (Admin)

Acesse o Firebase Console:
1. Firestore Database > aba "Dados"
2. Veja coleções: `looks`, `votos`, `rsvps`
3. Exportar para JSON/CSV quando quiser

Ou crie uma página admin protegida por senha que use:
```javascript
db.collection('looks')
  .orderBy('votos', 'desc')
  .get()
  .then(snapshot => {
    // Mostrar ranking dos looks
  });
```

### 🚀 Deploy na Vercel

Nenhuma mudança necessária! Firebase funciona 100% client-side na Vercel.

```bash
# Só fazer push no Git
git add .
git commit -m "Adiciona Firebase para votação"
git push
```

### 💡 Alternativa Mais Simples

Se não quiser mexer com Firebase agora, você pode:

**Opção A: Google Forms**
- Criar Form para RSVP
- Criar Form para Upload de Look (Google Drive)
- Respostas vão para Google Sheets
- ⚠️ Sem galeria integrada no site

**Opção B: Typeform + Airtable**
- Formulários bonitos
- Airtable armazena dados
- API para mostrar galeria
- 💰 Plano pago pode ser necessário

### ❓ Dúvidas?

**P: Firebase é grátis mesmo?**
R: Sim, até 50 mil leituras/dia. Para um evento com 200 convidados, sobra muito.

**P: Precisa de cartão de crédito?**
R: Não para o plano gratuito (Spark Plan).

**P: E se passar do limite?**
R: Firebase simplesmente para de aceitar requests. Nada é cobrado.

**P: Posso migrar dados do localStorage para Firebase depois?**
R: Sim! Basta ler do localStorage e escrever no Firebase via script.

### 📞 Próximos Passos

1. ✅ Criar projeto Firebase (5 min)
2. ✅ Ativar Firestore + Storage (3 min)
3. ✅ Configurar regras (5 min)
4. ✅ Copiar config e adicionar ao site (10 min)
5. ✅ Testar upload e votação (5 min)
6. ✅ Deploy na Vercel (2 min)

**Tempo total: ~30 minutos** ⏱️

---

Qualquer dúvida, me avise! 🎭✨
