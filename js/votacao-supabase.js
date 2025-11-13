/**
 * Sistema de Votação Completo
 * - Upload de looks
 * - Galeria de looks
 * - Votação (apenas quando liberada)
 */

// ========================================
// 1. INICIALIZAÇÃO
// ========================================

document.addEventListener('DOMContentLoaded', async () => {
  console.log('Sistema de votação inicializado');
  
  // Verificar se votação está liberada
  await verificarVotacaoLiberada();
  
  // Carregar galeria de looks
  await carregarGaleria();
  
  // Setup do formulário de envio
  setupFormularioEnvio();
  
  // Setup preview de foto
  setupFotoPreview();
});

// ========================================
// 2. VERIFICAR SE VOTAÇÃO ESTÁ LIBERADA
// ========================================

async function verificarVotacaoLiberada() {
  try {
    const { data, error } = await supabase
      .from('config')
      .select('votacao_liberada')
      .single();
    
    if (error) throw error;
    
    const liberada = data?.votacao_liberada || false;
    
    // Atualizar UI baseado no status
    const form = document.getElementById('voto-form');
    const galeria = document.getElementById('galeria-looks');
    const note = document.getElementById('voting-note');
    
    if (liberada) {
      // Votação liberada - mostrar tudo
      form.style.display = 'block';
      galeria.style.display = 'grid';
      note.textContent = '✅ Votação liberada! Envie seu look e vote no melhor traje da noite.';
      note.style.color = 'var(--gold)';
    } else {
      // Votação bloqueada
      form.querySelector('button[type="submit"]').disabled = true;
      form.querySelector('button[type="submit"]').textContent = '🔒 Envio Bloqueado';
      galeria.style.display = 'none';
      note.textContent = '⏳ A votação será liberada na noite do evento. Por enquanto, apenas visualização.';
      note.style.color = 'var(--muted)';
    }
    
    return liberada;
  } catch (error) {
    console.error('Erro ao verificar votação:', error);
    showError('Erro', 'Não foi possível verificar o status da votação.');
    return false;
  }
}

// ========================================
// 3. CARREGAR GALERIA DE LOOKS
// ========================================

async function carregarGaleria() {
  try {
    showLoading('Carregando galeria de looks...');
    
    const { data: looks, error } = await supabase
      .from('looks')
      .select('*')
      .order('votos', { ascending: false });
    
    hideLoading();
    
    if (error) throw error;
    
    const galeriaDiv = document.getElementById('galeria-looks');
    
    if (!looks || looks.length === 0) {
      galeriaDiv.innerHTML = '<p style="text-align:center;color:var(--muted);grid-column:1/-1">Ainda não há looks enviados. Seja o primeiro! 👑</p>';
      return;
    }
    
    // Renderizar cada look
    galeriaDiv.innerHTML = looks.map(look => `
      <div class="gallery-item" data-look-id="${look.id}">
        <img src="${look.foto_url}" alt="Look de ${look.nome}" loading="lazy">
        <div class="gallery-info">
          <h4>${look.nome}</h4>
          ${look.descricao ? `<p>${look.descricao}</p>` : ''}
          <div class="vote-section">
            <span class="vote-count">❤️ ${look.votos} votos</span>
            <button class="btn-vote" onclick="votarLook(${look.id}, '${look.nome}')">
              Votar Neste Look
            </button>
          </div>
        </div>
      </div>
    `).join('');
    
  } catch (error) {
    hideLoading();
    console.error('Erro ao carregar galeria:', error);
    showError('Erro', 'Não foi possível carregar a galeria de looks.');
  }
}

// ========================================
// 4. SETUP FORMULÁRIO DE ENVIO
// ========================================

function setupFormularioEnvio() {
  const form = document.getElementById('voto-form');
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Verificar novamente se votação está liberada
    const liberada = await verificarVotacaoLiberada();
    if (!liberada) {
      showError('Envio Bloqueado', 'A votação ainda não foi liberada. Aguarde a noite do evento.');
      return;
    }
    
    // Coletar dados do formulário
    const formData = new FormData(form);
    const nome = formData.get('nome').trim();
    const cpf = formData.get('cpf').trim().replace(/\D/g, '');
    const descricao = formData.get('descricao').trim();
    const foto = document.getElementById('foto-traje').files[0];
    
    // Validações
    if (!nome || nome.length < 3) {
      showError('Nome Inválido', 'Por favor, digite seu nome completo.');
      return;
    }
    
    if (cpf.length !== 11) {
      showError('CPF Inválido', 'Por favor, digite um CPF válido (11 dígitos).');
      return;
    }
    
    if (!foto) {
      showError('Foto Necessária', 'Por favor, escolha uma foto do seu traje.');
      return;
    }
    
    // Verificar se já enviou look
    try {
      showLoading('Verificando se você já enviou um look...');
      
      const { data: lookExistente, error: checkError } = await supabase
        .from('looks')
        .select('id')
        .eq('cpf', cpf)
        .single();
      
      hideLoading();
      
      if (lookExistente) {
        showError('Look Já Enviado', 'Você já enviou um look. Cada pessoa pode enviar apenas uma foto.');
        return;
      }
    } catch (error) {
      // Se não encontrou (error.code === 'PGRST116'), está OK
      if (error.code !== 'PGRST116') {
        hideLoading();
        console.error('Erro ao verificar look:', error);
        showError('Erro', 'Erro ao verificar envio anterior.');
        return;
      }
    }
    
    // Fazer upload da foto
    await enviarLook(nome, cpf, descricao, foto);
  });
}

