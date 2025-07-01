import mongoose, { Document, Schema } from 'mongoose';

export interface IJob extends Document {
  employerId: mongoose.Types.ObjectId;
  jobTitle: string;
  jobTitleDescription: string;
  jobType: 'onsite' | 'remote' | 'hybrid';
  city: string;
  area?: string;
  pincode?: string;
  streetAddress?: string;
  employmentTypes: string[];
  schedules: string[];
  customSchedule?: string;
  hasPlannedStartDate: boolean;
  plannedStartDate?: string;
  numberOfHires: string;
  customNumberOfHires?: string;
  recruitmentTimeline: string;
  payType: 'range' | 'starting' | 'maximum' | 'exact';
  minAmount?: string;
  maxAmount?: string;
  amount?: string;
  payRate: 'hour' | 'day' | 'week' | 'month' | 'year';
  supplementalPay: string[];
  customSupplementalPay?: string;
  benefits: string[];
  customBenefit?: string;
  minimumEducation: string;
  customEducation?: string;
  languageRequirement: string;
  customLanguage?: string;
  experienceType: 'any' | 'experienced' | 'fresher';
  minimumExperience?: string;
  customExperience?: string;
  selectedIndustries: string[];
  minAge?: string;
  maxAge?: string;
  gender: string;
  customGender?: string;
  skills: string[];
  jobProfileDescription: string;
  notificationEmails: string[];
  sendIndividualEmails: boolean;
  requireResume: boolean;
  allowCandidateContact: boolean;
  hasApplicationDeadline: boolean;
  applicationDeadline?: string;
  status: 'active' | 'pending' | 'expired';
  paymentStatus: 'paid' | 'pending' | 'failed';
  visibility: 'public' | 'private' | 'paused';
  postedDate: Date;
  expiresAt: Date;
  selectedPlan: 'basic' | 'standard' | 'premium' | null;
  couponCode?: string;
  requireGstInvoice: boolean;
  saveCardForFuture: boolean;
}

const JobSchema = new Schema<IJob>({
  employerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  jobTitle: {
    type: String,
    required: true
  },
  jobTitleDescription: {
    type: String,
    required: true
  },
  jobType: {
    type: String,
    enum: ['onsite', 'remote', 'hybrid'],
    required: true
  },
  city: {
    type: String,
    required: true
  },
  area: String,
  pincode: String,
  streetAddress: String,
  employmentTypes: [{
    type: String,
    required: true
  }],
  schedules: [{
    type: String,
    required: true
  }],
  customSchedule: String,
  hasPlannedStartDate: {
    type: Boolean,
    default: false
  },
  plannedStartDate: Date,
  numberOfHires: {
    type: String,
    required: true
  },
  customNumberOfHires: String,
  recruitmentTimeline: {
    type: String,
    required: true
  },
  payType: {
    type: String,
    enum: ['range', 'starting', 'maximum', 'exact'],
    required: true
  },
  minAmount: String,
  maxAmount: String,
  amount: String,
  payRate: {
    type: String,
    enum: ['hour', 'day', 'week', 'month', 'year'],
    required: true
  },
  supplementalPay: [String],
  customSupplementalPay: String,
  benefits: [String],
  customBenefit: String,
  minimumEducation: {
    type: String,
    required: true
  },
  customEducation: String,
  languageRequirement: {
    type: String,
    required: true
  },
  customLanguage: String,
  experienceType: {
    type: String,
    enum: ['any', 'experienced', 'fresher'],
    required: true
  },
  minimumExperience: String,
  customExperience: String,
  selectedIndustries: [String],
  minAge: String,
  maxAge: String,
  gender: {
    type: String,
    required: true
  },
  customGender: String,
  skills: [String],
  jobProfileDescription: {
    type: String,
    required: true
  },
  notificationEmails: [{
    type: String,
    required: true
  }],
  sendIndividualEmails: {
    type: Boolean,
    default: false
  },
  requireResume: {
    type: Boolean,
    default: false
  },
  allowCandidateContact: {
    type: Boolean,
    default: false
  },
  hasApplicationDeadline: {
    type: Boolean,
    default: false
  },
  applicationDeadline: Date,
  status: {
    type: String,
    enum: ['active', 'pending', 'expired'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['paid', 'pending', 'failed'],
    default: 'pending'
  },
  visibility: {
    type: String,
    enum: ['public', 'private', 'paused'],
    default: 'private'
  },
  postedDate: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true
  },
  selectedPlan: {
    type: String,
    enum: ['basic', 'standard', 'premium', null],
    default: null
  },
  couponCode: String,
  requireGstInvoice: {
    type: Boolean,
    default: false
  },
  saveCardForFuture: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for efficient querying
JobSchema.index({ employerId: 1, status: 1 });
JobSchema.index({ status: 1, visibility: 1 });
JobSchema.index({ expiresAt: 1 });

export default mongoose.model<IJob>('Job', JobSchema); 