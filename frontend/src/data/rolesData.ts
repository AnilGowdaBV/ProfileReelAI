import { CandidateScore, CandidateFact } from '../types/candidate';

export interface JobRole {
  id: string;
  title: string;
  company: string;
  location: string;
  logo: string;
  skills: string[];
  url: string;
  matchPercentage?: number;
  tier?: 'leadership' | 'mid_senior' | 'early_career';
}

/**
 * Tier 1: Leadership / Big Tech / High-Experience (Score >= 8.0 or Executive/Principal level)
 */
export const TIER1_LEADERSHIP_ROLES: JobRole[] = [
  {
    id: 'lead-1',
    title: 'Principal Cloud Architect & AI Infrastructure',
    company: 'Google',
    location: 'Bangalore, India',
    logo: 'https://www.google.com/s2/favicons?domain=google.com&sz=64',
    skills: ['Distributed Systems', 'AI Infrastructure', 'Cloud Scale', 'System Architecture'],
    url: 'https://careers.google.com',
    matchPercentage: 98,
    tier: 'leadership',
  },
  {
    id: 'lead-2',
    title: 'Director of Engineering - Scalable Enterprise Platforms',
    company: 'Microsoft',
    location: 'Hyderabad / Bangalore',
    logo: 'https://www.google.com/s2/favicons?domain=microsoft.com&sz=64',
    skills: ['Enterprise Strategy', 'High Concurrency', 'Distributed Computing', 'Team Leadership'],
    url: 'https://careers.microsoft.com',
    matchPercentage: 97,
    tier: 'leadership',
  },
  {
    id: 'lead-3',
    title: 'Principal Distributed Systems Lead',
    company: 'Atlassian',
    location: 'Bangalore / Remote',
    logo: 'https://www.google.com/s2/favicons?domain=atlassian.com&sz=64',
    skills: ['Cloud Architecture', 'Microservices', 'Global Scale', 'Performance Optimization'],
    url: 'https://www.atlassian.com/company/careers',
    matchPercentage: 96,
    tier: 'leadership',
  },
  {
    id: 'lead-4',
    title: 'Principal Software Architect - Experience Platform',
    company: 'Adobe',
    location: 'Noida / Bangalore',
    logo: 'https://www.google.com/s2/favicons?domain=adobe.com&sz=64',
    skills: ['Large Scale Systems', 'Distributed Caching', 'Full-Stack Architecture'],
    url: 'https://www.adobe.com/careers.html',
    matchPercentage: 97,
    tier: 'leadership',
  },
  {
    id: 'lead-5',
    title: 'Staff Infrastructure & Platform Architect',
    company: 'Stripe',
    location: 'Work From Home (Remote)',
    logo: 'https://www.google.com/s2/favicons?domain=stripe.com&sz=64',
    skills: ['FinTech Infrastructure', 'High Availability', 'Distributed Databases'],
    url: 'https://stripe.com/jobs',
    matchPercentage: 95,
    tier: 'leadership',
  },
];

/**
 * Tier 2: Mid-Senior / Experienced Tech / High-Growth Product Companies (Score 6.5 - 7.9)
 */
export const TIER2_MID_SENIOR_ROLES: JobRole[] = [
  {
    id: 'mid-1',
    title: 'Lead Platform & Cloud Architect',
    company: 'Swiggy',
    location: 'Bangalore / Hybrid',
    logo: 'https://www.google.com/s2/favicons?domain=swiggy.com&sz=64',
    skills: ['AWS', 'Go / Node.js', 'Distributed Caching', 'Event Streaming'],
    url: 'https://careers.swiggy.com',
    matchPercentage: 96,
    tier: 'mid_senior',
  },
  {
    id: 'mid-2',
    title: 'Senior Fullstack & Product Systems Engineer',
    company: 'CRED',
    location: 'Bangalore, India',
    logo: 'https://www.google.com/s2/favicons?domain=cred.club&sz=64',
    skills: ['React', 'Node.js', 'System Design', 'Microservices'],
    url: 'https://careers.cred.club',
    matchPercentage: 95,
    tier: 'mid_senior',
  },
  {
    id: 'mid-3',
    title: 'SDE III - Distributed Payments & Core Banking',
    company: 'Razorpay',
    location: 'Bangalore / Remote',
    logo: 'https://www.google.com/s2/favicons?domain=razorpay.com&sz=64',
    skills: ['Java / Go', 'Kubernetes', 'Microservices', 'High Concurrency'],
    url: 'https://razorpay.com/jobs',
    matchPercentage: 97,
    tier: 'mid_senior',
  },
  {
    id: 'mid-4',
    title: 'SDE II - Fullstack Systems Engineer',
    company: 'Khatabook',
    location: 'Bangalore, India',
    logo: 'https://www.google.com/s2/favicons?domain=khatabook.com&sz=64',
    skills: ['Node.js', 'React', 'PostgreSQL', 'High Concurrency'],
    url: 'https://khatabook.com',
    matchPercentage: 94,
    tier: 'mid_senior',
  },
  {
    id: 'mid-5',
    title: 'Senior Distributed Backend Developer',
    company: 'Zimperium',
    location: 'Work From Home (Remote)',
    logo: 'https://www.google.com/s2/favicons?domain=zimperium.com&sz=64',
    skills: ['Java', 'Spring Boot', 'Kubernetes', 'Cybersecurity'],
    url: 'https://www.zimperium.com',
    matchPercentage: 94,
    tier: 'mid_senior',
  },
];

