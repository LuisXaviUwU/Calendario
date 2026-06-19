/**
 * calendar.js — Lógica del Calendario de Cumpleaños
 * yocapi_pr Birthday Calendar
 */

const MONTHS_ES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
];

/* ─── Todas las imágenes de capybara disponibles ─── */
const ALL_CAPY_IMAGES = [
  'img/Capisandia.png',
  'img/capiacostado.png',
  'img/capiadormilado.png',
  'img/capiangel.png',
  'img/capibano.png',
  'img/capicocina.png',
  'img/capicocinando.png',
  'img/capicoral.png',
  'img/capiestrella.png',
  'img/capifeliz.png',
  'img/capifeliz2.png',
  'img/capilaptop.png',
  'img/capimirando.png',
  'img/capimusica.png',
  'img/capipapas.png',
  'img/capiplaya.png',
  'img/capirey.png',
  'img/capiuva.png',
  'img/capivegetal.png',
];

/* Imágenes para badges del calendario */
const BADGE_CAPY_ICONS = [
  'img/capifeliz.png',
  'img/capifeliz2.png',
  'img/capimirando.png',
  'img/capirey.png',
  'img/capiangel.png',
  'img/capiestrella.png',
  'img/Capisandia.png',
  'img/capiuva.png',
  'img/capimusica.png',
  'img/capiplaya.png',
];

let currentYear  = new Date().getFullYear();
let currentMonth = new Date().getMonth();
let birthdaysData = [];

/* ═══════════════════════════════════════════════════════════════
   DECORACIONES FLOTANTES — Sistema de bandas fijas
   Cada slot tiene su propia banda vertical EXCLUSIVA.
   Las bandas NO se solapan → cero colisiones garantizadas.

   Pantalla ~826px, header ~87px → zona válida: 10%-90%
   Capy height ~110px = ~13.3% → bandas separadas por ≥14%

   Banda 1 (arriba):  top 20%–33%
   Banda 2 (medio):   top 44%–57%
   Banda 3 (abajo):   top 67%–80%
═══════════════════════════════════════════════════════════════ */

const DECO_SLOTS = ['deco1','deco2','deco3','deco4','deco5','deco6'];
const decoState  = {};

const DECO_BANDS = {
  'deco1': { min: 67, max: 80 }, // Abajo-izquierda
  'deco2': { min: 20, max: 33 }, // Arriba-izquierda
  'deco3': { min: 44, max: 57 }, // Medio-izquierda
  'deco4': { min: 20, max: 33 }, // Arriba-derecha
  'deco5': { min: 44, max: 57 }, // Medio-derecha
  'deco6': { min: 67, max: 80 }, // Abajo-derecha
};

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function setDecoPosition(el, id) {
  const band = DECO_BANDS[id];
  const top  = (Math.random() * (band.max - band.min) + band.min).toFixed(1);
  el.style.top    = top + '%';
  el.style.bottom = 'auto';
}

function initDecorations() {
  const shuffled = shuffleArray(ALL_CAPY_IMAGES);
  DECO_SLOTS.forEach((id, i) => {
    const el  = document.getElementById(id);
    if (!el) return;
    const img = el.querySelector('img');
    const startImg = shuffled[i % shuffled.length];
    img.src = startImg;
    setDecoPosition(el, id);
    decoState[id] = { currentSrc: startImg, usedImages: [startImg] };
    // Entrada escalonada con fade-in
    el.style.opacity = '0';
    setTimeout(() => { el.style.opacity = '0.82'; }, 200 + i * 200);
  });
}

function getNextImageFor(id) {
  const state = decoState[id];
  if (state.usedImages.length >= ALL_CAPY_IMAGES.length) {
    state.usedImages = [state.currentSrc];
  }
  const available = ALL_CAPY_IMAGES.filter(img => !state.usedImages.includes(img));
  const next = available[Math.floor(Math.random() * available.length)];
  state.usedImages.push(next);
  if (state.usedImages.length > 6) state.usedImages.shift();
  return next;
}

