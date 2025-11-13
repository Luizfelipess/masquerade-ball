// Script principal: pequenas funcionalidades para RSVP e habilitar votação na noite do evento
(function(){
  'use strict';
  const EVENT_DATE = new Date('2026-02-21T20:00:00');

  /* ---------- Helpers ---------- */
  function qs(sel){ return document.querySelector(sel) }
  function qsa(sel){ return Array.from(document.querySelectorAll(sel)) }

  /* ---------- Countdown Timer ---------- */
  function startCountdown(){
    const daysEl = qs('#days');
    const hoursEl = qs('#hours');
    const minutesEl = qs('#minutes');
    const secondsEl = qs('#seconds');
    
    if(!daysEl) return; // Not on home page
    
    function updateCountdown(){
      const now = new Date().getTime();
      const distance = EVENT_DATE.getTime() - now;
      
      if(distance < 0){
        daysEl.textContent = '00';
        hoursEl.textContent = '00';
        minutesEl.textContent = '00';
        secondsEl.textContent = '00';
        return;
      }
      
      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);
      
      daysEl.textContent = String(days).padStart(2, '0');
      hoursEl.textContent = String(hours).padStart(2, '0');
      minutesEl.textContent = String(minutes).padStart(2, '0');
      secondsEl.textContent = String(seconds).padStart(2, '0');
    }
    
    updateCountdown();
    setInterval(updateCountdown, 1000);
  }

  /* ---------- Header Scroll Effect ---------- */
  function initHeaderScroll(){
    const header = qs('.site-header');
    if(!header) return;
    
    window.addEventListener('scroll', ()=>{
      if(window.scrollY > 50){
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    });
  }

  /* ---------- Hamburger Menu (Mobile) ---------- */
  function initHamburgerMenu(){
    const hamburger = qs('.hamburger');
    const nav = qs('.main-nav');
    const body = document.body;
    
    if(!hamburger || !nav) return;
    
    hamburger.addEventListener('click', ()=>{
      const isActive = hamburger.classList.toggle('active');
      nav.classList.toggle('active');
      body.classList.toggle('menu-open');
      hamburger.setAttribute('aria-expanded', isActive);
    });
    
    // Fechar ao clicar em link
    qsa('.main-nav a').forEach(link => {
      link.addEventListener('click', ()=>{
        hamburger.classList.remove('active');
        nav.classList.remove('active');
        body.classList.remove('menu-open');
        hamburger.setAttribute('aria-expanded', 'false');
      });
    });
    
    // Fechar ao clicar fora (overlay)
    body.addEventListener('click', (e)=>{
      if(body.classList.contains('menu-open') && 
         !nav.contains(e.target) && 
         !hamburger.contains(e.target)){
        hamburger.classList.remove('active');
        nav.classList.remove('active');
        body.classList.remove('menu-open');
        hamburger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* Simple CPF sanitizer + basic validation (not exhaustive) */
  function sanitizeCPF(raw){ if(!raw) return ''; return String(raw).replace(/\D/g,'') }
  function isValidCPF(cpf){
    cpf = sanitizeCPF(cpf);
    if(!cpf || cpf.length !== 11) return false;
    // Reject obvious repeats
    if(/^([0-9])\1+$/.test(cpf)) return false;
    // Basic calc
    const digits = cpf.split('').map(d=>+d);
    function calc(pos){
      let sum=0; for(let i=0;i<pos-1;i++) sum += digits[i]*(pos-i);
      let res = (sum*10)%11; return res===10?0:res;
    }
    return calc(10)===digits[9] && calc(11)===digits[10];
  }

  /* ---------- Visual helpers ---------- */
  function updateVotingAvailability(){
    const links = qsa('.main-nav a[href$="votacao.html"]');
    const now = new Date();
    const enabled = now >= EVENT_DATE;
    links.forEach(a=>{
      if(!enabled){
        a.classList.add('disabled');
        a.setAttribute('aria-disabled','true');
        a.title = 'A votação será aberta apenas na noite do evento.';
      } else {
        a.classList.remove('disabled');
        a.removeAttribute('aria-disabled');
        a.title = '';
      }
    });
  }

  /* ---------- RSVP handling ---------- */
  function handleRsvpForm(){
    const form = qs('#rsvp-form');
    if(!form) return;
    form.addEventListener('submit', e=>{
      e.preventDefault();
      const data = new FormData(form);
      const nome = (data.get('nome')||'').trim();
      const cpfRaw = data.get('cpf')||'';
      const cpf = sanitizeCPF(cpfRaw);
      const email = (data.get('email')||'').trim();
      const telefone = (data.get('telefone')||'').trim();
      if(!nome){ alert('Por favor, informe o nome.'); return }
      if(!isValidCPF(cpf)) { alert('CPF inválido.'); return }
      const list = JSON.parse(localStorage.getItem('rsvps')||'[]');
      // prevent duplicate cpf
      if(list.find(r=>r.cpf === cpf)){
        const msg = qs('#rsvp-msg'); if(msg) msg.textContent='Já recebemos confirmação deste CPF.'; return;
      }
      list.push({nome,cpf,email,telefone,when:new Date().toISOString()});
      localStorage.setItem('rsvps', JSON.stringify(list));
      form.reset();
      const msg = qs('#rsvp-msg');
      if(msg){ msg.textContent = 'Confirmação recebida com graça e apreço. Vossa presença foi registrada.' }
    });
  }

  /* ---------- Voting handling (public) ---------- */
  function handleVotingForm(){
    const form = qs('#voto-form');
    if(!form) return;
    const preview = qs('#foto-preview');
    const fileInput = qs('#foto-traje');

    fileInput && fileInput.addEventListener('change', ()=>{
      const f = fileInput.files && fileInput.files[0];
      if(!f){ if(preview){ preview.style.display='none'; preview.src=''; } return }
      const url = URL.createObjectURL(f); if(preview){ preview.src = url; preview.style.display='block' }
    });

    form.addEventListener('submit', e=>{
      e.preventDefault();
      const data = new FormData(form);
      const nome = (data.get('nome')||'').trim();
      const cpfRaw = data.get('cpf')||''; const cpf = sanitizeCPF(cpfRaw);
      if(!nome){ alert('Informe o nome.'); return }
      if(!isValidCPF(cpf)){ alert('CPF inválido.'); return }

      // check if voting is open
      const now = new Date(); if(now < EVENT_DATE){ alert('A votação só será aberta na noite do evento.'); return }

      const votes = JSON.parse(localStorage.getItem('votes')||'[]');
      if(votes.find(v=>v.cpf===cpf)) { alert('Já recebemos um voto deste CPF.'); return }

      // store basic vote info; images are not persisted (mock)
      votes.push({nome,cpf,description:(data.get('descricao')||'').trim(),when:new Date().toISOString()});
      localStorage.setItem('votes', JSON.stringify(votes));
      form.reset(); if(preview){ preview.style.display='none'; preview.src=''; }
      alert('Voto registrado. Obrigado por participar do Baile.');
    });
  }

  /* ---------- Admin utilities (client-side, basic) ---------- */
  function csvEscape(v){ if(v==null) return ''; return '"'+String(v).replace(/"/g,'""')+'"' }
  function exportCSV(){
    const rsvps = JSON.parse(localStorage.getItem('rsvps')||'[]');
    const votes = JSON.parse(localStorage.getItem('votes')||'[]');
    let rows = [];
    rows.push(['type','nome','cpf','email','telefone','descricao','when'].map(csvEscape).join(','));
    rsvps.forEach(r=> rows.push(['rsvp',r.nome||'',r.cpf||'',r.email||'',r.telefone||'','',r.when||''].map(csvEscape).join(',')));
    votes.forEach(v=> rows.push(['vote',v.nome||'',v.cpf||'','', '', v.description||'', v.when||''].map(csvEscape).join(',')));
    const blob = new Blob([rows.join('\n')], {type:'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'baile-data.csv'; document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }

  function renderAdmin(){
    const el = qs('#admin-root'); if(!el) return;
    const rsvps = JSON.parse(localStorage.getItem('rsvps') || '[]');
    const votes = JSON.parse(localStorage.getItem('votes') || '[]');
    el.innerHTML = '';
    const h = document.createElement('h3'); h.textContent = 'Confirmados ('+rsvps.length+')'; el.appendChild(h);
    const t1 = document.createElement('table'); t1.style.width='100%'; t1.style.borderCollapse='collapse';
    rsvps.forEach(r=>{
      const tr = document.createElement('tr'); tr.innerHTML = '<td style="padding:6px;border-bottom:1px solid rgba(255,255,255,0.04)">'+(r.nome||'')+'</td><td style="padding:6px;border-bottom:1px solid rgba(255,255,255,0.04)">'+(r.cpf||'')+'</td><td style="padding:6px;border-bottom:1px solid rgba(255,255,255,0.04)">'+(r.email||'')+'</td>';
      t1.appendChild(tr);
    }); el.appendChild(t1);
    const h2 = document.createElement('h3'); h2.textContent = 'Votos ('+votes.length+')'; h2.style.marginTop='18px'; el.appendChild(h2);
    const t2 = document.createElement('table'); t2.style.width='100%'; votes.forEach(v=>{
      const tr = document.createElement('tr'); tr.innerHTML = '<td style="padding:6px;border-bottom:1px solid rgba(255,255,255,0.04)">'+(v.nome||'')+'</td><td style="padding:6px;border-bottom:1px solid rgba(255,255,255,0.04)">'+(v.cpf||'')+'</td><td style="padding:6px;border-bottom:1px solid rgba(255,255,255,0.04)">'+(v.description||'')+'</td>';
      t2.appendChild(tr);
    }); el.appendChild(t2);
    const btns = document.createElement('div'); btns.style.marginTop='14px';
    const exp = document.createElement('button'); exp.className='btn'; exp.textContent='Exportar CSV'; exp.addEventListener('click', exportCSV);
    const clr = document.createElement('button'); clr.className='btn'; clr.style.marginLeft='10px'; clr.textContent='Limpar dados (local)'; clr.addEventListener('click', ()=>{ if(confirm('Apagar dados locais?')){ localStorage.removeItem('rsvps'); localStorage.removeItem('votes'); renderAdmin(); }});
    btns.appendChild(exp); btns.appendChild(clr); el.appendChild(btns);
  }

  // expose for admin page minimal integration
  window.renderAdmin = renderAdmin;

  // allow triggering renderAdmin via a custom event (admin.html fallback)
  window.addEventListener('render-admin', ()=>{ renderAdmin(); });

  /* ---------- Init ---------- */
  document.addEventListener('DOMContentLoaded', ()=>{
    startCountdown();
    initHeaderScroll();
    initHamburgerMenu();
    updateVotingAvailability();
    handleRsvpForm();
    handleVotingForm();
    renderAdmin();
  });

})();
