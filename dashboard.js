// ─── CONFIG ────────────────────────────────────────────────────────────
const ICS_URL = 'https://bloqueneon.uniandes.edu.co/d2l/le/calendar/feed/user/feed.ics?token=az9cqvl6udnqrz1lba3e';
let filterDays = 10;
let allTasks = [];

// ─── CACHE UI NODES ─────────────────────────────────────────────────────
const tasksList    = document.getElementById('tasks-list');
const toggleRange  = document.getElementById('toggle-range');
const spentGaugeEl = document.querySelector('#spent-gauge .gauge-fill');
const budgetGaugeEl= document.querySelector('#budget-gauge .gauge-fill');
const spentText    = document.getElementById('spent-text');
const budgetText   = document.getElementById('budget-text');

// ─── INITIALIZE ─────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  toggleRange.addEventListener('click', () => {
    filterDays = (filterDays === 10 ? 7 : 10);
    toggleRange.textContent = filterDays === 7
      ? 'Next 10 Days'
      : 'Next Week Only';
    renderTasks();
  });

  document.getElementById('lucky').addEventListener('click', () => {
    const q = document.querySelector('input[name="q"]').value;
    window.open(`https://www.google.com/search?q=${encodeURIComponent(q)}&btnI=I`, '_blank');
  });

  fetchAndMerge();
  startClock();
});

// ─── FETCH & MERGE ──────────────────────────────────────────────────────
async function fetchAndMerge() {
  tasksList.innerHTML = '<p>Loading…</p>';
  try {
    const res  = await fetch(ICS_URL);
    const text = await res.text();
    const jcal = ICAL.parse(text);
    const comp = new ICAL.Component(jcal);
    const events = comp.getAllSubcomponents('vevent')
      .map(c => new ICAL.Event(c))
      .filter(ev => ev.startDate.toJSDate() >= new Date())
      .map(ev => ({
        uid:      ev.uid,
        title:    ev.summary,
        due:      ev.startDate.toJSDate(),
        priority: ev.priority || 0,
        estHrs:   (ev.duration?.toSeconds() || 0) / 3600,
        done:     false
      }));

    const keys = events.map(e => e.uid);
    chrome.storage.local.get(keys, stored => {
      allTasks = events.map(e => {
        const m = stored[e.uid] || {};
        return {
          ...e,
          priority: m.priority ?? e.priority,
          estHrs:   m.estHrs   ?? e.estHrs,
          done:     m.done     ?? false
        };
      });
      renderTasks();
    });
  } catch (err) {
    console.error(err);
    tasksList.innerHTML = '<p style="color:#f88;">Error loading calendar.</p>';
  }
}

// ─── RENDER TASK LIST ───────────────────────────────────────────────────
function renderTasks() {
  tasksList.innerHTML = '';
  const now = new Date();

  // filter by next N days
  const filtered = allTasks.filter(t => {
    const days = (t.due - now) / 86400000;
    return days >= 0 && days <= filterDays;
  });

  // sort by priority descending, then due date
  filtered.sort((a, b) => b.priority - a.priority || a.due - b.due);

  filtered.forEach(t => {
    const wrapper = document.createElement('div');
    wrapper.className = 'task';

    // date swatch
    const dt = t.due;
    const month = dt.toLocaleString('default',{ month: 'short' }).toUpperCase();
    const day   = dt.getDate();
    const dateBox = document.createElement('div');
    dateBox.className = 'date';
    dateBox.innerHTML = `${month}<br>${day}`;

    // info
    const info = document.createElement('div');
    info.className = 'info';
    info.innerHTML = `
      <div class="title">${t.title}</div>
      <div class="due">${dt.toLocaleString()}</div>
    `;

    // editable priority
    const priInput = document.createElement('input');
    priInput.type = 'number';
    priInput.min  = 0;
    priInput.value= t.priority;
    priInput.className = 'priority-input';
    priInput.addEventListener('change', () => saveMeta(t.uid, { priority: +priInput.value }));

    // done checkbox
    const chk = document.createElement('input');
    chk.type    = 'checkbox';
    chk.checked = t.done;
    chk.className = 'done-chk';
    chk.addEventListener('change', () => saveMeta(t.uid, { done: chk.checked }));

    wrapper.append(dateBox, info, priInput, chk);
    tasksList.appendChild(wrapper);
  });

  updateStats();
}

// ─── STATS & GAUGES ─────────────────────────────────────────────────────
function updateStats() {
  const now = new Date();
  const dayNum = now.getDay();         // Sun=0,Mon=1…
  const mon = new Date(now);           
  mon.setDate(now.getDate() - ((dayNum + 6) % 7));

  const weekTasks = allTasks.filter(t =>
    t.due >= mon && t.due < new Date(mon.getTime() + 7*86400000)
  );

  const budget = weekTasks.reduce((sum,t) => sum + t.estHrs, 0);
  const spent  = weekTasks.filter(t => t.done)
                          .reduce((sum,t) => sum + t.estHrs, 0);

  drawGauge(spentGaugeEl, spent / Math.max(budget,1), spent, '#2ecc71');
  drawGauge(budgetGaugeEl, 1, budget, '#e74c3c');

  document.getElementById('spent-text').textContent  = `${spent.toFixed(1)} hrs`;
  document.getElementById('budget-text').textContent = `${budget.toFixed(1)} hrs`;
}

function drawGauge(el, ratio, value, color) {
  ratio = Math.max(0, Math.min(1, ratio));
  const r = 40, start = 'M10,50', la = ratio > .5 ? 1 : 0;
  const angle = Math.PI * ratio;
  const x = 50 + r * Math.cos(Math.PI - angle);
  const y = 50 - r * Math.sin(Math.PI - angle);
  const d = `${start} A${r},${r} 0 ${la},1 ${x},${y}`;
  el.setAttribute('d', d);
  el.setAttribute('stroke', color);
}

// ─── PERSIST META ───────────────────────────────────────────────────────
function saveMeta(uid, patch) {
  chrome.storage.local.get(uid, stored => {
    const base = stored[uid] || {};
    const updated = { ...base, ...patch };
    chrome.storage.local.set({ [uid]: updated }, renderTasks);
  });
}

// ─── CLOCK ─────────────────────────────────────────────────────────────
function startClock() {
  const timeEl = document.querySelector('#clock .time');
  const dateEl = document.querySelector('#clock .date');

  function upd() {
    const now = new Date();
    timeEl.textContent = now.toLocaleTimeString([], {
      hour:   '2-digit',
      minute: '2-digit'
    });
    dateEl.textContent = now.toLocaleDateString([], {
      weekday: 'short',
      month:   'short',
      day:     'numeric',
      year:    'numeric'
    });
  }

  // initial render:
  upd();
  // re-render every minute:
  setInterval(upd, 10000);  // no underscore separator
}
