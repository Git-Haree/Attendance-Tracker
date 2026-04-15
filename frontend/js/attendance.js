/**
 * attendance.js — Attendance marking logic
 * Handles: session loading, student grid, bulk marking, network error display
 */

let selectedSessionId = null;

document.addEventListener('DOMContentLoaded', () => {
  loadSessionOptions();
  loadRecentLogs();

  const sessionSelect = document.getElementById('session-select');
  const loadBtn = document.getElementById('load-students-btn');

  sessionSelect.addEventListener('change', () => {
    loadBtn.disabled = !sessionSelect.value;
  });

  loadBtn.addEventListener('click', () => {
    selectedSessionId = sessionSelect.value;
    if (selectedSessionId) loadStudentsForMarking();
  });

  document.getElementById('submit-attendance').addEventListener('click', submitAttendance);

  document.getElementById('mark-all-present').addEventListener('click', () => setAllStatus('present'));
  document.getElementById('mark-all-absent').addEventListener('click', () => setAllStatus('absent'));
});

// ── Load Session Options ──────────────────────────────────────
async function loadSessionOptions() {
  try {
    const res = await api('/sessions');
    const sessions = res.data;
    const select = document.getElementById('session-select');

    sessions.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.session_id;
      opt.textContent = `#${s.session_id} — ${s.subject_name} (${formatDate(s.session_date)}, ${formatTime(s.session_time)})`;
      select.appendChild(opt);
    });
  } catch (err) {
    console.error('Load sessions error:', err);
  }
}

// ── Load Students Grid ────────────────────────────────────────
async function loadStudentsForMarking() {
  const grid = document.getElementById('students-grid');
  const section = document.getElementById('marking-section');

  try {
    const res = await api('/students');
    const students = res.data;

    if (students.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1;">
          <div class="empty-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg></div>
          <div class="empty-title">No students enrolled</div>
          <div class="empty-text">Add students first before marking attendance</div>
        </div>`;
      section.classList.remove('hidden');
      return;
    }

    grid.innerHTML = students.map(s => `
      <div class="attendance-student-card" data-student-id="${s.student_id}">
        <div class="student-info">
          <span class="student-name">${s.full_name}</span>
          <span class="student-id">${s.student_id} · ${s.department}</span>
        </div>
        <select class="form-control status-select" data-student="${s.student_id}">
          <option value="present">Present</option>
          <option value="late">Late</option>
          <option value="absent">Absent</option>
        </select>
      </div>
    `).join('');

    section.classList.remove('hidden');
  } catch (err) {
    console.error('Load students error:', err);
    Toast.error('Failed to load students');
  }
}

// ── Set All Status ────────────────────────────────────────────
function setAllStatus(status) {
  document.querySelectorAll('.status-select').forEach(select => {
    select.value = status;
  });
}

// ── Submit Attendance ─────────────────────────────────────────
async function submitAttendance() {
  if (!selectedSessionId) {
    Toast.error('Please select a session first');
    return;
  }

  const selects = document.querySelectorAll('.status-select');
  if (selects.length === 0) {
    Toast.error('No students to mark');
    return;
  }

  const entries = [];
  selects.forEach(select => {
    entries.push({
      student_id: select.dataset.student,
      status: select.value
    });
  });

  const btn = document.getElementById('submit-attendance');
  btn.disabled = true;
  btn.textContent = 'Submitting...';

  // Hide any previous network error
  document.getElementById('network-error').classList.add('hidden');
  document.getElementById('attendance-content').style.display = '';

  try {
    const res = await api('/attendance/mark-bulk', {
      method: 'POST',
      body: { session_id: parseInt(selectedSessionId), entries }
    });

    Toast.success(res.message || 'Attendance submitted');
    loadRecentLogs();

    // Reset marking section
    document.getElementById('marking-section').classList.add('hidden');
    document.getElementById('session-select').value = '';
    document.getElementById('load-students-btn').disabled = true;
  } catch (err) {
    if (err.status === 403) {
      // Network access denied
      document.getElementById('network-error').classList.remove('hidden');
      document.getElementById('attendance-content').style.display = 'none';
      document.getElementById('denied-ip').textContent = err.clientIp || 'Unknown';
      document.getElementById('denied-network').textContent = err.requiredNetwork || '192.168.1.x or 10.0.0.x';
    } else {
      Toast.error(err.message || err.error || 'Failed to submit attendance');
    }
  } finally {
    btn.disabled = false;
    btn.textContent = 'Submit Attendance';
  }
}

// ── Load Recent Logs ──────────────────────────────────────────
async function loadRecentLogs() {
  const tbody = document.getElementById('logs-body');

  try {
    const res = await api('/attendance/logs');
    const logs = res.data;

    if (logs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6">
        <div class="empty-state" style="padding:40px;">
          <div class="empty-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></div>
          <div class="empty-title">No attendance logs yet</div>
          <div class="empty-text">Mark attendance for a session to see logs here</div>
        </div>
      </td></tr>`;
      return;
    }

    tbody.innerHTML = logs.map(log => {
      let statusBadge = 'badge-success';
      if (log.status === 'absent') statusBadge = 'badge-danger';
      else if (log.status === 'late') statusBadge = 'badge-warning';

      return `
        <tr>
          <td>
            <div style="font-weight:600;">${log.full_name}</div>
            <div style="font-size:12px;color:var(--text-tertiary);">${log.student_id}</div>
          </td>
          <td>
            <div>${log.subject_name}</div>
            <div style="font-size:12px;color:var(--text-tertiary);">${formatDate(log.session_date)}</div>
          </td>
          <td><span class="badge ${statusBadge}">${log.status}</span></td>
          <td style="font-size:13px;">${formatDateTime(log.marked_at)}</td>
          <td>
            <span class="hash-badge" title="${log.timestamp_hash}">
              <span class="hash-icon"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg></span>
              ${truncateHash(log.timestamp_hash)}
            </span>
          </td>
          <td style="font-size:13px;color:var(--text-tertiary);font-family:'SF Mono','Fira Code',monospace;">
            ${log.client_ip || '—'}
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    console.error('Load logs error:', err);
    tbody.innerHTML = `<tr><td colspan="6" class="text-center" style="padding:40px;color:var(--text-tertiary)">Failed to load logs</td></tr>`;
  }
}
