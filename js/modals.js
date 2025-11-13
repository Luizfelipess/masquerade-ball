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
function showSuccess(title, message, buttonText = 'OK') {
  const modal = createModalElement();
  
  document.getElementById('modal-icon').textContent = '✅';
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-message').textContent = message;
  
  const actions = document.getElementById('modal-actions');
  actions.innerHTML = `
    <button class="btn primary" onclick="closeModal()">${buttonText}</button>
  `;
  
  modal.classList.add('active');
}

// Modal de erro
function showError(title, message, buttonText = 'Entendi') {
  const modal = createModalElement();
  
  document.getElementById('modal-icon').textContent = '❌';
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-message').textContent = message;
  
  const actions = document.getElementById('modal-actions');
  actions.innerHTML = `
    <button class="btn secondary" onclick="closeModal()">${buttonText}</button>
  `;
  
  modal.classList.add('active');
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
function showInfo(title, message, buttonText = 'OK') {
  const modal = createModalElement();
  
  document.getElementById('modal-icon').textContent = 'ℹ️';
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-message').textContent = message;
  
  const actions = document.getElementById('modal-actions');
  actions.innerHTML = `
    <button class="btn primary" onclick="closeModal()">${buttonText}</button>
  `;
  
  modal.classList.add('active');
}

// Export
window.showSuccess = showSuccess;
window.showError = showError;
window.showConfirm = showConfirm;
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.showInfo = showInfo;
window.closeModal = closeModal;

console.log('✅ Sistema de modais carregado');
