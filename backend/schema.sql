-- ============================================================
-- College Attendance Management System — Database Schema
-- Run this script against your MySQL database to create
-- all required tables.
-- ============================================================

CREATE DATABASE IF NOT EXISTS college_ams;
USE college_ams;

-- -----------------------------------------------------------
-- Students
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS Students (
    student_id    VARCHAR(20)   PRIMARY KEY,
    full_name     VARCHAR(100)  NOT NULL,
    department    VARCHAR(50)   NOT NULL,
    semester      TINYINT       NOT NULL CHECK (semester BETWEEN 1 AND 8),
    email         VARCHAR(100)  UNIQUE NOT NULL,
    created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------
-- Sessions (lectures / labs / tutorials)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS Sessions (
    session_id    INT            AUTO_INCREMENT PRIMARY KEY,
    subject_name  VARCHAR(100)   NOT NULL,
    faculty_name  VARCHAR(100)   NOT NULL,
    session_date  DATE           NOT NULL,
    session_time  TIME           NOT NULL,
    created_at    TIMESTAMP      DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------
-- Attendance Logs
--   • UNIQUE(student_id, session_id) prevents duplicates
--   • timestamp_hash stores SHA-256 of student+session+time
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS Attendance_Logs (
    log_id          INT            AUTO_INCREMENT PRIMARY KEY,
    student_id      VARCHAR(20)    NOT NULL,
    session_id      INT            NOT NULL,
    status          ENUM('present', 'absent', 'late') NOT NULL DEFAULT 'present',
    marked_at       TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
    timestamp_hash  VARCHAR(64)    NOT NULL,
    client_ip       VARCHAR(45),

    UNIQUE KEY unique_attendance (student_id, session_id),

    CONSTRAINT fk_attendance_student
        FOREIGN KEY (student_id) REFERENCES Students(student_id) ON DELETE CASCADE,

    CONSTRAINT fk_attendance_session
        FOREIGN KEY (session_id) REFERENCES Sessions(session_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
