export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  description: string;
  salary: string;
  postedDate: string;
  requirements: string[];
  status: 'active' | 'paused' | 'closed' | 'expired';
  applications?: number;
  experience: string;
} 