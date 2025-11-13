// ========================================
// FUNÇÕES SUPABASE - BAILE DE MÁSCARAS
// ========================================

/* ========== HELPERS ========== */

function sanitizeCPF(str){
  return (str||'').replace(/\D/g,'');
}

function isValidCPF(cpf){
  if(!/^\d{11}$/.test(cpf)) return false;
  if(/^(\d)\1{10}$/.test(cpf)) return false;
  const digits = cpf.split('').map(Number);
  function calc(pos){
    let sum=0; for(let i=0;i<pos-1;i++) sum += digits[i]*(pos-i);
    let res = (sum*10)%11; return res===10?0:res;
  }
  return calc(10)===digits[9] && calc(11)===digits[10];
}

/* ========== RSVP COM DEPENDENTES ========== */

async function salvarRSVP(dados) {
  try {
    // Validar CPF
    const cpf = sanitizeCPF(dados.cpf);
    if (!isValidCPF(cpf)) {
      throw new Error('CPF inválido!');
    }

    // 1. Inserir titular
    const { data: rsvp, error: rsvpError } = await supabase
      .from('rsvps')
      .insert([{
        nome: dados.nome.trim(),
        cpf: cpf,
        email: dados.email?.trim() || null,
        telefone: dados.telefone?.trim() || null,
        observacoes: dados.observacoes?.trim() || null
      }])
      .select()
      .single();

    if (rsvpError) {
      if (rsvpError.code === '23505') {
        throw new Error('Este CPF já confirmou presença!');
      }
      throw rsvpError;
    }

    // 2. Inserir dependentes se houver
    if (dados.dependentes && dados.dependentes.length > 0) {
      const dependentesData = dados.dependentes.map(dep => ({
        rsvp_id: rsvp.id,
        nome: dep.nome.trim(),
        tipo: dep.tipo,
        idade: dep.tipo === 'crianca' ? parseInt(dep.idade) : null
      }));

      const { error: depError } = await supabase
        .from('dependentes')
        .insert(dependentesData);

      if (depError) throw depError;
    }

    return { success: true, data: rsvp };
  } catch (error) {
    console.error('Erro ao salvar RSVP:', error);
    return { success: false, error: error.message };
  }
}

/* ========== VERIFICAR SE VOTAÇÃO ESTÁ LIBERADA ========== */

async function verificarVotacaoLiberada() {
  try {
    const { data, error } = await supabase
      .from('config')
      .select('valor')
      .eq('chave', 'votacao_liberada')
      .single();

    if (error) throw error;

    return data.valor === 'true';
  } catch (error) {
    console.warn('Erro ao verificar config, usando horário:', error);
    // Fallback: verificar por horário
    const now = new Date();
    const eventDate = new Date('2026-02-21T20:00:00-03:00');
    return now >= eventDate;
  }
}

/* ========== ENVIAR LOOK ========== */

