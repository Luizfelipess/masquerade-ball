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
  const looksRanking = document.querySelector('#looks-ranking');
  
  const liberarVotacaoBtn = document.querySelector('#liberar-votacao-btn');
  const bloquearVotacaoBtn = document.querySelector('#bloquear-votacao-btn');
  const exportarCsvBtn = document.querySelector('#exportar-csv-btn');
  const refreshBtn = document.querySelector('#refresh-btn');
  
  // Tabs
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabConfirmacoes = document.querySelector('#tab-confirmacoes');
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
      if(tab === 'confirmacoes'){
        tabConfirmacoes.style.display = 'block';
        tabResultados.style.display = 'none';
      } else {
        tabConfirmacoes.style.display = 'none';
        tabResultados.style.display = 'block';
      }
    });
  });

  /* ========== CARREGAR DASHBOARD ========== */

  async function carregarDashboard(){
    await Promise.all([
      carregarEstatisticas(),
      carregarConfirmacoes(),
      carregarResultadosVotacao()
    ]);
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
      <div class="look-item">
        <div style="font-size:2rem;font-weight:700;color:var(--gold);min-width:40px;text-align:center">
          ${index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
        </div>
        <img src="${look.foto_url}" alt="Look de ${look.nome}">
        <div class="look-info">
          <h4>${look.nome}</h4>
          ${look.descricao ? `<p style="color:var(--muted);font-size:0.9rem">${look.descricao}</p>` : ''}
        </div>
        <div style="text-align:center">
          <div class="look-votes">${look.votos}</div>
          <div style="font-size:0.8rem;color:var(--muted)">votos</div>
        </div>
      </div>
    `).join('');
    
    } catch (error) {
      console.error('❌ Erro ao carregar resultados:', error);
      looksRanking.innerHTML = '<p style="text-align:center;color:#f44336;padding:40px 0">Erro ao carregar resultados da votação.</p>';
    }
  }

  /* ========== AÇÕES ADMIN ========== */

  liberarVotacaoBtn?.addEventListener('click', async () => {
    showConfirm(
      'Liberar Votação',
      'Deseja liberar a votação agora?\n\nOs convidados poderão enviar e votar nos looks.',
      async () => {
        showLoading('Liberando votação...');
        const result = await liberarVotacaoManual();
        hideLoading();
        
        if(result.success){
          showSuccess('Votação Liberada', 'A votação foi liberada com sucesso! Os convidados já podem votar.');
        } else {
          showError('Erro', `Não foi possível liberar a votação: ${result.error}`);
        }
      }
    );
  });

  bloquearVotacaoBtn?.addEventListener('click', async () => {
    showConfirm(
      'Bloquear Votação',
      'Deseja bloquear a votação?\n\nOs convidados não poderão mais votar.',
      async () => {
        showLoading('Bloqueando votação...');
        const result = await bloquearVotacao();
        hideLoading();
        
        if(result.success){
          showSuccess('Votação Bloqueada', 'A votação foi bloqueada. Os convidados não podem mais votar.');
        } else {
          showError('Erro', `Não foi possível bloquear a votação: ${result.error}`);
        }
      }
    );
  });

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

  refreshBtn?.addEventListener('click', () => {
    carregarDashboard();
  });

  console.log('✅ Admin Supabase carregado');
})();
