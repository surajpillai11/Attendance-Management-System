const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');

dotenv.config();

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);

// Serve Frontend
const __dirname1 = path.resolve();
app.use(express.static(path.join(__dirname1, '/Frontend')));

// Catch-all route for non-API requests
app.get(/.*/, (req, res) => {
  res.sendFile(path.resolve(__dirname1, 'Frontend', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
