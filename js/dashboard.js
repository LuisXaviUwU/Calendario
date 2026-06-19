/**
 * dashboard.js — Panel de Administración yocapi_pr
 * Usado desde: admin/yocapi-admin/index.html
 */

const MONTHS_ES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
];

// Imágenes de capybaras para la lista
const CAPY_ICONS = [
  '../../img/capifeliz.png',
  '../../img/capifeliz2.png',
  '../../img/capimirando.png',
  '../../img/capirey.png',
  '../../img/capiangel.png',
  '../../img/capiestrella.png',
  '../../img/Capisandia.png',
  '../../img/capiuva.png',
  '../../img/capimusica.png',
  '../../img/capiplaya.png',
];

let currentBirthdays = [];

/* ─── FETCH & PARSE ─────────────────────────────────────────── */
async function loadBirthdays() {
  try {
    // Desde admin/yocapi-admin/, subimos dos niveles
    const res = await fetch(`../../data/birthdays.txt?v=${Date.now()}`);
    if (!res.ok) throw new Error('No se encontró birthdays.txt');
    const text = await res.text();
    currentBirthdays = parseBirthdays(text);
  } catch (err) {
    console.warn('Error al cargar birthdays.txt:', err.message);
    currentBirthdays = [];
  }
  renderList();
}

function parseBirthdays(text) {
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
    results.push({ name, month: mm - 1, day: dd, date, url });
  });
  // Ordenar por mes y día
  results.sort((a, b) => a.month !== b.month ? a.month - b.month : a.day - b.day);
  return results;
}

/* ─── GENERAR LÍNEA ──────────────────────────────────────────── */
function generateLine() {
  const name = document.getElementById('inputName').value.trim();
  const dayStr = document.getElementById('inputDay').value.trim();
  const monthStr = document.getElementById('inputMonth').value.trim();
  const url  = document.getElementById('inputUrl').value.trim();

  if (!name) { showToast('⚠️ Ingresa un nombre de usuario'); return; }
  if (!dayStr || !monthStr) { showToast('⚠️ Ingresa el día y el mes'); return; }

  const dd = parseInt(dayStr, 10);
  const mm = parseInt(monthStr, 10);

  if (isNaN(dd) || dd < 1 || dd > 31) { showToast('⚠️ Día inválido'); return; }
  if (isNaN(mm) || mm < 1 || mm > 12) { showToast('⚠️ Mes inválido'); return; }

  // Formatear como MM-DD
  const formatted = `${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;

  let line = `${name}|${formatted}`;
  if (url) line += `|${url}`;

  document.getElementById('outputLine').textContent = line;
  document.getElementById('outputSection').style.display = 'block';
  document.getElementById('outputLine').scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  showToast('🦫 ¡Línea generada! Cópiala y pégala en birthdays.txt');
}

/* ─── COPIAR ─────────────────────────────────────────────────── */
function copyLine() {
  const text = document.getElementById('outputLine').textContent;
  if (!text) return;

  const btn = document.getElementById('btnCopy');

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      flashCopyBtn(btn);
    }).catch(() => fallbackCopy(text, btn));
  } else {
    fallbackCopy(text, btn);
  }
}

function fallbackCopy(text, btn) {
  const el = document.createElement('textarea');
  el.value = text;
  el.style.position = 'fixed';
  el.style.opacity  = '0';
  document.body.appendChild(el);
  el.select();
  try { document.execCommand('copy'); flashCopyBtn(btn); } catch(e) {}
  document.body.removeChild(el);
}

function flashCopyBtn(btn) {
  btn.classList.add('copied');
  btn.textContent = '✅ ¡Copiado!';
  showToast('✅ Copiado al portapapeles');
  setTimeout(() => {
    btn.classList.remove('copied');
    btn.innerHTML = '📋 Copiar al portapapeles';
  }, 2500);
}

/* ─── RENDER LISTA ───────────────────────────────────────────── */
function renderList() {
  const container = document.getElementById('birthdaysList');
  const countEl   = document.getElementById('birthdayCount');
  const total     = currentBirthdays.length;

  countEl.textContent = `${total} registrado${total !== 1 ? 's' : ''}`;

  if (total === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <img src="../../img/capiadormilado.png" alt="capybara" class="empty-capy" />
        No hay cumpleaños registrados aún.<br>¡Agrega el primero!
      </div>`;
    return;
  }

  container.innerHTML = '';
  currentBirthdays.forEach((b, i) => {
    const item = document.createElement('div');
    item.className = 'birthday-item';

    const [mm] = b.date.split('-').map(Number);
    const monthName = MONTHS_ES[mm - 1] || '';

    const thumb = document.createElement('img');
    thumb.src = CAPY_ICONS[i % CAPY_ICONS.length];
    thumb.alt = 'capybara';
    thumb.className = 'capy-thumb';

    const info = document.createElement('div');
    info.className = 'birthday-item-info';

    if (b.url) {
      info.innerHTML = `
        <a href="${b.url}" target="_blank" rel="noopener noreferrer"
           class="birthday-item-name has-link">${escapeHtml(b.name)}</a>
        <span class="birthday-item-date">🎂 ${b.day} de ${monthName}</span>
      `;
    } else {
      info.innerHTML = `
        <span class="birthday-item-name">${escapeHtml(b.name)}</span>
        <span class="birthday-item-date">🎂 ${b.day} de ${monthName}</span>
      `;
    }

    const tag = document.createElement('span');
    tag.className = 'birthday-item-month-tag';
    tag.textContent = monthName.substring(0, 3);

    item.appendChild(thumb);
    item.appendChild(info);
    item.appendChild(tag);
    container.appendChild(item);
  });
}

/* ─── TOAST ──────────────────────────────────────────────────── */
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

/* ─── UTILS ──────────────────────────────────────────────────── */
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ─── INIT ───────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btnGenerate').addEventListener('click', generateLine);
  document.getElementById('btnCopy').addEventListener('click', copyLine);

  ['inputName', 'inputDay', 'inputMonth', 'inputUrl'].forEach(id => {
    document.getElementById(id).addEventListener('keydown', e => {
      if (e.key === 'Enter') generateLine();
    });
  });

  loadBirthdays();
});
