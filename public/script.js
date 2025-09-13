let sessionId = null;

// Function to show a specific section
function showSection(sectionId) {
    document.querySelectorAll("section").forEach(sec => sec.classList.add("hidden"));
    document.getElementById(sectionId).classList.remove("hidden");
}

// Function to handle login
function login() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                sessionId = data.sessionId;
                alert("Login successful!");
                updateNavbar(true);
                showSection('profile');
            } else {
                alert("Invalid credentials!");
            }
        })
        .catch(error => console.error("Error during login:", error));
}

// Function to handle registration
function register() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    fetch('/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert("Registration successful!");
            } else {
                alert("Registration failed: " + data.message);
            }
        })
        .catch(error => console.error("Error during registration:", error));
}

// Function to handle logout
function logout() {
    sessionId = null;
    updateNavbar(false);
    showSection('login');
}

// Function to update the navbar based on login status
function updateNavbar(isLoggedIn) {
    const navbar = document.getElementById('navbar');
    navbar.innerHTML = '';

    if (isLoggedIn) {
        navbar.innerHTML = `
            <button onclick="showSection('tutors'); fetchTutors()">Tutors</button>
            <button onclick="showSection('questions'); fetchQuestions()">Question Board</button>
            <button onclick="logout()">Logout</button>
        `;
    } else {
        navbar.innerHTML = `
            <button id="loginBtn" onclick="showSection('login')">Login</button>
        `;
    }
}

// Function to fetch all tutors
function fetchTutors() {
    fetch('/searchTutors', {
        headers: { 'X-Session-Id': sessionId }
    })
        .then(response => response.json())
        .then(data => {
            const tutorList = document.getElementById("tutorList");
            tutorList.innerHTML = "";
            data.forEach(tutor => {
                const li = document.createElement("li");
                li.innerHTML = `
                    <strong>${tutor.name}</strong> - ${tutor.subject} <br>
                    <a href="mailto:${tutor.email}">${tutor.email}</a>
                `;
                tutorList.appendChild(li);
            });
        })
        .catch(error => console.error("Error fetching tutors:", error));
}

// Function to search tutors
function searchTutors() {
    const query = document.getElementById("searchTutors").value;
    fetch(`/searchTutors?q=${query}`, {
        headers: { 'X-Session-Id': sessionId }
    })
        .then(response => response.json())
        .then(data => {
            const tutorList = document.getElementById("tutorList");
            tutorList.innerHTML = "";
            data.forEach(tutor => {
                const li = document.createElement("li");
                li.innerHTML = `
                    <strong>${tutor.name}</strong> - ${tutor.subject} <br>
                    <a href="mailto:${tutor.email}">${tutor.email}</a>
                `;
                tutorList.appendChild(li);
            });
        })
        .catch(error => console.error("Error searching tutors:", error));
}

// Function to add a new tutor
function addTutor() {
    const name = document.getElementById("tutorName").value;
    const subject = document.getElementById("tutorSubject").value;
    const email = document.getElementById("tutorEmail").value;

    if (!name || !subject || !email) {
        alert("Please fill out all fields.");
        return;
    }

    fetch('/addTutor', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Session-Id': sessionId
        },
        body: JSON.stringify({ name, subject, email })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert("You are now a tutor!");
                document.getElementById("tutorName").value = "";
                document.getElementById("tutorSubject").value = "";
                document.getElementById("tutorEmail").value = "";
                fetchTutors(); // Refresh tutor list
            } else {
                alert("Failed to add tutor: " + data.message);
            }
        })
        .catch(error => console.error("Error adding tutor:", error));
}

// Function to fetch all questions and answers
function fetchQuestions() {
    fetch('/questions', {
        headers: { 'X-Session-Id': sessionId }
    })
        .then(response => response.json())
        .then(data => {
            const questionList = document.getElementById("questionList");
            questionList.innerHTML = "";
            data.forEach(q => {
                const li = document.createElement("li");
                li.innerHTML = `
                    <p><strong>${q.user}:</strong> ${q.question}</p>
                    <textarea placeholder="Write your answer here..." id="answer-${q.id}"></textarea>
                    <button onclick="postAnswer(${q.id})">Post Answer</button>
                    <ul>
                        ${q.answers.map(a => `<li><strong>${a.user}:</strong> ${a.answer}</li>`).join('')}
                    </ul>
                `;
                questionList.appendChild(li);
            });
        })
        .catch(error => console.error("Error fetching questions:", error));
}

// Function to post a question
function postQuestion() {
    const question = document.getElementById("newQuestion").value;
    fetch('/postQuestion', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'X-Session-Id': sessionId
        },
        body: JSON.stringify({ question })
    })
        .then(() => {
            alert("Question posted!");
            document.getElementById("newQuestion").value = "";
            fetchQuestions(); // Refresh question list
        })
        .catch(error => console.error("Error posting question:", error));
}

// Function to post an answer to a question
function postAnswer(questionId) {
    const answer = document.getElementById(`answer-${questionId}`).value;
    fetch(`/postAnswer/${questionId}`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'X-Session-Id': sessionId
        },
        body: JSON.stringify({ answer })
    })
        .then(() => {
            alert("Answer posted!");
            fetchQuestions(); // Refresh question list
        })
        .catch(error => console.error("Error posting answer:", error));
}

// Initialize the app
updateNavbar(false);
showSection('login');