// ========================================
// 5. ENVIAR LOOK (UPLOAD FOTO + SALVAR DB)
// ========================================

async function enviarLook(nome, cpf, descricao, foto) {
  try {
    showLoading('Enviando seu look... 📸');
    
    // 1. Fazer upload da foto para Supabase Storage
    const nomeArquivo = `${cpf}_${Date.now()}.jpg`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('looks')
      .upload(nomeArquivo, foto, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (uploadError) throw uploadError;
    
    // 2. Obter URL pública da foto
    const { data: urlData } = supabase.storage
      .from('looks')
      .getPublicUrl(nomeArquivo);
    
    const fotoUrl = urlData.publicUrl;
    
    // 3. Salvar no banco de dados
    const { error: dbError } = await supabase
      .from('looks')
      .insert([{
        nome: nome,
        cpf: cpf,
        descricao: descricao || null,
        foto_url: fotoUrl,
        votos: 0
      }]);
    
    if (dbError) throw dbError;
    
    hideLoading();
    
    // Sucesso!
    showSuccess(
      'Look Enviado! 🎉',
      `Obrigado, ${nome}! Seu look foi enviado com sucesso. Boa sorte na votação!`
    );
    
    // Limpar formulário
    document.getElementById('voto-form').reset();
    document.getElementById('foto-preview').style.display = 'none';
    
    // Recarregar galeria
    setTimeout(() => carregarGaleria(), 1000);
    
  } catch (error) {
    hideLoading();
    console.error('Erro ao enviar look:', error);
    showError('Erro no Envio', 'Não foi possível enviar seu look. Tente novamente.');
  }
}

// ========================================
// 6. VOTAR EM LOOK
// ========================================

async function votarLook(lookId, nomeLook) {
  // Verificar se votação está liberada
  const liberada = await verificarVotacaoLiberada();
  if (!liberada) {
    showError('Votação Bloqueada', 'A votação será liberada na noite do evento.');
    return;
  }
  
  // Pedir CPF do votante
  showConfirm(
    '🗳 Confirmar Voto',
    `Deseja votar no look de ${nomeLook}?\n\nDigite seu CPF para registrar seu voto (apenas um voto por CPF):`,
    async () => {
      // Criar input para CPF
      const cpfVotante = prompt('Digite seu CPF (apenas números):');
      
      if (!cpfVotante) {
        showError('Voto Cancelado', 'É necessário informar o CPF para votar.');
        return;
      }
      
      const cpfLimpo = cpfVotante.replace(/\D/g, '');
      
      if (cpfLimpo.length !== 11) {
        showError('CPF Inválido', 'Por favor, digite um CPF válido (11 dígitos).');
        return;
      }
      
      // Verificar se já votou
      try {
        showLoading('Registrando seu voto...');
        
        const { data: votoExistente, error: checkError } = await supabase
          .from('votos')
          .select('id')
          .eq('cpf_votante', cpfLimpo)
          .single();
        
        if (votoExistente) {
          hideLoading();
          showError('Voto Já Registrado', 'Você já votou. Cada pessoa pode votar apenas uma vez.');
          return;
        }
      } catch (error) {
        // Se não encontrou (error.code === 'PGRST116'), está OK
        if (error.code !== 'PGRST116') {
          hideLoading();
          console.error('Erro ao verificar voto:', error);
          showError('Erro', 'Erro ao verificar voto anterior.');
          return;
        }
      }
      
      // Registrar voto
      try {
        // 1. Adicionar voto na tabela votos
        const { error: votoError } = await supabase
          .from('votos')
          .insert([{
            look_id: lookId,
            cpf_votante: cpfLimpo
          }]);
        
        if (votoError) throw votoError;
        
        // 2. Incrementar contador de votos do look
        const { error: updateError } = await supabase.rpc('incrementar_votos', {
          look_id_param: lookId
        });
        
        if (updateError) {
          // Fallback: fazer manualmente se a function não existir
          const { data: lookAtual, error: getError } = await supabase
            .from('looks')
            .select('votos')
            .eq('id', lookId)
            .single();
          
          if (getError) throw getError;
          
          const { error: incError } = await supabase
            .from('looks')
            .update({ votos: lookAtual.votos + 1 })
            .eq('id', lookId);
          
          if (incError) throw incError;
        }
        
        hideLoading();
        
        // Sucesso!
        showSuccess(
          'Voto Registrado! 🎉',
          `Seu voto no look de ${nomeLook} foi registrado com sucesso!`
        );
        
        // Recarregar galeria para atualizar contadores
        setTimeout(() => carregarGaleria(), 1000);
        
      } catch (error) {
        hideLoading();
        console.error('Erro ao votar:', error);
        showError('Erro no Voto', 'Não foi possível registrar seu voto. Tente novamente.');
      }
    },
    () => {
      // Cancelar voto
      showInfo('Voto Cancelado', 'Você pode votar em outro look se preferir.');
    }
  );
}

// Expor função globalmente para onclick
window.votarLook = votarLook;

// ========================================
// 7. PREVIEW DE FOTO
// ========================================

function setupFotoPreview() {
  const fotoInput = document.getElementById('foto-traje');
  const preview = document.getElementById('foto-preview');
  
  fotoInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    
    if (file) {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        preview.src = event.target.result;
        preview.style.display = 'block';
      };
      
      reader.readAsDataURL(file);
    } else {
      preview.style.display = 'none';
    }
  });
}
