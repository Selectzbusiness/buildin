const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { applyToJob } = require('../controllers/applicationController');
const upload = require('../utils/upload');
router.post('/:jobId', protect, upload.single('resume'), applyToJob);
module.exports = router;