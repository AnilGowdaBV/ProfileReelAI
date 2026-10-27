export interface RawExperienceItem {
  company: string;
  title: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  isCurrentRole?: boolean;
}

export interface RawEducationItem {
  institution: string;
  degree?: string;
  fieldOfStudy?: string;
  year?: string;
}

export interface RawCandidateProfile {
  slug: string;
  fullName: string;
  headline?: string;
  location?: string;
  summary?: string;
  experiences: RawExperienceItem[];
  skills: string[];
  educations: RawEducationItem[];
  certifications?: string[];
  profilePictureUrl?: string;
  connections?: string | number;
  followers?: string | number;
  postsCount?: number;
}

export type ProfileRetrievalStatus =
  | 'SUCCESS'
  | 'PROFILE_DATA_UNAVAILABLE'
  | 'FAILED';

export interface ProfileRetrievalResult {
  status: ProfileRetrievalStatus;
  data?: RawCandidateProfile;
  errorReason?: string;
  sourceProvider: string;
  isMock: boolean;
  metadata?: {
    retrievedAt: string;
    fixtureId?: string;
    authorizedScope?: string;
  };
}
