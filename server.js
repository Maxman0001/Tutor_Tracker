const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');

const app = express();
app.use(express.static('public'));
app.use(bodyParser.json());

const sessions = {}; // In-memory session storage

// File paths
const USERS_FILE = 'users.txt';
const QUESTIONS_FILE = 'questions.txt';
const TUTORS_FILE = 'tutors.txt';

// Helper functions for file operations
function readFile(filePath) {
    return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf-8').split('\n').filter(Boolean) : [];
}

function writeFile(filePath, data) {
    fs.writeFileSync(filePath, data.join('\n') + '\n', 'utf-8');
}

// Middleware for authentication
function authenticate(req, res, next) {
    const sessionId = req.headers['x-session-id'];
    if (!sessionId || !sessions[sessionId]) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    req.user = sessions[sessionId]; // Attach user to request object
    next();
}

// Route: Register User
app.post('/register', (req, res) => {
    const { username, password } = req.body;
    const users = readFile(USERS_FILE);

    if (users.find(user => user.startsWith(username + ':'))) {
        return res.status(400).json({ success: false, message: 'User already exists' });
    }

    users.push(`${username}:${password}`);
    writeFile(USERS_FILE, users);
    res.json({ success: true });
});

// Route: Login User
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const users = readFile(USERS_FILE);

    if (users.find(user => user === `${username}:${password}`)) {
        const sessionId = `${username}-${Date.now()}`;
        sessions[sessionId] = username; // Save session
        res.json({ success: true, sessionId });
    } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});

// Route: Fetch All Tutors
app.get('/searchTutors', authenticate, (req, res) => {
    const query = req.query.q?.toLowerCase() || '';
    const tutors = readFile(TUTORS_FILE)
        .map(line => {
            const [name, subject, email] = line.split(':');
            return { name, subject, email };
        })
        .filter(tutor => 
            tutor.name.toLowerCase().includes(query) || 
            tutor.subject.toLowerCase().includes(query) || 
            tutor.email.toLowerCase().includes(query)
        );

    res.json(tutors);
});

// Route: Add a New Tutor
app.post('/addTutor', authenticate, (req, res) => {
    const { name, subject, email } = req.body;
    if (!name || !subject || !email) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const tutors = readFile(TUTORS_FILE);
    tutors.push(`${name}:${subject}:${email}`);
    writeFile(TUTORS_FILE, tutors);

    res.json({ success: true });
});

// Route: Fetch All Questions and Answers
app.get('/questions', authenticate, (req, res) => {
    const questions = readFile(QUESTIONS_FILE)
        .map((line, index) => {
            const [user, question, ...answers] = line.split('|');
            const parsedAnswers = answers.map(a => {
                const [answerUser, answerText] = a.split('>>');
                return { user: answerUser, answer: answerText };
            });
            return {
                id: index + 1,
                user,
                question,
                answers: parsedAnswers
            };
        });

    res.json(questions);
});

// Route: Post a Question
app.post('/postQuestion', authenticate, (req, res) => {
    const { question } = req.body;
    const questions = readFile(QUESTIONS_FILE);

    questions.push(`${req.user}|${question}`);
    writeFile(QUESTIONS_FILE, questions);
    res.json({ success: true });
});

// Route: Post an Answer
app.post('/postAnswer/:id', authenticate, (req, res) => {
    const { id } = req.params;
    const { answer } = req.body;
    const questions = readFile(QUESTIONS_FILE);

    const questionIndex = parseInt(id) - 1;
    if (questionIndex >= 0 && questionIndex < questions.length) {
        const parts = questions[questionIndex].split('|');
        parts.push(`${req.user}>>${answer}`);
        questions[questionIndex] = parts.join('|');
        writeFile(QUESTIONS_FILE, questions);
        res.json({ success: true });
    } else {
        res.status(404).json({ success: false, message: 'Question not found' });
    }
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
