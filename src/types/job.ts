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
  application_type?: 'in_app' | 'external_link';
  application_link?: string;
  disclaimer?: string;
} 