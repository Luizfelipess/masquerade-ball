/**
 * Sistema de Votação Completo (MELHORADO)
 * ✅ Nome OPCIONAL (sem validação)
 * ✅ Galeria + Câmera auto mobile
 * ✅ CPF único (envio + voto)
 */

// ========================================
// INICIALIZAÇÃO
// ========================================
let autoRefreshInterval = null;
let ultimoNumeroLooks = 0;
let jaVotou = false;
let looksCarregados = [];
let indiceAtual = 0;
const LOOKS_POR_PAGINA = 20;

document.addEventListener('DOMContentLoaded', async () => {
  console.log('🗳️ Sistema de votação inicializado');
  // Indica ao `main.js` que esta página usa a versão Supabase
  window.SUPABASE_VOTING = true;
  
  const liberada = await verificarVotacaoLiberada();
  await carregarGaleria();
  setupFormularioEnvio();
  setupFotoPreview();
  
  if (liberada) iniciarAutoRefresh();
});

// ========================================
// VERIFICAR VOTAÇÃO LIBERADA
// ========================================
async function verificarVotacaoLiberada() {
  try {
    const { data, error } = await supabase
      .from('config')
      .select('valor')
      .eq('chave', 'votacao_liberada')
      .single();
    
    if (error) throw error;
    
    const liberada = data?.valor === 'true';
    
    // UI
    document.getElementById('secao-votacao').style.display = liberada ? 'block' : 'none';
    document.getElementById('secao-envio').style.display = liberada ? 'block' : 'none';
    document.getElementById('voting-note').innerHTML = liberada 
      ? '✅ Votação liberada! Vote e envie seu look!'
      : '⏳ Votação liberada na noite do baile!';
    
    return liberada;
  } catch (error) {
    console.error('Erro verificar votação:', error);
    return false;
  }
}

// ========================================
// GALERIA + PAGINAÇÃO
// ========================================
async function carregarGaleria(resetar = false) {
  try {
    const { data: looks, error } = await supabase
      .from('looks')
      .select('*')
      .order('votos', { ascending: false });
    
    if (error) throw error;
    
    const galeriaDiv = document.getElementById('galeria-looks');
    
    if (!looks?.length) {
      galeriaDiv.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:var(--muted);">Nenhum look ainda. Envie o primeiro! 👑</p>';
      return;
    }
    
    looksCarregados = looks;
    if (resetar) {
      indiceAtual = 0;
      galeriaDiv.innerHTML = '';
    }
    
    ultimoNumeroLooks = looks.length;
    renderizarProximaPagina();
    
  } catch (error) {
    console.error('Erro galeria:', error);
  }
}

function renderizarProximaPagina() {
  const galeriaDiv = document.getElementById('galeria-looks');
  const inicio = indiceAtual;
  const fim = Math.min(inicio + LOOKS_POR_PAGINA, looksCarregados.length);
  const looksPagina = looksCarregados.slice(inicio, fim);
  
  // HTML looks
  const htmlLooks = looksPagina.map(look => `
    <div class="gallery-item" data-look-id="${look.id}">
      <img src="${look.foto_url}" alt="Look de ${look.nome || 'Convidado'}" loading="lazy">
      <div class="gallery-info">
        <h4>${look.nome || 'Look Misterioso'}</h4>
        ${look.descricao ? `<p>${look.descricao}</p>` : ''}
        <div class="vote-section">
          <button class="btn-vote" data-look-id="${look.id}" data-look-nome="${(look.nome || 'Look').replace(/"/g, '&quot;')}">
            Votar Neste Look
          </button>
        </div>
      </div>
    </div>
  `).join('');
  
  galeriaDiv.insertAdjacentHTML('beforeend', htmlLooks);
  indiceAtual = fim;
  atualizarBotaoCarregarMais();
  
  // Listeners votos
  document.querySelectorAll('.btn-vote').forEach(btn => {
    btn.onclick = () => votarLook(btn.dataset.lookId, btn.dataset.lookNome);
  });
}

function atualizarBotaoCarregarMais() {
  const btnExistente = document.getElementById('btn-carregar-mais');
  if (btnExistente) btnExistente.remove();
  
  if (indiceAtual < looksCarregados.length) {
    const galeriaDiv = document.getElementById('galeria-looks');
    galeriaDiv.insertAdjacentHTML('beforeend', `
      <div id="btn-carregar-mais" style="grid-column:1/-1;text-align:center;margin-top:24px">
        <button class="btn primary" onclick="renderizarProximaPagina()" style="min-width:250px">
          📸 +${looksCarregados.length - indiceAtual} looks
        </button>
      </div>
    `);
  }
}

// Global
window.renderizarProximaPagina = renderizarProximaPagina;

