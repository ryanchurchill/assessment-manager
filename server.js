const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Configure file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const studentId = req.body.student_id || 'unknown';
    const uploadPath = path.join('uploads', `student_${studentId}`);
    
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `assessment_${timestamp}${ext}`);
  }
});

const upload = multer({ storage });

// Initialize SQLite database
const db = new sqlite3.Database('./assessment_manager.db', (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

// Create tables
function initializeDatabase() {
  db.serialize(() => {
    // Students table
    db.run(`
      CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        grade INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Assessments table
    db.run(`
      CREATE TABLE IF NOT EXISTS assessments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        total_questions INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Student assessments (scores and scans)
    db.run(`
      CREATE TABLE IF NOT EXISTS student_assessments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER,
        assessment_id INTEGER,
        score REAL,
        scan_path TEXT,
        completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id),
        FOREIGN KEY (assessment_id) REFERENCES assessments(id)
      )
    `);

    // Standards table
    db.run(`
      CREATE TABLE IF NOT EXISTS standards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT NOT NULL,
        description TEXT
      )
    `);

    // Question responses
    db.run(`
      CREATE TABLE IF NOT EXISTS responses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_assessment_id INTEGER,
        question_number INTEGER,
        is_correct BOOLEAN,
        standard_id INTEGER,
        FOREIGN KEY (student_assessment_id) REFERENCES student_assessments(id),
        FOREIGN KEY (standard_id) REFERENCES standards(id)
      )
    `);

    console.log('Database tables initialized');
  });
}

// ===== ROUTES =====

// Get all students
app.get('/api/students', (req, res) => {
  db.all('SELECT * FROM students ORDER BY name', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

// Add a new student
app.post('/api/students', (req, res) => {
  const { name, grade } = req.body;
  
  db.run(
    'INSERT INTO students (name, grade) VALUES (?, ?)',
    [name, grade],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json({ id: this.lastID, name, grade });
      }
    }
  );
});

// Get all assessments
app.get('/api/assessments', (req, res) => {
  db.all('SELECT * FROM assessments ORDER BY created_at DESC', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

// Add a new assessment
app.post('/api/assessments', (req, res) => {
  const { name, total_questions } = req.body;
  
  db.run(
    'INSERT INTO assessments (name, total_questions) VALUES (?, ?)',
    [name, total_questions],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json({ id: this.lastID, name, total_questions });
      }
    }
  );
});

// Upload a scanned assessment
app.post('/api/upload', upload.single('scan'), (req, res) => {
  const { student_id, assessment_id } = req.body;
  
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const scanPath = req.file.path;

  db.run(
    'INSERT INTO student_assessments (student_id, assessment_id, scan_path) VALUES (?, ?, ?)',
    [student_id, assessment_id, scanPath],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json({
          id: this.lastID,
          student_id,
          assessment_id,
          scan_path: scanPath,
          message: 'Assessment uploaded successfully'
        });
      }
    }
  );
});

// Get assessments for a specific student
app.get('/api/students/:id/assessments', (req, res) => {
  const studentId = req.params.id;
  
  db.all(
    `SELECT sa.*, a.name as assessment_name, a.total_questions
     FROM student_assessments sa
     JOIN assessments a ON sa.assessment_id = a.id
     WHERE sa.student_id = ?
     ORDER BY sa.completed_at DESC`,
    [studentId],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json(rows);
      }
    }
  );
});

// Start server
app.listen(PORT, () => {
  console.log(`Assessment Manager server running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Database connection closed');
    process.exit(0);
  });
});