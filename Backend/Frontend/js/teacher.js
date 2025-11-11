document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    const user = JSON.parse(localStorage.getItem('user'));
    if (user.role !== 'teacher') {
        alert('Access Denied');
        localStorage.clear();
        window.location.href = 'index.html';
        return;
    }

    // Common elements
    const userNameSpan = document.getElementById('user-name');
    const logoutBtn = document.getElementById('logout-btn');
    userNameSpan.textContent = `Welcome, ${user.name}`;

    logoutBtn.addEventListener('click', () => {
        localStorage.clear();
        window.location.href = 'index.html';
    });
    
    // API URL
    const API_URL = 'http://localhost:5000/api/attendance';
    const authHeader = { 'Authorization': `Bearer ${token}` };

    // Mark Attendance Tab
    const markDateInput = document.getElementById('mark-date');
    const markCourseInput = document.getElementById('mark-course');
    const loadStudentsBtn = document.getElementById('load-students-btn');
    const studentListContainer = document.getElementById('student-list-container');
    const submitAttendanceBtn = document.getElementById('submit-attendance-btn');
    
    // Set date to today by default
    markDateInput.valueAsDate = new Date();

    let loadedStudents = [];

    loadStudentsBtn.addEventListener('click', async () => {
        try {
            const res = await fetch(`${API_URL}/students`, { headers: authHeader });
            if (!res.ok) throw new Error('Failed to load students');
            
            const students = await res.json();
            loadedStudents = students;
            renderStudentList(students);
            submitAttendanceBtn.classList.remove('hidden');
        } catch (error) {
            alert(error.message);
        }
    });

    const renderStudentList = (students) => {
        studentListContainer.innerHTML = '';
        students.forEach(student => {
            const studentRow = document.createElement('div');
            studentRow.className = 'student-row';
            studentRow.dataset.studentId = student._id;
            studentRow.innerHTML = `
                <div class="student-info">${student.name} (${student.studentId || 'N/A'})</div>
                <div class="attendance-options">
                    <select class="attendance-status">
                        <option value="present">Present</option>
                        <option value="absent">Absent</option>
                        <option value="late">Late</option>
                    </select>
                </div>
            `;
            studentListContainer.appendChild(studentRow);
        });
    };

    submitAttendanceBtn.addEventListener('click', async () => {
        const date = markDateInput.value;
        const course = markCourseInput.value;

        if (!date || !course) {
            alert('Please select a date and enter a course name.');
            return;
        }

        const attendanceData = [];
        const studentRows = document.querySelectorAll('.student-row');
        studentRows.forEach(row => {
            attendanceData.push({
                studentId: row.dataset.studentId,
                course,
                date,
                status: row.querySelector('.attendance-status').value,
            });
        });

        try {
            for (const data of attendanceData) {
                await fetch(`${API_URL}/mark`, {
                    method: 'POST',
                    headers: { ...authHeader, 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });
            }
            alert('Attendance submitted successfully!');
            studentListContainer.innerHTML = '';
            submitAttendanceBtn.classList.add('hidden');

        } catch (error) {
            alert('Failed to submit attendance. ' + error.message);
        }
    });

    // View Records Tab
    const filterRecordsForm = document.getElementById('filter-records-form');
    const recordsTbody = document.getElementById('records-tbody');
    const filterStudentSelect = document.getElementById('filter-student');

    const populateStudentFilter = async () => {
        try {
            const res = await fetch(`${API_URL}/students`, { headers: authHeader });
            const students = await res.json();
            students.forEach(student => {
                const option = document.createElement('option');
                option.value = student._id;
                option.textContent = `${student.name} (${student.studentId || 'N/A'})`;
                filterStudentSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Failed to populate student filter:', error);
        }
    };

    filterRecordsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const studentId = filterStudentSelect.value;
        const course = document.getElementById('filter-course').value;
        const startDate = document.getElementById('filter-start-date').value;
        const endDate = document.getElementById('filter-end-date').value;

        let query = new URLSearchParams();
        if (studentId) query.append('studentId', studentId);
        if (course) query.append('course', course);
        if (startDate) query.append('startDate', startDate);
        if (endDate) query.append('endDate', endDate);

        try {
            const res = await fetch(`${API_URL}/records?${query.toString()}`, { headers: authHeader });
            const records = await res.json();
            renderRecordsTable(records);
        } catch (error) {
            alert('Failed to fetch records. ' + error.message);
        }
    });

    const renderRecordsTable = (records) => {
        recordsTbody.innerHTML = '';
        if (records.length === 0) {
            recordsTbody.innerHTML = `<tr><td colspan="6">No records found.</td></tr>`;
            return;
        }
        records.forEach(record => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${record.student.name}</td>
                <td>${record.student.studentId || 'N/A'}</td>
                <td>${record.course}</td>
                <td>${new Date(record.date).toLocaleDateString()}</td>
                <td class="status-${record.status}">${record.status.charAt(0).toUpperCase() + record.status.slice(1)}</td>
                <td>${record.remarks || ''}</td>
            `;
            recordsTbody.appendChild(row);
        });
    };

    // Statistics Tab
    const statsFilterForm = document.getElementById('stats-filter-form');
    const statsStudentSelect = document.getElementById('stats-student');
    const statsResultsContainer = document.getElementById('stats-results');
    const statsStudentName = document.getElementById('stats-student-name');
    const overallStatsGrid = document.getElementById('overall-stats-grid');
    const courseStatsGrid = document.getElementById('course-stats-grid');

    const populateStatsStudentFilter = async () => {
        try {
            const res = await fetch(`${API_URL}/students`, { headers: authHeader });
            const students = await res.json();
            students.forEach(student => {
                const option = document.createElement('option');
                option.value = student._id;
                option.textContent = `${student.name} (${student.studentId || 'N/A'})`;
                statsStudentSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Failed to populate stats student filter:', error);
        }
    };
    
    statsFilterForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const studentId = statsStudentSelect.value;
        if (!studentId) {
            alert('Please select a student.');
            return;
        }

        const selectedStudentName = statsStudentSelect.options[statsStudentSelect.selectedIndex].text;

        try {
            const res = await fetch(`${API_URL}/statistics?studentId=${studentId}`, { headers: authHeader });
            const stats = await res.json();

            statsStudentName.textContent = `Statistics for ${selectedStudentName}`;
            renderStatistics(stats);
            statsResultsContainer.classList.remove('hidden');

        } catch (error) {
            alert('Failed to fetch statistics. ' + error.message);
        }
    });

    const renderStatistics = (stats) => {
        const { overall, byCourse } = stats;
        
        overallStatsGrid.innerHTML = `
            <div class="stat-card">
                <h4>Total Days</h4>
                <p>${overall.total}</p>
            </div>
            <div class="stat-card">
                <h4>Present</h4>
                <p>${overall.present}</p>
                <div class="percentage">${overall.presentPercentage}%</div>
                <div class="progress-bar-container">
                    <div class="progress-bar" style="width: ${overall.presentPercentage}%; background-color: #2ecc71;"></div>
                </div>
            </div>
            <div class="stat-card">
                <h4>Absent</h4>
                <p>${overall.absent}</p>
                 <div class="progress-bar-container">
                    <div class="progress-bar" style="width: ${(overall.absent / overall.total * 100) || 0}%; background-color: #e74c3c;"></div>
                </div>
            </div>
            <div class="stat-card">
                <h4>Late</h4>
                <p>${overall.late}</p>
                 <div class="progress-bar-container">
                    <div class="progress-bar" style="width: ${(overall.late / overall.total * 100) || 0}%; background-color: #f39c12;"></div>
                </div>
            </div>
        `;

        courseStatsGrid.innerHTML = '';
        if (Object.keys(byCourse).length === 0) {
            courseStatsGrid.innerHTML = '<p>No course-specific data available.</p>';
            return;
        }
        for (const course in byCourse) {
            const courseData = byCourse[course];
            const card = document.createElement('div');
            card.className = 'stat-card';
            card.innerHTML = `
                <h4>${course}</h4>
                <p>${courseData.present} / ${courseData.total}</p>
                <div class="percentage">${courseData.presentPercentage}% Present</div>
                 <div class="progress-bar-container">
                    <div class="progress-bar" style="width: ${courseData.presentPercentage}%;"></div>
                </div>
            `;
            courseStatsGrid.appendChild(card);
        }
    };

    // Initial data load
    populateStudentFilter();
    populateStatsStudentFilter();
    filterRecordsForm.dispatchEvent(new Event('submit')); // Load all records initially
});

// Tab switching logic
function openTab(evt, tabName) {
    let i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tab-content");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].classList.remove("active");
    }
    tablinks = document.getElementsByClassName("tab-link");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].classList.remove("active");
    }
    document.getElementById(tabName).classList.add("active");
    evt.currentTarget.classList.add("active");
}