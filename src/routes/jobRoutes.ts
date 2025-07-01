import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { addDays } from 'date-fns';
import { isAuthenticated } from '../middleware/auth';
import Job from '../models/Job';
import Favourites from '../pages/jobseeker/Favourites';

const router = express.Router();

// Validation middleware
const validateJob = [
  body('jobTitle').notEmpty().withMessage('Job title is required'),
  body('jobType').isIn(['onsite', 'remote', 'hybrid']).withMessage('Invalid job type'),
  body('city').notEmpty().withMessage('City is required'),
  body('employmentTypes').isArray().withMessage('Employment types must be an array'),
  body('schedules').isArray().withMessage('Schedules must be an array'),
  body('numberOfHires').isInt({ min: 1 }).withMessage('Number of hires must be at least 1'),
  body('payType').isIn(['range', 'starting', 'maximum', 'exact']).withMessage('Invalid pay type'),
  body('payRate').isIn(['hour', 'day', 'week', 'month', 'year']).withMessage('Invalid pay rate'),
  body('minimumEducation').notEmpty().withMessage('Minimum education is required'),
  body('languageRequirement').notEmpty().withMessage('Language requirement is required'),
  body('experienceType').notEmpty().withMessage('Experience type is required'),
  body('selectedIndustries').isArray().withMessage('Industries must be an array'),
  body('skills').isArray().withMessage('Skills must be an array'),
  body('jobProfileDescription').notEmpty().withMessage('Job description is required'),
  body('notificationEmails').isArray().withMessage('Notification emails must be an array'),
];

// Create a new job
router.post('/', isAuthenticated, validateJob, async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const jobData = {
      ...req.body,
      employerId: req.user._id,
      status: 'pending',
      paymentStatus: 'pending',
      visibility: 'private',
      postedDate: new Date(),
      expiresAt: addDays(new Date(), 30),
    };

    const job = new Job(jobData);
    await job.save();

    res.status(201).json(job);
  } catch (error) {
    res.status(500).json({ message: 'Error creating job' });
  }
});

// Get all jobs for the authenticated employer
router.get('/my-jobs', isAuthenticated, async (req: Request, res: Response): Promise<void> => {
  try {
    const jobs = await Job.find({ employerId: req.user._id });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching jobs' });
  }
});

// Get a specific job
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      res.status(404).json({ message: 'Job not found' });
      return;
    }
    res.json(job);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching job' });
  }
});

// Update a job
router.put('/:id', isAuthenticated, validateJob, async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const job = await Job.findOneAndUpdate(
      { _id: req.params.id, employerId: req.user._id },
      req.body,
      { new: true }
    );

    if (!job) {
      res.status(404).json({ message: 'Job not found' });
      return;
    }

    res.json(job);
  } catch (error) {
    res.status(500).json({ message: 'Error updating job' });
  }
});

// Delete a job
router.delete('/:id', isAuthenticated, async (req: Request, res: Response): Promise<void> => {
  try {
    const job = await Job.findOneAndDelete({ _id: req.params.id, employerId: req.user._id });
    if (!job) {
      res.status(404).json({ message: 'Job not found' });
      return;
    }
    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting job' });
  }
});

// Search public jobs
router.get('/public/search', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      jobType,
      city,
      employmentTypes,
      schedules,
      payType,
      payRate,
      minimumEducation,
      experienceType,
      selectedIndustries,
      skills,
    } = req.query;

    const query: any = {
      status: 'active',
      visibility: 'public',
      paymentStatus: 'paid',
    };

    if (jobType) query.jobType = jobType;
    if (city) query.city = city;
    if (employmentTypes) query.employmentTypes = { $in: employmentTypes };
    if (schedules) query.schedules = { $in: schedules };
    if (payType) query.payType = payType;
    if (payRate) query.payRate = payRate;
    if (minimumEducation) query.minimumEducation = minimumEducation;
    if (experienceType) query.experienceType = experienceType;
    if (selectedIndustries) query.selectedIndustries = { $in: selectedIndustries };
    if (skills) query.skills = { $in: skills };

    const jobs = await Job.find(query);
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: 'Error searching jobs' });
  }
});

export default router; 