// ─── CONFIG ────────────────────────────────────────────────────────────
const ICS_URL  = 'https://bloqueneon.uniandes.edu.co/d2l/le/calendar/feed/user/';
let filterDays = 14;            // default: next 14 days
let allTasks   = [];

// ─── CACHE DOM NODES ────────────────────────────────────────────────────
const tasksList   = document.getElementById('tasks-list');
const toggleRange = document.getElementById('toggle-range');

// ─── INITIALIZE ─────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // set initial toggle label
  toggleRange.textContent = 'Next 7 Days';

  toggleRange.addEventListener('click', () => {
    filterDays = (filterDays === 14 ? 7 : 14);
    toggleRange.textContent = filterDays === 14
      ? 'Next 7 Days'
      : 'Next 14 Days';
    renderTasks();
  });

  document.getElementById('lucky').addEventListener('click', () => {
    const q = document.querySelector('input[name="q"]').value;
    window.open(
      `https://www.google.com/search?q=${encodeURIComponent(q)}&btnI=I`,
      '_blank'
    );
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
        estHrs:   ((ev.duration?.toSeconds() || 0) / 3600).toFixed(1),
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

  const filtered = allTasks.filter(t => {
    const days = (t.due - now) / 86400000;
    return days >= 0 && days <= filterDays;
  });

  filtered.sort((a,b) => b.priority - a.priority || a.due - b.due);

  filtered.forEach(t => {
    const wrapper = document.createElement('div');
    wrapper.className = 'task';

    // date swatch
    const dt    = t.due;
    const month = dt.toLocaleString('default',{month:'short'}).toUpperCase();
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
    priInput.type      = 'number';
    priInput.min       = 0;
    priInput.value     = t.priority;
    priInput.className = 'priority-input';
    priInput.addEventListener('change', () =>
      saveMeta(t.uid, { priority: +priInput.value })
    );

    // done checkbox
    const chk = document.createElement('input');
    chk.type      = 'checkbox';
    chk.checked   = t.done;
    chk.className = 'done-chk';
    chk.addEventListener('change', () =>
      saveMeta(t.uid, { done: chk.checked })
    );

    wrapper.append(dateBox, info, priInput, chk);
    tasksList.appendChild(wrapper);
  });
}

// ─── PERSIST META & UPDATE in-memory ────────────────────────────────────
function saveMeta(uid, patch) {
  chrome.storage.local.get(uid, stored => {
    const base    = stored[uid] || {};
    const updated = { ...base, ...patch };
    chrome.storage.local.set({ [uid]: updated }, () => {
      allTasks = allTasks.map(t =>
        t.uid === uid ? { ...t, ...patch } : t
      );
      renderTasks();
    });
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

  upd();
  setInterval(upd, 5000);  // ← every 5 seconds
}

