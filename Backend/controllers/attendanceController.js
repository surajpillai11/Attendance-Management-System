const Attendance = require('../models/Attendance');
const User = require('../models/User');

// Mark attendance
// POST /api/attendance/mark
// Private (Teacher only)
exports.markAttendance = async (req, res) => {
  try {
    const { studentId, course, date, status, remarks } = req.body;

    if (!studentId || !course || !date || !status) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ message: 'Student not found' });
    }

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const existingAttendance = await Attendance.findOne({
      student: studentId,
      course,
      date: targetDate
    });

    if (existingAttendance) {
      existingAttendance.status = status;
      existingAttendance.remarks = remarks || '';
      existingAttendance.markedBy = req.user._id;
      await existingAttendance.save();

      return res.json({
        message: 'Attendance updated successfully',
        attendance: existingAttendance
      });
    }

    const attendance = await Attendance.create({
      student: studentId,
      course,
      date: targetDate,
      status,
      remarks: remarks || '',
      markedBy: req.user._id
    });

    res.status(201).json({
      message: 'Attendance marked successfully',
      attendance
    });
  } catch (error) {
    console.error('Mark attendance error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get attendance records (teacher view)
// GET /api/attendance/records
// Private (Teacher only)
exports.getAttendanceRecords = async (req, res) => {
  try {
    const { course, startDate, endDate, studentId } = req.query;
    const query = {};

    if (course) query.course = course;
    if (studentId) query.student = studentId;

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const records = await Attendance.find(query)
      .populate('student', 'name email studentId department')
      .populate('markedBy', 'name')
      .sort({ date: -1 });

    res.json(records);
  } catch (error) {
    console.error('Get attendance records error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get student's own attendance
// GET /api/attendance/my-attendance
// Private (Student only)
exports.getMyAttendance = async (req, res) => {
  try {
    const { course, startDate, endDate } = req.query;
    const query = { student: req.user._id };

    if (course) query.course = course;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const records = await Attendance.find(query)
      .populate('markedBy', 'name')
      .sort({ date: -1 });

    res.json(records);
  } catch (error) {
    console.error('Get my attendance error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get attendance statistics
// GET /api/attendance/statistics
// Private
exports.getStatistics = async (req, res) => {
  try {
    const { studentId, course } = req.query;

    const targetStudentId =
      req.user.role === 'teacher' && studentId ? studentId : req.user._id;

    const query = { student: targetStudentId };
    if (course) query.course = course;

    const records = await Attendance.find(query);

    const stats = {
      total: records.length,
      present: records.filter(r => r.status === 'present').length,
      absent: records.filter(r => r.status === 'absent').length,
      late: records.filter(r => r.status === 'late').length
    };

    stats.presentPercentage =
      stats.total > 0 ? ((stats.present / stats.total) * 100).toFixed(2) : 0;

    const courseStats = {};
    for (const record of records) {
      if (!courseStats[record.course]) {
        courseStats[record.course] = { total: 0, present: 0, absent: 0, late: 0 };
      }
      courseStats[record.course].total++;
      courseStats[record.course][record.status]++;
    }

    for (const courseName of Object.keys(courseStats)) {
      const c = courseStats[courseName];
      c.presentPercentage =
        c.total > 0 ? ((c.present / c.total) * 100).toFixed(2) : 0;
    }

    res.json({ overall: stats, byCourse: courseStats });
  } catch (error) {
    console.error('Get statistics error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all students
// GET /api/attendance/students
// Private (Teacher only)
exports.getStudents = async (req, res) => {
  try {
    const students = await User.find({ role: 'student' })
      .select('-password')
      .sort({ name: 1 });

    res.json(students);
  } catch (error) {
    console.error('Get students error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};
