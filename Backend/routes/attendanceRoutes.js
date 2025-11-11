const express = require('express');
const router = express.Router();
const {
  markAttendance,
  getAttendanceRecords,
  getMyAttendance,
  getStatistics,
  getStudents
} = require('../controllers/attendanceController');
const { protect, teacherOnly, studentOnly } = require('../middleware/authMiddleware');

router.post('/mark', protect, teacherOnly, markAttendance);
router.get('/records', protect, teacherOnly, getAttendanceRecords);
router.get('/my-attendance', protect, studentOnly, getMyAttendance);
router.get('/statistics', protect, getStatistics);
router.get('/students', protect, teacherOnly, getStudents);

module.exports = router;