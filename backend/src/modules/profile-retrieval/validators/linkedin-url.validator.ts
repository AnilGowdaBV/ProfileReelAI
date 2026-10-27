import { BadRequestException } from '@nestjs/common';

export interface ValidatedLinkedInUrl {
  originalUrl: string;
  normalizedUrl: string;
  profileSlug: string;
}

export class LinkedInUrlValidator {
  private static readonly LINKEDIN_HOST_REGEX =
    /^(?:[a-z]{2,3}\.)?linkedin\.com$/i;
  private static readonly PROFILE_PATH_REGEX =
    /^\/in\/([a-zA-Z0-9_\-\u00C0-\u024F%]+)\/?$/i;

  /**
   * Validates and normalizes a LinkedIn profile URL.
   * Throws BadRequestException on invalid or unsafe URLs.
   */
  public static validateAndNormalize(rawUrl: string): ValidatedLinkedInUrl {
    if (!rawUrl || typeof rawUrl !== 'string') {
      throw new BadRequestException('LinkedIn profile URL must be a non-empty string');
    }

    let trimmed = rawUrl.trim();

    // Auto-prepend https:// if user submitted without protocol
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      trimmed = `https://${trimmed}`;
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(trimmed);
    } catch {
      throw new BadRequestException('The provided URL is not a valid format');
    }

    // SSRF & Protocol Safety Check
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      throw new BadRequestException('Only HTTP/HTTPS URLs are allowed');
    }

    const hostname = parsedUrl.hostname.toLowerCase();

    // Check host belongs to linkedin.com
    if (!this.LINKEDIN_HOST_REGEX.test(hostname)) {
      throw new BadRequestException(
        `Invalid domain "${hostname}". Expected a valid LinkedIn profile URL (e.g., https://www.linkedin.com/in/username)`,
      );
    }

    // Check pathname structure (/in/{username})
    const pathname = parsedUrl.pathname;
    const match = pathname.match(this.PROFILE_PATH_REGEX);

    if (!match || !match[1]) {
      throw new BadRequestException(
        'LinkedIn URL must point to a member profile path (e.g., https://www.linkedin.com/in/username)',
      );
    }

    const rawSlug = match[1];
    const decodedSlug = decodeURIComponent(rawSlug).toLowerCase().trim();

    if (decodedSlug.length < 2 || decodedSlug.length > 100) {
      throw new BadRequestException(
        'LinkedIn profile slug has an invalid length (must be between 2 and 100 characters)',
      );
    }

    // Canonical normalized URL format: https://www.linkedin.com/in/{normalizedSlug}
    const normalizedUrl = `https://www.linkedin.com/in/${encodeURIComponent(decodedSlug)}`;

    return {
      originalUrl: rawUrl.trim(),
      normalizedUrl,
      profileSlug: decodedSlug,
    };
  }
}