function rotateDecoImage(id) {
  const el  = document.getElementById(id);
  if (!el) return;
  const img  = el.querySelector('img');
  const next = getNextImageFor(id);

  el.style.opacity = '0';
  setTimeout(() => {
    img.src = next;
    decoState[id].currentSrc = next;
    setDecoPosition(el, id); // nueva posición dentro de su banda
    el.style.opacity = '0.82';
  }, 700);
}

function startDecoRotation() {
  // Intervalos diferentes para que no roten todas al mismo tiempo
  const intervals = [6000, 8500, 11000, 7000, 9500, 12000];
  DECO_SLOTS.forEach((id, i) => {
    setTimeout(() => {
      rotateDecoImage(id);
      setInterval(() => rotateDecoImage(id), intervals[i]);
    }, 4000 + i * 1300);
  });
}

/* ═══════════════════════════════════════════════════════════════
   FETCH & PARSE birthdays.txt
═══════════════════════════════════════════════════════════════ */
async function loadBirthdays() {
  try {
    const res = await fetch(`data/birthdays.txt?v=${Date.now()}`);
    if (!res.ok) throw new Error('No se pudo cargar birthdays.txt');
    const text = await res.text();
    birthdaysData = parseBirthdays(text);
  } catch (err) {
    console.warn('Error cargando birthdays.txt:', err.message);
    birthdaysData = [];
  }
  updateNextBirthday();
  renderCalendar();
}

function parseBirthdays(text) {
  const seen = new Set();
  const results = [];
  text.split('\n').forEach(raw => {
    const line = raw.trim();
    if (!line || line.startsWith('#')) return;
    const parts = line.split('|');
    if (parts.length < 2) return;
    const name = parts[0].trim();
    const date = parts[1].trim();
    const url  = parts[2] ? parts[2].trim() : null;
    const [mm, dd] = date.split('-').map(Number);
    if (!mm || !dd || mm < 1 || mm > 12 || dd < 1 || dd > 31) return;
    const key = `${name}|${mm}|${dd}`;
    if (seen.has(key)) return;
    seen.add(key);
    results.push({ name, month: mm - 1, day: dd, url });
  });
  return results;
}

function getBirthdaysForDay(month, day) {
  return birthdaysData.filter(b => b.month === month && b.day === day);
}

/* ═══════════════════════════════════════════════════════════════
   RENDER CALENDAR
═══════════════════════════════════════════════════════════════ */
function renderCalendar() {
  document.getElementById('monthName').textContent = MONTHS_ES[currentMonth];
  document.getElementById('yearName').textContent  = currentYear;
  renderGrid();
}

