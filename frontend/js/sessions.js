/**
 * sessions.js — Session management logic
 */

document.addEventListener('DOMContentLoaded', () => {
  // Set default date to today
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('session_date').value = today;

  loadSessions();

  document.getElementById('session-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await createSession();
  });
});

async function loadSessions() {
  const tbody = document.getElementById('sessions-body');
  try {
    const res = await api('/sessions');
    const sessions = res.data;

    document.getElementById('session-count').textContent = `${sessions.length} session${sessions.length !== 1 ? 's' : ''}`;

    if (sessions.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7">
        <div class="empty-state">
          <div class="empty-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg></div>
          <div class="empty-title">No sessions created</div>
          <div class="empty-text">Create your first lecture or lab session above</div>
        </div>
      </td></tr>`;
      return;
    }

    tbody.innerHTML = sessions.map(s => `
      <tr>
        <td style="font-family:'SF Mono','Fira Code',monospace;font-size:13px;">#${s.session_id}</td>
        <td style="font-weight:600;">${s.subject_name}</td>
        <td>${s.faculty_name}</td>
        <td>${formatDate(s.session_date)}</td>
        <td>${formatTime(s.session_time)}</td>
        <td style="color:var(--text-tertiary);font-size:13px;">${formatDate(s.created_at)}</td>
        <td>
          <button class="btn btn-danger btn-sm" onclick="deleteSession(${s.session_id})" title="Delete session"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Load sessions error:', err);
    tbody.innerHTML = `<tr><td colspan="7" class="text-center" style="padding:40px;color:var(--text-tertiary)">Failed to load sessions</td></tr>`;
  }
}

async function createSession() {
  const btn = document.getElementById('session-submit-btn');
  btn.disabled = true;
  btn.textContent = 'Creating...';

  try {
    const data = {
      subject_name: document.getElementById('subject_name').value.trim(),
      faculty_name: document.getElementById('faculty_name').value.trim(),
      session_date: document.getElementById('session_date').value,
      session_time: document.getElementById('session_time').value
    };

    await api('/sessions', { method: 'POST', body: data });
    Toast.success('Session created successfully');
    document.getElementById('session-form').reset();

    // Reset date to today
    document.getElementById('session_date').value = new Date().toISOString().split('T')[0];

    loadSessions();
  } catch (err) {
    Toast.error(err.error || 'Failed to create session');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Create Session';
  }
}

async function deleteSession(id) {
  if (!confirm(`Delete session #${id}? This will also remove all attendance logs for this session.`)) return;

  try {
    await api(`/sessions/${id}`, { method: 'DELETE' });
    Toast.success('Session deleted');
    loadSessions();
  } catch (err) {
    Toast.error(err.error || 'Failed to delete session');
  }
}
