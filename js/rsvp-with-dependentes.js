// Script para formulário RSVP com dependentes
(function(){
  'use strict';

  let dependenteCounter = 0;
  const dependentes = [];

  const form = document.querySelector('#rsvp-form');
  const dependentesList = document.querySelector('#dependentes-list');
  const addAdultoBtn = document.querySelector('#add-adulto-btn');
  const addCriancaBtn = document.querySelector('#add-crianca-btn');
  const msgEl = document.querySelector('#rsvp-msg');

  if(!form) return;

  /* ========== ADICIONAR DEPENDENTE ========== */
  
  function adicionarDependente(tipo){
    dependenteCounter++;
    const id = `dep-${dependenteCounter}`;
    
    const depCard = document.createElement('div');
    depCard.className = 'card';
    depCard.style.marginBottom = '16px';
    depCard.style.padding = '16px';
    depCard.style.background = 'rgba(232,197,116,0.03)';
    depCard.dataset.dependenteId = id;
    
    depCard.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <h4 style="color:var(--gold);margin:0;font-size:1rem">
          ${tipo === 'adulto' ? '👤 Adulto' : '👶 Criança'} ${dependenteCounter}
        </h4>
        <button type="button" class="btn-remove-dep" data-id="${id}" style="background:rgba(255,0,0,0.2);color:#ff6b6b;border:none;padding:6px 12px;border-radius:6px;cursor:pointer;font-size:0.85rem">
          ✕ Remover
        </button>
      </div>
      
      <div class="form-row">
        <label class="small">Nome Completo *<br>
          <input type="text" class="input dep-nome" required placeholder="Nome do acompanhante">
        </label>
        ${tipo === 'crianca' ? `
          <label class="small">Idade *<br>
            <input type="number" class="input dep-idade" required min="0" max="17" placeholder="Ex: 8">
          </label>
        ` : ''}
      </div>
    `;
    
    dependentesList.appendChild(depCard);
    
    // Event listener para remover
    depCard.querySelector('.btn-remove-dep').addEventListener('click', function(){
      const idx = dependentes.findIndex(d => d.id === id);
      if(idx > -1) dependentes.splice(idx, 1);
      depCard.remove();
    });
    
    // Adicionar ao array
    dependentes.push({
      id,
      tipo,
      element: depCard
    });
  }

  /* ========== EVENT LISTENERS ========== */

  if(addAdultoBtn){
    addAdultoBtn.addEventListener('click', () => adicionarDependente('adulto'));
  }

  if(addCriancaBtn){
    addCriancaBtn.addEventListener('click', () => adicionarDependente('crianca'));
  }

  /* ========== SUBMIT FORM ========== */

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Dados do titular
    const formData = new FormData(form);
    const dados = {
      nome: formData.get('nome'),
      cpf: formData.get('cpf'),
      email: formData.get('email'),
      telefone: formData.get('telefone'),
      observacoes: formData.get('observacoes'),
      dependentes: []
    };

    // Coletar dados dos dependentes
    dependentes.forEach(dep => {
      const nomeInput = dep.element.querySelector('.dep-nome');
      const idadeInput = dep.element.querySelector('.dep-idade');
      
      if(!nomeInput.value.trim()){
        alert('Preencha o nome de todos os acompanhantes!');
        nomeInput.focus();
        throw new Error('Validação');
      }

      const depData = {
        nome: nomeInput.value.trim(),
        tipo: dep.tipo
      };

      if(dep.tipo === 'crianca'){
        if(!idadeInput.value){
          alert('Preencha a idade da criança!');
          idadeInput.focus();
          throw new Error('Validação');
        }
        depData.idade = parseInt(idadeInput.value);
      }

      dados.dependentes.push(depData);
    });

    // Salvar no Supabase
    msgEl.textContent = '⏳ Enviando confirmação...';
    msgEl.style.color = 'var(--gold)';

    const result = await salvarRSVP(dados);

    if(result.success){
      alert(`✨ Confirmação recebida com sucesso!\n\n` +
            `Titular: ${dados.nome}\n` +
            `Acompanhantes: ${dados.dependentes.length}\n\n` +
            `Sua presença foi registrada para o grande baile!`);
      
      form.reset();
      dependentesList.innerHTML = '';
      dependentes.length = 0;
      dependenteCounter = 0;
      
      msgEl.textContent = '✓ Confirmação enviada! Aguardamos vossa presença no baile.';
      msgEl.style.color = '#4ade80';
    } else {
      alert(`❌ Erro ao confirmar presença:\n\n${result.error}\n\nTente novamente.`);
      msgEl.textContent = result.error;
      msgEl.style.color = '#ff6b6b';
    }
  });

  console.log('✅ Script RSVP com dependentes carregado');
})();
