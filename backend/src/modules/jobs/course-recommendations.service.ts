import { Injectable, Logger } from '@nestjs/common';

const LEARN_ORIGIN = 'https://xqa.io';
const CACHE_MS = 15 * 60 * 1000;
const MAX_RESULTS = 15;

export interface RecommendedCourse {
  id: string;
  title: string;
  provider: string;
  track: string;
  level: string;
  url: string;
  skills: string[];
  matchPercentage: number;
}

export interface CourseRecommendationResult {
  courses: RecommendedCourse[];
  totalMatched: number;
  limit: number;
}

interface TrackCard {
  slug: string;
  name: string;
  description: string;
  url: string;
}

interface CatalogLesson {
  slug: string;
  title: string;
  track: string;
  level: string;
  url: string;
}

/**
 * Skill phrases that point at a live catalog track. These are match signals,
 * not a course list — the lessons themselves are read from the catalog.
 */
const TRACK_SIGNALS: Record<string, string[]> = {
  python: ['python', 'pandas', 'numpy', 'flask', 'django', 'machine learning'],
  cpp: ['c++', 'cpp', 'stl'],
  c: ['c programming', 'embedded c'],
  javascript: ['javascript', 'typescript', 'react', 'node', 'nodejs', 'node.js', 'vue', 'angular', 'frontend'],
  java: ['java', 'spring', 'spring boot', 'android'],
  git: ['git', 'github', 'version control'],
  'web-development': ['html', 'css', 'web development', 'ui'],
  dsa: ['dsa', 'algorithms', 'data structures', 'leetcode'],
  'test-automation': ['selenium', 'cypress', 'playwright', 'qa', 'test automation', 'software testing'],
  'reinforcement-learning': ['reinforcement learning', 'rlhf'],
};

const JUNK_SLUG =
  /(sign-in|contact|breadcrumb|w3schools|generator|htaccess|robots|calendar|entities|labels|^views$|my-w3)/i;

const FOREIGN_NAV =
  /^(react|angular|angularjs|django|jquery|mongodb|mysql|nodejs|excel|bootstrap|sass|swift|rust|typescript|bash|cybersecurity|gen-ai|data-science|postgresql|linux|tools|images|audio|video|web-development|how-to|sign-in|contact)$/;

@Injectable()
export class CourseRecommendationsService {
  private readonly logger = new Logger(CourseRecommendationsService.name);
  private indexCache: { at: number; tracks: TrackCard[] } | null = null;
  private lessonCache = new Map<string, { at: number; lessons: CatalogLesson[] }>();

  async recommend(
    skills: string,
    interests: string,
    limit: number,
  ): Promise<CourseRecommendationResult> {
    const take = Math.min(MAX_RESULTS, Math.max(1, limit || 5));
    const terms = extractTerms(skills, interests);
    if (terms.skills.length === 0 && terms.interests.length === 0) {
      return { courses: [], totalMatched: 0, limit: take };
    }

    const tracks = await this.loadTracks();
    const rankedTracks = tracks
      .map((track) => ({ track, score: scoreTrack(track, terms.skills.concat(terms.interests)) }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    if (rankedTracks.length === 0) {
      return { courses: [], totalMatched: 0, limit: take };
    }

    const lessonGroups = await Promise.all(
      rankedTracks.map(async (entry) => ({
        track: entry.track,
        trackScore: entry.score,
        lessons: await this.loadLessons(entry.track.slug),
      })),
    );

    const pool: { lesson: CatalogLesson; trackName: string; score: number; matched: string[] }[] = [];
    const seenTitles = new Set<string>();

    for (const group of lessonGroups) {
      for (const lesson of group.lessons) {
        if (isJunkLesson(group.track.slug, lesson)) continue;
        const titleKey = lesson.title.toLowerCase().replace(/\s+/g, ' ').trim();
        if (seenTitles.has(titleKey)) continue;
        const { score, matched } = scoreLesson(lesson, terms, group.trackScore);
        if (score <= 0) continue;
        seenTitles.add(titleKey);
        pool.push({ lesson, trackName: group.track.name, score, matched });
      }
    }

    pool.sort(
      (a, b) =>
        b.score - a.score ||
        a.lesson.title.length - b.lesson.title.length ||
        a.lesson.title.localeCompare(b.lesson.title),
    );
    const capped = pool.slice(0, MAX_RESULTS);

    return {
      limit: take,
      totalMatched: capped.length,
      courses: capped.slice(0, take).map((entry) => ({
        id: `${entry.lesson.track}-${entry.lesson.level}-${entry.lesson.slug}`,
        title: decodeTitle(entry.lesson.title),
        provider: 'XQA Learn',
        track: entry.trackName,
        level: titleCase(entry.lesson.level),
        url: entry.lesson.url,
        skills: (entry.matched.length > 0 ? entry.matched : [entry.trackName]).slice(0, 4),
        matchPercentage: Math.min(99, 76 + Math.min(23, entry.score)),
      })),
    };
  }

  private async loadTracks(): Promise<TrackCard[]> {
    if (this.indexCache && Date.now() - this.indexCache.at < CACHE_MS) {
      return this.indexCache.tracks;
    }
    const html = await this.fetchText(`${LEARN_ORIGIN}/learn`);
    const tracks: TrackCard[] = [];
    const pattern =
      /<a class="block h-full" href="\/learn\/([a-z0-9-]+)"[\s\S]*?<h3[^>]*>([^<]+)<\/h3><p[^>]*>([^<]*)<\/p>/g;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(html))) {
      const slug = match[1];
      if (slug === 'in') continue;
      tracks.push({
        slug,
        name: decodeTitle(match[2]),
        description: decodeTitle(match[3]),
        url: `${LEARN_ORIGIN}/learn/${slug}`,
      });
    }
    this.indexCache = { at: Date.now(), tracks };
    return tracks;
  }

