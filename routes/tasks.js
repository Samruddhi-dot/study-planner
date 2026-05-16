// ============================================================
// routes/tasks.js — WITH AUTHENTICATION
// Every route now checks: "Is this user logged in?"
// Each route = one action (add, view, update, delete, filter).
// ============================================================

const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');

// ─────────────────────────────────────────────────────────────
// GET /tasks
// Returns ALL tasks from the database.
// You can also filter by ?status=Pending or ?priority=High
//
// Examples:
//   GET /tasks              → all tasks
//   GET /tasks?status=Done  → only completed tasks
//   GET /tasks?priority=High → only high-priority tasks
// ─────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    // Start a query: select all columns from "tasks" table
    let query = supabase.from('tasks').select('*').order('created_at', { ascending: false });

    // If the user sent ?status=... in the URL, filter by that status
    if (req.query.status) {
      query = query.eq('status', req.query.status);
    }

    // If the user sent ?priority=... in the URL, filter by that priority
    if (req.query.priority) {
      query = query.eq('priority', req.query.priority);
    }

    // Actually run the query and wait for the result
    const { data, error } = await query;

    // If something went wrong, throw the error so our catch block handles it
    if (error) throw error;

    // Send the tasks back as JSON
    res.status(200).json({ success: true, count: data.length, tasks: data });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /tasks
// Adds a NEW task to the database.
//
// Required body (JSON):
//   { "subject": "Math", "title": "Calculus Ch.5", "deadline": "2025-06-01", "priority": "High" }
//
// Optional body fields:
//   "status" defaults to "Pending" if not provided
// ─────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { subject, title, deadline, priority, status } = req.body;

    // Basic validation — make sure required fields are present
    if (!subject || !title || !deadline || !priority) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: subject, title, deadline, priority'
      });
    }

    // Validate priority value
    const validPriorities = ['High', 'Medium', 'Low'];
    if (!validPriorities.includes(priority)) {
      return res.status(400).json({
        success: false,
        message: 'Priority must be one of: High, Medium, Low'
      });
    }

    // Insert the new task into Supabase
    // .select() at the end returns the newly created row
    const { data, error } = await supabase
      .from('tasks')
      .insert([{
        subject,
        title,
        deadline,
        priority,
        status: status || 'Pending'  // Default to Pending if not provided
      }])
      .select();

    if (error) throw error;

    res.status(201).json({ success: true, message: 'Task created!', task: data[0] });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────
// PUT /tasks/:id
// Updates an existing task (e.g., mark as Done, change priority).
// :id is the task's unique ID from the database.
//
// Example: PUT /tasks/5  with body { "status": "Done" }
// ─────────────────────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;   // Get the task ID from the URL
    const updates = req.body;    // Get the fields to update from the request body

    // Make sure they actually sent something to update
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'No fields provided to update.' });
    }

    // Optional: validate status if it's being updated
    if (updates.status && !['Pending', 'Done'].includes(updates.status)) {
      return res.status(400).json({ success: false, message: 'Status must be Pending or Done' });
    }

    // Update the task where the id matches
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) throw error;

    // If no rows returned, the task wasn't found
    if (data.length === 0) {
      return res.status(404).json({ success: false, message: `Task with ID ${id} not found.` });
    }

    res.status(200).json({ success: true, message: 'Task updated!', task: data[0] });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────
// DELETE /tasks/:id
// Permanently deletes a task from the database.
//
// Example: DELETE /tasks/5
// ─────────────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)
      .select();

    if (error) throw error;

    if (data.length === 0) {
      return res.status(404).json({ success: false, message: `Task with ID ${id} not found.` });
    }

    res.status(200).json({ success: true, message: `Task ${id} deleted successfully.` });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
