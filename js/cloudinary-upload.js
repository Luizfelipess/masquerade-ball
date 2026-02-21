// Cloudinary upload helpers
(function () {
  function createWidget(cloudName, uploadPreset, onSuccess) {
    if (!window.cloudinary || !cloudName || !uploadPreset) {
      throw new Error('cloudinary widget not available or missing config');
    }

    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName: cloudName,
        uploadPreset: uploadPreset,
        sources: ['local', 'camera', 'url'],
        multiple: false,
        cropping: false,
      },
      function (error, result) {
        if (!error && result && result.event === 'success') {
          onSuccess && onSuccess(result.info);
        }
      }
    );

    return widget;
  }

  async function uploadFileDirect(file, cloudName, uploadPreset) {
    if (!file) throw new Error('file is required');
    const url = `https://api.cloudinary.com/v1_1/${cloudName}/upload`;
    const fd = new FormData();
    fd.append('file', file);
    fd.append('upload_preset', uploadPreset);
    const res = await fetch(url, { method: 'POST', body: fd });
    if (!res.ok) throw new Error('Upload failed: ' + res.statusText);
    return res.json();
  }

  window.CloudinaryUpload = {
    createWidget,
    uploadFileDirect,
  };
})();
