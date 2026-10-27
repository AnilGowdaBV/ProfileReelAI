import { RawCandidateProfile } from '../interfaces/raw-profile-data.interface';

export const MOCK_PROFILES: Record<string, RawCandidateProfile> = {
  'anil-bv-2704a8351': {
    slug: 'anil-bv-2704a8351',
    fullName: 'Anil BV',
    headline: 'Software Engineer | AI Agents & Intelligent Automation',
    location: 'Bengaluru, Karnataka, India',
    summary:
      'Passionate Software Engineer at Thinkify Labs specializing in architecting intelligent AI agents, scalable backend architectures, full-stack systems, and robust automation workflows.',
    experiences: [
      {
        company: 'Thinkify Labs',
        title: 'Software Engineer',
        startDate: '2024',
        endDate: 'Present',
        isCurrentRole: true,
        description:
          'Designing and deploying intelligent AI agent architectures, autonomous developer tools, and scalable automation pipelines using TypeScript, NestJS, and modern LLM frameworks.',
      },
    ],
    skills: [
      'AI Agents',
      'Intelligent Automation',
      'TypeScript',
      'NestJS',
      'React',
      'Node.js',
      'Python',
      'MySQL',
      'System Architecture',
    ],
    educations: [
      {
        institution: 'Sri Venkateshwara College of Engineering, Bengaluru',
        degree: 'Bachelor of Engineering (B.E.)',
        fieldOfStudy: 'Computer Science and Engineering',
        year: '2024',
      },
    ],
    certifications: [
      'Full-Stack & Intelligent Automation Specialist',
    ],
  },

  // Verified demo fixtures

  'alex-chen-senior-fullstack': {
    slug: 'alex-chen-senior-fullstack',
    fullName: 'Alex Chen',
    headline: 'Staff Full-Stack Architect | Distributed Systems & AI Systems',
    location: 'San Francisco, California, United States',
    summary:
      'Passionate architect with 10+ years designing resilient, scalable cloud architectures and real-time streaming data pipelines. Expert in TypeScript, NestJS, React, and high-throughput microservices.',
    experiences: [
      {
        company: 'Apex Cloud Systems',
        title: 'Staff Full-Stack Architect',
        startDate: '2022',
        endDate: 'Present',
        isCurrentRole: true,
        description:
          'Led architecture of real-time telemetry processing platform serving 40M daily active requests. Mentored 14 senior engineers and reduced end-to-end latency by 45%.',
      },
      {
        company: 'Vanguard Analytics',
        title: 'Senior Software Engineer',
        startDate: '2018',
        endDate: '2022',
        isCurrentRole: false,
        description:
          'Designed high-throughput ETL data ingestion services using Node.js, TypeScript, Kafka, and PostgreSQL. Spearheaded adoption of monorepo tooling.',
      },
      {
        company: 'Horizon Labs',
        title: 'Full-Stack Developer',
        startDate: '2015',
        endDate: '2018',
        isCurrentRole: false,
        description:
          'Developed customer-facing analytics dashboards using React, D3.js, and Express. Automated CI/CD deployment pipelines.',
      },
    ],
    skills: [
      'NestJS',
      'TypeScript',
      'React',
      'Distributed Systems',
      'PostgreSQL',
      'MySQL',
      'Redis',
      'Docker',
      'Kubernetes',
      'System Architecture',
    ],
    educations: [
      {
        institution: 'University of California, Berkeley',
        degree: 'Bachelor of Science (B.S.)',
        fieldOfStudy: 'Computer Science',
        year: '2015',
      },
    ],
    certifications: [
      'AWS Certified Solutions Architect – Professional',
      'Certified Kubernetes Application Developer (CKAD)',
    ],
  },

  'sarah-jenkins-product-lead': {
    slug: 'sarah-jenkins-product-lead',
    fullName: 'Sarah Jenkins',
    headline: 'VP of Product & AI Innovation | B2B SaaS Scale-Up Veteran',
    location: 'New York, New York, United States',
    summary:
      'Customer-centric product executive with 9+ years scaling venture-backed SaaS platforms from $2M to $35M ARR. Proven track record leading cross-functional teams of PMs, designers, and AI engineers.',
    experiences: [
      {
        company: 'Luminary AI',
        title: 'VP of Product',
        startDate: '2021',
        endDate: 'Present',
        isCurrentRole: true,
        description:
          'Drove product strategy for enterprise generative workflows, increasing product-led expansion by 60% year-over-year.',
      },
      {
        company: 'PulseMetrics',
        title: 'Director of Product Management',
        startDate: '2017',
        endDate: '2021',
        isCurrentRole: false,
        description:
          'Built and led a team of 8 product managers. Successfully launched 3 core SaaS analytics tiers and established enterprise customer advisory boards.',
      },
    ],
    skills: [
      'Product Strategy',
      'AI Product Management',
      'Go-to-Market (GTM)',
      'Enterprise SaaS',
      'User Research',
      'Data Analytics',
      'Cross-Functional Leadership',
    ],
    educations: [
      {
        institution: 'Columbia University',
        degree: 'Master of Business Administration (MBA)',
        fieldOfStudy: 'Technology Management',
        year: '2017',
      },
      {
        institution: 'Boston University',
        degree: 'Bachelor of Arts (B.A.)',
        fieldOfStudy: 'Economics',
        year: '2014',
      },
    ],
    certifications: ['Pragmatic Institute Certified (PMC-III)'],
  },

  'marcus-vance-cloud-devops': {
    slug: 'marcus-vance-cloud-devops',
    fullName: 'Marcus Vance',
    headline: 'Lead Cloud & DevOps Engineer | Kubernetes, Terraform, Platform Eng',
    location: 'Austin, Texas, United States',
    summary:
      'Cloud platform engineer specializing in zero-downtime migrations, infrastructure-as-code, and developer experience platforms across AWS and GCP environments.',
    experiences: [
      {
        company: 'Strata Cloud Solutions',
        title: 'Lead DevOps & Platform Engineer',
        startDate: '2020',
        endDate: 'Present',
        isCurrentRole: true,
        description:
          'Architected multi-region Kubernetes clusters with automated GitOps workflows via ArgoCD, achieving 99.99% system availability.',
      },
      {
        company: 'Clearwater Technologies',
        title: 'Cloud Systems Administrator',
        startDate: '2017',
        endDate: '2020',
        isCurrentRole: false,
        description:
          'Migrated legacy monolithic infrastructure to containerized AWS ECS and Terraform modules.',
      },
    ],
    skills: [
      'Kubernetes',
      'Terraform',
      'AWS',
      'Docker',
      'ArgoCD',
      'CI/CD Pipelines',
      'Prometheus & Grafana',
      'Linux Administration',
    ],
    educations: [
      {
        institution: 'University of Texas at Austin',
        degree: 'Bachelor of Science (B.S.)',
        fieldOfStudy: 'Information Technology',
        year: '2017',
      },
    ],
    certifications: [
      'AWS Certified DevOps Engineer – Professional',
      'HashiCorp Certified: Terraform Associate',
    ],
  },

  'priya-sharma-data-scientist': {
    slug: 'priya-sharma-data-scientist',
    fullName: 'Priya Sharma',
    headline: 'Principal AI & NLP Researcher | Deep Learning & LLM Fine-Tuning',
    location: 'Seattle, Washington, United States',
    summary:
      'AI researcher and practitioner with 7+ years delivering state-of-the-art transformer models, semantic search engines, and generative pipelines for enterprise knowledge systems.',
    experiences: [
      {
        company: 'Cognitive Dynamics',
        title: 'Principal AI Researcher',
        startDate: '2021',
        endDate: 'Present',
        isCurrentRole: true,
        description:
          'Spearheaded research and deployment of domain-specific LLM fine-tuning techniques, reducing inference latency by 3.5x while improving factual accuracy.',
      },
      {
        company: 'DeepMind Innovations (Affiliate)',
        title: 'Senior Machine Learning Engineer',
        startDate: '2018',
        endDate: '2021',
        isCurrentRole: false,
        description:
          'Developed transformer-based entity extraction and semantic similarity models deployed across 15 enterprise clients.',
      },
    ],
    skills: [
      'Python',
      'PyTorch',
      'Transformers',
      'NLP',
      'Vector Databases',
      'LLM Fine-Tuning',
      'MLOps',
      'FastAPI',
    ],
    educations: [
      {
        institution: 'Carnegie Mellon University',
        degree: 'Master of Science (M.S.)',
        fieldOfStudy: 'Computational Data Science',
        year: '2018',
      },
    ],
    certifications: ['DeepLearning.AI TensorFlow Developer'],
  },
};
