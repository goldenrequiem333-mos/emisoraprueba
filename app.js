const STORAGE_KEY = 'cajitas-radio-stations-v1';

const starterStations = [
  {
    id: 'radio-paradise',
    name: 'Radio Paradise',
    city: 'Global · Estados Unidos',
    category: 'Música',
    description: 'Una mezcla ecléctica de rock, electrónica y música para descubrir.',
    emoji: '🌙',
    color: '#47442f',
    url: 'https://stream.radioparadise.com/mp3-128',
    published: true,
  },
  {
    id: 'soma-groove-salad',
    name: 'Groove Salad',
    city: 'San Francisco · Estados Unidos',
    category: 'Música',
    description: 'Chillout, downtempo y ritmos suaves para dejarse llevar.',
    emoji: '🌴',
    color: '#33443b',
    url: 'https://ice.somafm.com/groovesalad',
    published: true,
  },
  {
    id: 'soma-lush',
    name: 'SomaFM Lush',
    city: 'San Francisco · Estados Unidos',
    category: 'Música',
    description: 'Sonidos elegantes, indie y atmósferas para la noche.',
    emoji: '🎧',
    color: '#493b4e',
    url: 'https://ice.somafm.com/lush',
    published: true,
  },
  {
    id: 'soma-jazz',
    name: 'SomaFM — Sonic Universe',
    city: 'San Francisco · Estados Unidos',
    category: 'Cultura',
    description: 'Jazz moderno, nuevos sonidos y paisajes instrumentales.',
    emoji: '🎷',
    color: '#4b4030',
    url: 'https://ice.somafm.com/sonicuniverse',
    published: true,
  },
];

const grid = document.querySelector('#station-grid');
const adminList = document.querySelector('#admin-station-list');
const form = document.querySelector('#station-form');
const formMessage = document.querySelector('#form-message');
let currentFilter = 'Todas';
let searchQuery = '';
let stations = loadStations();

function loadStations() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === null) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(starterStations));
    return starterStations.map((station) => ({ ...station }));
  }

  try {
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) throw new Error('El formato de emisoras guardado no es válido.');
    return parsed;
  } catch (error) {
    console.error('No se pudieron leer las emisoras guardadas.', error);
    return [];
  }
}

function saveStations() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stations));
    return true;
  } catch (error) {
    console.error('No se pudieron guardar las emisoras.', error);
    showFormMessage('No se pudieron guardar los cambios en este navegador.', true);
    return false;
  }
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
}

function safeStreamUrl(value) {
  try {
    const parsed = new URL(value);
    return ['http:', 'https:'].includes(parsed.protocol) ? parsed.href : null;
  } catch {
    return null;
  }
}

function renderPublicStations() {
  const publishedStations = stations.filter((station) => station.published);
  const visibleStations = publishedStations.filter((station) => {
    const matchesCategory = currentFilter === 'Todas' || station.category === currentFilter;
    const searchable = `${station.name} ${station.city} ${station.category} ${station.description}`.toLowerCase();
    return matchesCategory && searchable.includes(searchQuery.toLowerCase());
  });

  grid.innerHTML = visibleStations.map((station) => {
    const url = safeStreamUrl(station.url);
    if (!url) return '';
    return `
      <article class="station-card">
        <div class="card-top">
          <div class="station-art" style="background:${escapeHtml(station.color)}">${escapeHtml(station.emoji)}</div>
          <span class="station-live"><span class="live-dot"></span> EN DIRECTO</span>
        </div>
        <h3>${escapeHtml(station.name)}</h3>
        <p class="station-location">${escapeHtml(station.city || 'Radio en línea')}</p>
        <p class="station-description">${escapeHtml(station.description || 'Sintoniza esta emisora en directo.')}</p>
        <div class="card-meta">
          <span class="category-tag">${escapeHtml(station.category)}</span>
          <span class="listener-note">ABRIR FRECUENCIA ↗</span>
        </div>
        <audio class="station-audio" controls preload="none" src="${escapeHtml(url)}" aria-label="Reproductor de ${escapeHtml(station.name)}"></audio>
      </article>`;
  }).join('');

  document.querySelector('#all-count').textContent = String(publishedStations.length);
  document.querySelector('#catalog-count').textContent = `${publishedStations.length} EMISORAS`;
  document.querySelector('#empty-state').hidden = visibleStations.length > 0;
  grid.hidden = visibleStations.length === 0;
}

function renderAdminStations() {
  const publishedCount = stations.filter((station) => station.published).length;
  document.querySelector('#stat-total').textContent = String(stations.length);
  document.querySelector('#stat-published').textContent = String(publishedCount);
  document.querySelector('#manage-count').textContent = `${stations.length} TOTAL`;
  document.querySelector('#admin-empty').hidden = stations.length > 0;

  adminList.innerHTML = stations.map((station) => `
    <article class="admin-station">
      <span class="admin-station-icon" style="background:${escapeHtml(station.color)}">${escapeHtml(station.emoji)}</span>
      <div class="admin-station-info">
        <strong>${escapeHtml(station.name)}</strong>
        <small>${escapeHtml(station.category)} · ${escapeHtml(station.city || 'Sin ubicación')}</small>
      </div>
      <div class="admin-station-actions">
        <span class="status-pill ${station.published ? 'is-published' : ''}">${station.published ? 'PUBLICADA' : 'BORRADOR'}</span>
        <button class="icon-button" type="button" data-action="toggle" data-id="${escapeHtml(station.id)}" aria-label="${station.published ? 'Despublicar' : 'Publicar'} ${escapeHtml(station.name)}" title="${station.published ? 'Despublicar' : 'Publicar'}">${station.published ? '◉' : '○'}</button>
        <button class="icon-button" type="button" data-action="edit" data-id="${escapeHtml(station.id)}" aria-label="Editar ${escapeHtml(station.name)}" title="Editar">✎</button>
        <button class="icon-button delete-button" type="button" data-action="delete" data-id="${escapeHtml(station.id)}" aria-label="Borrar ${escapeHtml(station.name)}" title="Borrar">×</button>
      </div>
    </article>`).join('');
}

