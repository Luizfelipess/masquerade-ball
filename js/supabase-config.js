// ========================================
// CONFIGURAÇÃO SUPABASE
// ========================================
// 
// ⚠️ IMPORTANTE: Após criar seu projeto no Supabase:
// 1. Acesse: Settings > API
// 2. Copie "Project URL" e "anon public" key
// 3. Cole abaixo substituindo os valores de exemplo
//

const SUPABASE_URL = 'https://lvbgbadewkhmxzczptjy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2YmdiYWRld2tobXh6Y3pwdGp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5ODgzNjYsImV4cCI6MjA3ODU2NDM2Nn0.r_B5Gd43wQxcqbxBUcJiuEcxPXUylrVbBvKTZqgFyTY';

// Inicializar cliente Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Log de inicialização
console.log('✅ Supabase inicializado');
