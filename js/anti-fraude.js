/**
 * Sistema Anti-Fraude para Votação
 * Versão adaptada para TABLET COMPARTILHADO no evento
 * Proteção APENAS por CPF no banco de dados
 */

(function() {
  'use strict';
  
  // ========================================
  // 1. RATE LIMITING (PREVENIR SPAM)
  // ========================================
  
  const rateLimits = new Map();
  
  function verificarRateLimit(action, maxAttempts = 5, windowMs = 30000) {
    const now = Date.now();
    const key = action;
    
    if (!rateLimits.has(key)) {
      rateLimits.set(key, []);
    }
    
    const attempts = rateLimits.get(key);
    
    // Remover tentativas antigas
    const recentAttempts = attempts.filter(t => now - t < windowMs);
    
    if (recentAttempts.length >= maxAttempts) {
      const oldestAttempt = Math.min(...recentAttempts);
      const waitTime = Math.ceil((windowMs - (now - oldestAttempt)) / 1000);
      throw new Error(`Muitas tentativas. Aguarde ${waitTime} segundos.`);
    }
    
    recentAttempts.push(now);
    rateLimits.set(key, recentAttempts);
    
    return true;
  }
  
  // ========================================
  // 2. VALIDAÇÃO COMPLETA DE CPF
  // ========================================
  
  /**
   * Validação completa de CPF (com dígitos verificadores)
   */
  function validarCPFCompleto(cpf) {
    if (!cpf || cpf.length !== 11) return false;
    
    // Verificar se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cpf)) return false;
    
    // Validar primeiro dígito verificador
    let soma = 0;
    for (let i = 0; i < 9; i++) {
      soma += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let digito1 = 11 - (soma % 11);
    if (digito1 > 9) digito1 = 0;
    if (parseInt(cpf.charAt(9)) !== digito1) return false;
    
    // Validar segundo dígito verificador
    soma = 0;
    for (let i = 0; i < 10; i++) {
      soma += parseInt(cpf.charAt(i)) * (11 - i);
    }
    let digito2 = 11 - (soma % 11);
    if (digito2 > 9) digito2 = 0;
    if (parseInt(cpf.charAt(10)) !== digito2) return false;
    
    return true;
  }
  
  // ========================================
  // 3. DETECTAR DEVTOOLS (APENAS AVISO)
  // ========================================
  
  let devtoolsOpen = false;
  const checkDevTools = () => {
    const threshold = 160;
    if (window.outerWidth - window.innerWidth > threshold || 
        window.outerHeight - window.innerHeight > threshold) {
      devtoolsOpen = true;
    } else {
      devtoolsOpen = false;
    }
  };
  
  setInterval(checkDevTools, 2000);
  
  // ========================================
  // 4. LIMPAR DADOS LOCAIS (TABLET COMPARTILHADO)
  // ========================================
  
  /**
   * Limpar dados locais após ação (permitir próxima pessoa usar)
   */
  function limparDadosLocais() {
    try {
      // Limpar apenas dados de votação/envio
      localStorage.removeItem('masquerade_votos');
      localStorage.removeItem('masquerade_envios');
      localStorage.removeItem('masquerade_fp');
      localStorage.removeItem('masquerade_envio_fp');
      console.log('🧹 Dados locais limpos - pronto para próximo usuário');
    } catch (error) {
      console.error('Erro ao limpar dados locais:', error);
    }
  }
  
  /**
   * Registrar ação e limpar após delay (auto-reset para tablet)
   */
  let autoResetTimer = null;
  
  function registrarAcaoComAutoReset() {
    // Cancelar timer anterior se existir
    if (autoResetTimer) {
      clearTimeout(autoResetTimer);
    }
    
    // Limpar dados após 2 minutos de inatividade
    autoResetTimer = setTimeout(() => {
      limparDadosLocais();
      console.log('⏰ Auto-reset: Dados limpos, pronto para próximo usuário');
      // NÃO recarregar a página - deixar o usuário continuar navegando
    }, 120000); // 2 minutos
  }
  
  // ========================================
  // 5. PROTEÇÃO CONTRA MANIPULAÇÃO DE FUNÇÕES
  // ========================================
  
  Object.freeze(validarCPFCompleto);
  Object.freeze(verificarRateLimit);
  Object.freeze(limparDadosLocais);
  Object.freeze(registrarAcaoComAutoReset);
  
  // ========================================
  // 6. EXPORTAR FUNÇÕES PROTEGIDAS
  // ========================================
  
  window.AntiFraude = Object.freeze({
    verificarRateLimit,
    validarCPF: validarCPFCompleto,
    devtoolsAberto: () => devtoolsOpen,
    limparDados: limparDadosLocais,
    registrarAcao: registrarAcaoComAutoReset
  });
  
  console.log('🛡️ Sistema anti-fraude ativado (modo TABLET COMPARTILHADO)');
  console.log('✅ Proteção por CPF no banco de dados');
  console.log('✅ Rate limiting ativo (5 tentativas/30s)');
  console.log('✅ Auto-reset após 30s de inatividade');
  
  // ========================================
  // 7. MONITORAMENTO BÁSICO
  // ========================================
  
  // Detectar tentativas de modificar o DOM de forma suspeita
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node.tagName === 'SCRIPT') {
            console.warn('⚠️ Script externo adicionado - monitorando');
          }
        });
      }
    });
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
})();