// ========================================
// FORMULÁRIO ENVIO (NOME OPCIONAL)
// ========================================
function setupFormularioEnvio() {
  document.getElementById('voto-form').onsubmit = async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const nome = formData.get('nome')?.trim() || 'Anônimo'; // ✅ OPCIONAL!
    const cpfRaw = (formData.get('cpf') || '').trim();
    const cpf = cpfRaw ? cpfRaw.replace(/\D/g, '') : null; // CPF agora é opcional
    const descricao = formData.get('descricao')?.trim();
    const foto = document.getElementById('foto-traje').files[0];
    
    // ✅ Se CPF foi informado, valida; caso contrário prossegue (CPF opcional)
    if (cpf && (cpf.length !== 11 || !window.AntiFraude?.validarCPF?.(cpf))) {
      showError('CPF inválido', 'Digite CPF correto (11 dígitos) ou deixe em branco para enviar sem CPF');
      return;
    }
    if (!foto) {
      showError('Foto necessária', 'Escolha foto da galeria/câmera');
      return;
    }
    
    // Check duplicado CPF apenas se CPF informado
    if (cpf) {
      const { data: existente } = await supabase
        .from('looks').select('id').eq('cpf', cpf).maybeSingle();
      if (existente) {
        // Não bloqueamos envio por completo — informamos e interrompemos para evitar duplicatas intencionais
        showError('Já enviou', 'Este CPF já tem look! Se for um erro, contate o administrador.');
        return;
      }
    }

    await enviarLook(nome, cpf, descricao, foto);
  };
}

async function enviarLook(nome, cpf, descricao, foto) {
  try {
    showLoading('Enviando...');
    
    // Compressão
    const fotoComprimida = foto.size > 500 * 1024 
      ? await comprimirImagem(foto) 
      : foto;
    
    // Upload Supabase
    const nomeArquivo = `${cpf}_${Date.now()}.jpg`;
    const { error: uploadError } = await supabase.storage
      .from('looks')
      .upload(nomeArquivo, fotoComprimida, { 
        contentType: 'image/jpeg',
        cacheControl: '3600'
      });
    
    if (uploadError) throw uploadError;
    
    const { data: urlData } = supabase.storage.from('looks').getPublicUrl(nomeArquivo);
    
    // Salvar DB
    await supabase.from('looks').insert([{
      nome, cpf, descricao: descricao || null, 
      foto_url: urlData.publicUrl, votos: 0
    }]);
    
    showSuccess('Look enviado! 🎉', `Obrigado ${nome}!`);
    document.getElementById('voto-form').reset();
    document.getElementById('foto-preview').style.display = 'none';
    carregarGaleria(true);
    
  } catch (error) {
    showError('Erro envio', error.message);
  } finally {
    hideLoading();
  }
}

// ========================================
// VOTAR (CPF ÚNICO)
// ========================================
async function votarLook(lookId, nomeLook) {
  if (jaVotou) return showError('Já votou', 'Um voto por sessão');
  
  const cpfVotante = prompt('Digite seu CPF para votar:')?.replace(/\D/g, '');
  
  if (!cpfVotante || cpfVotante.length !== 11 || !window.AntiFraude?.validarCPF?.(cpfVotante)) {
    return showError('CPF inválido', 'CPF correto necessário');
  }
  
  // Check duplicado
  const { data: jaVotouDB } = await supabase
    .from('votos').select('id').eq('cpf_votante', cpfVotante);
  
  if (jaVotouDB?.length) {
    return showError('Já votou', 'Este CPF já votou!');
  }
  
  // Registrar voto
  await supabase.from('votos').insert([{ look_id: lookId, cpf_votante: cpfVotante }]);
  
  // Incrementar
  const { data: look } = await supabase.from('looks').select('votos').eq('id', lookId).single();
  await supabase.from('looks').update({ votos: (look.votos || 0) + 1 }).eq('id', lookId);
  
  showSuccess('Voto OK!', `Votou em ${nomeLook}!`);
  jaVotou = true;
  document.querySelectorAll('.btn-vote').forEach(btn => btn.disabled = true);
  carregarGaleria(true);
}

// ========================================
// UTILITÁRIOS
// ========================================
function setupFotoPreview() {
  document.getElementById('foto-traje').onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        document.getElementById('foto-preview').src = ev.target.result;
        document.getElementById('foto-preview').style.display = 'block';
      };
      reader.readAsDataURL(file);
    }
  };
}

async function comprimirImagem(file) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = Math.min(1200, img.width);
      canvas.height = (img.height * canvas.width) / img.width;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(resolve, 'image/jpeg', 0.8);
    };
    img.src = URL.createObjectURL(file);
  });
}

function iniciarAutoRefresh() {
  autoRefreshInterval = setInterval(carregarGaleria, 15000);
}

function showLoading(msg) { /* seu código */ }
function hideLoading() { /* seu código */ }
function showSuccess(title, msg) { /* seu código */ }
function showError(title, msg) { /* seu código */ }
