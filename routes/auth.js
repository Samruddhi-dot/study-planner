// ============================================================
// routes/auth.js
// Handles: signup, login, Google OAuth, logout
// All auth is done by Supabase — we just call their functions.
// ============================================================

const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');

// ─────────────────────────────────────────────────────────────
// POST /auth/signup
// Creates a new user account with email + password
//
// Body: { "email": "user@example.com", "password": "secret123" }
// ─────────────────────────────────────────────────────────────
router.post('/signup', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    // Supabase creates the user and sends a confirmation email
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: 'Account created! Check your email to confirm your account.',
      user: { id: data.user.id, email: data.user.email }
    });

  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /auth/login
// Logs in with email + password, returns a session token
//
// Body: { "email": "user@example.com", "password": "secret123" }
// Response includes: access_token (use this in all future requests)
// ─────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) throw error;

    res.status(200).json({
      success: true,
      message: 'Logged in successfully!',
      token: data.session.access_token,   // Save this on the frontend
      user: { id: data.user.id, email: data.user.email }
    });

  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid email or password.' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /auth/google
// Returns the Google OAuth URL — frontend redirects user there
// ─────────────────────────────────────────────────────────────
router.get('/google', async (req, res) => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.APP_URL || 'http://localhost:3000'}/auth/callback`
      }
    });

    if (error) throw error;

    // Send the Google login URL back to the frontend
    res.status(200).json({ success: true, url: data.url });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /auth/me
// Returns the currently logged-in user's info
// Requires: Authorization: Bearer <token> header
// ─────────────────────────────────────────────────────────────
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ success: false, message: 'No token provided.' });

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) throw new Error('Invalid token');

    res.status(200).json({
      success: true,
      user: { id: user.id, email: user.email, created_at: user.created_at }
    });

  } catch (error) {
    res.status(401).json({ success: false, message: 'Not authenticated.' });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /auth/logout
// Logs out the current user (invalidates their session)
// ─────────────────────────────────────────────────────────────
router.post('/logout', async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    res.status(200).json({ success: true, message: 'Logged out successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
