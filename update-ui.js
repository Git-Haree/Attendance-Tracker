const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  'frontend/index.html',
  'frontend/students.html',
  'frontend/sessions.html',
  'frontend/attendance.html',
  'frontend/js/dashboard.js',
  'frontend/js/students.js',
  'frontend/js/sessions.js',
  'frontend/js/attendance.js',
  'frontend/js/app.js'
];

const basePath = "c:\\Users\\keert\\Downloads\\College AMS Project";

const icons = {
  brand: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>',
  dash: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>',
  students: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
  sessions: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>',
  attendance: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
  appearance: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>',
  avg: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>',
  logs: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>',
  studentsLg: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
  sessionsLg: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>',
  check: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
  cancel: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',
  lock: '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>',
  hash: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>',
  toastSuccess: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--status-success)"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
  toastError: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--status-danger)"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
  toastInfo: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--status-info)"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>',
  download: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>'
};

for (const f of filesToUpdate) {
  const p = path.join(basePath, f);
  if (fs.existsSync(p)) {
    let content = fs.readFileSync(p, 'utf8');

    // Title Changes
    content = content.replace(/<span class="brand-text">AttendAMS<\/span>/g, '<span class="brand-text">College Attendance</span>');
    content = content.replace(/<span class="brand-sub">Management System<\/span>/g, '<span class="brand-sub">Tracker</span>');
    
    // Icon Replacements (HTML)
    content = content.replace(/<div class="brand-icon">📋<\/div>/g, '<div class="brand-icon">' + icons.brand + '</div>');
    content = content.replace(/<div class="brand-icon"><\/div>/g, '<div class="brand-icon">' + icons.brand + '</div>');
    content = content.replace(/<span class="nav-icon">📊<\/span>/g, '<span class="nav-icon">' + icons.dash + '</span>');
    content = content.replace(/<span class="nav-icon">👤<\/span>/g, '<span class="nav-icon">' + icons.students + '</span>');
    content = content.replace(/<span class="nav-icon">📅<\/span>/g, '<span class="nav-icon">' + icons.sessions + '</span>');
    content = content.replace(/<span class="nav-icon">✅<\/span>/g, '<span class="nav-icon">' + icons.attendance + '</span>');
    content = content.replace(/<span>🌗<\/span>/g, '<span>' + icons.appearance + '</span>');
    
    // Dash Items (HTML)
    content = content.replace(/<div class="kpi-icon">👤<\/div>/g, '<div class="kpi-icon">' + icons.studentsLg + '</div>');
    content = content.replace(/<div class="kpi-icon">📅<\/div>/g, '<div class="kpi-icon">' + icons.sessionsLg + '</div>');
    content = content.replace(/<div class="kpi-icon">📈<\/div>/g, '<div class="kpi-icon">' + icons.avg + '</div>');
    content = content.replace(/<div class="kpi-icon">📝<\/div>/g, '<div class="kpi-icon">' + icons.logs + '</div>');

    // Download icon in Dash
    content = content.replace(/⬇ Export CSV/g, icons.download + ' Export CSV');
    
    // JS Replacements
    content = content.replace(/<div class="empty-icon">📊<\/div>/g, '<div class="empty-icon">' + icons.dash + '</div>');
    content = content.replace(/<div class="empty-icon">✅<\/div>/g, '<div class="empty-icon">' + icons.check + '</div>');
    content = content.replace(/<div class="empty-icon">📋<\/div>/g, '<div class="empty-icon">' + icons.brand + '</div>');
    content = content.replace(/<div class="empty-icon">👤<\/div>/g, '<div class="empty-icon">' + icons.studentsLg + '</div>');
    content = content.replace(/✕<\/button>/g, icons.cancel + '</button>');
    content = content.replace(/<div class="empty-icon">📅<\/div>/g, '<div class="empty-icon">' + icons.sessionsLg + '</div>');
    content = content.replace(/<div class="empty-icon">📝<\/div>/g, '<div class="empty-icon">' + icons.logs + '</div>');
    content = content.replace(/<div class="denied-icon">🔒<\/div>/g, '<div class="denied-icon">' + icons.lock + '</div>');
    content = content.replace(/<span class="hash-icon">🔐<\/span>/g, '<span class="hash-icon">' + icons.hash + '</span>');
    
    // Toast Icons in app.js
    content = content.replace(/success: '✓',/g, "success: '" + icons.toastSuccess + "',");
    content = content.replace(/error: '✕',/g, "error: '" + icons.toastError + "',");
    content = content.replace(/info: 'ℹ'/g, "info: '" + icons.toastInfo + "'");
    
    fs.writeFileSync(p, content, 'utf8');
  }
}
