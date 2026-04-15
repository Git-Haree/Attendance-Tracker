const express = require('express');
const router  = express.Router();
const db      = require('../config/db');

// GET /api/reports/summary — Per-student attendance percentage
router.get('/summary', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        s.student_id,
        s.full_name,
        s.department,
        s.semester,
        COUNT(al.log_id) AS sessions_attended,
        total.total_sessions,
        ROUND((COUNT(al.log_id) / total.total_sessions) * 100, 1) AS attendance_pct
      FROM Students s
      CROSS JOIN (SELECT COUNT(*) AS total_sessions FROM Sessions) total
      LEFT JOIN Attendance_Logs al
        ON s.student_id = al.student_id AND al.status IN ('present', 'late')
      GROUP BY s.student_id, s.full_name, s.department, s.semester, total.total_sessions
      ORDER BY attendance_pct ASC
    `);

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('GET /reports/summary error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to generate summary' });
  }
});

// GET /api/reports/below-threshold?pct=75 — Students below threshold
router.get('/below-threshold', async (req, res) => {
  try {
    const threshold = parseFloat(req.query.pct) || 75;

    const [rows] = await db.query(`
      SELECT
        s.student_id,
        s.full_name,
        s.department,
        s.semester,
        COUNT(al.log_id) AS sessions_attended,
        total.total_sessions,
        ROUND((COUNT(al.log_id) / total.total_sessions) * 100, 1) AS attendance_pct
      FROM Students s
      CROSS JOIN (SELECT COUNT(*) AS total_sessions FROM Sessions) total
      LEFT JOIN Attendance_Logs al
        ON s.student_id = al.student_id AND al.status IN ('present', 'late')
      GROUP BY s.student_id, s.full_name, s.department, s.semester, total.total_sessions
      HAVING attendance_pct < ?
      ORDER BY attendance_pct ASC
    `, [threshold]);

    res.json({ success: true, data: rows, threshold });
  } catch (err) {
    console.error('GET /reports/below-threshold error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch low-attendance students' });
  }
});

// GET /api/reports/weekly-trends — Weekly attendance counts for chart
router.get('/weekly-trends', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        YEARWEEK(se.session_date, 1) AS year_week,
        MIN(se.session_date) AS week_start,
        COUNT(DISTINCT se.session_id) AS total_sessions,
        COUNT(CASE WHEN al.status IN ('present', 'late') THEN 1 END) AS present_count,
        COUNT(CASE WHEN al.status = 'absent' THEN 1 END) AS absent_count
      FROM Sessions se
      LEFT JOIN Attendance_Logs al ON se.session_id = al.session_id
      GROUP BY YEARWEEK(se.session_date, 1)
      ORDER BY year_week DESC
      LIMIT 12
    `);

    res.json({ success: true, data: rows.reverse() });
  } catch (err) {
    console.error('GET /reports/weekly-trends error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch weekly trends' });
  }
});

// GET /api/reports/stats — Dashboard KPI stats
router.get('/stats', async (req, res) => {
  try {
    const [[studentCount]] = await db.query('SELECT COUNT(*) AS count FROM Students');
    const [[sessionCount]] = await db.query('SELECT COUNT(*) AS count FROM Sessions');
    const [[logCount]]     = await db.query('SELECT COUNT(*) AS count FROM Attendance_Logs');

    const [[avgAttendance]] = await db.query(`
      SELECT ROUND(AVG(pct), 1) AS avg_pct FROM (
        SELECT
          (COUNT(al.log_id) / total.total_sessions) * 100 AS pct
        FROM Students s
        CROSS JOIN (SELECT COUNT(*) AS total_sessions FROM Sessions) total
        LEFT JOIN Attendance_Logs al
          ON s.student_id = al.student_id AND al.status IN ('present', 'late')
        WHERE total.total_sessions > 0
        GROUP BY s.student_id, total.total_sessions
      ) sub
    `);

    res.json({
      success: true,
      data: {
        total_students:  studentCount.count,
        total_sessions:  sessionCount.count,
        total_logs:      logCount.count,
        avg_attendance:  avgAttendance.avg_pct || 0
      }
    });
  } catch (err) {
    console.error('GET /reports/stats error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch stats' });
  }
});

module.exports = router;
