/**
 * students.js — Student management logic
 */

document.addEventListener('DOMContentLoaded', () => {
  loadStudents();

  document.getElementById('student-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await addStudent();
  });
});

async function loadStudents() {
  const tbody = document.getElementById('students-body');
  try {
    const res = await api('/students');
    const students = res.data;

    document.getElementById('student-count').textContent = `${students.length} student${students.length !== 1 ? 's' : ''}`;

    if (students.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7">
        <div class="empty-state">
          <div class="empty-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg></div>
          <div class="empty-title">No students enrolled</div>
          <div class="empty-text">Use the form above to add your first student</div>
        </div>
      </td></tr>`;
      return;
    }

    tbody.innerHTML = students.map(s => `
      <tr>
        <td style="font-family:'SF Mono','Fira Code',monospace;font-size:13px;font-weight:500;">${s.student_id}</td>
        <td style="font-weight:600;">${s.full_name}</td>
        <td><span class="badge badge-neutral">${s.department}</span></td>
        <td>${s.semester}</td>
        <td style="color:var(--text-secondary);">${s.email}</td>
        <td style="color:var(--text-tertiary);font-size:13px;">${formatDate(s.created_at)}</td>
        <td>
          <button class="btn btn-danger btn-sm" onclick="deleteStudent('${s.student_id}')" title="Remove student"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Load students error:', err);
    tbody.innerHTML = `<tr><td colspan="7" class="text-center" style="padding:40px;color:var(--text-tertiary)">Failed to load students</td></tr>`;
  }
}

async function addStudent() {
  const btn = document.getElementById('submit-btn');
  btn.disabled = true;
  btn.textContent = 'Adding...';

  try {
    const data = {
      student_id: document.getElementById('student_id').value.trim(),
      full_name:  document.getElementById('full_name').value.trim(),
      email:      document.getElementById('email').value.trim(),
      department: document.getElementById('department').value,
      semester:   document.getElementById('semester').value
    };

    await api('/students', { method: 'POST', body: data });
    Toast.success('Student enrolled successfully');
    document.getElementById('student-form').reset();
    loadStudents();
  } catch (err) {
    Toast.error(err.error || 'Failed to add student');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Add Student';
  }
}

async function deleteStudent(id) {
  if (!confirm(`Remove student ${id}? This will also delete all their attendance records.`)) return;

  try {
    await api(`/students/${id}`, { method: 'DELETE' });
    Toast.success('Student removed');
    loadStudents();
  } catch (err) {
    Toast.error(err.error || 'Failed to delete student');
  }
}
