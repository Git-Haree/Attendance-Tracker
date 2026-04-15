const express = require('express');
const router  = express.Router();
const db      = require('../config/db');

// GET /api/sessions — List all sessions
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM Sessions ORDER BY session_date DESC, session_time DESC'
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('GET /sessions error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch sessions' });
  }
});

// GET /api/sessions/:id — Single session
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM Sessions WHERE session_id = ?',
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('GET /sessions/:id error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch session' });
  }
});

// POST /api/sessions — Create a new session
router.post('/', async (req, res) => {
  try {
    const { subject_name, faculty_name, session_date, session_time } = req.body;

    if (!subject_name || !faculty_name || !session_date || !session_time) {
      return res.status(400).json({ success: false, error: 'All fields are required' });
    }

    const [result] = await db.query(
      `INSERT INTO Sessions (subject_name, faculty_name, session_date, session_time)
       VALUES (?, ?, ?, ?)`,
      [subject_name, faculty_name, session_date, session_time]
    );

    res.status(201).json({
      success: true,
      message: 'Session created successfully',
      session_id: result.insertId
    });
  } catch (err) {
    console.error('POST /sessions error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to create session' });
  }
});

// DELETE /api/sessions/:id — Remove a session
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await db.query(
      'DELETE FROM Sessions WHERE session_id = ?',
      [req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }
    res.json({ success: true, message: 'Session deleted' });
  } catch (err) {
    console.error('DELETE /sessions/:id error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to delete session' });
  }
});

module.exports = router;