function renderGrid() {
  const grid = document.getElementById('calGrid');
  grid.innerHTML = '';

  const today       = new Date();
  const firstDay    = new Date(currentYear, currentMonth, 1).getDay();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  for (let i = 0; i < startOffset; i++) {
    const empty = document.createElement('div');
    empty.className = 'cal-day empty';
    empty.setAttribute('aria-hidden', 'true');
    grid.appendChild(empty);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const bdays  = getBirthdaysForDay(currentMonth, d);
    const isToday =
      today.getFullYear() === currentYear &&
      today.getMonth()    === currentMonth &&
      today.getDate()     === d;

    const cell = document.createElement('div');
    cell.className = 'cal-day';
    cell.setAttribute('role', 'gridcell');
    cell.setAttribute('aria-label', `${d} de ${MONTHS_ES[currentMonth]}`);
    if (isToday)      cell.classList.add('today');
    if (bdays.length) cell.classList.add('has-birthday');

    // Número del día
    const numEl = document.createElement('div');
    numEl.className = 'day-number';
    numEl.textContent = d;
    cell.appendChild(numEl);

    // Badges de cumpleaños: máximo 2 visibles + "+N más"
    if (bdays.length) {
      const badge = document.createElement('div');
      badge.className = 'birthday-badge';

      // Mostrar máximo 2 nombres
      bdays.slice(0, 2).forEach((b, idx) => {
        const entry = document.createElement('div');
        entry.className = 'birthday-entry';

        const icon = document.createElement('img');
        icon.src = BADGE_CAPY_ICONS[(d + idx) % BADGE_CAPY_ICONS.length];
        icon.alt = '';
        icon.className = 'bi-icon';

        const nameSpan = document.createElement('span');
        nameSpan.textContent = b.name;

        entry.appendChild(icon);
        entry.appendChild(nameSpan);
        badge.appendChild(entry);
      });

      // Si hay más de 2, mostrar pastilla "+N más" con tooltip
      if (bdays.length > 2) {
        const more = document.createElement('div');
        more.className = 'birthday-entry more-entry';
        more.textContent = `+${bdays.length - 2} más`;
        // Tooltip nativo con los nombres restantes
        const extraNames = bdays.slice(2).map(b => b.name).join(', ');
        more.title = `También cumplen: ${extraNames}`;
        badge.appendChild(more);
      }

      cell.appendChild(badge);
      // Toda la celda es clickable para abrir el modal
      cell.addEventListener('click', () => openModal(d, bdays));
    }

    grid.appendChild(cell);
  }
}

/* ═══════════════════════════════════════════════════════════════
   MODAL
═══════════════════════════════════════════════════════════════ */
function openModal(day, bdays) {
  const overlay  = document.getElementById('modalOverlay');
  const modalImg = document.getElementById('modalCapyImg');

  document.getElementById('modalDate').textContent =
    `${day} de ${MONTHS_ES[currentMonth]} 🎂`;

  modalImg.src = BADGE_CAPY_ICONS[Math.floor(Math.random() * BADGE_CAPY_ICONS.length)];

  const list = document.getElementById('modalFollowers');
  list.innerHTML = '';

  bdays.forEach((b, idx) => {
    const item = document.createElement('div');
    item.className = 'modal-follower-item';

    const thumb = document.createElement('img');
    thumb.src = BADGE_CAPY_ICONS[(day + idx) % BADGE_CAPY_ICONS.length];
    thumb.alt = '';
    thumb.className = 'capy-thumb';

    const link = document.createElement('a');
    link.className = 'modal-follower-link';
    link.textContent = b.name;
    link.href   = b.url || '#';
    link.target = '_blank';
    link.rel    = 'noopener noreferrer';
    if (!b.url) { link.style.pointerEvents = 'none'; link.style.cursor = 'default'; }

    item.appendChild(thumb);
    item.appendChild(link);
    list.appendChild(item);
  });

  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
  overlay.addEventListener('click', outsideClick);
}

function closeModal() {
  const overlay = document.getElementById('modalOverlay');
  overlay.classList.remove('active');
  document.body.style.overflow = '';
  overlay.removeEventListener('click', outsideClick);
}

function outsideClick(e) {
  if (e.target === document.getElementById('modalOverlay')) closeModal();
}

/* ═══════════════════════════════════════════════════════════════
   NAVEGACIÓN
═══════════════════════════════════════════════════════════════ */
function prevMonth() {
  if (currentMonth === 0) { currentMonth = 11; currentYear--; }
  else currentMonth--;
  renderCalendar();
}

function nextMonth() {
  if (currentMonth === 11) { currentMonth = 0; currentYear++; }
  else currentMonth++;
  renderCalendar();
}

