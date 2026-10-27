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
};
