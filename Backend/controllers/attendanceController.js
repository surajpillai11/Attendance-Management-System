const Attendance = require('../models/Attendance');
const User = require('../models/User');

// @desc    Mark attendance
// @route   POST /api/attendance/mark
// @access  Private (Teacher only)
exports.markAttendance = async (req, res) => {
  try {
    const { studentId, course, date, status, remarks } = req.body;

    // Validation
    if (!studentId || !course || !date || !status) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Check if student exists
    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Check if attendance already marked for this date and course
    const existingAttendance = await Attendance.findOne({
      student: studentId,
      course,
      date: new Date(date).setHours(0, 0, 0, 0)
    });

    if (existingAttendance) {
      // Update existing attendance
      existingAttendance.status = status;
      existingAttendance.remarks = remarks;
      existingAttendance.markedBy = req.user._id;
      await existingAttendance.save();

      return res.json({
        message: 'Attendance updated successfully',
        attendance: existingAttendance
      });
    }

    // Create new attendance record
    const attendance = await Attendance.create({
      student: studentId,
      course,
      date: new Date(date),
      status,
      remarks,
      markedBy: req.user._id
    });

    res.status(201).json({
      message: 'Attendance marked successfully',
      attendance
    });
  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get attendance records
// @route   GET /api/attendance/records
// @access  Private (Teacher only)
exports.getAttendanceRecords = async (req, res) => {
  try {
    const { course, startDate, endDate, studentId } = req.query;

    let query = {};

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
    console.error('Get attendance records error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get student's own attendance
// @route   GET /api/attendance/my-attendance
// @access  Private (Student only)
exports.getMyAttendance = async (req, res) => {
  try {
    const { course, startDate, endDate } = req.query;

    let query = { student: req.user._id };

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
    console.error('Get my attendance error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get attendance statistics
// @route   GET /api/attendance/statistics
// @access  Private
exports.getStatistics = async (req, res) => {
  try {
    const { studentId, course } = req.query;

    // Determine which student to get stats for
    const targetStudentId = req.user.role === 'teacher' && studentId 
      ? studentId 
      : req.user._id;

    let query = { student: targetStudentId };
    if (course) query.course = course;

    const records = await Attendance.find(query);

    const stats = {
      total: records.length,
      present: records.filter(r => r.status === 'present').length,
      absent: records.filter(r => r.status === 'absent').length,
      late: records.filter(r => r.status === 'late').length
    };

    stats.presentPercentage = stats.total > 0 
      ? ((stats.present / stats.total) * 100).toFixed(2) 
      : 0;

    // Get course-wise statistics
    const courseStats = {};
    records.forEach(record => {
      if (!courseStats[record.course]) {
        courseStats[record.course] = {
          total: 0,
          present: 0,
          absent: 0,
          late: 0
        };
      }
      courseStats[record.course].total++;
      courseStats[record.course][record.status]++;
    });

    // Calculate percentages for each course
    Object.keys(courseStats).forEach(course => {
      const cs = courseStats[course];
      cs.presentPercentage = cs.total > 0 
        ? ((cs.present / cs.total) * 100).toFixed(2) 
        : 0;
    });

    res.json({
      overall: stats,
      byCourse: courseStats
    });
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all students
// @route   GET /api/attendance/students
// @access  Private (Teacher only)
exports.getStudents = async (req, res) => {
  try {
    const students = await User.find({ role: 'student' })
      .select('-password')
      .sort({ name: 1 });

    res.json(students);
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};