/* ═══════════════════════════════════════════════════════════════
   PRÓXIMO CUMPLEAÑOS
═══════════════════════════════════════════════════════════════ */
function updateNextBirthday() {
  if (!birthdaysData.length) return;
  const today = new Date();
  const m = today.getMonth();
  const d = today.getDate();

  // Ordenar cronológicamente
  const sorted = [...birthdaysData].sort((a, b) => a.month !== b.month ? a.month - b.month : a.day - b.day);

  // Buscar el primero que sea hoy o en el futuro
  let next = sorted.find(b => b.month > m || (b.month === m && b.day >= d));
  
  if (!next) {
    // Si ya pasaron todos este año, el próximo es el primero del año que viene
    next = sorted[0];
  }

  const banner = document.getElementById('nextBdayBanner');
  const textEl = document.getElementById('nextBdayText');
  
  textEl.textContent = `${next.name} (${next.day} de ${MONTHS_ES[next.month]})`;
  banner.style.display = 'block';
}

/* ═══════════════════════════════════════════════════════════════
   MODO NOCHE
═══════════════════════════════════════════════════════════════ */
function toggleDarkMode() {
  const isDark = document.body.classList.toggle('dark-mode');
  localStorage.setItem('yocapi_dark_mode', isDark ? '1' : '0');
  document.getElementById('btnNightMode').textContent = isDark ? '☀️' : '🌙';
}

function initDarkMode() {
  if (localStorage.getItem('yocapi_dark_mode') === '1') {
    document.body.classList.add('dark-mode');
    document.getElementById('btnNightMode').textContent = '☀️';
  }
}

/* ═══════════════════════════════════════════════════════════════
   BUSCADOR RÁPIDO
═══════════════════════════════════════════════════════════════ */
function initSearch() {
  const input = document.getElementById('searchInput');
  const results = document.getElementById('searchResults');
  
  if (!input || !results) return;

  input.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase().trim();
    if (!q) { results.style.display = 'none'; return; }
    
    // Filtrar coincidencias y tomar max 5
    const matches = birthdaysData.filter(b => b.name.toLowerCase().includes(q)).slice(0, 5);
    
    if (!matches.length) {
      results.innerHTML = '<div class="search-item" style="cursor:default">No encontrado 🦫</div>';
      results.style.display = 'block';
      return;
    }
    
    results.innerHTML = '';
    matches.forEach(m => {
      const div = document.createElement('div');
      div.className = 'search-item';
      div.textContent = `🎂 ${m.name} (${m.day} de ${MONTHS_ES[m.month].substring(0,3)})`;
      div.addEventListener('click', () => {
        // Cambiar al mes correspondiente
        currentMonth = m.month;
        renderCalendar();
        
        // Resaltar el día con animación (esperamos a que el DOM se actualice)
        setTimeout(() => highlightDay(m.day), 50);
        
        results.style.display = 'none';
        input.value = '';
      });
      results.appendChild(div);
    });
    results.style.display = 'block';
  });

  // Cerrar al hacer clic fuera
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-wrap')) {
      results.style.display = 'none';
    }
  });
}

function highlightDay(day) {
  const cells = document.querySelectorAll('.cal-day:not(.empty)');
  cells.forEach(c => {
    const numEl = c.querySelector('.day-number');
    if (numEl && parseInt(numEl.textContent, 10) === day) {
      c.scrollIntoView({ behavior: 'smooth', block: 'center' });
      c.classList.add('highlight-pulse');
      setTimeout(() => c.classList.remove('highlight-pulse'), 2500);
    }
  });
}

/* ═══════════════════════════════════════════════════════════════
   INIT
═══════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  initDarkMode();
  initSearch();
  document.getElementById('btnNightMode').addEventListener('click', toggleDarkMode);

  document.getElementById('btnPrev').addEventListener('click', prevMonth);
  document.getElementById('btnNext').addEventListener('click', nextMonth);
  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  // Swipe móvil
  let touchStartX = 0;
  document.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });
  document.addEventListener('touchend', e => {
    const diff = touchStartX - e.changedTouches[0].screenX;
    if (Math.abs(diff) > 55) diff > 0 ? nextMonth() : prevMonth();
  }, { passive: true });

  initDecorations();
  startDecoRotation();
  loadBirthdays();
});
