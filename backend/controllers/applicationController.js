const Application = require('../models/Application');
const Job = require('../models/Job');
const cloudinary = require('../config/cloudinary');

exports.applyToJob = async (req, res) => {
  const { jobId } = req.params;

  const filePath = req.file.path;
  const result = await cloudinary.uploader.upload(filePath, {
    folder: 'resumes',
    resource_type: 'raw' // for PDF, DOCX
  });

  const application = await Application.create({
    job: jobId,
    applicant: req.user._id,
    resumeUrl: result.secure_url
  });

  await Job.findByIdAndUpdate(jobId, { $push: { applicants: application._id } });

  res.status(201).json(application);
};
