import { Job } from '../types/job';
import { mockJobs } from './mockData';

// Mock API delay to simulate network request
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Get all jobs
export const getJobs = async (): Promise<Job[]> => {
  await delay(1000); // Simulate network delay
  return mockJobs;
};

// Get jobs posted by the current employer
export const getMyJobs = async (): Promise<Job[]> => {
  await delay(1000);
  return mockJobs;
};

// Get a single job by ID
export const getJob = async (id: string): Promise<Job | undefined> => {
  await delay(500);
  return mockJobs.find(job => job.id === id);
};

// Create a new job
export const createJob = async (jobData: Omit<Job, 'id'>): Promise<Job> => {
  await delay(1000);
  const newJob: Job = {
    ...jobData,
    id: Math.random().toString(36).substr(2, 9),
    applications: 0
  };
  mockJobs.push(newJob);
  return newJob;
};

// Update a job
export const updateJob = async (id: string, jobData: Partial<Job>): Promise<Job> => {
  await delay(1000);
  const jobIndex = mockJobs.findIndex(job => job.id === id);
  if (jobIndex === -1) {
    throw new Error('Job not found');
  }
  mockJobs[jobIndex] = { ...mockJobs[jobIndex], ...jobData };
  return mockJobs[jobIndex];
};

// Delete a job
export const deleteJob = async (id: string): Promise<void> => {
  await delay(1000);
  const jobIndex = mockJobs.findIndex(job => job.id === id);
  if (jobIndex === -1) {
    throw new Error('Job not found');
  }
  mockJobs.splice(jobIndex, 1);
}; 