/**
 * Tier 3: Early Career / Junior / Emerging Talent / High-Velocity Innovation Startups (Score < 6.5)
 */
export const TIER3_EARLY_CAREER_ROLES: JobRole[] = [
  {
    id: 'early-1',
    title: 'AI Agents & Intelligent Automation Engineer',
    company: 'Thinkify Labs',
    location: 'Bangalore, India',
    logo: 'https://www.google.com/s2/favicons?domain=thinkifylabs.com&sz=64',
    skills: ['AI Agents', 'TypeScript', 'NestJS', 'LLM Workflows'],
    url: 'https://thinkifylabs.com',
    matchPercentage: 98,
    tier: 'early_career',
  },
  {
    id: 'early-2',
    title: 'Associate Fullstack & Automation Developer',
    company: 'Freshworks',
    location: 'Chennai / Remote',
    logo: 'https://www.google.com/s2/favicons?domain=freshworks.com&sz=64',
    skills: ['JavaScript', 'React', 'Node.js', 'REST APIs'],
    url: 'https://www.freshworks.com/careers',
    matchPercentage: 96,
    tier: 'early_career',
  },
  {
    id: 'early-3',
    title: 'Software Engineer - Core Engineering & Systems',
    company: 'Tally Solutions',
    location: 'Bangalore, India',
    logo: 'https://www.google.com/s2/favicons?domain=tallysolutions.com&sz=64',
    skills: ['Software Engineering', 'C++ / TypeScript', 'Data Structures', 'Database Systems'],
    url: 'https://tallysolutions.com/careers',
    matchPercentage: 95,
    tier: 'early_career',
  },
  {
    id: 'early-4',
    title: 'Associate Product Developer - Cloud Applications',
    company: 'Zoho',
    location: 'Chennai / Remote',
    logo: 'https://www.google.com/s2/favicons?domain=zoho.com&sz=64',
    skills: ['Fullstack Development', 'SQL', 'Python', 'Modern Web'],
    url: 'https://www.zoho.com/careers',
    matchPercentage: 94,
    tier: 'early_career',
  },
  {
    id: 'early-5',
    title: 'Junior Backend & GraphQL Systems Engineer',
    company: 'Hasura',
    location: 'Bangalore / Remote',
    logo: 'https://www.google.com/s2/favicons?domain=hasura.io&sz=64',
    skills: ['PostgreSQL', 'GraphQL', 'Node.js', 'Cloud Fundamentals'],
    url: 'https://hasura.io/careers',
    matchPercentage: 93,
    tier: 'early_career',
  },
  {
    id: 'early-6',
    title: 'Software Engineer Specialist - Intelligent Workflows',
    company: 'Inventech',
    location: 'Bangalore, India',
    logo: 'https://www.google.com/s2/favicons?domain=inventech-info.com&sz=64',
    skills: ['Python', 'JavaScript', 'API Integrations', 'Automation'],
    url: 'https://inventech-info.com',
    matchPercentage: 94,
    tier: 'early_career',
  },
];

/**
 * Universal catalog of Live Instahyre Opportunities for Section 2 & Career Hub
 */
