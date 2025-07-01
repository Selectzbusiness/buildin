# Job Connect Backend

A backend service for managing job postings and applications.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory with the following variables:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/job-connect
JWT_SECRET=your-secret-key-here
```

3. Start the development server:
```bash
npm run dev
```

## API Endpoints

### Jobs

- `POST /api/jobs` - Create a new job posting
- `GET /api/jobs/my-jobs` - Get all jobs for the authenticated employer
- `GET /api/jobs/:id` - Get a specific job by ID
- `PUT /api/jobs/:id` - Update a job posting
- `DELETE /api/jobs/:id` - Delete a job posting
- `GET /api/jobs/public/search` - Search public jobs (for job seekers)

## Database Schema

### Job
- `employerId` - Reference to the employer (User)
- `jobTitle` - Title of the job
- `jobTitleDescription` - Description of the job title
- `jobType` - Type of job (onsite/remote/hybrid)
- `city` - City where the job is located
- `area` - Area within the city (optional)
- `pincode` - Postal code (optional)
- `streetAddress` - Street address (optional)
- `employmentTypes` - Array of employment types
- `schedules` - Array of work schedules
- `customSchedule` - Custom schedule if needed (optional)
- `hasPlannedStartDate` - Whether there's a planned start date
- `plannedStartDate` - Planned start date (optional)
- `numberOfHires` - Number of positions to fill
- `customNumberOfHires` - Custom number if needed (optional)
- `recruitmentTimeline` - Timeline for recruitment
- `payType` - Type of pay (range/starting/maximum/exact)
- `minAmount` - Minimum pay amount (optional)
- `maxAmount` - Maximum pay amount (optional)
- `amount` - Exact pay amount (optional)
- `payRate` - Pay rate (hour/day/week/month/year)
- `supplementalPay` - Array of supplemental pay types
- `customSupplementalPay` - Custom supplemental pay (optional)
- `benefits` - Array of benefits
- `customBenefit` - Custom benefit (optional)
- `minimumEducation` - Minimum education required
- `customEducation` - Custom education requirement (optional)
- `languageRequirement` - Language requirement
- `customLanguage` - Custom language requirement (optional)
- `experienceType` - Type of experience required
- `minimumExperience` - Minimum experience required (optional)
- `customExperience` - Custom experience requirement (optional)
- `selectedIndustries` - Array of relevant industries
- `minAge` - Minimum age requirement (optional)
- `maxAge` - Maximum age requirement (optional)
- `gender` - Gender requirement
- `customGender` - Custom gender requirement (optional)
- `skills` - Array of required skills
- `jobProfileDescription` - Detailed job description
- `notificationEmails` - Array of notification email addresses
- `sendIndividualEmails` - Whether to send individual emails
- `requireResume` - Whether resume is required
- `allowCandidateContact` - Whether to allow candidate contact
- `hasApplicationDeadline` - Whether there's an application deadline
- `applicationDeadline` - Application deadline date (optional)
- `status` - Job status (active/pending/expired)
- `paymentStatus` - Payment status (paid/pending/failed)
- `visibility` - Job visibility (public/private/paused)
- `postedDate` - Date when the job was posted
- `expiresAt` - Date when the job posting expires
- `selectedPlan` - Selected subscription plan
- `couponCode` - Applied coupon code (optional)
- `requireGstInvoice` - Whether GST invoice is required
- `saveCardForFuture` - Whether to save card for future use

### User
- `email` - User's email address
- `password` - Hashed password
- `firstName` - User's first name
- `lastName` - User's last name
- `role` - User role (employer/jobseeker)
- `companyName` - Company name (for employers)
- `phoneNumber` - Phone number
- `isVerified` - Whether the user is verified
- `verificationToken` - Token for email verification
- `resetPasswordToken` - Token for password reset
- `resetPasswordExpires` - Password reset token expiration
