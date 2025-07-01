// utils/upload.js
const multer = require('multer');
const path = require('path');

// Store file temporarily on disk
const storage = multer.diskStorage({
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

// Optional: file filter for resumes only
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname);
  if (ext === '.pdf' || ext === '.docx') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF and DOCX files are allowed'), false);
  }
};

const upload = multer({ storage, fileFilter });

module.exports = upload;
