const sprockets = document.getElementById('sprockets');
sprockets.innerHTML = '<span></span>'.repeat(40);

const grid = document.getElementById('grid');
const empty = document.getElementById('empty');
const reelCount = document.getElementById('reelCount');

function playIcon() {
  return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M6 4L19 12L6 20V4Z" fill="#f2efe9"/>
  </svg>`;
}

function render() {
  const videos = Array.isArray(window.VIDEOS) ? window.VIDEOS : [];
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

    const wrap = document.createElement('div');
    wrap.className = 'video-wrap';
    wrap.innerHTML = `
      <img src="https://img.youtube.com/vi/${v.id}/hqdefault.jpg" alt="${v.titulo}" loading="lazy">
      <div class="play-btn">${playIcon()}</div>
    `;
    wrap.addEventListener('click', () => {
      wrap.innerHTML = `<iframe
        src="https://www.youtube.com/embed/${v.id}?autoplay=1"
        title="${v.titulo}"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen></iframe>`;
    });
    frame.appendChild(wrap);

    const info = document.createElement('div');
    info.className = 'frame-info';
    info.innerHTML = `
      <p class="frame-name">${v.titulo}</p>
      <p class="frame-desc">${v.descripcion || ''}</p>
    `;
    frame.appendChild(info);

    grid.appendChild(frame);
  });
}

render();
