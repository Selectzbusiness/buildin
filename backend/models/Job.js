const mongoose = require('mongoose');
const jobSchema = new mongoose.Schema({
  title: String,
  location: String,
  salary: String,
  description: String,
  company: String,
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  applicants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Application' }]
}, { timestamps: true });
module.exports = mongoose.model('Job', jobSchema);