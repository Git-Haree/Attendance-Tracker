const express = require('express');
const router  = express.Router();
const db      = require('../config/db');

// GET /api/students — List all students
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM Students ORDER BY created_at DESC'
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('GET /students error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch students' });
  }
});

// GET /api/students/:id — Single student
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM Students WHERE student_id = ?',
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('GET /students/:id error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch student' });
  }
});

// POST /api/students — Add a new student
router.post('/', async (req, res) => {
  try {
    const { student_id, full_name, department, semester, email } = req.body;

    if (!student_id || !full_name || !department || !semester || !email) {
      return res.status(400).json({ success: false, error: 'All fields are required' });
    }

    await db.query(
      `INSERT INTO Students (student_id, full_name, department, semester, email)
       VALUES (?, ?, ?, ?, ?)`,
      [student_id, full_name, department, parseInt(semester), email]
    );

    res.status(201).json({ success: true, message: 'Student added successfully' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, error: 'Student ID or email already exists' });
    }
    console.error('POST /students error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to add student' });
  }
});

// DELETE /api/students/:id — Remove a student
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await db.query(
      'DELETE FROM Students WHERE student_id = ?',
      [req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }
    res.json({ success: true, message: 'Student deleted' });
  } catch (err) {
    console.error('DELETE /students/:id error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to delete student' });
  }
});

module.exports = router;
