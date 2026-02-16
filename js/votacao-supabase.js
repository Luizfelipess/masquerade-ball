/**
 * Sistema de Votação Completo
 * - Upload de looks
 * - Galeria de looks
 * - Votação (apenas quando liberada)
 */

// ========================================
// 1. INICIALIZAÇÃO
// ========================================

let autoRefreshInterval = null;
let ultimoNumeroLooks = 0;
let jaVotou = false; // Flag local para controle de voto único

// Paginação
let looksCarregados = [];
let indiceAtual = 0;
const LOOKS_POR_PAGINA = 20;

document.addEventListener('DOMContentLoaded', () => {
  console.log('Sistema de votação inicializado');
  // Pequeno delay para garantir carregamento do Supabase no Chrome mobile
  setTimeout(async () => {
    // Verificar se votação está liberada
    const liberada = await verificarVotacaoLiberada();
    // Carregar galeria de looks
    await carregarGaleria();
    // Setup do formulário de envio
    setupFormularioEnvio();
    // Setup preview de foto
    setupFotoPreview();
    // Se votação liberada, iniciar auto-refresh a cada 30 segundos
    if (liberada) {
      iniciarAutoRefresh();
    }
  }, 300);
});

// ========================================
// 2. VERIFICAR SE VOTAÇÃO ESTÁ LIBERADA
// ========================================

// Função auxiliar para desabilitar votação
function desabilitarVotacao(mensagem) {
  const botoes = document.querySelectorAll('.btn-vote');
  botoes.forEach(btn => {
    btn.disabled = true;
    btn.textContent = '🔒 Voto Já Registrado';
    btn.style.opacity = '0.5';
    btn.style.cursor = 'not-allowed';
  });
  
  const note = document.getElementById('voting-note');
  if (note) {
    note.textContent = `🔒 ${mensagem}`;
    note.style.color = 'var(--error, red)';
  }
}

// Função auxiliar para desabilitar envio
function desabilitarEnvio(mensagem) {
  const form = document.getElementById('voto-form');
  if (form) {
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = '🔒 Look Já Enviado';
      submitBtn.style.opacity = '0.5';
    }
    
    // Desabilitar todos os inputs
    const inputs = form.querySelectorAll('input, textarea');
    inputs.forEach(input => input.disabled = true);
  }
  
  const note = document.getElementById('envio-note');
  if (note) {
    note.textContent = `🔒 ${mensagem}`;
    note.style.color = 'var(--error, red)';
  }
}

