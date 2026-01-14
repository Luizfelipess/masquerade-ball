// Script para painel administrativo Supabase
(function(){
  'use strict';

  const ADMIN_PASSWORD = 'baile2026thamires';
  
  const loginSection = document.querySelector('#admin-login');
  const dashboardSection = document.querySelector('#admin-dashboard');
  const loginForm = document.querySelector('#login-form');
  const logoutBtn = document.querySelector('#logout-btn');
  
  const statConfirmacoes = document.querySelector('#stat-confirmacoes');
  const statPessoas = document.querySelector('#stat-pessoas');
  const statLooks = document.querySelector('#stat-looks');
  const statVotos = document.querySelector('#stat-votos');
  
  const rsvpsList = document.querySelector('#rsvps-list');
  const looksList = document.querySelector('#looks-list');
  const looksRanking = document.querySelector('#looks-ranking');
  
  const votacaoToggle = document.querySelector('#votacao-toggle');
  const votacaoStatus = document.querySelector('#votacao-status');
  const exportarCsvBtn = document.querySelector('#exportar-csv-btn');
  const exportarExcelBtn = document.querySelector('#exportar-excel-btn');
  const refreshBtn = document.querySelector('#refresh-btn');
  
  // Tabs
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabConfirmacoes = document.querySelector('#tab-confirmacoes');
  const tabLooks = document.querySelector('#tab-looks');
  const tabResultados = document.querySelector('#tab-resultados');

  /* ========== LOGIN ========== */

  loginForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const password = document.querySelector('#admin-password').value;
    
    if(password === ADMIN_PASSWORD){
      loginSection.style.display = 'none';
      dashboardSection.classList.add('active');
      sessionStorage.setItem('admin-logged', 'true');
      carregarDashboard();
    } else {
      showError('Senha Incorreta', 'A senha digitada não está correta. Tente novamente.');
    }
  });

  /* ========== LOGOUT ========== */

  logoutBtn?.addEventListener('click', () => {
    sessionStorage.removeItem('admin-logged');
    loginSection.style.display = 'block';
    dashboardSection.classList.remove('active');
  });

  /* ========== AUTO LOGIN ========== */

  // Verificar se já está logado ao carregar a página
  window.addEventListener('DOMContentLoaded', () => {
    if(sessionStorage.getItem('admin-logged') === 'true'){
      loginSection.style.display = 'none';
      dashboardSection.classList.add('active');
      carregarDashboard();
    }
  });

  /* ========== TABS ========== */

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      
      // Update buttons
      tabBtns.forEach(b => {
        b.classList.remove('active');
        b.style.borderBottomColor = 'transparent';
        b.style.color = 'var(--accent-soft)';
      });
      btn.classList.add('active');
      btn.style.borderBottomColor = 'var(--gold)';
      btn.style.color = 'var(--gold)';
      
      // Update content
      tabConfirmacoes.style.display = 'none';
      tabLooks.style.display = 'none';
      tabResultados.style.display = 'none';
      
      if(tab === 'confirmacoes'){
        tabConfirmacoes.style.display = 'block';
      } else if(tab === 'looks'){
        tabLooks.style.display = 'block';
        // Carregar looks quando abrir a aba
        carregarLooksEnviados();
      } else if(tab === 'resultados'){
        tabResultados.style.display = 'block';
      }
    });
  });

  /* ========== CARREGAR DASHBOARD ========== */

  async function carregarDashboard(){
    await Promise.all([
      carregarEstatisticas(),
      carregarConfirmacoes(),
      carregarResultadosVotacao(),
      carregarStatusVotacao()
    ]);
  }
  
  /* ========== STATUS DA VOTAÇÃO ========== */
  
  async function carregarStatusVotacao(){
    try {
      const { data, error } = await supabase
        .from('config')
        .select('valor')
        .eq('chave', 'votacao_liberada')
        .single();
      
      if (error) throw error;
      
      const liberada = data?.valor === 'true';
      votacaoToggle.checked = liberada;
      atualizarStatusUI(liberada);
      
    } catch (error) {
      console.error('Erro ao carregar status:', error);
    }
  }
  
  function atualizarStatusUI(liberada){
    if (liberada) {
      votacaoStatus.textContent = 'Ativa';
      votacaoStatus.style.color = 'var(--gold)';
    } else {
      votacaoStatus.textContent = 'Bloqueada';
      votacaoStatus.style.color = 'var(--muted)';
    }
  }

  /* ========== ESTATÍSTICAS ========== */

  async function carregarEstatisticas(){
    try {
      // Confirmações
      const { data: rsvps } = await supabase
        .from('rsvps')
        .select('id, dependentes(id)');
      
      const numConfirmacoes = rsvps?.length || 0;
      const numDependentes = rsvps?.reduce((acc, r) => acc + (r.dependentes?.length || 0), 0) || 0;
      const totalPessoas = numConfirmacoes + numDependentes;
      
      // Looks
      const { count: countLooks } = await supabase
        .from('looks')
        .select('*', { count: 'exact', head: true });
      
      // Votos
      const { count: countVotos } = await supabase
        .from('votos')
        .select('*', { count: 'exact', head: true });
      
      statConfirmacoes.textContent = numConfirmacoes;
      statPessoas.textContent = totalPessoas;
      statLooks.textContent = countLooks || 0;
      statVotos.textContent = countVotos || 0;
      
    } catch(error){
      console.error('Erro ao carregar estatísticas:', error);
    }
  }

  /* ========== CARREGAR CONFIRMAÇÕES ========== */

  async function carregarConfirmacoes(){
    const result = await carregarRSVPs();
    
    if(!result.success || result.rsvps.length === 0){
      rsvpsList.innerHTML = '<p style="text-align:center;color:var(--muted);padding:40px 0">Nenhuma confirmação ainda.</p>';
      return;
    }
    
    rsvpsList.innerHTML = result.rsvps.map(rsvp => {
      const dependentes = rsvp.dependentes || [];
      const adultos = dependentes.filter(d => d.tipo === 'adulto');
      const criancas = dependentes.filter(d => d.tipo === 'crianca');
      
      return `
        <div class="rsvp-item" data-rsvp-id="${rsvp.id}">
          <div style="display:flex;justify-content:space-between;align-items:start">
            <div style="flex:1">
              <h4>👤 ${rsvp.nome}</h4>
            </div>
            <button 
              class="btn-manage-rsvp" 
              data-rsvp-id="${rsvp.id}"
              style="background:rgba(232,197,116,0.2);color:var(--gold);border:1px solid var(--gold);padding:6px 12px;border-radius:6px;cursor:pointer;font-size:0.85rem;font-weight:600;transition:all 0.3s"
              title="Gerenciar confirmação"
            >
              ⚙️ Gerenciar
            </button>
          </div>
          
          <p>�📱 <strong>Tel:</strong> ${rsvp.telefone || 'Não informado'}</p>
          ${rsvp.email ? `<p>✉️ <strong>Email:</strong> ${rsvp.email}</p>` : ''}
          ${rsvp.observacoes ? `<p>📝 ${rsvp.observacoes}</p>` : ''}
          
          ${dependentes.length > 0 ? `
            <div style="margin-top:12px">
              <p style="color:var(--gold);font-weight:600;margin-bottom:8px">Acompanhantes:</p>
              ${adultos.map(a => `<span class="dependente-tag">👤 ${a.nome}</span>`).join('')}
              ${criancas.map(c => `<span class="dependente-tag">👶 ${c.nome} (${c.idade} anos)</span>`).join('')}
            </div>
          ` : ''}
          
          <p style="font-size:0.8rem;color:var(--muted);margin-top:12px">
            ✓ Confirmado em ${new Date(rsvp.created_at).toLocaleString('pt-BR')}
          </p>
        </div>
      `;
    }).join('');
    
    // Adicionar event listeners aos botões de gerenciar
    document.querySelectorAll('.btn-manage-rsvp').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const rsvpId = e.target.getAttribute('data-rsvp-id');
        // Comparar como string (UUID não precisa parseInt)
        const rsvp = result.rsvps.find(r => r.id === rsvpId || r.id === parseInt(rsvpId));
        if (rsvp) {
          console.log('🎯 Botão clicado, RSVP encontrado:', rsvp);
          window.abrirModalGerenciarRSVP(rsvp);
        } else {
          console.error('❌ RSVP não encontrado para ID:', rsvpId);
          console.log('📋 RSVPs disponíveis:', result.rsvps.map(r => ({id: r.id, nome: r.nome})));
        }
      });
    });
  }

  /* ========== CARREGAR LOOKS ENVIADOS ========== */

  async function carregarLooksEnviados(){
    try {
      const { data: looks, error } = await supabase
        .from('looks')
        .select('*')
        .order('created_at', { ascending: false }); // Ordem de envio (mais recente primeiro)
      
      if (error) throw error;
      
      if(!looks || looks.length === 0){
        looksList.innerHTML = '<p style="text-align:center;color:var(--muted);padding:40px 0;grid-column:1/-1">Nenhum look enviado ainda.</p>';
        return;
      }
      
      // Renderizar looks em galeria (similar à página de votação)
      looksList.innerHTML = looks.map(look => `
        <div class="gallery-item" data-look-id="${look.id}">
          <img src="${look.foto_url}" alt="Look de ${look.nome}" loading="lazy" class="look-thumbnail" data-foto="${look.foto_url}" data-nome="${look.nome}" style="cursor:pointer">
          <div class="gallery-info">
            <h4>${look.nome}</h4>
            ${look.descricao ? `<p style="color:var(--muted);font-size:0.9rem">${look.descricao}</p>` : ''}
            <div class="vote-section">
              <span class="vote-count">❤️ ${look.votos} votos</span>
              <p style="font-size:0.8rem;color:var(--muted);margin-top:8px">
                📅 Enviado em ${new Date(look.created_at).toLocaleString('pt-BR')}
              </p>
              <button class="btn-ver-votantes" data-look-id="${look.id}" data-look-nome="${look.nome}" style="background:rgba(232,197,116,0.2);color:var(--gold);border:1px solid var(--gold);padding:10px 16px;border-radius:8px;cursor:pointer;margin-top:12px;width:100%;font-weight:600;transition:all 0.3s">
                👥 Ver Votantes (${look.votos})
              </button>
              <button class="btn-delete-look" data-look-id="${look.id}" data-look-nome="${look.nome}" data-foto-url="${look.foto_url}" style="background:#d32f2f;color:#fff;border:none;padding:10px 16px;border-radius:8px;cursor:pointer;margin-top:8px;width:100%;font-weight:600;transition:all 0.3s">
                🗑️ Excluir Look
              </button>
            </div>
          </div>
        </div>
      `).join('');
      
      // Adicionar event listeners nas imagens
      const thumbnails = looksList.querySelectorAll('.look-thumbnail');
      thumbnails.forEach(img => {
        img.addEventListener('click', () => {
          const fotoUrl = img.dataset.foto;
          const nome = img.dataset.nome;
          abrirModalFoto(fotoUrl, nome);
        });
      });
      
      // Adicionar event listeners nos botões de ver votantes
      const botoesVerVotantes = looksList.querySelectorAll('.btn-ver-votantes');
      botoesVerVotantes.forEach(btn => {
        btn.addEventListener('click', async () => {
          const lookId = btn.dataset.lookId;
          const lookNome = btn.dataset.lookNome;
          await mostrarVotantes(lookId, lookNome);
        });
      });
      
      // Adicionar event listeners nos botões de excluir
      const botoesExcluir = looksList.querySelectorAll('.btn-delete-look');
      botoesExcluir.forEach(btn => {
        btn.addEventListener('click', async () => {
          const lookId = btn.dataset.lookId;
          const lookNome = btn.dataset.lookNome;
          const fotoUrl = btn.dataset.fotoUrl;
          
          // Confirmar exclusão
          showConfirm(
            '⚠️ Confirmar Exclusão',
            `Tem certeza que deseja excluir o look de ${lookNome}? Esta ação não pode ser desfeita.`,
            async () => {
              await excluirLook(lookId, lookNome, fotoUrl);
            },
            () => {
              showInfo('Cancelado', 'Exclusão cancelada.');
            }
          );
        });
      });
      
    } catch (error) {
      console.error('❌ Erro ao carregar looks:', error);
      looksList.innerHTML = '<p style="text-align:center;color:#f44336;padding:40px 0;grid-column:1/-1">Erro ao carregar looks enviados.</p>';
    }
  }

  /* ========== CARREGAR RESULTADOS VOTAÇÃO ========== */

  async function carregarResultadosVotacao(){
    try {
      const { data: looks, error } = await supabase
        .from('looks')
        .select('*')
        .order('votos', { ascending: false });
      
      if (error) throw error;
      
      if(!looks || looks.length === 0){
        looksRanking.innerHTML = '<p style="text-align:center;color:var(--muted);padding:40px 0">Nenhum look enviado ainda.</p>';
        return;
      }
      
      looksRanking.innerHTML = looks.map((look, index) => `
      <div class="look-item" data-look-id="${look.id}">
        <div style="font-size:2rem;font-weight:700;color:var(--gold);min-width:40px;text-align:center">
          ${index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
        </div>
        <img src="${look.foto_url}" alt="Look de ${look.nome}">
        <div class="look-info">
          <h4>${look.nome}</h4>
          ${look.descricao ? `<p style="color:var(--muted);font-size:0.9rem">${look.descricao}</p>` : ''}
          <div style="display:flex;gap:8px;margin-top:8px">
            <button class="btn-ver-votantes-ranking" data-look-id="${look.id}" data-look-nome="${look.nome}" style="flex:1;background:rgba(232,197,116,0.15);color:var(--gold);border:1px solid rgba(232,197,116,0.3);padding:8px 12px;border-radius:6px;cursor:pointer;font-size:0.85rem;font-weight:600">
              👥 Votantes
            </button>
            <button class="btn-delete-look-ranking" data-look-id="${look.id}" data-look-nome="${look.nome}" data-foto-url="${look.foto_url}" style="flex:1;background:#d32f2f;color:#fff;border:none;padding:8px 12px;border-radius:6px;cursor:pointer;font-size:0.85rem;font-weight:600">
              🗑️ Excluir
            </button>
          </div>
        </div>
        <div style="text-align:center">
          <div class="look-votes">${look.votos}</div>
          <div style="font-size:0.8rem;color:var(--muted)">votos</div>
        </div>
      </div>
    `).join('');
    
      // Adicionar event listeners nos botões de ver votantes do ranking
      const botoesVerVotantesRanking = looksRanking.querySelectorAll('.btn-ver-votantes-ranking');
      botoesVerVotantesRanking.forEach(btn => {
        btn.addEventListener('click', async () => {
          const lookId = btn.dataset.lookId;
          const lookNome = btn.dataset.lookNome;
          await mostrarVotantes(lookId, lookNome);
        });
      });
    
      // Adicionar event listeners nos botões de excluir do ranking
      const botoesExcluirRanking = looksRanking.querySelectorAll('.btn-delete-look-ranking');
      botoesExcluirRanking.forEach(btn => {
        btn.addEventListener('click', async () => {
          const lookId = btn.dataset.lookId;
          const lookNome = btn.dataset.lookNome;
          const fotoUrl = btn.dataset.fotoUrl;
          
          showConfirm(
            '⚠️ Confirmar Exclusão',
            `Tem certeza que deseja excluir o look de ${lookNome}? Esta ação não pode ser desfeita.`,
            async () => {
              await excluirLook(lookId, lookNome, fotoUrl);
            },
            () => {
              showInfo('Cancelado', 'Exclusão cancelada.');
            }
          );
        });
      });
    
    } catch (error) {
      console.error('❌ Erro ao carregar resultados:', error);
      looksRanking.innerHTML = '<p style="text-align:center;color:#f44336;padding:40px 0">Erro ao carregar resultados da votação.</p>';
    }
  }

  /* ========== MODAL FOTO ========== */

  function abrirModalFoto(fotoUrl, nome) {
    const modalHTML = `
      <div class="modal-overlay active" id="modal-foto-look" style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.95);z-index:10000;display:flex;align-items:center;justify-content:center;padding:20px;cursor:zoom-out" onclick="this.remove()">
        <div style="max-width:90vw;max-height:90vh;position:relative" onclick="event.stopPropagation()">
          <button onclick="document.getElementById('modal-foto-look').remove()" style="position:absolute;top:-40px;right:0;background:rgba(232,197,116,0.2);color:var(--gold);border:1px solid var(--gold);padding:8px 16px;border-radius:8px;cursor:pointer;font-size:1rem;font-weight:600">✕ Fechar</button>
          <img src="${fotoUrl}" alt="Look de ${nome}" style="max-width:100%;max-height:90vh;border-radius:12px;border:2px solid var(--gold);box-shadow:0 10px 40px rgba(0,0,0,0.5)">
          <p style="text-align:center;color:var(--gold);margin-top:16px;font-size:1.2rem;font-weight:600">${nome}</p>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }

  /* ========== MOSTRAR VOTANTES ========== */

  async function mostrarVotantes(lookId, lookNome) {
    try {
      showLoading('Carregando votantes...');
      
      console.log('👥 Buscando votantes do look:', { lookId, lookNome });
      
      // Buscar todos os votos relacionados ao look
      const { data: votos, error } = await supabase
        .from('votos')
        .select('cpf_votante, created_at')
        .eq('look_id', lookId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      hideLoading();
      
      if (!votos || votos.length === 0) {
        showInfo(
          `👥 Votantes - ${lookNome}`,
          'Nenhum voto registrado ainda para este look.',
          'Fechar',
          false
        );
        return;
      }
      
      // Formatar CPF para exibição: 123.456.789-10
      const formatarCPF = (cpf) => {
        if (!cpf || cpf.length !== 11) return cpf;
        return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
      };
      
      // Criar lista de votantes
      const listaVotantes = votos.map((voto, index) => `
        <div style="padding:12px;border-bottom:1px solid rgba(232,197,116,0.1);display:flex;justify-content:space-between;align-items:center">
          <div>
            <strong style="color:var(--gold)">${index + 1}. CPF: ${formatarCPF(voto.cpf_votante)}</strong>
            <br>
            <small style="color:var(--muted)">🕐 ${new Date(voto.created_at).toLocaleString('pt-BR')}</small>
          </div>
        </div>
      `).join('');
      
      // Criar modal customizado
      const modal = document.getElementById('app-modal');
      if (!modal) {
        console.error('Modal não encontrado');
        return;
      }
      
      document.getElementById('modal-icon').textContent = '👥';
      document.getElementById('modal-title').innerHTML = `Votantes - ${lookNome}`;
      document.getElementById('modal-message').innerHTML = `
        <div style="max-height:400px;overflow-y:auto;margin-top:16px">
          <p style="color:var(--accent-soft);margin-bottom:16px;text-align:left">
            <strong style="color:var(--gold)">${votos.length} ${votos.length === 1 ? 'voto registrado' : 'votos registrados'}</strong>
          </p>
          ${listaVotantes}
        </div>
      `;
      
      const actions = document.getElementById('modal-actions');
      actions.innerHTML = `
        <button class="btn primary" onclick="closeModal()">Fechar</button>
      `;
      
      modal.classList.add('active');
      
    } catch (error) {
      hideLoading();
      console.error('❌ Erro ao carregar votantes:', error);
      showError('Erro', 'Não foi possível carregar a lista de votantes.');
    }
  }

  /* ========== EXCLUIR LOOK ========== */

  async function excluirLook(lookId, lookNome, fotoUrl) {
    try {
      showLoading('Excluindo look...');
      
      console.log('🗑️ Excluindo look:', { lookId, lookNome, fotoUrl });
      
      // 1. Excluir todos os votos relacionados ao look
      const { error: votosError } = await supabase
        .from('votos')
        .delete()
        .eq('look_id', lookId);
      
      if (votosError) {
        console.warn('⚠️ Aviso ao excluir votos:', votosError);
        // Continua mesmo se não houver votos
      }
      
      // 2. Excluir o look do banco de dados
      const { error: dbError } = await supabase
        .from('looks')
        .delete()
        .eq('id', lookId);
      
      if (dbError) throw dbError;
      
      // 3. Excluir a foto do storage
      // Extrair o nome do arquivo da URL
      const urlParts = fotoUrl.split('/');
      const nomeArquivo = urlParts[urlParts.length - 1];
      
      console.log('📁 Excluindo arquivo:', nomeArquivo);
      
      const { error: storageError } = await supabase.storage
        .from('looks')
        .remove([nomeArquivo]);
      
      if (storageError) {
        console.warn('⚠️ Aviso ao excluir foto do storage:', storageError);
        // Continua mesmo se houver erro (foto pode já ter sido deletada)
      }
      
      hideLoading();
      
      showSuccess(
        'Look Excluído! 🗑️',
        `O look de ${lookNome} foi excluído com sucesso.`
      );
      
      // Recarregar dados
      await carregarDashboard();
      await carregarLooksEnviados(); // Atualizar aba de looks
      
    } catch (error) {
      hideLoading();
      console.error('❌ Erro ao excluir look:', error);
      showError('Erro ao Excluir', 'Não foi possível excluir o look. Tente novamente.');
    }
  }

  /* ========== AÇÕES ADMIN ========== */

  // Toggle de votação
  votacaoToggle?.addEventListener('change', async (e) => {
    const ativar = e.target.checked;
    
    const mensagem = ativar 
      ? 'Deseja liberar a votação agora?\n\nOs convidados poderão enviar e votar nos looks.'
      : 'Deseja bloquear a votação?\n\nOs convidados não poderão mais votar ou enviar looks.';
    
    showConfirm(
      ativar ? 'Liberar Votação' : 'Bloquear Votação',
      mensagem,
      async () => {
        showLoading(ativar ? 'Liberando votação...' : 'Bloqueando votação...');
        
        try {
          const { error } = await supabase
            .from('config')
            .update({ 
              valor: ativar ? 'true' : 'false',
              updated_at: new Date().toISOString()
            })
            .eq('chave', 'votacao_liberada');
          
          if (error) throw error;
          
          hideLoading();
          atualizarStatusUI(ativar);
          
          showSuccess(
            ativar ? 'Votação Liberada! 🎉' : 'Votação Bloqueada 🔒',
            ativar 
              ? 'A votação foi liberada. Os convidados já podem votar!' 
              : 'A votação foi bloqueada com sucesso.'
          );
          
        } catch (error) {
          hideLoading();
          console.error('Erro ao alterar votação:', error);
          showError('Erro', `Não foi possível alterar o status: ${error.message}`);
          // Reverter toggle
          votacaoToggle.checked = !ativar;
        }
      },
      () => {
        // Cancelou - reverter toggle
        votacaoToggle.checked = !ativar;
      }
    );
  });

  // Exportar CSV
  exportarCsvBtn?.addEventListener('click', async () => {
    showLoading('Gerando CSV...');
    const result = await carregarRSVPs();
    
    if(!result.success || result.rsvps.length === 0){
      hideLoading();
      showError('Sem Dados', 'Nenhuma confirmação para exportar ainda.');
      return;
    }
    
    // Gerar CSV
    let csv = 'Nome,Idade,CPF,Telefone,Email,Dependentes Adultos,Dependentes Crianças,Total Pessoas,Data Confirmação\n';
    
    result.rsvps.forEach(rsvp => {
      const dependentes = rsvp.dependentes || [];
      const adultos = dependentes.filter(d => d.tipo === 'adulto').length;
      const criancas = dependentes.filter(d => d.tipo === 'crianca').length;
      const total = 1 + adultos + criancas;
      
      csv += `"${rsvp.nome}","${rsvp.idade || ''}","${rsvp.cpf || ''}","${rsvp.telefone || ''}","${rsvp.email || ''}",${adultos},${criancas},${total},"${new Date(rsvp.created_at).toLocaleString('pt-BR')}"\n`;
      
      // Adicionar linhas de dependentes
      dependentes.forEach(dep => {
        csv += `"  └ ${dep.nome} (${dep.tipo === 'adulto' ? 'Adulto' : 'Criança ' + dep.idade + ' anos'})","${dep.idade || ''}","","","","","","",""\n`;
      });
    });
    
    // Download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `confirmacoes_baile_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    hideLoading();
    showSuccess('CSV Exportado', `Arquivo baixado com ${result.rsvps.length} confirmações!`);
  });

  // Exportar Excel
  exportarExcelBtn?.addEventListener('click', async () => {
    showLoading('Gerando arquivo Excel...');
    const result = await carregarRSVPs();
    
    if(!result.success || result.rsvps.length === 0){
      hideLoading();
      showError('Sem Dados', 'Nenhuma confirmação para exportar ainda.');
      return;
    }
    
    try {
      // Preparar dados para o Excel
      const dados = [];
      
      result.rsvps.forEach(rsvp => {
        const dependentes = rsvp.dependentes || [];
        const adultos = dependentes.filter(d => d.tipo === 'adulto').length;
        const criancas = dependentes.filter(d => d.tipo === 'crianca').length;
        const total = 1 + adultos + criancas;
        
        // Linha principal
        dados.push({
          'Nome': rsvp.nome,
          'Idade': rsvp.idade || '',
          'CPF': rsvp.cpf || '',
          'Telefone': rsvp.telefone || '',
          'Email': rsvp.email || '',
          'Dependentes Adultos': adultos,
          'Dependentes Crianças': criancas,
          'Total Pessoas': total,
          'Data Confirmação': new Date(rsvp.created_at).toLocaleString('pt-BR')
        });
        
        // Linhas de dependentes
        dependentes.forEach(dep => {
          dados.push({
            'Nome': `  └ ${dep.nome} (${dep.tipo === 'adulto' ? 'Adulto' : 'Criança ' + dep.idade + ' anos'})`,
            'Idade': dep.idade || '',
            'CPF': '',
            'Telefone': '',
            'Email': '',
            'Dependentes Adultos': '',
            'Dependentes Crianças': '',
            'Total Pessoas': '',
            'Data Confirmação': ''
          });
        });
      });
      
      // Criar workbook
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(dados);
      
      // Ajustar largura das colunas
      ws['!cols'] = [
        { wch: 30 }, // Nome
        { wch: 8 },  // Idade
        { wch: 15 }, // CPF
        { wch: 15 }, // Telefone
        { wch: 25 }, // Email
        { wch: 18 }, // Dep. Adultos
        { wch: 18 }, // Dep. Crianças
        { wch: 15 }, // Total
        { wch: 20 }  // Data
      ];
      
      XLSX.utils.book_append_sheet(wb, ws, 'Confirmações');
      
      // Download
      const fileName = `confirmacoes_baile_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      hideLoading();
      showSuccess('Excel Exportado! 📊', `Arquivo "${fileName}" baixado com ${result.rsvps.length} confirmações!`);
      
    } catch (error) {
      hideLoading();
      console.error('Erro ao gerar Excel:', error);
      showError('Erro', 'Não foi possível gerar o arquivo Excel. Tente o CSV.');
    }
  });

  refreshBtn?.addEventListener('click', () => {
    carregarDashboard();
  });

  /* ========== MODAL GERENCIAR RSVP ========== */

  window.abrirModalGerenciarRSVP = function(rsvp) {
    console.log('🔓 Abrindo modal para:', rsvp);
    
    // Remover modal anterior se existir
    const modalExistente = document.getElementById('modal-gerenciar-rsvp');
    if (modalExistente) {
      console.log('⚠️ Removendo modal existente');
      modalExistente.remove();
    }
    
    const dependentes = rsvp.dependentes || [];
    const totalPessoas = 1 + dependentes.length;
    
    console.log('📋 Dependentes:', dependentes);
    console.log('👥 Total de pessoas:', totalPessoas);
    
    const modalHTML = `
      <div class="modal-overlay active" id="modal-gerenciar-rsvp" style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.8);z-index:10000;display:flex;align-items:center;justify-content:center;padding:20px">
        <div class="modal-content" style="background:#1a1a1a;border:2px solid var(--gold);border-radius:16px;max-width:600px;width:100%;max-height:90vh;overflow-y:auto;padding:32px">
          
          <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:24px">
            <h3 style="color:var(--gold);margin:0;font-family:'Playfair Display',serif;font-size:1.5rem">
              ⚙️ Gerenciar Confirmação
            </h3>
            <button class="btn-close-modal" style="background:none;border:none;color:var(--muted);font-size:1.5rem;cursor:pointer;padding:0;line-height:1">×</button>
          </div>

          <!-- Titular -->
          <div style="background:rgba(232,197,116,0.05);border:1px solid rgba(232,197,116,0.2);border-radius:12px;padding:20px;margin-bottom:24px">
            <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:12px">
              <h4 style="color:var(--gold);margin:0;font-size:1.1rem">👤 Titular</h4>
              <button 
                class="btn-delete-titular" 
                data-rsvp-id="${rsvp.id}"
                style="background:#d32f2f;color:#fff;border:none;padding:6px 12px;border-radius:6px;cursor:pointer;font-size:0.85rem;font-weight:600"
              >
                🗑️ Excluir Tudo
              </button>
            </div>
            <p style="color:var(--accent-soft);margin:8px 0;font-size:1rem"><strong>${rsvp.nome}</strong></p>
            <p style="color:var(--muted);margin:4px 0;font-size:0.9rem">📱 ${rsvp.telefone || 'Não informado'}</p>
            ${rsvp.email ? `<p style="color:var(--muted);margin:4px 0;font-size:0.9rem">✉️ ${rsvp.email}</p>` : ''}
            ${rsvp.idade ? `<p style="color:var(--muted);margin:4px 0;font-size:0.9rem">🎂 ${rsvp.idade} anos</p>` : ''}
            <p style="color:var(--muted);margin:8px 0 0;font-size:0.8rem">✓ ${new Date(rsvp.created_at).toLocaleString('pt-BR')}</p>
          </div>

          <!-- Dependentes -->
          ${dependentes.length > 0 ? `
            <div style="margin-bottom:24px">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
                <h4 style="color:var(--gold);margin:0;font-size:1.1rem">👥 Acompanhantes (${dependentes.length})</h4>
                <button 
                  class="btn-add-dependente"
                  style="background:var(--gold);color:#000;border:none;padding:6px 12px;border-radius:6px;cursor:pointer;font-size:0.85rem;font-weight:600"
                >
                  ➕ Adicionar
                </button>
              </div>
              <div style="display:flex;flex-direction:column;gap:12px" id="lista-dependentes-modal">
                ${dependentes.map(dep => `
                  <div class="dependente-item-modal" data-dep-id="${dep.id}" style="background:rgba(255,255,255,0.02);border:1px solid rgba(232,197,116,0.1);border-radius:8px;padding:16px;display:flex;justify-content:space-between;align-items:center">
                    <div>
                      <p style="color:var(--accent-soft);margin:0;font-size:0.95rem">
                        ${dep.tipo === 'crianca' ? '👶' : '👤'} <strong>${dep.nome}</strong>
                      </p>
                      ${dep.idade ? `<p style="color:var(--muted);margin:4px 0 0;font-size:0.85rem">Idade: ${dep.idade} anos</p>` : ''}
                    </div>
                    <button 
                      class="btn-delete-dependente" 
                      data-dep-id="${dep.id}"
                      data-dep-nome="${dep.nome}"
                      style="background:#d32f2f;color:#fff;border:none;padding:6px 12px;border-radius:6px;cursor:pointer;font-size:0.85rem;font-weight:600"
                    >
                      🗑️
                    </button>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : `
            <div style="margin-bottom:24px">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
                <h4 style="color:var(--gold);margin:0;font-size:1.1rem">👥 Acompanhantes</h4>
                <button 
                  class="btn-add-dependente"
                  style="background:var(--gold);color:#000;border:none;padding:6px 12px;border-radius:6px;cursor:pointer;font-size:0.85rem;font-weight:600"
                >
                  ➕ Adicionar
                </button>
              </div>
              <p style="text-align:center;color:var(--muted);padding:20px;font-style:italic">
                Nenhum acompanhante ainda
              </p>
            </div>
          `}

          <!-- Resumo -->
          <div style="background:rgba(232,197,116,0.1);border:1px solid var(--gold);border-radius:8px;padding:16px;margin-top:24px">
            <p style="color:var(--gold);font-weight:600;text-align:center;margin:0;font-size:1.1rem">
              📊 Total: ${totalPessoas} pessoa(s) confirmada(s)
            </p>
          </div>

          <!-- Botão Fechar -->
          <button class="btn primary btn-close-modal" style="width:100%;margin-top:24px;padding:12px">
            ✓ Fechar
          </button>
        </div>
      </div>
    `;
    
    // Adicionar modal ao DOM
    console.log('➕ Adicionando modal ao DOM...');
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Event listeners
    const modal = document.getElementById('modal-gerenciar-rsvp');
    
    if (!modal) {
      console.error('❌ Modal não foi criado no DOM!');
      return;
    }
    
    console.log('✅ Modal criado com sucesso:', modal);
    
    // Fechar modal
    modal.querySelectorAll('.btn-close-modal').forEach(btn => {
      btn.addEventListener('click', () => {
        console.log('🚪 Fechando modal...');
        modal.remove();
      });
    });
    
    // Clicar fora fecha
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
    
    // Excluir titular (toda a confirmação)
    modal.querySelector('.btn-delete-titular')?.addEventListener('click', async () => {
      if (confirm(`❌ Excluir TODA a confirmação de "${rsvp.nome}"?\n\nIsso irá remover o titular e todos os ${dependentes.length} acompanhante(s).\n\nEsta ação não pode ser desfeita!`)) {
        modal.remove();
        await excluirConfirmacao(rsvp.id, rsvp.nome);
      }
    });
    
    // Excluir dependentes individuais
    modal.querySelectorAll('.btn-delete-dependente').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const depId = e.target.getAttribute('data-dep-id');
        const depNome = e.target.getAttribute('data-dep-nome');
        
        if (confirm(`❌ Excluir o acompanhante "${depNome}"?\n\nEsta ação não pode ser desfeita!`)) {
          await excluirDependente(depId, depNome, modal);
        }
      });
    });

    // Adicionar acompanhante
    modal.querySelector('.btn-add-dependente')?.addEventListener('click', () => {
      modal.remove();
      abrirModalAdicionarAcompanhante(rsvp);
    });
  }

  /* ========== EXCLUIR DEPENDENTE ========== */

  window.excluirDependente = async function(depId, depNome, modal) {
    try {
      showLoading('Excluindo acompanhante...');
      
      const { error } = await window.supabase
        .from('dependentes')
        .delete()
        .eq('id', depId);
      
      if (error) throw error;
      
      hideLoading();
      showSuccess('Acompanhante Excluído! 🗑️', `"${depNome}" foi removido da confirmação.`);
      
      // Remover do DOM do modal
      const depItem = modal.querySelector(`[data-dep-id="${depId}"]`);
      if (depItem) {
        depItem.style.transition = 'opacity 0.3s';
        depItem.style.opacity = '0';
        setTimeout(() => depItem.remove(), 300);
      }
      
      // Recarregar dashboard
      setTimeout(() => carregarDashboard(), 500);
      
    } catch (error) {
      hideLoading();
      console.error('Erro ao excluir dependente:', error);
      showError('Erro ao Excluir', `Não foi possível excluir o acompanhante: ${error.message}`);
    }
  }

  /* ========== ADICIONAR ACOMPANHANTE ========== */

  function abrirModalAdicionarAcompanhante(rsvp) {
    const modalHTML = `
      <div class="modal-overlay active" id="modal-adicionar-acompanhante" style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.8);z-index:10000;display:flex;align-items:center;justify-content:center;padding:20px">
        <div class="modal-content" style="background:#1a1a1a;border:2px solid var(--gold);border-radius:16px;max-width:500px;width:100%;max-height:90vh;overflow-y:auto;padding:32px">
          
          <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:24px">
            <h3 style="color:var(--gold);margin:0;font-family:'Playfair Display',serif;font-size:1.5rem">
              ➕ Adicionar Acompanhante
            </h3>
            <button class="btn-close-modal" style="background:none;border:none;color:var(--muted);font-size:1.5rem;cursor:pointer;padding:0;line-height:1">×</button>
          </div>

          <div style="background:rgba(232,197,116,0.05);border:1px solid rgba(232,197,116,0.2);border-radius:8px;padding:16px;margin-bottom:24px">
            <p style="color:var(--accent-soft);margin:0;font-size:0.9rem">
              <strong style="color:var(--gold)">Confirmação de:</strong> ${rsvp.nome}
            </p>
          </div>

          <form id="form-adicionar-acompanhante" style="display:flex;flex-direction:column;gap:16px">
            <div>
              <label style="color:var(--accent-soft);font-weight:600;display:block;margin-bottom:8px">Nome do Acompanhante *</label>
              <input type="text" id="dep-nome" required style="width:100%;padding:12px;background:rgba(255,255,255,0.05);border:1px solid rgba(232,197,116,0.3);border-radius:8px;color:var(--accent-soft);font-size:1rem">
            </div>

            <div>
              <label style="color:var(--accent-soft);font-weight:600;display:block;margin-bottom:8px">Tipo *</label>
              <select id="dep-tipo" required style="width:100%;padding:12px;background:rgba(255,255,255,0.05);border:1px solid rgba(232,197,116,0.3);border-radius:8px;color:var(--accent-soft);font-size:1rem;cursor:pointer">
                <option value="" style="background:#1a1a1a;color:var(--muted)">Selecione...</option>
                <option value="adulto" style="background:#1a1a1a;color:var(--accent-soft)">👤 Adulto (18+ anos)</option>
                <option value="crianca" style="background:#1a1a1a;color:var(--accent-soft)">👶 Criança (0-17 anos)</option>
              </select>
            </div>

            <div id="idade-field" style="display:none">
              <label style="color:var(--accent-soft);font-weight:600;display:block;margin-bottom:8px">Idade da Criança *</label>
              <input type="number" id="dep-idade" min="0" max="17" placeholder="Ex: 5" style="width:100%;padding:12px;background:rgba(255,255,255,0.05);border:1px solid rgba(232,197,116,0.3);border-radius:8px;color:var(--accent-soft);font-size:1rem">
            </div>

            <div style="display:flex;gap:12px;margin-top:16px">
              <button type="button" class="btn-close-modal" style="flex:1;background:rgba(255,255,255,0.1);color:var(--accent-soft);border:none;padding:12px;border-radius:8px;cursor:pointer;font-weight:600">
                Cancelar
              </button>
              <button type="submit" style="flex:1;background:var(--gold);color:#000;border:none;padding:12px;border-radius:8px;cursor:pointer;font-weight:600;transition:all 0.3s">
                ✓ Adicionar
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const modal = document.getElementById('modal-adicionar-acompanhante');
    const form = document.getElementById('form-adicionar-acompanhante');
    const tipoSelect = document.getElementById('dep-tipo');
    const idadeField = document.getElementById('idade-field');
    const idadeInput = document.getElementById('dep-idade');

    // Mostrar campo idade apenas para crianças
    tipoSelect.addEventListener('change', () => {
      if (tipoSelect.value === 'crianca') {
        idadeField.style.display = 'block';
        idadeInput.required = true;
      } else {
        idadeField.style.display = 'none';
        idadeInput.required = false;
        idadeInput.value = '';
      }
    });

    // Fechar modal
    modal.querySelectorAll('.btn-close-modal').forEach(btn => {
      btn.addEventListener('click', () => modal.remove());
    });

    // Clicar fora fecha
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });

    // Submit do form
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const nome = document.getElementById('dep-nome').value.trim();
      const tipo = document.getElementById('dep-tipo').value;
      const idade = tipo === 'crianca' ? parseInt(document.getElementById('dep-idade').value) : null;

      if (!nome || !tipo) {
        showError('Campos Obrigatórios', 'Preencha todos os campos obrigatórios.');
        return;
      }

      if (tipo === 'crianca' && !idade) {
        showError('Idade Obrigatória', 'Para crianças, informe a idade.');
        return;
      }

      try {
        showLoading('Adicionando acompanhante...');
        modal.remove();

        const { data, error } = await supabase
          .from('dependentes')
          .insert({
            rsvp_id: rsvp.id,
            nome,
            tipo,
            idade
          })
          .select()
          .single();

        if (error) throw error;

        hideLoading();
        showSuccess('Acompanhante Adicionado! ✅', `${nome} foi adicionado(a) como acompanhante de ${rsvp.nome}!`);
        
        // Recarregar dashboard
        await carregarDashboard();

      } catch (error) {
        hideLoading();
        console.error('Erro ao adicionar acompanhante:', error);
        showError('Erro ao Adicionar', `Não foi possível adicionar o acompanhante: ${error.message}`);
      }
    });
  }

  /* ========== EXCLUIR CONFIRMAÇÃO ========== */

  async function excluirConfirmacao(rsvpId, rsvpNome) {
    try {
      showLoading('Excluindo confirmação...');
      
      // 1. Excluir dependentes primeiro (CASCADE pode fazer isso automaticamente, mas vamos garantir)
      const { error: depsError } = await supabase
        .from('dependentes')
        .delete()
        .eq('rsvp_id', rsvpId);
      
      if (depsError) {
        console.warn('Aviso ao excluir dependentes:', depsError);
      }
      
      // 2. Excluir RSVP
      const { error: rsvpError } = await supabase
        .from('rsvps')
        .delete()
        .eq('id', rsvpId);
      
      if (rsvpError) throw rsvpError;
      
      hideLoading();
      showSuccess('Confirmação Excluída! 🗑️', `A confirmação de "${rsvpNome}" foi removida com sucesso.`);
      
      // Recarregar dashboard
      await carregarDashboard();
      
    } catch (error) {
      hideLoading();
      console.error('Erro ao excluir confirmação:', error);
      showError('Erro ao Excluir', `Não foi possível excluir a confirmação: ${error.message}`);
    }
  }

  /* ========== ADICIONAR CONFIRMAÇÃO MANUAL ========== */

  document.getElementById('btn-adicionar-confirmacao')?.addEventListener('click', () => {
    abrirModalAdicionarConfirmacao();
  });

  function abrirModalAdicionarConfirmacao() {
    const modalHTML = `
      <div class="modal-overlay active" id="modal-adicionar-confirmacao" style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.8);z-index:10000;display:flex;align-items:center;justify-content:center;padding:20px">
        <div class="modal-content" style="background:#1a1a1a;border:2px solid var(--gold);border-radius:16px;max-width:600px;width:100%;max-height:90vh;overflow-y:auto;padding:32px">
          
          <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:24px">
            <h3 style="color:var(--gold);margin:0;font-family:'Playfair Display',serif;font-size:1.5rem">
              ➕ Adicionar Confirmação Manual
            </h3>
            <button class="btn-close-modal" style="background:none;border:none;color:var(--muted);font-size:1.5rem;cursor:pointer;padding:0;line-height:1">×</button>
          </div>

          <form id="form-adicionar-confirmacao" style="display:flex;flex-direction:column;gap:16px">
            <div>
              <label style="color:var(--accent-soft);font-weight:600;display:block;margin-bottom:8px">Nome Completo *</label>
              <input type="text" id="add-nome" required style="width:100%;padding:12px;background:rgba(255,255,255,0.05);border:1px solid rgba(232,197,116,0.3);border-radius:8px;color:var(--accent-soft);font-size:1rem">
            </div>

            <div>
              <label style="color:var(--accent-soft);font-weight:600;display:block;margin-bottom:8px">Telefone *</label>
              <input type="tel" id="add-telefone" required placeholder="(11) 99999-9999" style="width:100%;padding:12px;background:rgba(255,255,255,0.05);border:1px solid rgba(232,197,116,0.3);border-radius:8px;color:var(--accent-soft);font-size:1rem">
            </div>

            <div>
              <label style="color:var(--accent-soft);font-weight:600;display:block;margin-bottom:8px">Email</label>
              <input type="email" id="add-email" placeholder="exemplo@email.com" style="width:100%;padding:12px;background:rgba(255,255,255,0.05);border:1px solid rgba(232,197,116,0.3);border-radius:8px;color:var(--accent-soft);font-size:1rem">
            </div>

            <div>
              <label style="color:var(--accent-soft);font-weight:600;display:block;margin-bottom:8px">Idade</label>
              <input type="number" id="add-idade" min="0" max="120" placeholder="Ex: 25" style="width:100%;padding:12px;background:rgba(255,255,255,0.05);border:1px solid rgba(232,197,116,0.3);border-radius:8px;color:var(--accent-soft);font-size:1rem">
            </div>

            <div>
              <label style="color:var(--accent-soft);font-weight:600;display:block;margin-bottom:8px">Observações</label>
              <textarea id="add-observacoes" rows="3" placeholder="Informações adicionais..." style="width:100%;padding:12px;background:rgba(255,255,255,0.05);border:1px solid rgba(232,197,116,0.3);border-radius:8px;color:var(--accent-soft);font-size:1rem;resize:vertical"></textarea>
            </div>

            <div style="background:rgba(232,197,116,0.1);border:1px solid var(--gold);border-radius:8px;padding:16px;margin-top:8px">
              <p style="color:var(--muted);font-size:0.9rem;margin:0">
                💡 <strong>Dica:</strong> Após adicionar, você pode gerenciar e adicionar acompanhantes usando o botão "⚙️ Gerenciar".
              </p>
            </div>

            <div style="display:flex;gap:12px;margin-top:16px">
              <button type="button" class="btn-close-modal" style="flex:1;background:rgba(255,255,255,0.1);color:var(--accent-soft);border:none;padding:12px;border-radius:8px;cursor:pointer;font-weight:600">
                Cancelar
              </button>
              <button type="submit" style="flex:1;background:var(--gold);color:#000;border:none;padding:12px;border-radius:8px;cursor:pointer;font-weight:600;transition:all 0.3s">
                ✓ Adicionar
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const modal = document.getElementById('modal-adicionar-confirmacao');
    const form = document.getElementById('form-adicionar-confirmacao');

    // Fechar modal
    modal.querySelectorAll('.btn-close-modal').forEach(btn => {
      btn.addEventListener('click', () => modal.remove());
    });

    // Clicar fora fecha
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });

    // Máscara de telefone
    const telInput = document.getElementById('add-telefone');
    telInput.addEventListener('input', (e) => {
      let value = e.target.value.replace(/\D/g, '');
      if (value.length > 11) value = value.slice(0, 11);
      
      if (value.length <= 10) {
        value = value.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
      } else {
        value = value.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
      }
      
      e.target.value = value;
    });

    // Submit do form
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const nome = document.getElementById('add-nome').value.trim();
      const telefone = document.getElementById('add-telefone').value.trim();
      const email = document.getElementById('add-email').value.trim() || null;
      const idade = document.getElementById('add-idade').value ? parseInt(document.getElementById('add-idade').value) : null;
      const observacoes = document.getElementById('add-observacoes').value.trim() || null;

      if (!nome || !telefone) {
        showError('Campos Obrigatórios', 'Preencha pelo menos o nome e telefone.');
        return;
      }

      try {
        showLoading('Adicionando confirmação...');
        modal.remove();

        const { data, error } = await supabase
          .from('rsvps')
          .insert({
            nome,
            telefone,
            email,
            idade,
            cpf: null,
            observacoes
          })
          .select()
          .single();

        if (error) throw error;

        hideLoading();
        showSuccess('Confirmação Adicionada! ✅', `${nome} foi confirmado(a) com sucesso!`);
        
        // Recarregar dashboard
        await carregarDashboard();

      } catch (error) {
        hideLoading();
        console.error('Erro ao adicionar confirmação:', error);
        showError('Erro ao Adicionar', `Não foi possível adicionar a confirmação: ${error.message}`);
      }
    });
  }

  console.log('✅ Admin Supabase carregado');
})();
