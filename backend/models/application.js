const mongoose = require('mongoose');
const applicationSchema = new mongoose.Schema({
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
  applicant: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resumeUrl: String,
  status: { type: String, enum: ['applied','reviewed','rejected','hired'], default: 'applied' }
}, { timestamps: true });
module.exports = mongoose.model('Application', applicationSchema);