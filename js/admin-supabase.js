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

  if(sessionStorage.getItem('admin-logged') === 'true'){
    loginSection.style.display = 'none';
    dashboardSection.classList.add('active');
    carregarDashboard();
  }

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
        <div class="rsvp-item">
          <h4>👤 ${rsvp.nome}</h4>
          <p>📱 <strong>Tel:</strong> ${rsvp.telefone || 'Não informado'}</p>
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
          <img src="${look.foto_url}" alt="Look de ${look.nome}" loading="lazy">
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
      await carregarDados();
      
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

  console.log('✅ Admin Supabase carregado');
})();
