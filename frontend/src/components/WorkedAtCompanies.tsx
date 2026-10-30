import React, { useState } from 'react';
import { Briefcase, Building2 } from 'lucide-react';
import { CandidateFact } from '../types/candidate';

/**
 * High-coverage domain lookup for tech, product, enterprise, and startup companies.
 */
const KNOWN_COMPANY_DOMAINS: Record<string, string> = {
  // Common big tech & cloud
  oracle: 'oracle.com',
  makemytrip: 'makemytrip.com',
  'makemytrip.com': 'makemytrip.com',
  intuit: 'intuit.com',
  salesforce: 'salesforce.com',
  thinkify: 'thinkifylabs.com',
  'thinkify labs': 'thinkifylabs.com',
  'thinkify labs pvt ltd': 'thinkifylabs.com',
  tally: 'tallysolutions.com',
  'tally solutions': 'tallysolutions.com',
  'tally solutions pvt ltd': 'tallysolutions.com',
  inventech: 'inventech-info.com',
  'inventech info solutions': 'inventech-info.com',
  google: 'google.com',
  microsoft: 'microsoft.com',
  amazon: 'amazon.com',
  apple: 'apple.com',
  meta: 'meta.com',
  facebook: 'meta.com',
  netflix: 'netflix.com',
  uber: 'uber.com',
  airbnb: 'airbnb.com',
  twitter: 'x.com',
  x: 'x.com',
  linkedin: 'linkedin.com',
  stripe: 'stripe.com',
  atlassian: 'atlassian.com',
  adobe: 'adobe.com',
  cisco: 'cisco.com',
  ibm: 'ibm.com',
  intel: 'intel.com',
  nvidia: 'nvidia.com',
  amd: 'amd.com',
  qualcomm: 'qualcomm.com',
  accenture: 'accenture.com',
  tcs: 'tcs.com',
  'tata consultancy services': 'tcs.com',
  infosys: 'infosys.com',
  wipro: 'wipro.com',
  cognizant: 'cognizant.com',
  capgemini: 'capgemini.com',
  hcl: 'hcltech.com',
  hcltech: 'hcltech.com',
  'tech mahindra': 'techmahindra.com',
  paypal: 'paypal.com',
  spotify: 'spotify.com',
  slack: 'slack.com',
  zoom: 'zoom.us',
  shopify: 'shopify.com',
  'goldman sachs': 'goldmansachs.com',
  jpmorgan: 'jpmorgan.com',
  'jpmorgan chase': 'jpmorganchase.com',
  'morgan stanley': 'morganstanley.com',
  bloomberg: 'bloomberg.com',
  flipkart: 'flipkart.com',
  swiggy: 'swiggy.com',
  zomato: 'zomato.com',
  razorpay: 'razorpay.com',
  phonepe: 'phonepe.com',
  paytm: 'paytm.com',
  cred: 'cred.club',
  ola: 'olacabs.com',
  freshworks: 'freshworks.com',
  zoho: 'zoho.com',
  postman: 'postman.com',
  browserstack: 'browserstack.com',
  hasura: 'hasura.io',
  zerodha: 'zerodha.com',
  groww: 'groww.in',
  deloitte: 'deloitte.com',
  pwc: 'pwc.com',
  ey: 'ey.com',
  kpmg: 'kpmg.com',
  mckinsey: 'mckinsey.com',
  bcg: 'bcg.com',
  bain: 'bain.com',
  samsung: 'samsung.com',
  sony: 'sony.com',
  dell: 'dell.com',
  hp: 'hp.com',
  vmware: 'vmware.com',
  servicenow: 'servicenow.com',
  snowflake: 'snowflake.com',
  databricks: 'databricks.com',
  palantir: 'palantir.com',
  twilio: 'twilio.com',
  cloudflare: 'cloudflare.com',
  datadog: 'datadoghq.com',
  mongodb: 'mongodb.com',
  redis: 'redis.io',
  elastic: 'elastic.co',
  github: 'github.com',
  gitlab: 'gitlab.com',
  docker: 'docker.com',
  kubernetes: 'kubernetes.io',
  hashicorp: 'hashicorp.com',
  'red hat': 'redhat.com',
  redhat: 'redhat.com',
  sap: 'sap.com',
  siemens: 'siemens.com',
  bosch: 'bosch.com',
  byjus: 'byjus.com',
  unacademy: 'unacademy.com',
  swiggyinstamart: 'swiggy.com',
  zepto: 'zeptonow.com',
  blinkit: 'blinkit.com',
};

/**
 * Intelligent domain resolver for any company name.
 */