async function verificarVotacaoLiberada() {
  try {
    const { data, error } = await supabase
      .from('config')
      .select('valor')
      .eq('chave', 'votacao_liberada')
      .single();
    
    if (error) throw error;
    
    // Converter string para boolean
    const liberada = data?.valor === 'true';
    
    // Atualizar UI baseado no status
    const secaoVotacao = document.getElementById('secao-votacao');
    const secaoEnvio = document.getElementById('secao-envio');
    const note = document.getElementById('voting-note');
    
    if (liberada) {
      // Votação liberada - mostrar ambas seções
      secaoVotacao.style.display = 'block';
      secaoEnvio.style.display = 'block';
      note.textContent = '✅ Votação liberada! Vote no melhor look e, se desejar, envie o seu também.';
      note.style.color = 'var(--gold)';
    } else {
      // Votação bloqueada - ocultar tudo
      secaoVotacao.style.display = 'none';
      secaoEnvio.style.display = 'none';
      note.textContent = '⏳ A votação será liberada na noite do evento. Por enquanto, aguarde!';
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
// 3. CARREGAR GALERIA DE LOOKS (COM PAGINAÇÃO)
// ========================================

async function carregarGaleria(resetar = false) {
  try {
    const { data: looks, error } = await supabase
      .from('looks')
      .select('*')
      .order('votos', { ascending: false });
    
    if (error) throw error;
    
    const galeriaDiv = document.getElementById('galeria-looks');
    
    if (!looks || looks.length === 0) {
      galeriaDiv.innerHTML = '<p style="text-align:center;color:var(--muted);grid-column:1/-1">Ainda não há looks enviados. Seja o primeiro! 👑</p>';
      ultimoNumeroLooks = 0;
      return;
    }
    
    // Se resetar ou se é primeira carga, reiniciar
    if (resetar || looksCarregados.length === 0) {
      looksCarregados = looks;
      indiceAtual = 0;
      galeriaDiv.innerHTML = '';
    } else {
      // Atualizar lista se houver novos looks
      looksCarregados = looks;
    }
    
    // Atualizar contador
    const novoNumero = looks.length;
    if (novoNumero !== ultimoNumeroLooks && ultimoNumeroLooks > 0) {
      console.log(`📸 Novos looks detectados! ${ultimoNumeroLooks} → ${novoNumero}`);
    }
    ultimoNumeroLooks = novoNumero;
    
    // Renderizar próxima página de looks
    renderizarProximaPagina();
    
} catch (error) {
  console.error('Erro ao carregar galeria:', error);
  showError('Erro', 'Não foi possível carregar a galeria de looks.\n\n' + (error?.message || ''));
}
}

function renderizarProximaPagina() {
  const galeriaDiv = document.getElementById('galeria-looks');
  
  // Calcular range da página atual
  const inicio = indiceAtual;
  const fim = Math.min(inicio + LOOKS_POR_PAGINA, looksCarregados.length);
  const looksPagina = looksCarregados.slice(inicio, fim);
  
  // Renderizar looks da página
  const htmlLooks = looksPagina.map(look => {
    return `
      <div class="gallery-item" data-look-id="${look.id}">
        <img src="${look.foto_url}" alt="Look de ${look.nome}" loading="lazy">
        <div class="gallery-info">
          <h4>${look.nome}</h4>
          ${look.descricao ? `<p>${look.descricao}</p>` : ''}
          <div class="vote-section">
            <span class="vote-count">❤️ ${look.votos} votos</span>
            <button class="btn-vote" data-look-id="${look.id}" data-look-nome="${look.nome.replace(/"/g, '&quot;')}">
              Votar Neste Look
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
  
  // Adicionar ao final da galeria
  galeriaDiv.insertAdjacentHTML('beforeend', htmlLooks);
  
  // Atualizar índice
  indiceAtual = fim;
  
  // Adicionar/atualizar botão "Carregar Mais"
  atualizarBotaoCarregarMais();
  
  // Adicionar event listeners nos novos botões de votar
  const botoesVotar = galeriaDiv.querySelectorAll('.btn-vote');
  botoesVotar.forEach(btn => {
    // Remover listeners duplicados
    btn.replaceWith(btn.cloneNode(true));
  });
  
  // Re-adicionar listeners
  const novosBotoesVotar = galeriaDiv.querySelectorAll('.btn-vote');
  novosBotoesVotar.forEach(btn => {
    btn.addEventListener('click', () => {
      const lookId = btn.dataset.lookId;
      const lookNome = btn.dataset.lookNome;
      
      console.log('🗳️ Votando:', { lookId, lookNome });
      
      if (!lookId || lookId === 'undefined' || lookId === 'null') {
        showError('Erro', 'ID do look inválido. Recarregue a página.');
        return;
      }
      
      votarLook(lookId, lookNome);
    });
  });
  
  console.log(`📄 Página carregada: ${inicio + 1}-${fim} de ${looksCarregados.length} looks`);
}

function atualizarBotaoCarregarMais() {
  // Remover botão existente se houver
  const btnExistente = document.getElementById('btn-carregar-mais');
  if (btnExistente) {
    btnExistente.remove();
  }
  
  // Verificar se há mais looks para carregar
  if (indiceAtual < looksCarregados.length) {
    const galeriaDiv = document.getElementById('galeria-looks');
    const restantes = looksCarregados.length - indiceAtual;
    
    const btnHTML = `
      <div id="btn-carregar-mais" style="grid-column:1/-1;text-align:center;margin-top:24px">
        <button class="btn primary" onclick="renderizarProximaPagina()" style="min-width:250px">
          📸 Carregar Mais Looks (${restantes} restantes)
        </button>
        <p style="color:var(--muted);font-size:0.9rem;margin-top:12px">
          Mostrando ${indiceAtual} de ${looksCarregados.length} looks
        </p>
      </div>
    `;
    
    galeriaDiv.insertAdjacentHTML('beforeend', btnHTML);
  } else if (looksCarregados.length > LOOKS_POR_PAGINA) {
    // Mostrar mensagem de fim
    const galeriaDiv = document.getElementById('galeria-looks');
    const msgHTML = `
      <div id="btn-carregar-mais" style="grid-column:1/-1;text-align:center;margin-top:24px">
        <p style="color:var(--gold);font-size:1rem;font-weight:600">
          ✨ Todos os ${looksCarregados.length} looks foram carregados!
        </p>
      </div>
    `;
    galeriaDiv.insertAdjacentHTML('beforeend', msgHTML);
  }
}

// Expor função globalmente para o botão
window.renderizarProximaPagina = renderizarProximaPagina;

// ========================================
// 4. SETUP FORMULÁRIO DE ENVIO
// ========================================

function setupFormularioEnvio() {
  const form = document.getElementById('voto-form');
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // 🛡️ PROTEÇÃO 1: Rate limiting
    try {
      window.AntiFraude.verificarRateLimit('enviar_look', 5, 30000);
    } catch (error) {
      showError('Muitas Tentativas', error.message);
      return;
    }
    
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
    
    // CPF é opcional - apenas sanitizar se fornecido
    const cpfLimpo = cpf ? cpf : null;
    
    if (!foto) {
      showError('Foto Necessária', 'Por favor, escolha uma foto do seu traje.');
      return;
    }
    
    // 🛡️ PROTEÇÃO 3: Verificar tamanho da foto (máx 5MB)
    if (foto.size > 5 * 1024 * 1024) {
      showError('Foto Muito Grande', 'A foto deve ter no máximo 5MB. Tire uma nova foto ou escolha outra.');
      return;
    }
    
    // 🛡️ PROTEÇÃO: Verificar se já enviou look NO BANCO DE DADOS (apenas se tiver CPF)
    if (cpfLimpo) {
      try {
        showLoading('Verificando se você já enviou um look...');
        
        const { data: lookExistente, error: checkError } = await supabase
          .from('looks')
          .select('id')
          .eq('cpf', cpfLimpo)
          .single();
        
        hideLoading();
        
        if (lookExistente) {
          showError('Look Já Enviado', 'Este CPF já enviou um look. Cada pessoa pode enviar apenas uma foto.');
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
    }
    
    // Fazer upload da foto
    await enviarLook(nome, cpfLimpo, descricao, foto);
  });
}

// ========================================
// 5. ENVIAR LOOK (UPLOAD FOTO + SALVAR DB)
// ========================================

// Função auxiliar para comprimir imagem
async function comprimirImagem(file, maxWidth = 1200, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        // Criar canvas para redimensionar
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Redimensionar mantendo proporção
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Converter para blob com qualidade reduzida
        canvas.toBlob(
          (blob) => {
            if (blob) {
              console.log(`📦 Compressão: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(blob.size / 1024 / 1024).toFixed(2)}MB (${((1 - blob.size/file.size) * 100).toFixed(0)}% redução)`);
              resolve(blob);
            } else {
              reject(new Error('Falha ao comprimir imagem'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      
      img.onerror = () => reject(new Error('Falha ao carregar imagem'));
      img.src = e.target.result;
    };
    
    reader.onerror = () => reject(new Error('Falha ao ler arquivo'));
    reader.readAsDataURL(file);
  });
}

async function enviarLook(nome, cpf, descricao, foto) {
  try {
    showLoading('Preparando sua foto... 🖼️');
    
    // COMPRESSÃO: Reduzir tamanho da imagem antes do upload
    let fotoParaUpload = foto;
    
    // Comprimir apenas se for maior que 500KB
    if (foto.size > 500 * 1024) {
      try {
        fotoParaUpload = await comprimirImagem(foto, 1200, 0.8);
        showLoading('Enviando seu look... 📸');
      } catch (compressError) {
        console.warn('⚠️ Erro ao comprimir, enviando original:', compressError);
        // Se falhar compressão, usa foto original
      }
    }
    
    // 1. Fazer upload da foto para Supabase Storage
    const nomeArquivo = `${cpf}_${Date.now()}.jpg`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('looks')
      .upload(nomeArquivo, fotoParaUpload, {
        cacheControl: '3600',
        upsert: false,
        contentType: 'image/jpeg'
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
    
    // Desabilitar formulário (apenas nesta sessão)
    desabilitarEnvio('Look enviado com sucesso! Obrigado pela participação.');
    
    // Limpar preview
    document.getElementById('foto-preview').style.display = 'none';
    
    // Recarregar galeria automaticamente (sem reload da página)
    console.log('🔄 Atualizando galeria...');
    setTimeout(() => carregarGaleria(true), 2000); // true = resetar paginação
    
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
  // Verificar se já votou nesta sessão
  if (jaVotou) {
    showError('Voto Já Registrado', 'Você já votou nesta sessão. Cada pessoa pode votar apenas uma vez.');
    return;
  }
  
  // 🛡️ PROTEÇÃO 1: Verificar rate limiting
  try {
    window.AntiFraude.verificarRateLimit('votar', 5, 30000);
  } catch (error) {
    showError('Muitas Tentativas', error.message);
    return;
  }
  
  // 🛡️ PROTEÇÃO 2: Verificar se DevTools está aberto
  if (window.AntiFraude.devtoolsAberto()) {
    console.warn('⚠️ DevTools detectado - votação monitorada');
  }
  
  // Verificar se votação está liberada
  const liberada = await verificarVotacaoLiberada();
  if (!liberada) {
    showError('Votação Bloqueada', 'A votação será liberada na noite do evento.');
    return;
  }
  
  // Pedir CPF do votante usando modal customizado
  showPrompt(
    '🗳️ Confirmar Voto',
    `Você está votando no look de <strong style="color: var(--gold);">${nomeLook}</strong>.<br><br>Digite seu CPF para registrar seu voto (apenas um voto por CPF):`,
    '000.000.000-00',
    async (cpfVotante) => {
      // Callback quando usuário confirma
      if (!cpfVotante) {
        showError('Voto Cancelado', 'É necessário informar o CPF para votar.');
        return;
      }
      
      // CPF é opcional - apenas sanitizar se fornecido
      const cpfLimpo = cpfVotante ? cpfVotante.replace(/\D/g, '') : null;
      
      // 🛡️ PROTEÇÃO: Verificar se já votou NO BANCO DE DADOS (apenas se tiver CPF)
      if (cpfLimpo) {
        try {
          showLoading('Verificando voto...');
          
          const { data: votosExistentes, error: checkError } = await supabase
            .from('votos')
            .select('id')
            .eq('cpf_votante', cpfLimpo);
          
          if (checkError) throw checkError;
          
          if (votosExistentes && votosExistentes.length > 0) {
            hideLoading();
            showError('Voto Já Registrado', 'Este CPF já votou. Cada pessoa pode votar apenas uma vez.');
            return;
          }
        } catch (error) {
          hideLoading();
          console.error('Erro ao verificar voto:', error);
          showError('Erro', 'Erro ao verificar voto anterior.');
          return;
        }
      }
      
      // Registrar voto
      try {
        showLoading('Registrando seu voto...');
        
        console.log('📝 Inserindo voto:', { lookId, cpfLimpo });
        
        // 1. Adicionar voto na tabela votos
        const { error: votoError } = await supabase
          .from('votos')
          .insert([{
            look_id: lookId,
            cpf_votante: cpfLimpo
          }]);
        
        if (votoError) {
          console.error('❌ Erro ao inserir voto:', votoError);
          throw votoError;
        }
        
        console.log('✅ Voto inserido com sucesso');
        
        // 2. Incrementar contador de votos do look
        // Buscar votos atuais
        const { data: lookAtual, error: getError } = await supabase
          .from('looks')
          .select('votos')
          .eq('id', lookId)
          .single();
        
        if (getError) {
          console.error('❌ Erro ao buscar look:', getError);
          throw getError;
        }
        
        console.log('📊 Votos atuais:', lookAtual.votos);
        
        // Atualizar contador
        const { error: incError } = await supabase
          .from('looks')
          .update({ votos: (lookAtual.votos || 0) + 1 })
          .eq('id', lookId);
        
        if (incError) {
          console.error('❌ Erro ao incrementar votos:', incError);
          throw incError;
        }
        
        console.log('✅ Contador atualizado para:', (lookAtual.votos || 0) + 1);
        
        hideLoading();
        
        // Sucesso!
        showSuccess(
          'Voto Registrado! 🎉',
          `Seu voto no look de ${nomeLook} foi registrado com sucesso!`
        );
        
        // Marcar que já votou nesta sessão
        jaVotou = true;
        
        // Desabilitar todos os botões de votação (apenas nesta sessão)
        desabilitarVotacao('Voto registrado! Obrigado pela participação.');
        
        // Recarregar galeria para atualizar contadores (sem reload da página)
        console.log('🔄 Atualizando contadores de votos...');
        setTimeout(() => carregarGaleria(true), 2000); // true = resetar paginação
        
      } catch (error) {
        hideLoading();
        console.error('Erro ao votar:', error);
        showError('Erro no Voto', 'Não foi possível registrar seu voto. Tente novamente.');
      }
    },
    () => {
      // Callback quando usuário cancela
      showInfo('Voto Cancelado', 'Você pode votar em outro look se preferir.');
    },
    'text',
    'cpf'
  );
}

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

// ========================================
// 8. AUTO-REFRESH DA GALERIA
// ========================================

/**
 * Inicia atualização automática da galeria a cada 15 segundos
 * Atualiza APENAS a galeria, sem reload da página
 */
function iniciarAutoRefresh() {
  console.log('🔄 Auto-refresh da galeria ativado (15s)');
  
  autoRefreshInterval = setInterval(async () => {
    try {
      // Buscar apenas contagem de looks
      const { count, error } = await supabase
        .from('looks')
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      
      // Se houver novos looks ou mudança de votos, recarregar galeria
      if (count !== ultimoNumeroLooks) {
        console.log(`📸 Novos looks detectados: ${ultimoNumeroLooks} → ${count}`);
        await carregarGaleria();
      } else {
        // Mesmo sem novos looks, atualizar contadores de votos
        await carregarGaleria();
      }
    } catch (error) {
      console.error('Erro no auto-refresh:', error);
    }
  }, 15000); // 15 segundos (mais frequente para mostrar votos em tempo real)
}

/**
 * Para o auto-refresh (útil quando página não está mais ativa)
 */
function pararAutoRefresh() {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
    autoRefreshInterval = null;
    console.log('🔄 Auto-refresh pausado');
  }
}

// Pausar auto-refresh quando a página não está visível
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    pararAutoRefresh();
  } else {
    // Recarregar galeria imediatamente ao voltar
    carregarGaleria();
    // Reiniciar auto-refresh se votação estiver liberada
    verificarVotacaoLiberada().then(liberada => {
      if (liberada) {
        iniciarAutoRefresh();
      }
    });
  }
});

// Limpar interval ao sair da página
window.addEventListener('beforeunload', pararAutoRefresh);
