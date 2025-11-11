document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const showRegisterLink = document.getElementById('show-register');
    const showLoginLink = document.getElementById('show-login');
    const loginContainer = document.getElementById('login-container');
    const registerContainer = document.getElementById('register-container');
    const errorMessage = document.getElementById('error-message');
    const roleSelect = document.getElementById('register-role');
    const studentFields = document.getElementById('student-fields');

    const API_URL = 'http://localhost:5000/api/auth';

    // Toggle between login and register forms
    showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginContainer.classList.add('hidden');
        registerContainer.classList.remove('hidden');
    });

    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        registerContainer.classList.add('hidden');
        loginContainer.classList.remove('hidden');
    });

    // Show student-specific fields when role = student
    roleSelect.addEventListener('change', () => {
        if (roleSelect.value === 'student') {
            studentFields.classList.remove('hidden');
            document.getElementById('register-student-id').required = true;
        } else {
            studentFields.classList.add('hidden');
            document.getElementById('register-student-id').required = false;
        }
    });

    // Login form submission
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorMessage.style.display = 'none';

        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        try {
            const res = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Failed to login');
            }

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data));

            // Redirect user based on role
            if (data.role === 'teacher') {
                window.location.href = 'teacher.html';
            } else {
                window.location.href = 'student.html';
            }
        } catch (error) {
            errorMessage.textContent = error.message;
            errorMessage.style.display = 'block';
        }
    });

    // Register form submission
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorMessage.style.display = 'none';

        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const role = document.getElementById('register-role').value;
        const studentId = document.getElementById('register-student-id').value;
        const department = document.getElementById('register-department').value;

        const userData = { name, email, password, role };

        if (role === 'student') {
            if (!studentId.trim()) {
                errorMessage.textContent = 'Student ID is required for students.';
                errorMessage.style.display = 'block';
                return;
            }
            userData.studentId = studentId.trim();
            userData.department = department;
        }

        try {
            const res = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Failed to register');
            }

            alert('Registration successful. Please login.');
            registerContainer.classList.add('hidden');
            loginContainer.classList.remove('hidden');
            loginForm.reset();
            registerForm.reset();
        } catch (error) {
            errorMessage.textContent = error.message;
            errorMessage.style.display = 'block';
        }
    });
});
