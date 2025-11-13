# 📸 COMO ADICIONAR A IMAGEM DO BAILE

## 🎯 A imagem que você enviou

![Baile de Máscaras](../attachments/masquerade-ball-hero.jpg)

Essa linda imagem de uma mulher com máscara em um baile precisa ser adicionada ao site!

---

## 📥 PASSO 1: Salvar a imagem

### Opção A: Do chat para o projeto (recomendado)

```bash
# 1. No chat, clicar com botão direito na imagem
# 2. "Salvar imagem como..."
# 3. Salvar com nome: baile-hero.jpg
# 4. Mover para a pasta: /images/

# Ou via terminal:
# Se a imagem estiver nos Downloads:
mv ~/Downloads/imagem-do-chat.jpg images/baile-hero.jpg
```

### Opção B: Usar serviço de hospedagem

```bash
# 1. Fazer upload em: https://imgur.com
# 2. Copiar URL direta da imagem
# 3. Usar essa URL no HTML
```

---

## 🎨 PASSO 2: Adicionar no site

### LOCAL 1: Página inicial (Hero)

**Arquivo:** `index.html`

**Substituir a linha 74:**
```html
<!-- ANTES: -->
<img src="/images/mask-ornate.svg" alt="Máscara elegante" class="hero-image">

<!-- DEPOIS: -->
<img src="/images/baile-hero.jpg" 
     alt="Baile de Máscaras - Thamires Feres" 
     class="hero-image"
     style="width:100%;max-width:500px;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,0.4);border:2px solid rgba(232,197,116,0.3)">
```

---

### LOCAL 2: Seção especial (Recomendado!)

**Adicionar no `index.html` após a seção hero:**

```html
<!-- Adicionar depois da tag </main> e antes de <footer> -->

<section class="container" style="margin:48px auto">
  <div class="card" style="text-align:center;padding:40px 24px">
    <h2 style="color:var(--gold);font-family:'Playfair Display',serif;font-size:2rem;margin-bottom:16px">
      ✨ Uma Noite Inesquecível ✨
    </h2>
    <img src="/images/flourish.svg" alt="ornamento" class="ornament" aria-hidden="true">
    
    <div style="margin:32px 0">
      <img src="/images/baile-hero.jpg" 
           alt="Baile de Máscaras de Thamires Feres" 
           style="width:100%;max-width:600px;height:auto;border-radius:16px;box-shadow:0 12px 48px rgba(0,0,0,0.5);border:3px solid rgba(232,197,116,0.2);display:block;margin:0 auto">
    </div>
    
    <p class="lead-para" style="max-width:600px;margin:24px auto 0">
      Vista sua melhor máscara e prepare-se para uma celebração digna da alta sociedade. 
      Uma noite onde elegância, mistério e romance se encontram.
    </p>
    
    <div style="margin-top:32px">
      <a href="/pages/codigo-vestes.html" class="btn primary">
        Ver Código de Vestes 👑
      </a>
    </div>
  </div>
</section>
```

---

### LOCAL 3: Página do convite

**Arquivo:** `pages/convite.html`

**Adicionar após o texto do convite:**

```html
<!-- Adicionar dentro da section class="card" -->
<div style="margin-top:32px;text-align:center">
  <img src="/images/baile-hero.jpg" 
       alt="Baile de Máscaras" 
       style="width:100%;max-width:500px;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,0.4);border:2px solid rgba(232,197,116,0.2)">
  <p style="font-size:0.85rem;color:var(--muted);margin-top:12px;font-style:italic">
    "Que vossas máscaras estejam polidas e vossos trajes dignos da corte"
  </p>
</div>
```

---

## 🎨 ESTILOS RESPONSIVOS

**Adicionar no CSS ou inline:**

```css
/* Imagem responsiva */
.hero-photo {
  width: 100%;
  max-width: 600px;
  height: auto;
  border-radius: 16px;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.5),
    0 0 0 3px rgba(232, 197, 116, 0.2);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  display: block;
  margin: 0 auto;
}

.hero-photo:hover {
  transform: scale(1.02);
  box-shadow: 
    0 12px 48px rgba(0, 0, 0, 0.6),
    0 0 0 3px rgba(232, 197, 116, 0.4);
}

@media (max-width: 768px) {
  .hero-photo {
    max-width: 100%;
    border-radius: 12px;
  }
}
```

---

## 🖼️ EFEITO GALERIA (Opcional)

