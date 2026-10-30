export interface JobRole {
  id: string;
  title: string;
  company: string;
  location: string;
  logo: string;
  skills: string[];
  url: string;
  matchPercentage?: number;
}

export const LIVE_ROLES: JobRole[] = [
  {
    id: 'job-1',
    title: 'SDE 4 - Frontend Architecture',
    company: 'Google',
    location: 'Bangalore, India',
    logo: 'https://logo.clearbit.com/google.com',
    skills: ['React', 'TypeScript', 'Web Performance', 'Micro-frontends'],
    url: 'https://www.instahyre.com',
    matchPercentage: 96,
  },
  {
    id: 'job-2',
    title: 'Senior Java / Distributed Backend Developer',
    company: 'Zimperium',
    location: 'Work From Home (Remote)',
    logo: 'https://logo.clearbit.com/zimperium.com',
    skills: ['Java', 'Spring Boot', 'Kubernetes', 'Cybersecurity'],
    url: 'https://www.instahyre.com',
    matchPercentage: 94,
  },
  {
    id: 'job-3',
    title: 'SDE II - Fullstack Systems Engineer',
    company: 'Khatabook',
    location: 'Bangalore, India',
    logo: 'https://logo.clearbit.com/khatabook.com',
    skills: ['Node.js', 'React', 'PostgreSQL', 'High Concurrency'],
    url: 'https://www.instahyre.com',
    matchPercentage: 98,
  },
  {
    id: 'job-4',
    title: 'Lead Platform & Cloud Architect',
    company: 'Swiggy',
    location: 'Bangalore / Hybrid',
    logo: 'https://logo.clearbit.com/swiggy.com',
    skills: ['AWS', 'Go', 'Distributed Caching', 'Event Streaming'],
    url: 'https://www.instahyre.com',
    matchPercentage: 91,
  },
  {
    id: 'job-5',
    title: 'AI Systems & Agentic Engineer',
    company: 'Freshworks',
    location: 'Chennai / Remote',
    logo: 'https://logo.clearbit.com/freshworks.com',
    skills: ['Python', 'LangChain', 'FastAPI', 'Vector Databases'],
    url: 'https://www.instahyre.com',
    matchPercentage: 95,
  },
  {
    id: 'job-6',
    title: 'Senior Mobile Engineer (React Native)',
    company: 'CRED',
    location: 'Bangalore, India',
    logo: 'https://logo.clearbit.com/cred.club',
    skills: ['React Native', 'iOS', 'Android', 'Design Systems'],
    url: 'https://www.instahyre.com',
    matchPercentage: 92,
  },
];