export function getCompanyDomain(companyName: string): string {
  if (!companyName) return 'google.com';
  const cleanName = companyName.trim();
  const lower = cleanName.toLowerCase();

  // 1. Exact match in dictionary
  if (KNOWN_COMPANY_DOMAINS[lower]) {
    return KNOWN_COMPANY_DOMAINS[lower];
  }

  // 2. Partial substring / word-boundary matches in dictionary
  for (const [key, domain] of Object.entries(KNOWN_COMPANY_DOMAINS)) {
    if (lower.includes(key) || key.includes(lower)) {
      return domain;
    }
  }

  // 3. If company name already has a domain extension (e.g., MakeMyTrip.com, cred.club)
  const domainPattern = /([a-z0-9-]+\.[a-z]{2,8})/i;
  const domainMatch = lower.match(domainPattern);
  if (domainMatch) {
    return domainMatch[1];
  }

  // 4. Strip corporate designations and build domain
  const stripped = lower
    .replace(/\b(pvt|ltd|limited|private limited|inc|incorporated|llc|corp|corporation|technologies|solutions|labs|group|services|co)\b/gi, '')
    .trim()
    .replace(/[^a-z0-9]/g, '');

  if (stripped && stripped.length > 1) {
    return `${stripped}.com`;
  }

  return 'google.com';
}

/**
 * Extract distinct company names from candidate facts (category === 'experience').
 * Guarantees no years/dates are included in the company name.
 */
export function extractWorkedCompanies(facts?: CandidateFact[]): string[] {
  if (!facts || facts.length === 0) return [];

  const experienceFacts = facts.filter((f) => f.category === 'experience');
  const companies: string[] = [];

  for (const exp of experienceFacts) {
    const atMatch = exp.factText.match(/\bat\s+([^(:\n,]+)/i);
    if (atMatch) {
      let comp = atMatch[1].trim();
      // Remove any trailing date/tenure indicators
      comp = comp.replace(/\s+(from|during|since|in|tenure).*/i, '').trim();
      comp = comp.replace(/\b(19|20)\d{2}\b.*/, '').trim();
      comp = comp.replace(/[.,;/-]+$/, '').trim();

      // Skip generic placeholder words
      if (
        comp &&
        comp.length > 1 &&
        !['company', 'self-employed', 'freelance', 'various'].includes(comp.toLowerCase()) &&
        !companies.some((c) => c.toLowerCase() === comp.toLowerCase())
      ) {
        companies.push(comp);
      }
    }
  }

  return companies;
}

/**
 * Get stylish 1-2 letter monogram for company fallback.
 */
export function getCompanyInitials(name: string): string {
  if (!name) return 'CO';
  const clean = name.replace(/[^a-zA-Z0-9\s]/g, '').trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase() || 'CO';
}

interface CompanyLogoBadgeProps {
  company: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Reusable Company Logo Component with high-res Google Favicon API
 * and elegant monogram fallback on load failure.
 */
export const CompanyLogoBadge: React.FC<CompanyLogoBadgeProps> = ({
  company,
  size = 'sm',
  className = '',
}) => {
  const [hasError, setHasError] = useState(false);
  const domain = getCompanyDomain(company);
  const initials = getCompanyInitials(company);

  // Size variations
  const sizeClasses = {
    sm: 'w-5 h-5 rounded-md text-[10px]',
    md: 'w-7 h-7 rounded-lg text-xs',
    lg: 'w-10 h-10 rounded-xl text-sm',
  };

  const imgSize = size === 'lg' ? 64 : size === 'md' ? 48 : 32;
  const logoUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=${imgSize}`;

  return (
    <div
      className={`inline-flex items-center justify-center flex-shrink-0 bg-white dark:bg-charcoal-800 border border-slate-200/90 dark:border-white/10 overflow-hidden shadow-2xs ${sizeClasses[size]} ${className}`}
      title={`${company} (${domain})`}
    >
      {!hasError ? (
        <img
          src={logoUrl}
          alt={`${company} logo`}
          className="w-full h-full object-contain p-0.5"
          onError={() => setHasError(true)}
          loading="lazy"
        />
      ) : (
        <span className="font-bold text-brand-600 dark:text-brand-300 leading-none select-none">
          {initials}
        </span>
      )}
    </div>
  );
};

interface WorkedAtCompaniesHeaderRowProps {
  facts?: CandidateFact[];
  className?: string;
}

/**
 * Modern "Worked at" header section with brand logos, smooth hover interactions,
 * and clean responsive layout.
 */
export const WorkedAtCompaniesHeaderRow: React.FC<WorkedAtCompaniesHeaderRowProps> = ({
  facts,
  className = '',
}) => {
  const companies = extractWorkedCompanies(facts);

  if (companies.length === 0) return null;

  return (
    <div
      className={`mt-3.5 pt-3 border-t border-slate-200/70 dark:border-white/5 flex flex-wrap items-center gap-2 ${className}`}
    >
      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1 select-none">
        <Building2 className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
        <span>Worked at:</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {companies.map((comp) => (
          <div
            key={comp}
            className="inline-flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-50/90 hover:bg-slate-100 dark:bg-charcoal-900/80 dark:hover:bg-charcoal-850 border border-slate-200/80 hover:border-brand-500/30 dark:border-white/10 dark:hover:border-white/20 transition-all duration-200 group cursor-default shadow-xs"
          >
            <CompanyLogoBadge company={comp} size="sm" />
            <span className="text-xs font-medium text-slate-800 dark:text-slate-200 group-hover:text-brand-600 dark:group-hover:text-brand-300 transition-colors">
              {comp}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
