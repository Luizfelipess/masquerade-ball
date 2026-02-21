// Upload logic for navbar modal using CloudinaryUpload helper
(function(){
  // TODO: replace with your Cloudinary config values
  const CLOUDINARY_CLOUD_NAME = 'YOUR_CLOUD_NAME';
  const CLOUDINARY_UPLOAD_PRESET = 'YOUR_UNSIGNED_UPLOAD_PRESET';

  const openLink = document.getElementById('open-photo-upload');
  const modal = document.getElementById('photo-upload-modal');
  const closeBtn = document.getElementById('close-photo-modal');
  const backdrop = modal && modal.querySelector('.modal-backdrop');
  const openWidgetBtn = document.getElementById('open-cloud-widget');
  const fileInput = document.getElementById('photo-file');
  const uploadBtn = document.getElementById('upload-direct-navbar');
  const preview = document.getElementById('photo-preview');
  const info = document.getElementById('photo-info');
  const nameInput = document.getElementById('photo-name');

  function openModal(){
    if(!modal) return;
    modal.setAttribute('aria-hidden','false');
    document.body.style.overflow='hidden';
  }
  function closeModal(){
    if(!modal) return;
    modal.setAttribute('aria-hidden','true');
    document.body.style.overflow='';
    preview.innerHTML=''; info.textContent=''; fileInput.value=''; nameInput.value='';
  }

  openLink && openLink.addEventListener('click', function(e){ e.preventDefault(); openModal(); });
  closeBtn && closeBtn.addEventListener('click', closeModal);
  backdrop && backdrop.addEventListener('click', closeModal);

  openWidgetBtn && openWidgetBtn.addEventListener('click', function(){
    try{
      const widget = CloudinaryUpload.createWidget(CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET, function(result){
        // result is the info object from cloudinary
        preview.innerHTML = '';
        const img = document.createElement('img');
        img.src = result.secure_url || result.url;
        preview.appendChild(img);
        info.textContent = JSON.stringify(result, null, 2);
      });
      widget.open();
    }catch(err){
      alert('Erro ao abrir widget: '+err.message);
    }
  });

  uploadBtn && uploadBtn.addEventListener('click', async function(){
    const file = fileInput.files && fileInput.files[0];
    if(!file) return alert('Selecione ou tire uma foto antes de enviar');
    try{
      const res = await CloudinaryUpload.uploadFileDirect(file, CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET);
      preview.innerHTML = '';
      const img = document.createElement('img');
      img.src = res.secure_url || res.url;
      preview.appendChild(img);
      info.textContent = JSON.stringify(res, null, 2);
      // Optionally attach name metadata (client-side only). For server-side, send alongside to your backend.
      const nome = nameInput.value && nameInput.value.trim();
      if(nome){
        info.textContent += '\n\nNome: ' + nome;
      }
    }catch(err){
      alert('Upload falhou: '+err.message);
    }
  });

})();
