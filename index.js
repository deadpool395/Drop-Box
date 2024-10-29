const express = require('express');
const multer = require('multer');
const multerS3 = require('multer-s3');
const { S3Client } = require('@aws-sdk/client-s3');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Admin credentials
const ADMIN_USER = "admin";
const ADMIN_PASS = "password";

// AWS S3 configuration using S3Client from SDK v3
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.S3_BUCKET_NAME,
    // Remove `acl: 'public-read'` line
    key: function (req, file, cb) {
      const className = req.body.class || 'general';
      const filePath = `${className}/${file.originalname}`;
      cb(null, filePath);
    }
  })
});


// Middleware for sessions
app.use(session({
  secret: 'secret-key',
  resave: false,
  saveUninitialized: true
}));

// Serve static files (for HTML pages and CSS)
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to check if user is authenticated


// Route to render upload success page
app.get('/upload-success', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'success.html'));
});

// File upload route with class selection, storing files in S3
app.post('/upload', upload.single('file'), (req, res) => {
  const className = req.body.class;
  if (!req.file || !className) {
    return res.status(400).send('No file uploaded or class not selected.');
  }

  // Redirect to success page after upload
  res.redirect('/upload-success');
});

// Logout route


// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
