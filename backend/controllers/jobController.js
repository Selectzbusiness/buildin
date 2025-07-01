const Job = require('../models/Job');
// @desc Create job
// @route POST /api/jobs
exports.createJob = async (req, res) => {
  const { title, location, salary, description, company } = req.body;
  const job = await Job.create({ title, location, salary, description, company, postedBy: req.user._id });
  res.status(201).json(job);
};

// @desc Get all jobs
// @route GET /api/jobs
exports.getJobs = async (req, res) => {
  const filter = {};
  if (req.query.location) filter.location = req.query.location;
  if (req.query.keyword) filter.title = new RegExp(req.query.keyword, 'i');
  const jobs = await Job.find(filter).populate('postedBy', 'name company');
  res.json(jobs);
};