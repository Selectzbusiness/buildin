import { Job } from '../types/job';

export const mockJobs: Job[] = [
  {
    id: '1',
    title: 'Senior Software Engineer',
    company: 'TechCorp',
    location: 'Bangalore, India',
    type: 'Full-time',
    description: 'Join our team as a senior software engineer and work on cutting-edge projects. Lead development initiatives and mentor junior developers.',
    salary: '₹25 LPA',
    postedDate: '2024-03-15',
    requirements: ['8+ years of experience', 'Strong problem-solving skills', 'Team leadership'],
    status: 'active',
    applications: 12,
    experience: '8-12'
  },
  {
    id: '2',
    title: 'Product Manager',
    company: 'InnovateX',
    location: 'Mumbai, India',
    type: 'Full-time',
    description: 'Drive product strategy and execution. Work with cross-functional teams to deliver exceptional products.',
    salary: '₹35 LPA',
    postedDate: '2024-03-14',
    requirements: ['5+ years product management', 'Agile methodologies', 'Data analysis'],
    status: 'active',
    applications: 8,
    experience: '5-8'
  },
  {
    id: '3',
    title: 'UX Designer',
    company: 'DesignHub',
    location: 'Remote',
    type: 'Contract',
    description: 'Create beautiful and intuitive user interfaces. Work with our design team on various projects.',
    salary: '₹18 LPA',
    postedDate: '2024-03-13',
    requirements: ['3+ years UX design', 'Figma', 'User research'],
    status: 'active',
    applications: 15,
    experience: '3-5'
  },
  {
    id: '4',
    title: 'Data Scientist',
    company: 'DataTech',
    location: 'Hyderabad, India',
    type: 'Full-time',
    description: 'Apply machine learning and statistical methods to solve complex business problems.',
    salary: '₹30 LPA',
    postedDate: '2024-03-12',
    requirements: ['5+ years data science', 'Python', 'Machine Learning'],
    status: 'active',
    applications: 10,
    experience: '12-20'
  }
]; 