/**
 * Sistema de Máscaras e Validações
 * - Máscaras para CPF e Telefone
 * - Validação real de CPF (dígitos verificadores)
 * - Validação de telefone brasileiro
 */

// ========================================
// MÁSCARAS DE INPUT
// ========================================

/**
 * Aplica máscara de CPF: 000.000.000-00
 */
function mascaraCPF(valor) {
  return valor
    .replace(/\D/g, '') // Remove tudo que não é dígito
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1'); // Limita a 11 dígitos
}

/**
 * Aplica máscara de Telefone: (00) 00000-0000 ou (00) 0000-0000
 */
function mascaraTelefone(valor) {
  valor = valor.replace(/\D/g, '');
  
  if (valor.length <= 10) {
    // Telefone fixo: (00) 0000-0000
    return valor
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');
  } else {
    // Celular: (00) 00000-0000
    return valor
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');
  }
}

/**
 * Remove máscara e retorna apenas números
 */
function removerMascara(valor) {
  return valor.replace(/\D/g, '');
}

// ========================================
// VALIDAÇÃO DE CPF
// ========================================

/**
 * Valida CPF usando algoritmo dos dígitos verificadores
 * Retorna true se CPF é válido
 */
function validarCPF(cpf) {
  cpf = removerMascara(cpf);
  
  // Verifica se tem 11 dígitos
  if (cpf.length !== 11) {
    return false;
  }
  
  // Verifica se todos os dígitos são iguais (CPF inválido conhecido)
  if (/^(\d)\1{10}$/.test(cpf)) {
    return false;
  }
  
  // Validação do primeiro dígito verificador
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let resto = 11 - (soma % 11);
  let digitoVerificador1 = resto >= 10 ? 0 : resto;
  
  if (digitoVerificador1 !== parseInt(cpf.charAt(9))) {
    return false;
  }
  
  // Validação do segundo dígito verificador
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpf.charAt(i)) * (11 - i);
  }
  resto = 11 - (soma % 11);
  let digitoVerificador2 = resto >= 10 ? 0 : resto;
  
  if (digitoVerificador2 !== parseInt(cpf.charAt(10))) {
    return false;
  }
  
  return true;
}

// ========================================
// VALIDAÇÃO DE TELEFONE
// ========================================

/**
 * Valida telefone brasileiro
 * Aceita: (00) 0000-0000 ou (00) 00000-0000
 */
function validarTelefone(telefone) {
  const numeros = removerMascara(telefone);
  
  // Deve ter 10 (fixo) ou 11 (celular) dígitos
  if (numeros.length !== 10 && numeros.length !== 11) {
    return false;
  }
  
  // DDD deve ser válido (11-99)
  const ddd = parseInt(numeros.substring(0, 2));
  if (ddd < 11 || ddd > 99) {
    return false;
  }
  
  // Celular deve começar com 9
  if (numeros.length === 11 && numeros.charAt(2) !== '9') {
    return false;
  }
  
  return true;
}

// ========================================
// APLICAR MÁSCARAS AUTOMATICAMENTE
// ========================================

/**
 * Aplica máscaras em todos os inputs com atributos data-mask
 */
function aplicarMascaras() {
  // Máscara de CPF
  document.querySelectorAll('input[data-mask="cpf"]').forEach(input => {
    input.addEventListener('input', (e) => {
      e.target.value = mascaraCPF(e.target.value);
    });
    
    // Aplicar máscara no valor inicial se houver
    if (input.value) {
      input.value = mascaraCPF(input.value);
    }
  });
  
  // Máscara de Telefone
  document.querySelectorAll('input[data-mask="telefone"]').forEach(input => {
    input.addEventListener('input', (e) => {
      e.target.value = mascaraTelefone(e.target.value);
    });
    
    // Aplicar máscara no valor inicial se houver
    if (input.value) {
      input.value = mascaraTelefone(input.value);
    }
  });
}

// ========================================
// VALIDAÇÃO DE FORMULÁRIOS
// ========================================

/**
 * Valida campo de CPF e mostra erro se inválido
 */
function validarCampoCPF(input) {
  const cpf = input.value;
  
  if (!cpf) {
    return { valid: false, message: 'CPF é obrigatório' };
  }
  
  if (!validarCPF(cpf)) {
    return { valid: false, message: 'CPF inválido. Verifique os números digitados.' };
  }
  
  return { valid: true };
}

/**
 * Valida campo de telefone e mostra erro se inválido
 */
function validarCampoTelefone(input) {
  const telefone = input.value;
  
  if (!telefone) {
    return { valid: false, message: 'Telefone é obrigatório' };
  }
  
  if (!validarTelefone(telefone)) {
    return { valid: false, message: 'Telefone inválido. Use formato (00) 00000-0000' };
  }
  
  return { valid: true };
}

// ========================================
// INICIALIZAÇÃO AUTOMÁTICA
// ========================================

// Aplicar máscaras quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', aplicarMascaras);
} else {
  aplicarMascaras();
}

// ========================================
// EXPORTAR FUNÇÕES GLOBALMENTE
// ========================================

window.mascaraCPF = mascaraCPF;
window.mascaraTelefone = mascaraTelefone;
window.removerMascara = removerMascara;
window.validarCPF = validarCPF;
window.validarTelefone = validarTelefone;
window.validarCampoCPF = validarCampoCPF;
window.validarCampoTelefone = validarCampoTelefone;
window.aplicarMascaras = aplicarMascaras;

console.log('✅ Sistema de máscaras e validações carregado');