**Para criar uma galeria de fotos:**

```html
<section class="container" style="margin:48px auto">
  <div class="card">
    <h2 style="color:var(--gold);font-family:'Playfair Display',serif;text-align:center;margin-bottom:32px">
      🎭 Inspire-se 🎭
    </h2>
    
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px">
      <div style="position:relative;overflow:hidden;border-radius:12px">
        <img src="/images/baile-hero.jpg" 
             alt="Exemplo de traje 1" 
             style="width:100%;height:300px;object-fit:cover;transition:transform 0.3s"
             onmouseover="this.style.transform='scale(1.1)'"
             onmouseout="this.style.transform='scale(1)'">
        <div style="position:absolute;bottom:0;left:0;right:0;background:linear-gradient(transparent,rgba(0,0,0,0.8));padding:16px;color:white">
          <p style="margin:0;font-size:0.9rem">Elegância e Mistério</p>
        </div>
      </div>
      
      <!-- Adicionar mais fotos aqui -->
    </div>
  </div>
</section>
```

---

## ✅ VERIFICAR SE FUNCIONOU

### Teste 1: Imagem carrega?
```bash
# Abrir no navegador:
http://localhost:8000

# Verificar se imagem aparece
# Abrir DevTools (F12) → Network → Img
# Ver se baile-hero.jpg carregou (status 200)
```

### Teste 2: Responsivo?
```bash
# F12 → Toggle device toolbar (Ctrl+Shift+M)
# Testar em:
# - iPhone 12 Pro (390x844)
# - iPad (768x1024)
# - Desktop (1920x1080)
```

### Teste 3: Performance?
```bash
# Redimensionar imagem se muito grande:
# Recomendado: max 1200px de largura
# Formato: JPG (menor) ou WebP (moderno)

# Comprimir com:
# - TinyPNG.com
# - Squoosh.app
# - ImageOptim (Mac)
```

---

## 🚀 COMMIT E DEPLOY

```bash
# 1. Adicionar imagem
git add images/baile-hero.jpg

# 2. Commit
git commit -m "Adicionar imagem principal do baile de máscaras"

# 3. Push (Vercel faz deploy automático)
git push
```

---

## 🎯 RESULTADO FINAL

**Antes:**
```
[ Ícone SVG simples ]
```

**Depois:**
```
┌─────────────────────────────────────┐
│                                     │
│   [Imagem linda do baile]          │
│   Mulher com máscara dourada       │
│   Lustres, elegância, Bridgerton   │
│                                     │
│   ✨ Cria impacto visual ✨        │
│   💎 Transmite o clima do evento   │
│                                     │
└─────────────────────────────────────┘
```

---

## 💡 DICAS EXTRAS

### Otimizar imagem:
```bash
# Se imagem muito grande (> 500KB):
# 1. Abrir em: photopea.com (Photoshop online grátis)
# 2. Image → Image Size → Width: 1200px
# 3. File → Export as → JPG → Quality: 85%
# 4. Salvar
```

### Lazy loading:
```html
<img src="/images/baile-hero.jpg" 
     alt="Baile de Máscaras"
     loading="lazy"  <!-- Carrega só quando usuário scrollar -->
     decoding="async">  <!-- Não bloqueia renderização -->
```

### WebP (melhor performance):
```html
<picture>
  <source srcset="/images/baile-hero.webp" type="image/webp">
  <source srcset="/images/baile-hero.jpg" type="image/jpeg">
  <img src="/images/baile-hero.jpg" alt="Baile de Máscaras">
</picture>
```

---

## ❓ PROBLEMAS COMUNS

### Imagem não aparece:
```bash
# Verificar caminho:
# ✅ CERTO: /images/baile-hero.jpg
# ❌ ERRADO: images/baile-hero.jpg (sem /)
# ❌ ERRADO: ../images/baile-hero.jpg

# Verificar se arquivo existe:
ls -lh images/baile-hero.jpg
```

### Imagem muito grande:
```bash
# Ver tamanho:
du -h images/baile-hero.jpg

# Se > 500KB, comprimir em:
# https://tinypng.com
```

### Imagem deformada:
```css
/* Usar object-fit: */
img {
  object-fit: cover;  /* Preenche sem distorcer */
  /* ou */
  object-fit: contain;  /* Cabe inteira sem cortar */
}
```

---

🎭✨ **Imagem do baile pronta para brilhar no site!** ✨🎭
