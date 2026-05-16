// ============================================================
// server.js  ← This is the HEART of your app.
// It starts the web server and connects all the routes.
// Run this file with: node server.js
// ============================================================

// Load environment variables from .env FIRST (before anything else)
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

// Create the Express app
const app = express();

// ─────────────────────────────────────────────────────────────
// MIDDLEWARE
// Middleware = code that runs on EVERY request before your routes.
// Think of it as security guards at a door.
// ─────────────────────────────────────────────────────────────

// cors() allows your frontend (running on a different port) to talk to this server
app.use(cors());

// express.json() lets Express read JSON data sent in request bodies
app.use(express.json());

// Serve static files (HTML, CSS, JS) from the "public" folder
app.use(express.static(path.join(__dirname, 'public')));

// ─────────────────────────────────────────────────────────────
// ROUTES
// This connects our tasks routes file.
// Any URL starting with /tasks will be handled by routes/tasks.js
// ─────────────────────────────────────────────────────────────
const taskRoutes = require('./routes/tasks');
app.use('/tasks', taskRoutes);
const authRoutes = require('./routes/auth');
app.use('/auth', authRoutes);

// ─────────────────────────────────────────────────────────────
// ROOT ROUTE — sends the frontend HTML page
// ─────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/signin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'signin.html'));
});

// ─────────────────────────────────────────────────────────────
// 404 HANDLER — runs if no route matched the request
// ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found.' });
});

// ─────────────────────────────────────────────────────────────
// START SERVER
// process.env.PORT reads the port from .env (defaults to 3000)
// ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 Study Planner server running at: http://localhost:${PORT}`);
  console.log(`📚 API Endpoints:`);
  console.log(`   GET    http://localhost:${PORT}/tasks`);
  console.log(`   POST   http://localhost:${PORT}/tasks`);
  console.log(`   PUT    http://localhost:${PORT}/tasks/:id`);
  console.log(`   DELETE http://localhost:${PORT}/tasks/:id\n`);
});
