// ========================================
// SISTEMA DE MODAIS ELEGANTE
// ========================================

// Criar modal no DOM
function createModalElement() {
  const existingModal = document.getElementById('app-modal');
  if (existingModal) return existingModal;
  
  const modalHTML = `
    <div class="modal-overlay" id="app-modal">
      <div class="modal">
        <button class="modal-close" onclick="closeModal()" aria-label="Fechar">×</button>
        <div class="modal-icon" id="modal-icon"></div>
        <h3 class="modal-title" id="modal-title"></h3>
        <p class="modal-message" id="modal-message"></p>
        <div class="modal-actions" id="modal-actions"></div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  // Fechar ao clicar fora
  const overlay = document.getElementById('app-modal');
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });
  
  // Fechar com ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('active')) {
      closeModal();
    }
  });
  
  return overlay;
}

// Fechar modal
function closeModal() {
  const modal = document.getElementById('app-modal');
  if (modal) {
    modal.classList.remove('active');
    setTimeout(() => {
      const actions = document.getElementById('modal-actions');
      if (actions) actions.innerHTML = '';
    }, 300);
  }
}

// Modal de sucesso
function showSuccess(title, message, buttonText = 'OK', autoClose = true) {
  const modal = createModalElement();
  
  document.getElementById('modal-icon').textContent = '✅';
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-message').textContent = message;
  
  const actions = document.getElementById('modal-actions');
  actions.innerHTML = `
    <button class="btn primary" onclick="closeModal()">${buttonText}</button>
  `;
  
  modal.classList.add('active');
  
  // Auto-fechar após 3 segundos
  if (autoClose) {
    setTimeout(() => closeModal(), 3000);
  }
}

// Modal de erro
function showError(title, message, buttonText = 'Entendi', autoClose = false) {
  const modal = createModalElement();
  
  document.getElementById('modal-icon').textContent = '❌';
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-message').textContent = message;
  
  const actions = document.getElementById('modal-actions');
  actions.innerHTML = `
    <button class="btn secondary" onclick="closeModal()">${buttonText}</button>
  `;
  
  modal.classList.add('active');
  
  // Erros não fecham automaticamente por padrão (usuário deve ler)
  if (autoClose) {
    setTimeout(() => closeModal(), 5000);
  }
}

// Modal de confirmação
function showConfirm(title, message, onConfirm, onCancel) {
  const modal = createModalElement();
  
  document.getElementById('modal-icon').textContent = '⚠️';
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-message').textContent = message;
  
  const actions = document.getElementById('modal-actions');
  actions.innerHTML = `
    <button class="btn secondary" onclick="handleModalCancel()">Cancelar</button>
    <button class="btn primary" onclick="handleModalConfirm()">Confirmar</button>
  `;
  
  // Armazenar callbacks
  window._modalConfirmCallback = onConfirm;
  window._modalCancelCallback = onCancel;
  
  modal.classList.add('active');
}

// Handlers para callbacks
function handleModalConfirm() {
  if (window._modalConfirmCallback) {
    window._modalConfirmCallback();
    window._modalConfirmCallback = null;
  }
  closeModal();
}

function handleModalCancel() {
  if (window._modalCancelCallback) {
    window._modalCancelCallback();
    window._modalCancelCallback = null;
  }
  closeModal();
}

// Modal de loading
function showLoading(message = 'Carregando...') {
  const modal = createModalElement();
  
  document.getElementById('modal-icon').innerHTML = '<div style="font-size:3rem">⏳</div>';
  document.getElementById('modal-title').textContent = 'Aguarde';
  document.getElementById('modal-message').textContent = message;
  document.getElementById('modal-actions').innerHTML = '';
  
  // Desabilitar fechar
  const closeBtn = document.querySelector('.modal-close');
  if (closeBtn) closeBtn.style.display = 'none';
  
  modal.classList.add('active');
}

// Fechar loading
function hideLoading() {
  const closeBtn = document.querySelector('.modal-close');
  if (closeBtn) closeBtn.style.display = 'flex';
  closeModal();
}

// Modal de informação
function showInfo(title, message, buttonText = 'Entendi', autoClose = true) {
  const modal = createModalElement();
  
  document.getElementById('modal-icon').textContent = 'ℹ️';
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-message').textContent = message;
  
  const actions = document.getElementById('modal-actions');
  actions.innerHTML = `
    <button class="btn primary" onclick="closeModal()">${buttonText}</button>
  `;
  
  modal.classList.add('active');
  
  // Auto-fechar após 3 segundos
  if (autoClose) {
    setTimeout(() => closeModal(), 3000);
  }
}

// Modal com input (prompt customizado)
function showPrompt(title, message, placeholder = '', onSubmit, onCancel, inputType = 'text', maskType = null) {
  const modal = createModalElement();
  
  document.getElementById('modal-icon').textContent = '✏️';
  document.getElementById('modal-title').textContent = title;
  
  // Criar input dentro da mensagem
  const messageElement = document.getElementById('modal-message');
  messageElement.innerHTML = `
    <p style="margin-bottom: 16px; color: var(--accent-soft);">${message}</p>
    <input 
      type="${inputType}" 
      id="modal-input" 
      class="input" 
      placeholder="${placeholder}"
      style="width: 100%; font-size: 16px; padding: 12px; border-radius: 8px; border: 1px solid rgba(232,197,116,0.3); background: rgba(255,255,255,0.05); color: var(--accent);"
      autocomplete="off"
      maxlength="${maskType === 'cpf' ? 14 : ''}"
    />
  `;
  
  const actions = document.getElementById('modal-actions');
  actions.innerHTML = `
    <button class="btn secondary" onclick="handleModalPromptCancel()">Cancelar</button>
    <button class="btn primary" onclick="handleModalPromptSubmit()">Confirmar</button>
  `;
  
  // Armazenar callbacks
  window._modalPromptCallback = onSubmit;
  window._modalPromptCancelCallback = onCancel;
  
  modal.classList.add('active');
  
  // Focar no input após o modal abrir
  setTimeout(() => {
    const input = document.getElementById('modal-input');
    if (input) {
      input.focus();
      
      // Aplicar máscara de CPF se especificado
      if (maskType === 'cpf') {
        input.addEventListener('input', (e) => {
          let value = e.target.value.replace(/\D/g, '');
          if (value.length > 11) value = value.slice(0, 11);
          
          if (value.length > 9) {
            value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
          } else if (value.length > 6) {
            value = value.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
          } else if (value.length > 3) {
            value = value.replace(/(\d{3})(\d{1,3})/, '$1.$2');
          }
          
          e.target.value = value;
        });
      }
      
      // Permitir Enter para submeter
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          handleModalPromptSubmit();
        }
      });
    }
  }, 100);
}

// Handlers para prompt
function handleModalPromptSubmit() {
  const input = document.getElementById('modal-input');
  const value = input ? input.value.trim() : '';
  
  if (window._modalPromptCallback) {
    window._modalPromptCallback(value);
    window._modalPromptCallback = null;
  }
  closeModal();
}

function handleModalPromptCancel() {
  if (window._modalPromptCancelCallback) {
    window._modalPromptCancelCallback();
    window._modalPromptCancelCallback = null;
  }
  closeModal();
}

// Export
window.showSuccess = showSuccess;
window.showError = showError;
window.showConfirm = showConfirm;
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.showInfo = showInfo;
window.showPrompt = showPrompt;
window.closeModal = closeModal;

console.log('✅ Sistema de modais carregado');
