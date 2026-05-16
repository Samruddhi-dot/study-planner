// ============================================================
// public/js/app.js
// This is the frontend brain — it calls your Express API
// and updates the page without refreshing.
// ============================================================

const API = '/tasks';

// ── AUTH: Check login, redirect if not signed in ───────────
const token  = localStorage.getItem('sf_token');
const sfUser = JSON.parse(localStorage.getItem('sf_user') || 'null');
if (!token) window.location.href = '/signin.html';

// ── AUTH: Show user email + logout button in header ─────────
window.addEventListener('DOMContentLoaded', () => {
  const statsBar = document.querySelector('.stats-bar');
  if (sfUser && statsBar) {
    const div = document.createElement('div');
    div.style.cssText = 'display:flex;align-items:center;gap:10px;margin-left:8px';
    div.innerHTML = `<span style="font-size:13px;color:#4a473d;font-weight:500">${sfUser.email}</span>
      <button onclick="logout()" style="padding:5px 12px;border-radius:100px;border:1px solid rgba(26,23,16,0.12);background:transparent;font-size:12px;font-weight:500;cursor:pointer;color:#4a473d">Sign out</button>`;
    statsBar.after(div);
  }
});

async function logout() {
  await fetch('/auth/logout', { method: 'POST' });
  localStorage.removeItem('sf_token');
  localStorage.removeItem('sf_user');
  window.location.href = '/signin.html';
}

// ── AUTH: Every API request needs the token in headers ──────
function authHeaders() {
  return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
}


// Track current filter state
let currentFilter   = 'all';
let currentPriority = null;
let selectedPriority = 'High';  // Default priority for form

// ─────────────────────────────────────────────────────────────
// UTILITY: Show a toast notification (bottom-right pop-up)
// ─────────────────────────────────────────────────────────────
function showToast(msg, type = 'default') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = `toast ${type}`;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3000);
}

// ─────────────────────────────────────────────────────────────
// UTILITY: Show/hide the in-form message
// ─────────────────────────────────────────────────────────────
function showFormMsg(msg, type = 'error') {
  const el = document.getElementById('form-msg');
  el.textContent = msg;
  el.className = `form-msg ${type}`;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 4000);
}

// ─────────────────────────────────────────────────────────────
// UTILITY: Check if a deadline is overdue
// ─────────────────────────────────────────────────────────────
function isOverdue(deadline) {
  const today = new Date(); today.setHours(0,0,0,0);
  return new Date(deadline) < today;
}

// ─────────────────────────────────────────────────────────────
// UTILITY: Format a date nicely (2025-06-01 → Jun 1, 2025)
// ─────────────────────────────────────────────────────────────
function formatDate(d) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });
}

// ─────────────────────────────────────────────────────────────
// LOAD TASKS — Fetch from API and render cards
// ─────────────────────────────────────────────────────────────
async function loadTasks() {
  let url = API;
  const params = [];
  if (currentFilter !== 'all') params.push(`status=${currentFilter}`);
  if (currentPriority)         params.push(`priority=${currentPriority}`);
  if (params.length)           url += '?' + params.join('&');

  try {
    const res  = await fetch(url, { headers: authHeaders() });
    const data = await res.json();

    if (!data.success) throw new Error(data.message);

    renderTasks(data.tasks);
    updateStats(data.tasks);

  } catch (err) {
    showToast('Could not load tasks. Is the server running?', 'error');
    console.error(err);
  }
}

// ─────────────────────────────────────────────────────────────
// RENDER TASKS — Build the HTML cards from task data
// ─────────────────────────────────────────────────────────────
function renderTasks(tasks) {
  const grid  = document.getElementById('task-list');
  const empty = document.getElementById('empty-state');

  // Remove old cards (but keep empty-state element)
  grid.querySelectorAll('.task-card').forEach(c => c.remove());

  if (!tasks.length) {
    empty.classList.remove('hidden');
    return;
  }

  empty.classList.add('hidden');

  tasks.forEach((task, i) => {
    const card = document.createElement('div');
    card.className = `task-card${task.status === 'Done' ? ' done' : ''}`;
    card.dataset.priority = task.priority;
    card.style.animationDelay = `${i * 50}ms`;

    const overdueClass = (task.status !== 'Done' && isOverdue(task.deadline))
      ? ' deadline-overdue' : '';

    card.innerHTML = `
      <div class="task-top">
        <span class="task-subject">${escapeHtml(task.subject)}</span>
        <span class="priority-badge ${task.priority}">${task.priority}</span>
      </div>
      <p class="task-title">${escapeHtml(task.title)}</p>
      <div class="task-meta">
        <span class="task-deadline${overdueClass}">
          📅 ${formatDate(task.deadline)}${overdueClass ? ' ⚠ Overdue' : ''}
        </span>
        <span class="status-badge ${task.status}">${task.status}</span>
      </div>
      <div class="task-actions">
        ${task.status === 'Pending' ? `
          <button class="action-btn done-btn" onclick="markDone(${task.id})">
            ✓ Mark Done
          </button>` : `
          <button class="action-btn" onclick="markPending(${task.id})">
            ↩ Undo
          </button>`}
        <button class="action-btn delete-btn" onclick="deleteTask(${task.id})">
          🗑 Delete
        </button>
      </div>
    `;

    grid.appendChild(card);
  });
}

