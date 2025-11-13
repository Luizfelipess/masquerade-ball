// Sistema de Galeria de Votação para Looks
(function(){
  'use strict';

  /* ---------- Helpers ---------- */
  function qs(sel){ return document.querySelector(sel) }
  function qsa(sel){ return Array.from(document.querySelectorAll(sel)) }
  
  function sanitizeCPF(str){
    return (str||'').replace(/\D/g,'');
  }
  
  function isValidCPF(cpf){
    if(!/^\d{11}$/.test(cpf)) return false;
    if(/^(\d)\1{10}$/.test(cpf)) return false;
    const digits = cpf.split('').map(Number);
    function calc(pos){
      let sum=0; for(let i=0;i<pos-1;i++) sum += digits[i]*(pos-i);
      let res = (sum*10)%11; return res===10?0:res;
    }
    return calc(10)===digits[9] && calc(11)===digits[10];
  }

  /* ---------- Gerenciar Upload de Looks ---------- */
  function handleLookUpload(){
    const form = qs('#voto-form');
    const fileIn = qs('#foto-traje');
    const preview = qs('#foto-preview');
    
    if(!form) return;

    // Preview da foto quando selecionada/tirada
    if(fileIn && preview){
      fileIn.addEventListener('change', ()=>{
        const file = fileIn.files[0];
        if(!file) return;
        
        // Validação de tamanho (max 5MB)
        if(file.size > 5 * 1024 * 1024){
          alert('📸 Foto muito grande! Use uma imagem de até 5MB.');
          fileIn.value = '';
          return;
        }
        
        const reader = new FileReader();
        reader.onload = e => {
          preview.src = e.target.result;
          preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
      });
    }

    // Submissão do formulário de envio do look
    form.addEventListener('submit', e => {
      e.preventDefault();
      const formData = new FormData(form);
      const nome = (formData.get('nome')||'').trim();
      const cpf = sanitizeCPF(formData.get('cpf'));
      const descricao = (formData.get('descricao')||'').trim();
      const foto = fileIn.files[0];

      if(!nome || !cpf || !foto){
        alert('⚠️ Preencha nome, CPF e envie uma foto do seu look!');
        return;
      }

      if(!isValidCPF(cpf)){
        alert('⚠️ CPF inválido. Verifique os dígitos.');
        return;
      }

      // Salvar look (com foto em base64 para localStorage)
      const reader = new FileReader();
      reader.onload = () => {
        const look = {
          nome,
          cpf,
          descricao,
          foto: reader.result,
          timestamp: Date.now()
        };
        
        const looks = JSON.parse(localStorage.getItem('looks')||'[]');
        
        // Verificar se CPF já enviou look
        if(looks.some(l => l.cpf === cpf)){
          alert('⚠️ Este CPF já enviou um look! Apenas um envio por pessoa.');
          return;
        }
        
        looks.push(look);
        localStorage.setItem('looks', JSON.stringify(looks));
        
        alert('✨ Look enviado com sucesso! Em breve aparecerá na galeria para votação.');
        form.reset();
        preview.style.display = 'none';
        
        // Atualizar galeria
        renderGallery();
      };
      reader.readAsDataURL(foto);
    });
  }

  /* ---------- Renderizar Galeria de Looks ---------- */
  function renderGallery(){
    const galeria = qs('#galeria-looks');
    if(!galeria) return;
    
    const looks = JSON.parse(localStorage.getItem('looks')||'[]');
    const votos = JSON.parse(localStorage.getItem('votos-looks')||'{}');
    
    if(looks.length === 0){
      galeria.innerHTML = '<p style="text-align:center;color:var(--muted);padding:40px 0;font-size:1.1rem">🎭 Ainda não há looks enviados. Seja o primeiro a compartilhar seu traje!</p>';
      galeria.style.display = 'block';
      return;
    }
    
    galeria.style.display = 'grid';
    galeria.innerHTML = looks.map((look, index) => {
      const votoCount = votos[look.cpf] || 0;
      return `
        <div class="gallery-item" data-index="${index}">
          <img src="${look.foto}" alt="Look de ${look.nome}" loading="lazy">
          <div class="gallery-info">
            <h3>${look.nome}</h3>
            ${look.descricao ? `<p>${look.descricao}</p>` : '<p style="opacity:0.6"><em>Sem descrição</em></p>'}
            <button class="btn primary votar-btn" data-index="${index}" data-cpf="${look.cpf}">
              ⭐ Votar neste Look
            </button>
            <p style="font-size:0.85rem;color:var(--muted);margin-top:10px;text-align:center">
              💎 ${votoCount} voto${votoCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      `;
    }).join('');
    
    // Adicionar eventos de votação
    qsa('.votar-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const lookIndex = btn.dataset.index;
        const lookCPF = btn.dataset.cpf;
        votarEmLook(lookCPF, looks[lookIndex].nome);
      });
    });
  }

  /* ---------- Votar em Look ---------- */
  function votarEmLook(lookCPF, lookNome){
    // Pedir CPF do votante
    const votanteCPF = prompt('Digite seu CPF para confirmar o voto:');
    if(!votanteCPF) return;
    
    const cpfLimpo = sanitizeCPF(votanteCPF);
    if(!isValidCPF(cpfLimpo)){
      alert('⚠️ CPF inválido!');
      return;
    }
    
    // Verificar se já votou
    const votantes = JSON.parse(localStorage.getItem('votantes-cpf')||'[]');
    if(votantes.includes(cpfLimpo)){
      alert('⚠️ Você já votou! Apenas 1 voto por CPF.');
      return;
    }
    
    // Não pode votar no próprio look
    if(cpfLimpo === lookCPF){
      alert('⚠️ Você não pode votar no seu próprio look!');
      return;
    }
    
    // Registrar voto
    const votos = JSON.parse(localStorage.getItem('votos-looks')||'{}');
    votos[lookCPF] = (votos[lookCPF] || 0) + 1;
    localStorage.setItem('votos-looks', JSON.stringify(votos));
    
    votantes.push(cpfLimpo);
    localStorage.setItem('votantes-cpf', JSON.stringify(votantes));
    
    alert(`✨ Voto confirmado para ${lookNome}!\n\nObrigado por participar da escolha do Diamante da Temporada.`);
    renderGallery(); // Atualizar contagem
  }

  /* ---------- Init ---------- */
  document.addEventListener('DOMContentLoaded', ()=>{
    handleLookUpload();
    renderGallery();
  });

})();
