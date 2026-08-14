const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');
const browseBtn = document.getElementById('browseBtn');
const grid = document.getElementById('grid');
const empty = document.getElementById('empty');
const reelCount = document.getElementById('reelCount');
const uploadProgress = document.getElementById('uploadProgress');
const progressFill = document.getElementById('progressFill');
const progressLabel = document.getElementById('progressLabel');
const errorBox = document.getElementById('errorBox');
const sprockets = document.getElementById('sprockets');

sprockets.innerHTML = '<span></span>'.repeat(40);

function formatSize(bytes) {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function showError(message) {
  errorBox.textContent = message;
  errorBox.hidden = false;
  setTimeout(() => { errorBox.hidden = true; }, 6000);
}

async function loadVideos() {
  try {
    const res = await fetch('/api/videos');
    const videos = await res.json();
    render(videos);
  } catch (err) {
    showError('No se pudo cargar el carrete. Revisa que el servidor esté corriendo.');
  }
}

function render(videos) {
  grid.innerHTML = '';
  empty.hidden = videos.length !== 0;
  reelCount.textContent = videos.length + (videos.length === 1 ? ' video' : ' videos');

  videos.forEach((v) => {
    const frame = document.createElement('div');
    frame.className = 'frame';

    const perf = document.createElement('div');
    perf.className = 'frame-perf';
    for (let i = 0; i < 6; i++) perf.appendChild(document.createElement('span'));
    frame.appendChild(perf);

    const video = document.createElement('video');
    video.src = `/uploads/${v.filename}`;
    video.controls = true;
    video.preload = 'metadata';
    frame.appendChild(video);

    const info = document.createElement('div');
    info.className = 'frame-info';
    info.innerHTML = `
      <p class="frame-name" title="${v.title}">${v.title}</p>
      <div class="frame-meta"><span>${formatSize(v.size)}</span></div>
    `;
    const meta = info.querySelector('.frame-meta');
    const delBtn = document.createElement('button');
    delBtn.className = 'del-btn';
    delBtn.textContent = 'Eliminar';
    delBtn.onclick = () => removeVideo(v.id);
    meta.appendChild(delBtn);

    frame.appendChild(info);
    grid.appendChild(frame);
  });
}

function uploadFile(file) {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('video', file);
    formData.append('title', file.name);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/videos');

    uploadProgress.hidden = false;
    progressFill.style.width = '0%';
    progressLabel.textContent = `Subiendo ${file.name}…`;

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const pct = Math.round((e.loaded / e.total) * 100);
        progressFill.style.width = pct + '%';
        progressLabel.textContent = `Subiendo ${file.name}… ${pct}%`;
      }
    });

    xhr.onload = () => {
      uploadProgress.hidden = true;
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        try {
          const data = JSON.parse(xhr.responseText);
          reject(new Error(data.error || 'No se pudo subir el video.'));
        } catch {
          reject(new Error('No se pudo subir el video.'));
        }
      }
    };
    xhr.onerror = () => {
      uploadProgress.hidden = true;
      reject(new Error('Error de red al subir el video.'));
    };

    xhr.send(formData);
  });
}

async function handleFiles(fileList) {
  const files = Array.from(fileList).filter((f) => f.type.startsWith('video/'));
  for (const file of files) {
    try {
      await uploadFile(file);
    } catch (err) {
      showError(err.message);
    }
  }
  loadVideos();
}

async function removeVideo(id) {
  try {
    const res = await fetch(`/api/videos/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('No se pudo eliminar el video.');
    loadVideos();
  } catch (err) {
    showError(err.message);
  }
}

browseBtn.addEventListener('click', (e) => { e.stopPropagation(); fileInput.click(); });
dropzone.addEventListener('click', () => fileInput.click());
dropzone.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') fileInput.click(); });
fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

['dragenter', 'dragover'].forEach((evt) => {
  dropzone.addEventListener(evt, (e) => { e.preventDefault(); dropzone.classList.add('drag'); });
});
['dragleave', 'drop'].forEach((evt) => {
  dropzone.addEventListener(evt, (e) => { e.preventDefault(); dropzone.classList.remove('drag'); });
});
dropzone.addEventListener('drop', (e) => {
  if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
});

loadVideos();