async function enviarLook(nome, cpf, descricao, file) {
  try {
    // 1. Validar CPF
    const cpfLimpo = sanitizeCPF(cpf);
    if (!isValidCPF(cpfLimpo)) {
      throw new Error('CPF inválido!');
    }

    // 2. Verificar se votação está liberada
    const liberada = await verificarVotacaoLiberada();
    if (!liberada) {
      throw new Error('A galeria de looks será liberada apenas na noite do evento às 20h!');
    }

    // 3. Validar tamanho do arquivo
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('Foto muito grande! Máximo 5MB.');
    }

    // 4. Upload da foto
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `trajes/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('looks')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    // 5. Obter URL pública
    const { data: urlData } = supabase.storage
      .from('looks')
      .getPublicUrl(filePath);

    // 6. Salvar no banco
    const { data, error } = await supabase
      .from('looks')
      .insert([{
        nome: nome.trim(),
        cpf: cpfLimpo,
        descricao: descricao?.trim() || null,
        foto_url: urlData.publicUrl
      }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error('Este CPF já enviou um look!');
      }
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('Erro ao enviar look:', error);
    return { success: false, error: error.message };
  }
}

/* ========== CARREGAR GALERIA ========== */

async function carregarGaleria() {
  try {
    const { data: looks, error } = await supabase
      .from('looks')
      .select('*')
      .order('votos', { ascending: false }); // Ordenar por votos

    if (error) throw error;

    return { success: true, looks: looks || [] };
  } catch (error) {
    console.error('Erro ao carregar galeria:', error);
    return { success: false, looks: [] };
  }
}

/* ========== VOTAR EM LOOK ========== */

async function votarEmLook(lookId, lookCPF, cpfVotante) {
  try {
    // Validar CPF
    const cpfLimpo = sanitizeCPF(cpfVotante);
    if (!isValidCPF(cpfLimpo)) {
      throw new Error('CPF inválido!');
    }

    // Não pode votar em si mesmo
    if (lookCPF === cpfLimpo) {
      throw new Error('Você não pode votar no seu próprio look!');
    }

    // Verificar se votação está liberada
    const liberada = await verificarVotacaoLiberada();
    if (!liberada) {
      throw new Error('A votação será liberada apenas na noite do evento às 20h!');
    }

    // Registrar voto
    const { error: votoError } = await supabase
      .from('votos')
      .insert([{
        look_id: lookId,
        cpf_votante: cpfLimpo
      }]);

    if (votoError) {
      if (votoError.code === '23505') {
        throw new Error('Você já votou! Apenas 1 voto por CPF.');
      }
      throw votoError;
    }

    // Incrementar contador de votos
    const { data: look } = await supabase
      .from('looks')
      .select('votos')
      .eq('id', lookId)
      .single();

    const { error: updateError } = await supabase
      .from('looks')
      .update({ votos: (look?.votos || 0) + 1 })
      .eq('id', lookId);

    if (updateError) throw updateError;

    return { success: true };
  } catch (error) {
    console.error('Erro ao votar:', error);
    return { success: false, error: error.message };
  }
}

/* ========== CARREGAR RSVPs (ADMIN) ========== */

async function carregarRSVPs() {
  try {
    const { data: rsvps, error: rsvpError } = await supabase
      .from('rsvps')
      .select(`
        *,
        dependentes (*)
      `)
      .order('created_at', { ascending: false });

    if (rsvpError) throw rsvpError;

    return { success: true, rsvps: rsvps || [] };
  } catch (error) {
    console.error('Erro ao carregar RSVPs:', error);
    return { success: false, rsvps: [] };
  }
}

/* ========== CARREGAR RESULTADOS VOTAÇÃO (ADMIN) ========== */

async function carregarResultadosVotacao() {
  try {
    const { data: looks, error } = await supabase
      .from('looks')
      .select('*')
      .order('votos', { ascending: false });

    if (error) throw error;

    return { success: true, looks: looks || [] };
  } catch (error) {
    console.error('Erro ao carregar resultados:', error);
    return { success: false, looks: [] };
  }
}

/* ========== LIBERAR VOTAÇÃO MANUALMENTE (ADMIN) ========== */

async function liberarVotacaoManual() {
  try {
    const { error } = await supabase
      .from('config')
      .update({ 
        valor: 'true',
        updated_at: new Date().toISOString()
      })
      .eq('chave', 'votacao_liberada');

    if (error) throw error;

    return { success: true, message: 'Votação liberada com sucesso!' };
  } catch (error) {
    console.error('Erro ao liberar votação:', error);
    return { success: false, error: error.message };
  }
}

/* ========== BLOQUEAR VOTAÇÃO (ADMIN) ========== */

async function bloquearVotacao() {
  try {
    const { error } = await supabase
      .from('config')
      .update({ 
        valor: 'false',
        updated_at: new Date().toISOString()
      })
      .eq('chave', 'votacao_liberada');

    if (error) throw error;

    return { success: true, message: 'Votação bloqueada!' };
  } catch (error) {
    console.error('Erro ao bloquear votação:', error);
    return { success: false, error: error.message };
  }
}

// Log de carregamento
console.log('✅ Funções Supabase carregadas');
