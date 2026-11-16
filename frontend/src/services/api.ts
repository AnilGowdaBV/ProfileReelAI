import {
  Candidate,
  SubmissionResponse,
  JobDetails,
  HealthStatus,
  GeneratedVideoResponse,
  VideoMetadata,
  CandidateScore,
} from '../types/candidate';
const rawBase =
  ((import.meta as any).env?.VITE_API_BASE_URL as string | undefined) || '';
export const API_BASE = rawBase.endsWith('/api')
  ? rawBase
  : `${rawBase.replace(/\/$/, '')}/api`;

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: any,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options?.headers || {}),
  };

  const response = await fetch(url, { ...options, headers });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg =
      data?.message && Array.isArray(data.message)
        ? data.message.join(', ')
        : data?.message || data?.error || `Request failed with status ${response.status}`;
    throw new ApiError(response.status, errorMsg, data);
  }

  return data as T;
}

export type JobApplicationRow = {
  id: string;
  jobTitle: string;
  companyName: string;
  fullName: string;
  email: string;
  phone: string;
  linkedinUrl?: string;
  location?: string;
  currentSalary?: string;
  expectedSalary?: string;
  interviewingAt?: string;
  resumeFileName?: string;
  hasResume?: boolean;
  status: string;
  createdAt: string;
};

export type MockTestResultRow = {
  id: string;
  fullName: string;
  email: string;
  linkedinUrl: string;
  testId: string;
  questionNo: number;
  difficulty: string;
  title: string;
  pattern: string;
  submissionUrl: string;
  status: string;
  createdAt: string;
};

export type CoursePlatformRow = {
  id: string;
  name: string;
  url: string;
  purpose: string;
  recommendFor: string;
  createdAt: string;
};

export type InterviewerApplicationRow = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  linkedinUrl: string;
  currentCompany: string;
  previousCompanies: string;
  status: string;
  createdAt: string;
};

