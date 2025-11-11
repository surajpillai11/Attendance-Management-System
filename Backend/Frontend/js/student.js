document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    const user = JSON.parse(localStorage.getItem('user'));
    if (user.role !== 'student') {
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

    // My Attendance Tab
    const myRecordsFilterForm = document.getElementById('my-records-filter-form');
    const myRecordsTbody = document.getElementById('my-records-tbody');

    const fetchMyRecords = async () => {
        const course = document.getElementById('my-filter-course').value;
        const startDate = document.getElementById('my-filter-start-date').value;
        const endDate = document.getElementById('my-filter-end-date').value;

        let query = new URLSearchParams();
        if (course) query.append('course', course);
        if (startDate) query.append('startDate', startDate);
        if (endDate) query.append('endDate', endDate);
        
        try {
            const res = await fetch(`${API_URL}/my-attendance?${query.toString()}`, { headers: authHeader });
            const records = await res.json();
            renderMyRecordsTable(records);
        } catch (error) {
            alert('Failed to fetch attendance records. ' + error.message);
        }
    };
    
    myRecordsFilterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        fetchMyRecords();
    });

    const renderMyRecordsTable = (records) => {
        myRecordsTbody.innerHTML = '';
        if (records.length === 0) {
            myRecordsTbody.innerHTML = `<tr><td colspan="5">No records found.</td></tr>`;
            return;
        }
        records.forEach(record => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${record.course}</td>
                <td>${new Date(record.date).toLocaleDateString()}</td>
                <td class="status-${record.status}">${record.status.charAt(0).toUpperCase() + record.status.slice(1)}</td>
                <td>${record.remarks || ''}</td>
                <td>${record.markedBy.name}</td>
            `;
            myRecordsTbody.appendChild(row);
        });
    };

    // My Statistics Tab
    const myOverallStatsGrid = document.getElementById('my-overall-stats-grid');
    const myCourseStatsGrid = document.getElementById('my-course-stats-grid');

    const fetchMyStatistics = async () => {
        try {
            const res = await fetch(`${API_URL}/statistics`, { headers: authHeader });
            const stats = await res.json();
            renderMyStatistics(stats);
        } catch (error) {
            alert('Failed to fetch statistics. ' + error.message);
        }
    };

    const renderMyStatistics = (stats) => {
        const { overall, byCourse } = stats;
        
        myOverallStatsGrid.innerHTML = `
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

        myCourseStatsGrid.innerHTML = '';
        if (Object.keys(byCourse).length === 0) {
            myCourseStatsGrid.innerHTML = '<p>No course-specific data available.</p>';
            return;
        }
        for (const course in byCourse) {
            const courseData = byCourse[course];
            const card = document.createElement('div');
            card.className = 'stat-card';
            card.innerHTML = `
                <h4>${course}</h4>
                <p>${courseData.present} / ${courseData.total} Days</p>
                <div class="percentage">${courseData.presentPercentage}% Present</div>
                 <div class="progress-bar-container">
                    <div class="progress-bar" style="width: ${courseData.presentPercentage}%;"></div>
                </div>
            `;
            myCourseStatsGrid.appendChild(card);
        }
    };

    // Initial data load
    fetchMyRecords();
    fetchMyStatistics();
});

// Tab switching logic (can be in a separate shared file later)
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