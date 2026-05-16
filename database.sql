-- ============================================================
-- SUPABASE SQL — Run this in the Supabase SQL Editor
-- Go to: your project → SQL Editor → New query → paste & run
-- ============================================================

-- Create the "tasks" table
CREATE TABLE tasks (
  id          BIGSERIAL PRIMARY KEY,          -- Auto-incrementing unique ID
  subject     TEXT NOT NULL,                  -- e.g. "Mathematics"
  title       TEXT NOT NULL,                  -- e.g. "Solve integration problems"
  deadline    DATE NOT NULL,                  -- e.g. "2025-06-01"
  priority    TEXT NOT NULL CHECK (priority IN ('High', 'Medium', 'Low')),
  status      TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Done')),
  created_at  TIMESTAMPTZ DEFAULT NOW()       -- Auto-set when task is created
);

-- Add some sample data to test with
INSERT INTO tasks (subject, title, deadline, priority, status) VALUES
  ('Mathematics',  'Solve integration problems', '2025-06-01', 'High',   'Pending'),
  ('Physics',      'Read Chapter 5 - Optics',    '2025-05-28', 'Medium', 'Pending'),
  ('English',      'Write essay on Shakespeare', '2025-05-20', 'Low',    'Done'),
  ('Computer Sci', 'Practice sorting algorithms','2025-06-10', 'High',   'Pending');

-- Verify the data was inserted
SELECT * FROM tasks ORDER BY created_at DESC;
