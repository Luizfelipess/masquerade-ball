/**
 * Controle de Visibilidade do Menu de Votação
 * Mostra/oculta o link de votação baseado no status
 */

(async function() {
  'use strict';
  
  // Aguardar Supabase estar disponível
  if (typeof supabase === 'undefined') {
    console.log('⏳ Aguardando Supabase carregar...');
    await new Promise(resolve => {
      const checkSupabase = setInterval(() => {
        if (typeof supabase !== 'undefined') {
          clearInterval(checkSupabase);
          resolve();
        }
      }, 100);
    });
  }
  
  try {
    // Buscar status da votação
    const { data, error } = await supabase
      .from('config')
      .select('valor')
      .eq('chave', 'votacao_liberada')
      .single();
    
    if (error) {
      // Se houver erro, manter oculto
      console.warn('⚠️ Não foi possível verificar status da votação:', error.message);
      return;
    }
    
    // Converter string para boolean
    const votacaoLiberada = data?.valor === 'true';
    
    // Selecionar link de votação pelo class
    const votacaoLink = document.querySelector('.menu-votacao');
    
    if (votacaoLink) {
      if (votacaoLiberada) {
        // Votação liberada - MOSTRAR link
        votacaoLink.style.display = '';  // Remove o inline style
        votacaoLink.style.removeProperty('display');  // Garante remoção
        console.log('✅ Menu de votação VISÍVEL (votação liberada)');
      } else {
        // Votação bloqueada - MANTER OCULTO
        votacaoLink.style.display = 'none';
        console.log('🔒 Menu de votação OCULTO (votação bloqueada)');
      }
    } else {
      console.warn('⚠️ Elemento .menu-votacao não encontrado');
    }
    
  } catch (error) {
    console.error('Erro ao controlar menu de votação:', error);
  }
})();
