/**
 * dashboard.js — Dashboard logic
 * Loads KPIs, renders Chart.js weekly trends, populates report tables
 */

let weeklyChart = null;

document.addEventListener('DOMContentLoaded', () => {
  loadStats();
  loadWeeklyTrends();
  loadLowAttendance(75);
  loadSummary();

  document.getElementById('threshold-select').addEventListener('change', (e) => {
    loadLowAttendance(parseInt(e.target.value));
  });
});

// ── Load KPI Stats ────────────────────────────────────────────
async function loadStats() {
  try {
    const res = await api('/reports/stats');
    const d = res.data;

    document.getElementById('kpi-students').textContent = d.total_students;
    document.getElementById('kpi-sessions').textContent = d.total_sessions;
    document.getElementById('kpi-avg').textContent = d.avg_attendance ? d.avg_attendance + '%' : '0%';
    document.getElementById('kpi-logs').textContent = d.total_logs;
  } catch (err) {
    console.error('Stats error:', err);
  }
}

// ── Load Weekly Trends Chart ──────────────────────────────────
async function loadWeeklyTrends() {
  try {
    const res = await api('/reports/weekly-trends');
    const data = res.data;

    if (data.length === 0) {
      document.querySelector('.chart-wrapper').innerHTML =
        '<div class="empty-state"><div class="empty-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg></div><div class="empty-title">No trend data yet</div><div class="empty-text">Create sessions and mark attendance to see trends</div></div>';
      return;
    }

    const labels = data.map(d => {
      const date = new Date(d.week_start);
      return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    });

    const presentData = data.map(d => d.present_count);
    const absentData  = data.map(d => d.absent_count);

    const ctx = document.getElementById('weeklyChart').getContext('2d');
    const isDark = ThemeManager.isDark;

    if (weeklyChart) weeklyChart.destroy();

    weeklyChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Present',
            data: presentData,
            backgroundColor: isDark ? 'rgba(99, 102, 241, 0.6)' : 'rgba(79, 70, 229, 0.7)',
            borderColor: isDark ? 'rgba(99, 102, 241, 0.8)' : 'rgba(79, 70, 229, 0.9)',
            borderWidth: 1,
            borderRadius: 6,
            borderSkipped: false
          },
          {
            label: 'Absent',
            data: absentData,
            backgroundColor: isDark ? 'rgba(239, 68, 68, 0.4)' : 'rgba(239, 68, 68, 0.5)',
            borderColor: isDark ? 'rgba(239, 68, 68, 0.6)' : 'rgba(239, 68, 68, 0.7)',
            borderWidth: 1,
            borderRadius: 6,
            borderSkipped: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index'
        },
        plugins: {
          legend: {
            position: 'top',
            align: 'end',
            labels: {
              usePointStyle: true,
              pointStyle: 'rectRounded',
              padding: 20,
              font: { family: 'Inter', size: 12, weight: 500 },
              color: isDark ? '#94A3B8' : '#475569'
            }
          },
          tooltip: {
            backgroundColor: isDark ? '#1E293B' : '#0F172A',
            titleFont: { family: 'Inter', size: 13 },
            bodyFont: { family: 'Inter', size: 12 },
            padding: 12,
            cornerRadius: 8,
            displayColors: true
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              font: { family: 'Inter', size: 11 },
              color: isDark ? '#64748B' : '#94A3B8'
            },
            border: { display: false }
          },
          y: {
            beginAtZero: true,
            grid: {
              color: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
              drawBorder: false
            },
            ticks: {
              font: { family: 'Inter', size: 11 },
              color: isDark ? '#64748B' : '#94A3B8',
              stepSize: 1
            },
            border: { display: false }
          }
        }
      }
    });
  } catch (err) {
    console.error('Weekly trends error:', err);
  }
}

// ── Load Low Attendance ───────────────────────────────────────
async function loadLowAttendance(threshold) {
  const tbody = document.getElementById('low-attendance-body');
  try {
    const res = await api(`/reports/below-threshold?pct=${threshold}`);
    const data = res.data;

    if (data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="3">
        <div class="empty-state" style="padding:30px;">
          <div class="empty-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg></div>
          <div class="empty-title">All clear</div>
          <div class="empty-text">No students below ${threshold}% threshold</div>
        </div>
      </td></tr>`;
      return;
    }

    tbody.innerHTML = data.map(s => `
      <tr>
        <td>
          <div style="font-weight:600;">${s.full_name}</div>
          <div style="font-size:12px;color:var(--text-tertiary);">${s.student_id}</div>
        </td>
        <td>${s.department}</td>
        <td>
          <span class="badge ${s.attendance_pct < 50 ? 'badge-danger' : 'badge-warning'}">
            ${s.attendance_pct != null ? s.attendance_pct + '%' : '0%'}
          </span>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Low attendance error:', err);
    tbody.innerHTML = `<tr><td colspan="3" class="text-center" style="padding:30px;color:var(--text-tertiary)">Failed to load data</td></tr>`;
  }
}

// ── Load Full Summary ─────────────────────────────────────────
async function loadSummary() {
  const tbody = document.getElementById('summary-body');
  try {
    const res = await api('/reports/summary');
    const data = res.data;

    if (data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8">
        <div class="empty-state" style="padding:40px;">
          <div class="empty-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg></div>
          <div class="empty-title">No data available</div>
          <div class="empty-text">Add students and sessions to generate reports</div>
        </div>
      </td></tr>`;
      return;
    }

    tbody.innerHTML = data.map(s => {
      const pct = s.attendance_pct != null ? s.attendance_pct : 0;
      let badgeClass = 'badge-success';
      let statusText = 'Good';
      if (pct < 50) { badgeClass = 'badge-danger'; statusText = 'Critical'; }
      else if (pct < 75) { badgeClass = 'badge-warning'; statusText = 'Low'; }

      return `
        <tr>
          <td style="font-family:'SF Mono','Fira Code',monospace;font-size:13px;">${s.student_id}</td>
          <td style="font-weight:600;">${s.full_name}</td>
          <td>${s.department}</td>
          <td>${s.semester}</td>
          <td>${s.sessions_attended}</td>
          <td>${s.total_sessions}</td>
          <td style="font-weight:600;">${pct}%</td>
          <td><span class="badge ${badgeClass}">${statusText}</span></td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    console.error('Summary error:', err);
    tbody.innerHTML = `<tr><td colspan="8" class="text-center" style="padding:40px;color:var(--text-tertiary)">Failed to load data</td></tr>`;
  }
}