  private async loadLessons(slug: string): Promise<CatalogLesson[]> {
    const cached = this.lessonCache.get(slug);
    if (cached && Date.now() - cached.at < CACHE_MS) return cached.lessons;

    const html = await this.fetchText(`${LEARN_ORIGIN}/learn/${slug}`);
    const lessons: CatalogLesson[] = [];
    const seen = new Set<string>();
    const pattern =
      /href="\/learn\/([a-z0-9-]+)\/(beginner|intermediate|hard)\/([a-z0-9-]+)">([^<]+)</g;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(html))) {
      const key = `${match[2]}/${match[3]}`;
      if (seen.has(key)) continue;
      seen.add(key);
      lessons.push({
        track: match[1],
        level: match[2],
        slug: match[3],
        title: match[4],
        url: `${LEARN_ORIGIN}/learn/${match[1]}/${match[2]}/${match[3]}`,
      });
    }
    this.lessonCache.set(slug, { at: Date.now(), lessons });
    return lessons;
  }

  private async fetchText(url: string): Promise<string> {
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html',
      },
    });
    if (!response.ok) {
      this.logger.warn(`Catalog fetch failed ${response.status} ${url}`);
      return '';
    }
    return response.text();
  }
}

function extractTerms(skills: string, interests: string): { skills: string[]; interests: string[] } {
  const skillTerms = uniqueTerms(splitPhrases(skills)).slice(0, 12);
  const interestTerms = uniqueTerms(splitPhrases(interests))
    .filter((term) => !skillTerms.includes(term))
    .slice(0, 8);
  return { skills: skillTerms, interests: interestTerms };
}

function splitPhrases(value: string): string[] {
  return value
    .split(/[\n,|/]+/)
    .map((part) => part.trim().toLowerCase().replace(/\s+/g, ' '))
    .filter((part) => part.length > 1 && part.length < 48 && !STOP_WORDS.has(part));
}

function uniqueTerms(terms: string[]): string[] {
  const unique: string[] = [];
  for (const term of terms) {
    if (!unique.includes(term)) unique.push(term);
  }
  return unique;
}

const STOP_WORDS = new Set([
  'and',
  'the',
  'for',
  'with',
  'from',
  'that',
  'this',
  'your',
  'you',
  'are',
  'was',
  'has',
  'have',
  'using',
  'into',
  'over',
  'years',
  'experience',
]);

function scoreTrack(track: TrackCard, terms: string[]): number {
  let score = 0;
  const haystack = `${track.name} ${track.description}`.toLowerCase();
  const signals = TRACK_SIGNALS[track.slug] || [];
  for (const term of terms) {
    if (signals.some((signal) => signalHits(term, signal))) {
      if (term === 'c' && track.slug !== 'c') continue;
      if (term === 'java' && track.slug === 'javascript') continue;
      if ((term === 'c++' || term === 'cpp') && track.slug === 'c') continue;
      score += 8;
      continue;
    }
    if (term === 'java' && track.slug === 'javascript') continue;
    if ((term === 'c++' || term === 'cpp') && track.slug === 'c') continue;
    if (includesTerm(haystack, term)) score += 5;
  }
  return score;
}

function scoreLesson(
  lesson: CatalogLesson,
  terms: { skills: string[]; interests: string[] },
  trackScore: number,
): { score: number; matched: string[] } {
  const title = decodeTitle(lesson.title).toLowerCase();
  const matched: string[] = [];
  let score = 0;
  for (const term of terms.skills) {
    if (titleHits(title, term)) {
      matched.push(term);
      score += 12;
    }
  }
  for (const term of terms.interests) {
    if (titleHits(title, term)) {
      matched.push(term);
      score += 8;
    }
  }
  if (/^[A-Z0-9\s&()+./'-]{8,}$/.test(lesson.title.trim())) score -= 6;
  if (score === 0 && trackScore > 0 && /what is|hello|introduction|syntax|variable|install|get started|getting started|data type/.test(title)) {
    score = 2;
  }
  return { score, matched };
}

function titleHits(title: string, term: string): boolean {
  if (term.length < 2) return false;
  return includesTerm(title, term);
}

function isJunkLesson(trackSlug: string, lesson: CatalogLesson): boolean {
  if (JUNK_SLUG.test(lesson.slug) || JUNK_SLUG.test(lesson.title)) return true;
  const prefix = `${trackSlug}-`;
  if (!lesson.slug.startsWith(prefix)) return false;
  return FOREIGN_NAV.test(lesson.slug.slice(prefix.length));
}

function signalHits(term: string, signal: string): boolean {
  if (term === signal) return true;
  return includesTerm(term, signal) || includesTerm(signal, term);
}

function includesTerm(haystack: string, term: string): boolean {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^a-z0-9+#])${escaped}([^a-z0-9+#]|$)`, 'i').test(haystack);
}

function decodeTitle(value: string): string {
  let current = value;
  for (let i = 0; i < 3; i += 1) {
    const next = current
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#x27;|&#39;/g, "'")
      .replace(/&quot;/g, '"');
    if (next === current) break;
    current = next;
  }
  return current.trim();
}

function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
