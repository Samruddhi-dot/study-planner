// ============================================================
// supabaseClient.js
// This file creates a connection to your Supabase database.
// Think of it as a "phone line" to your database.
// We import this file wherever we need to talk to the database.
// ============================================================

const { createClient } = require('@supabase/supabase-js');

// dotenv lets us read our secret keys from the .env file
require('dotenv').config();

// createClient() opens the connection using your project URL and API key
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

module.exports = supabase;