function render() {
  renderPublicStations();
  renderAdminStations();
}

function showView(view, scrollToTop = true) {
  const adminIsVisible = view === 'admin';
  document.querySelector('#public-view').hidden = adminIsVisible;
  document.querySelector('#admin-view').hidden = !adminIsVisible;
  document.querySelectorAll('[data-view]').forEach((link) => {
    link.classList.toggle('is-active', link.dataset.view === view && link.classList.contains('nav-link'));
  });
  if (scrollToTop) window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showFormMessage(message, isError = false) {
  formMessage.textContent = message;
  formMessage.classList.toggle('is-error', isError);
}

function clearForm() {
  form.reset();
  document.querySelector('#station-id').value = '';
  document.querySelector('#station-published').checked = true;
  document.querySelector('#form-heading').textContent = 'Añadir emisora';
  document.querySelector('#save-station').innerHTML = 'Publicar emisora <span aria-hidden="true">↗</span>';
  document.querySelector('#cancel-edit').hidden = true;
  showFormMessage('');
}

function beginEdit(station) {
  document.querySelector('#station-id').value = station.id;
  document.querySelector('#station-name').value = station.name;
  document.querySelector('#station-city').value = station.city || '';
  document.querySelector('#station-category').value = station.category;
  document.querySelector('#station-url').value = station.url;
  document.querySelector('#station-description').value = station.description || '';
  document.querySelector('#station-emoji').value = station.emoji;
  document.querySelector('#station-published').checked = station.published;
  document.querySelector('#form-heading').textContent = 'Editar emisora';
  document.querySelector('#save-station').innerHTML = 'Guardar cambios <span aria-hidden="true">↗</span>';
  document.querySelector('#cancel-edit').hidden = false;
  showFormMessage('');
  document.querySelector('#station-name').focus();
}

document.querySelectorAll('[data-view]').forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    const opensCatalog = link.dataset.view === 'public' && link.getAttribute('href') === '#stations';
    showView(link.dataset.view, !opensCatalog);
    if (opensCatalog) document.querySelector('#stations').scrollIntoView({ behavior: 'smooth' });
  });
});

document.querySelectorAll('.filter-chip').forEach((button) => {
  button.addEventListener('click', () => {
    currentFilter = button.dataset.filter;
    document.querySelectorAll('.filter-chip').forEach((chip) => chip.classList.toggle('is-selected', chip === button));
    renderPublicStations();
  });
});

document.querySelector('#station-search').addEventListener('input', (event) => {
  searchQuery = event.target.value.trim();
  renderPublicStations();
});

adminList.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const station = stations.find((item) => item.id === button.dataset.id);
  if (!station) return;

  if (button.dataset.action === 'edit') {
    beginEdit(station);
    document.querySelector('#station-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  if (button.dataset.action === 'toggle') {
    station.published = !station.published;
    if (saveStations()) render();
  }
  if (button.dataset.action === 'delete') {
    if (!window.confirm(`¿Borrar "${station.name}" de tu colección?`)) return;
    stations = stations.filter((item) => item.id !== station.id);
    if (saveStations()) {
      if (document.querySelector('#station-id').value === station.id) clearForm();
      render();
      showFormMessage('Emisora borrada.');
    }
  }
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const id = document.querySelector('#station-id').value;
  const url = safeStreamUrl(document.querySelector('#station-url').value.trim());
  if (!url) {
    showFormMessage('Introduce una URL válida que comience por http:// o https://.', true);
    document.querySelector('#station-url').focus();
    return;
  }

  const existing = stations.find((station) => station.id === id);
  const station = {
    id: existing?.id || crypto.randomUUID(),
    name: document.querySelector('#station-name').value.trim(),
    city: document.querySelector('#station-city').value.trim(),
    category: document.querySelector('#station-category').value,
    description: document.querySelector('#station-description').value.trim(),
    emoji: document.querySelector('#station-emoji').value,
    color: existing?.color || ['#47442f', '#33443b', '#493b4e', '#4b4030'][stations.length % 4],
    url,
    published: document.querySelector('#station-published').checked,
  };

  if (existing) {
    stations = stations.map((item) => item.id === existing.id ? station : item);
  } else {
    stations.unshift(station);
  }

  if (!saveStations()) return;
  render();
  clearForm();
  showFormMessage(existing ? 'Cambios guardados.' : station.published ? 'Emisora publicada en el sitio.' : 'Emisora guardada como borrador.');
});

document.querySelector('#cancel-edit').addEventListener('click', clearForm);
document.addEventListener('keydown', (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    showView('public');
    document.querySelector('#station-search').focus();
    document.querySelector('#stations').scrollIntoView({ behavior: 'smooth' });
  }
});

render();