// Simple XSS prevention: escape HTML special chars
function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ─────────────────────────────────────────────────────────────
// UPDATE STATS — Header counters
// ─────────────────────────────────────────────────────────────
async function updateStats(tasks) {
  // Always fetch ALL tasks for accurate stats, regardless of filter
  try {
    const res  = await fetch(API);
    const data = await res.json();
    const all  = data.tasks || tasks;

    document.getElementById('stat-total').textContent   = all.length;
    document.getElementById('stat-pending').textContent = all.filter(t => t.status === 'Pending').length;
    document.getElementById('stat-done').textContent    = all.filter(t => t.status === 'Done').length;
  } catch { /* ignore stats errors */ }
}

// ─────────────────────────────────────────────────────────────
// ADD TASK — POST /tasks
// ─────────────────────────────────────────────────────────────
async function addTask() {
  const subject  = document.getElementById('subject').value.trim();
  const title    = document.getElementById('title').value.trim();
  const deadline = document.getElementById('deadline').value;

  if (!subject || !title || !deadline) {
    showFormMsg('Please fill in Subject, Title, and Deadline.');
    return;
  }

  const btn = document.getElementById('addTaskBtn');
  btn.disabled = true;
  btn.querySelector('span').textContent = 'Adding...';

  try {
    const res  = await fetch(API, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ subject, title, deadline, priority: selectedPriority })
    });
    const data = await res.json();

    if (!data.success) throw new Error(data.message);

    // Clear form
    document.getElementById('subject').value  = '';
    document.getElementById('title').value    = '';
    document.getElementById('deadline').value = '';

    showToast('Task added! 🎉', 'success');
    loadTasks();

  } catch (err) {
    showFormMsg(err.message || 'Failed to add task.');
  } finally {
    btn.disabled = false;
    btn.querySelector('span').textContent = 'Add Task';
  }
}

// ─────────────────────────────────────────────────────────────
// MARK DONE — PUT /tasks/:id  { status: "Done" }
// ─────────────────────────────────────────────────────────────
async function markDone(id) {
  try {
    const res  = await fetch(`${API}/${id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ status: 'Done' })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    showToast('Great work! Task completed ✓', 'success');
    loadTasks();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ─────────────────────────────────────────────────────────────
// MARK PENDING — PUT /tasks/:id  { status: "Pending" }
// ─────────────────────────────────────────────────────────────
async function markPending(id) {
  try {
    const res  = await fetch(`${API}/${id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ status: 'Pending' })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    showToast('Task moved back to Pending.');
    loadTasks();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ─────────────────────────────────────────────────────────────
// DELETE TASK — DELETE /tasks/:id
// ─────────────────────────────────────────────────────────────
async function deleteTask(id) {
  if (!confirm('Delete this task permanently?')) return;

  try {
    const res  = await fetch(`${API}/${id}`, { method: 'DELETE', headers: authHeaders() });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    showToast('Task deleted.', 'error');
    loadTasks();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ─────────────────────────────────────────────────────────────
// PRIORITY SELECTOR (form buttons)
// ─────────────────────────────────────────────────────────────
document.querySelectorAll('.priority-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.priority-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedPriority = btn.dataset.value;
  });
});

// ─────────────────────────────────────────────────────────────
// FILTER BUTTONS
// ─────────────────────────────────────────────────────────────
document.querySelectorAll('.filter-btn:not(.priority-filter)').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn:not(.priority-filter)').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    loadTasks();
  });
});

document.querySelectorAll('.filter-btn.priority-filter').forEach(btn => {
  btn.addEventListener('click', () => {
    const p = btn.dataset.priority;
    if (currentPriority === p) {
      // Toggle off
      currentPriority = null;
      btn.classList.remove('active');
    } else {
      document.querySelectorAll('.filter-btn.priority-filter').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentPriority = p;
    }
    loadTasks();
  });
});

// ─────────────────────────────────────────────────────────────
// ADD TASK button click + Enter key
// ─────────────────────────────────────────────────────────────
document.getElementById('addTaskBtn').addEventListener('click', addTask);

document.querySelectorAll('#subject, #title, #deadline').forEach(input => {
  input.addEventListener('keydown', e => { if (e.key === 'Enter') addTask(); });
});

// ─────────────────────────────────────────────────────────────
// INIT — Load tasks when page opens
// ─────────────────────────────────────────────────────────────
loadTasks();
