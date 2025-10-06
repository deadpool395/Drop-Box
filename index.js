const express = require('express');
const multer = require('multer');
const multerS3 = require('multer-s3');
const { S3Client } = require('@aws-sdk/client-s3');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Admin credentials (optional if you add login)
const ADMIN_USER = "admin";
const ADMIN_PASS = "password";

// AWS S3 configuration (SDK v3)
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Middleware for parsing form data
app.use(express.urlencoded({ extended: true }));

// Multer-S3 setup — builds the S3 path dynamically from 3 dropdowns
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.S3_BUCKET_NAME,
    key: function (req, file, cb) {
      const className = req.body.class || 'General';
      const subClass = req.body.subClass || 'Section';
      const subject = req.body.subject || 'Subject';
      const filePath = `${className}/${subClass}/${subject}/${file.originalname}`;
      cb(null, filePath);
    }
  })
});

// Session middleware
app.use(session({
  secret: 'secret-key',
  resave: false,
  saveUninitialized: true
}));

// Serve static frontend files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Upload route (with all dropdown validations)
app.post('/upload', upload.single('file'), (req, res) => {
  const { class: className, subClass, subject } = req.body;

  if (!req.file || !className || !subClass || !subject) {
    return res.status(400).send('All fields are required (Class, Section, Subject, File).');
  }

  console.log(`✅ Uploaded: ${req.file.originalname} to ${className}/${subClass}/${subject}`);
  res.redirect('/upload-success');
});

// Success page
app.get('/upload-success', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'success.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