export const LIVE_ROLES: JobRole[] = [
  {
    id: 'job-1',
    title: 'SDE 4 - Frontend Architecture',
    company: 'Google',
    location: 'Bangalore, India',
    logo: 'https://www.google.com/s2/favicons?domain=google.com&sz=64',
    skills: ['React', 'TypeScript', 'Web Performance', 'Micro-frontends'],
    url: 'https://www.instahyre.com',
    matchPercentage: 96,
  },
  {
    id: 'job-2',
    title: 'Senior Java / Distributed Backend Developer',
    company: 'Zimperium',
    location: 'Work From Home (Remote)',
    logo: 'https://www.google.com/s2/favicons?domain=zimperium.com&sz=64',
    skills: ['Java', 'Spring Boot', 'Kubernetes', 'Cybersecurity'],
    url: 'https://www.instahyre.com',
    matchPercentage: 94,
  },
  {
    id: 'job-3',
    title: 'SDE II - Fullstack Systems Engineer',
    company: 'Khatabook',
    location: 'Bangalore, India',
    logo: 'https://www.google.com/s2/favicons?domain=khatabook.com&sz=64',
    skills: ['Node.js', 'React', 'PostgreSQL', 'High Concurrency'],
    url: 'https://www.instahyre.com',
    matchPercentage: 98,
  },
  {
    id: 'job-4',
    title: 'Lead Platform & Cloud Architect',
    company: 'Swiggy',
    location: 'Bangalore / Hybrid',
    logo: 'https://www.google.com/s2/favicons?domain=swiggy.com&sz=64',
    skills: ['AWS', 'Go', 'Distributed Caching', 'Event Streaming'],
    url: 'https://www.instahyre.com',
    matchPercentage: 91,
  },
  {
    id: 'job-5',
    title: 'AI Systems & Agentic Engineer',
    company: 'Freshworks',
    location: 'Chennai / Remote',
    logo: 'https://www.google.com/s2/favicons?domain=freshworks.com&sz=64',
    skills: ['Python', 'LangChain', 'FastAPI', 'Vector Databases'],
    url: 'https://www.instahyre.com',
    matchPercentage: 95,
  },
  {
    id: 'job-6',
    title: 'Senior Mobile Engineer (React Native)',
    company: 'CRED',
    location: 'Bangalore, India',
    logo: 'https://www.google.com/s2/favicons?domain=cred.club&sz=64',
    skills: ['React Native', 'iOS', 'Android', 'Design Systems'],
    url: 'https://www.instahyre.com',
    matchPercentage: 92,
  },
];

/**
 * Dynamically curate the Top 3 Best Suitable Companies and Roles based on
 * the candidate's verified experience, company tier, and score.
 */
export function getBestMatchedRolesForCandidate(
  score?: CandidateScore | null,
  candidateFacts?: CandidateFact[]
): JobRole[] {
  const expFacts = candidateFacts?.filter((f) => f.category === 'experience') || [];
  const headlineFact = candidateFacts?.find((f) => f.category === 'headline')?.factText || '';
  const textBlob = (
    headlineFact +
    ' ' +
    expFacts.map((f) => f.factText).join(' ')
  ).toLowerCase();

  // 1. Identify Candidate Profile Level
  const isExecutiveOrBigTech =
    (score && score.overallScore >= 8.0) ||
    score?.tier === 'EXCEPTIONAL' ||
    /\b(director|vp|vice president|managing director|principal|staff|head of|lead architect|chief|executive|founder|cxo|cto)\b/i.test(
      textBlob
    ) ||
    /\b(oracle|salesforce|google|microsoft|amazon|meta|apple|netflix|uber|intuit|makemytrip)\b/i.test(
      textBlob
    ) ||
    /\b(1[0-9]|2[0-9])\+?\s*years\b/i.test(textBlob);

  const isMidSenior =
    (score && score.overallScore >= 6.5 && score.overallScore < 8.0) ||
    score?.tier === 'STRONG' ||
    /\b(lead|senior|sde iii|sde 3|3\+|4\+|5\+|6\+|7\+|8\+)\b/i.test(textBlob);

  let pool: JobRole[];
  if (isExecutiveOrBigTech) {
    pool = [...TIER1_LEADERSHIP_ROLES];
  } else if (isMidSenior) {
    pool = [...TIER2_MID_SENIOR_ROLES];
  } else {
    pool = [...TIER3_EARLY_CAREER_ROLES];
  }

  // 2. Extract current candidate companies to avoid offering duplicate current role
  const currentCompanies = expFacts
    .map((e) => {
      const m = e.factText.match(/\bat\s+([^(:\n,]+)/i);
      return m ? m[1].toLowerCase().trim() : '';
    })
    .filter(Boolean);

  // If candidate is already at a company in the pool, place new companies first
  pool.sort((a, b) => {
    const aIsCurrent = currentCompanies.some(
      (c) => c.includes(a.company.toLowerCase()) || a.company.toLowerCase().includes(c)
    );
    const bIsCurrent = currentCompanies.some(
      (c) => c.includes(b.company.toLowerCase()) || b.company.toLowerCase().includes(c)
    );
    if (aIsCurrent && !bIsCurrent) return 1;
    if (!aIsCurrent && bIsCurrent) return -1;
    return (b.matchPercentage || 95) - (a.matchPercentage || 95);
  });

  return pool.slice(0, 3);
}
