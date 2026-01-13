// ========================================
// CONFIGURAÇÃO SUPABASE
// ========================================
// 
// ⚠️ IMPORTANTE: Após criar seu projeto no Supabase:
// 1. Acesse: Settings > API
// 2. Copie "Project URL" e "anon public" key
// 3. Cole abaixo substituindo os valores de exemplo
//

// Inicializar Supabase (IIFE para evitar conflitos)
(function() {
  'use strict';
  
  // Verificar se já foi inicializado
  if (window.supabaseClient) {
    console.log('⚠️ Supabase já foi inicializado');
    return;
  }
  
  const SUPABASE_URL = 'https://lvbgbadewkhmxzczptjy.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2YmdiYWRld2tobXh6Y3pwdGp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5ODgzNjYsImV4cCI6MjA3ODU2NDM2Nn0.r_B5Gd43wQxcqbxBUcJiuEcxPXUylrVbBvKTZqgFyTY';
  
  // Verificar se o SDK do Supabase foi carregado
  if (typeof window.supabase === 'undefined' || typeof window.supabase.createClient === 'undefined') {
    console.error('❌ SDK do Supabase não foi carregado! Verifique a conexão com o CDN.');
    return;
  }
  
  // Guardar referência ao SDK
  const supabaseSDK = window.supabase;
  
  // Inicializar cliente Supabase
  const client = supabaseSDK.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  // Substituir window.supabase com o cliente inicializado
  window.supabase = client;
  
  // Exportar também como window.supabaseClient para compatibilidade
  window.supabaseClient = client;
  
  // Log de inicialização
  console.log('✅ Supabase inicializado com sucesso');
  console.log('📡 URL:', SUPABASE_URL);
})();


