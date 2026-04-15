const express       = require('express');
const crypto        = require('crypto');
const router        = express.Router();
const db            = require('../config/db');
const networkGuard  = require('../middleware/networkGuard');

// POST /api/attendance/mark — Mark attendance (protected by network guard)
router.post('/mark', networkGuard, async (req, res) => {
  try {
    const { student_id, session_id, status } = req.body;

    if (!student_id || !session_id) {
      return res.status(400).json({ success: false, error: 'student_id and session_id are required' });
    }

    const attendanceStatus = status || 'present';
    const clientIp = req.clientIp || 'unknown';

    // Application-level duplicate check (DB also enforces via UNIQUE key)
    const [existing] = await db.query(
      'SELECT log_id FROM Attendance_Logs WHERE student_id = ? AND session_id = ?',
      [student_id, session_id]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Duplicate entry',
        message: `Attendance already recorded for student ${student_id} in session ${session_id}`
      });
    }

    // Generate cryptographic timestamp hash
    const now = new Date();
    const hashInput = `${student_id}:${session_id}:${now.toISOString()}`;
    const timestampHash = crypto
      .createHash('sha256')
      .update(hashInput)
      .digest('hex');

    await db.query(
      `INSERT INTO Attendance_Logs (student_id, session_id, status, marked_at, timestamp_hash, client_ip)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [student_id, session_id, attendanceStatus, now, timestampHash, clientIp]
    );

    res.status(201).json({
      success: true,
      message: 'Attendance marked successfully',
      data: {
        student_id,
        session_id,
        status: attendanceStatus,
        marked_at: now.toISOString(),
        timestamp_hash: timestampHash,
        client_ip: clientIp
      }
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        error: 'Duplicate entry',
        message: 'Attendance already recorded for this student in this session'
      });
    }
    console.error('POST /attendance/mark error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to mark attendance' });
  }
});

// POST /api/attendance/mark-bulk — Mark attendance for multiple students
router.post('/mark-bulk', networkGuard, async (req, res) => {
  try {
    const { session_id, entries } = req.body;

    if (!session_id || !entries || !Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'session_id and a non-empty entries array are required'
      });
    }

    const clientIp = req.clientIp || 'unknown';
    const results = [];
    let successCount = 0;
    let skipCount = 0;

    for (const entry of entries) {
      const { student_id, status } = entry;
      const attendanceStatus = status || 'present';

      // Check for existing entry
      const [existing] = await db.query(
        'SELECT log_id FROM Attendance_Logs WHERE student_id = ? AND session_id = ?',
        [student_id, session_id]
      );

      if (existing.length > 0) {
        results.push({ student_id, status: 'skipped', reason: 'Already marked' });
        skipCount++;
        continue;
      }

      const now = new Date();
      const hashInput = `${student_id}:${session_id}:${now.toISOString()}`;
      const timestampHash = crypto.createHash('sha256').update(hashInput).digest('hex');

      await db.query(
        `INSERT INTO Attendance_Logs (student_id, session_id, status, marked_at, timestamp_hash, client_ip)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [student_id, session_id, attendanceStatus, now, timestampHash, clientIp]
      );

      results.push({ student_id, status: 'recorded', timestamp_hash: timestampHash });
      successCount++;
    }

    res.status(201).json({
      success: true,
      message: `${successCount} recorded, ${skipCount} skipped`,
      data: results
    });
  } catch (err) {
    console.error('POST /attendance/mark-bulk error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to mark bulk attendance' });
  }
});

// GET /api/attendance/logs — Retrieve attendance logs
router.get('/logs', async (req, res) => {
  try {
    const { session_id, student_id } = req.query;
    let query = `
      SELECT al.*, s.full_name, s.department, se.subject_name, se.session_date
      FROM Attendance_Logs al
      JOIN Students s ON al.student_id = s.student_id
      JOIN Sessions se ON al.session_id = se.session_id
    `;
    const params = [];
    const conditions = [];

    if (session_id) {
      conditions.push('al.session_id = ?');
      params.push(session_id);
    }
    if (student_id) {
      conditions.push('al.student_id = ?');
      params.push(student_id);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY al.marked_at DESC';

    const [rows] = await db.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('GET /attendance/logs error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch logs' });
  }
});

module.exports = router;