export const api = {
  getHealth: () => request<HealthStatus>('/health'),

  submitCandidate: (
    payload:
      | string
      | {
          profileUrl: string;
          displayName?: string;
          headline?: string;
          profileText?: string;
          pdlApiKey?: string;
        },
  ) => {
    const body = typeof payload === 'string' ? { profileUrl: payload } : payload;
    return request<SubmissionResponse>('/candidates', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  getCandidate: (id: string) => request<Candidate>(`/candidates/${id}`),

  listCandidates: () => request<Candidate[]>('/candidates'),

  getJob: (id: string) => request<JobDetails>(`/jobs/${id}`),

  generateVideo: (candidateId: string) =>
    request<GeneratedVideoResponse>(`/candidates/${candidateId}/generate-video`, {
      method: 'POST',
    }),

  getLatestVideo: (candidateId: string) =>
    request<VideoMetadata | null>(`/videos/candidate/${candidateId}`).catch(() => null),

  getVideo: (videoId: string) => request<VideoMetadata>(`/videos/${videoId}`),

  getCandidateScore: (candidateId: string) =>
    request<CandidateScore>(`/candidates/${candidateId}/score`),

  calculateCandidateScore: (candidateId: string) =>
    request<CandidateScore>(`/candidates/${candidateId}/score`, {
      method: 'POST',
    }),

  jobApplyAllowance: (email: string, linkedinUrl?: string) =>
    request<{ needsPayment: boolean }>(
      `/jobs/apply-allowance?email=${encodeURIComponent(email)}&linkedin=${encodeURIComponent(linkedinUrl || '')}`,
    ),

  applyForJob: (data: {
    jobId: string;
    jobTitle: string;
    companyName: string;
    fullName: string;
    email: string;
    phone: string;
    linkedinUrl?: string;
    currentSalary?: string;
    expectedSalary?: string;
    location?: string;
    interviewingAt: string;
    resumeFileName?: string;
    resumeData?: string;
    applicationType?: string;
    sheetName?: string;
  }) =>
    request<{ success: boolean; message: string; application: any }>('/jobs/apply', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  adminLogin: (username: string, password: string) =>
    request<{ token: string; username: string }>('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  interviewRecordings: (token: string) =>
    request<Array<{ id: string; candidateName: string; candidateEmail: string; interviewerName: string; interviewDate: string; interviewTime: string; meetLink: string; state: string; watchUrl: string; detail?: string }>>('/interviewers/recordings', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  adminSession: (token: string) =>
    request<{ username: string }>('/admin/session', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  applicationResume: (token: string, id: string) =>
    request<{ fileName: string; resumeUrl: string; resumeData: string }>(`/jobs/applications/admin/${id}/resume`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  jobApplications: (token: string, kind: 'jobs' | 'interest') =>
    request<JobApplicationRow[]>(`/jobs/applications/admin?kind=${kind}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  coursePlatforms: () => request<CoursePlatformRow[]>('/jobs/course-platforms'),

  addCoursePlatform: (token: string, data: { name: string; url: string; purpose?: string; recommendFor?: string }) =>
    request<CoursePlatformRow>('/jobs/course-platforms', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    }),

  updateCoursePlatform: (token: string, id: string, data: { name: string; url: string; purpose?: string; recommendFor?: string }) =>
    request<CoursePlatformRow>(`/jobs/course-platforms/${id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    }),

  removeCoursePlatform: (token: string, id: string) =>
    request<{ success: boolean }>(`/jobs/course-platforms/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }),

  mockTestResults: (token: string) =>
    request<MockTestResultRow[]>('/jobs/mock-test-results', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  addInterviewer: (token: string, data: { fullName: string; email: string; password: string; linkedinUrl: string; currentCompany: string }) =>
    request<InterviewerApplicationRow>('/interviewers/applications', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    }),

  interviewerApplications: (token: string) =>
    request<InterviewerApplicationRow[]>('/interviewers/applications', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  setInterviewerStatus: (token: string, id: string, status: string) =>
    request<InterviewerApplicationRow>(`/interviewers/applications/${id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    }),

  interviewerPicks: () =>
    request<Array<{ id: string; fullName: string; currentCompany: string; currentTitle: string; previousCompanies: string; linkedinUrl: string; photoUrl: string; companies: Array<{ name: string; logo: string; title: string }> }>>('/interviewers/picks'),

  requestInterview: (data: {
    interviewerId: string;
    candidateName: string;
    candidateEmail: string;
    jobTitle: string;
    companyName: string;
    date: string;
    time: string;
    meetLink?: string;
    note?: string;
  }) =>
    request<{ success: boolean; message: string }>('/interviewers/requests', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  myInterviewRequests: (email: string) =>
    request<Array<{ id: string; interviewerName: string; photoUrl: string; jobTitle: string; companyName: string; status: string; interviewDate: string; interviewTime: string; note: string; meetLink: string; notice: string; createdAt: string }>>(
      `/interviewers/mine-requests?email=${encodeURIComponent(email)}`,
    ),

  interviewerInbox: (email: string) =>
    request<{
      approved: boolean;
      requests: Array<{ id: string; candidateName: string; candidateEmail: string; jobTitle: string; companyName: string; status: string; interviewDate: string; interviewTime: string; note: string; meetLink: string; notice: string; resumeFileName: string; resumeUrl: string; photoUrl: string; headline: string; createdAt: string }>;
    }>(`/interviewers/inbox?email=${encodeURIComponent(email)}`),

  interviewCandidate: (id: string, email: string) =>
    request<{
      fullName: string;
      email: string;
      phone: string;
      linkedinUrl: string;
      currentSalary: string;
      expectedSalary: string;
      location: string;
      interviewingAt: string;
      jobTitle: string;
      companyName: string;
      resumeFileName: string;
      resumeUrl: string;
      resumeData: string;
    }>(`/interviewers/inbox/${id}/profile?email=${encodeURIComponent(email)}`),

  rescheduleInterview: (id: string, email: string, schedule: { date: string; time: string; note: string; meetLink: string }) =>
    request<{ success: boolean; interviewDate: string; interviewTime: string; note: string; meetLink: string }>(
      `/interviewers/requests/${id}?email=${encodeURIComponent(email)}`,
      { method: 'PATCH', body: JSON.stringify(schedule) },
    ),

  acceptInterviewRequest: (id: string, email: string) =>
    request<{ success: boolean }>(`/interviewers/inbox/${id}?email=${encodeURIComponent(email)}`, { method: 'PATCH' }),

  rejectInterviewRequest: (id: string, email: string) =>
    request<{ success: boolean }>(`/interviewers/inbox/${id}/reject?email=${encodeURIComponent(email)}`, { method: 'PATCH' }),

  candidatePhoto: (email: string) =>
    request<{ photoUrl: string }>(`/interviewers/photo?email=${encodeURIComponent(email)}`),

  interviewerStatus: (email: string) =>
    request<{ found: boolean; status?: string; fullName?: string; photoUrl?: string }>(
      `/interviewers/mine?email=${encodeURIComponent(email)}`,
    ),

  applyInterviewer: (data: {
    fullName: string;
    email: string;
    phone: string;
    linkedinUrl: string;
    currentCompany: string;
  }) =>
    request<{ success: boolean; message: string; previousCompanies: string[] }>('/interviewers/apply', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  runCode: (data: { language: string; source: string; testsJson: string }) =>
    request<{
      passedCases: number;
      total: number;
      passed: boolean;
      note: string;
      output?: string;
      status?: string;
      time?: string;
      memory?: number;
      cases: Array<{ index: number; hidden: boolean; passed: boolean; message: string }>;
    }>('/jobs/run-code', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  submitMockTest: (data: {
    testId: string;
    userId?: string;
    fullName: string;
    email: string;
    linkedinUrl?: string;
    verdict?: string;
    verdictReason?: string;
    tabWarnings?: string;
    pasteWarnings?: string;
    answers: Array<{
      questionId: string;
      number?: string;
      title: string;
      difficulty: string;
      pattern?: string;
      leetcodeUrl?: string;
      submissionUrl?: string;
      snapshotData?: string;
      caseNote?: string;
      code?: string;
    }>;
  }) =>
    request<{ success: boolean; message: string; sheet: string; answers: number }>('/jobs/mock-test', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateProfilePicture: (candidateId: string, profilePictureUrl: string) =>
    request<{ candidateId: string; displayName: string; profilePictureUrl: string; message: string }>(
      `/candidates/${candidateId}/profile-picture`,
      {
        method: 'PATCH',
        body: JSON.stringify({ profilePictureUrl }),
      },
    ),

  getSubscriptionStatus: (identifier?: string) =>
    request<{ isPremium: boolean; subscription?: any }>(
      identifier ? `/payments/status?identifier=${encodeURIComponent(identifier)}` : '/payments/status',
    ),

  getRecommendedCourses: (
    skills: string[],
    interests: string[],
    limit: number,
  ) =>
    request<{
      courses: Array<{
        id: string;
        title: string;
        provider: string;
        track: string;
        level: string;
        url: string;
        skills: string[];
        matchPercentage: number;
      }>;
      totalMatched: number;
      limit: number;
    }>(
      `/jobs/courses/recommended?skills=${encodeURIComponent(skills.join(','))}&interests=${encodeURIComponent(interests.join(','))}&limit=${limit}`,
    ),

  getLiveInstahyreJobs: async (skills?: string, limit: number = 20, offset: number = 0): Promise<any[]> => {
    try {
      const skillsParam = skills ? `&skills=${encodeURIComponent(skills)}` : '';
      return await request<any[]>(`/jobs/instahyre/live?limit=${limit}&offset=${offset}${skillsParam}`);
    } catch (err) {
      console.warn('Backend Instahyre proxy unavailable, querying live Instahyre public endpoint...', err);
      // Fallback directly to Instahyre public search API
      try {
        const primarySkills = skills ? skills.split(/[,\s]+/).filter(Boolean).slice(0, 2).join('+') : '';
        const searchUrl = primarySkills
          ? `https://www.instahyre.com/api/v1/job_search?skills=${encodeURIComponent(primarySkills)}&offset=${offset}&count=${limit}`
          : `https://www.instahyre.com/api/v1/job_search?offset=${offset}&count=${limit}`;

        const res = await fetch(searchUrl, {
          headers: { Accept: 'application/json' },
        });
        if (!res.ok) return [];
        const data = await res.json();
        return (data?.objects || []).map((j: any) => ({
          id: String(j.id),
          title: j.title || j.candidate_title || 'Software Engineer',
          company: j.employer?.company_name || 'Tech Company',
          companyName: j.employer?.company_name || 'Tech Company',
          logo: j.employer?.profile_image_src || '',
          companyLogo: j.employer?.profile_image_src || '',
          location: Array.isArray(j.locations) ? j.locations.join(', ') : (j.locations || 'Bangalore, India'),
          skills: Array.isArray(j.keywords) ? j.keywords : [],
          url: j.public_url || `https://www.instahyre.com/job-${j.id}`,
          publicUrl: j.public_url || `https://www.instahyre.com/job-${j.id}`,
          matchPercentage: 94 + (Number(j.id) % 6),
        }));
      } catch {
        return [];
      }
    }
  },
};
