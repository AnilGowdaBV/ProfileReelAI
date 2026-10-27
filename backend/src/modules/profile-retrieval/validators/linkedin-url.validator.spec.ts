import { BadRequestException } from '@nestjs/common';
import { LinkedInUrlValidator } from './linkedin-url.validator';

describe('LinkedInUrlValidator', () => {
  describe('Valid LinkedIn URLs', () => {
    it('should validate and normalize standard LinkedIn URL', () => {
      const result = LinkedInUrlValidator.validateAndNormalize(
        'https://www.linkedin.com/in/alex-chen-senior-fullstack',
      );
      expect(result.normalizedUrl).toBe(
        'https://www.linkedin.com/in/alex-chen-senior-fullstack',
      );
      expect(result.profileSlug).toBe('alex-chen-senior-fullstack');
    });

    it('should handle URLs without protocol by prepending https', () => {
      const result = LinkedInUrlValidator.validateAndNormalize(
        'linkedin.com/in/sarah-jenkins-product-lead',
      );
      expect(result.normalizedUrl).toBe(
        'https://www.linkedin.com/in/sarah-jenkins-product-lead',
      );
      expect(result.profileSlug).toBe('sarah-jenkins-product-lead');
    });

    it('should normalize trailing slashes and query parameters', () => {
      const result = LinkedInUrlValidator.validateAndNormalize(
        'https://www.linkedin.com/in/marcus-vance-cloud-devops/?trk=public_profile&locale=en_US',
      );
      expect(result.normalizedUrl).toBe(
        'https://www.linkedin.com/in/marcus-vance-cloud-devops',
      );
      expect(result.profileSlug).toBe('marcus-vance-cloud-devops');
    });

    it('should accept regional subdomains like in.linkedin.com', () => {
      const result = LinkedInUrlValidator.validateAndNormalize(
        'https://in.linkedin.com/in/priya-sharma-data-scientist',
      );
      expect(result.normalizedUrl).toBe(
        'https://www.linkedin.com/in/priya-sharma-data-scientist',
      );
      expect(result.profileSlug).toBe('priya-sharma-data-scientist');
    });

    it('should normalize uppercase characters in the slug to lowercase', () => {
      const result = LinkedInUrlValidator.validateAndNormalize(
        'https://www.linkedin.com/in/Alex-Chen-Senior-FullStack',
      );
      expect(result.normalizedUrl).toBe(
        'https://www.linkedin.com/in/alex-chen-senior-fullstack',
      );
      expect(result.profileSlug).toBe('alex-chen-senior-fullstack');
    });
  });

  describe('Invalid and Potentially Malicious URLs', () => {
    it('should reject empty or whitespace URLs', () => {
      expect(() => LinkedInUrlValidator.validateAndNormalize('')).toThrow(
        BadRequestException,
      );
      expect(() => LinkedInUrlValidator.validateAndNormalize('   ')).toThrow(
        BadRequestException,
      );
    });

    it('should reject non-LinkedIn domains (SSRF protection)', () => {
      expect(() =>
        LinkedInUrlValidator.validateAndNormalize('https://evil.com/in/alexchen'),
      ).toThrow(BadRequestException);
      expect(() =>
        LinkedInUrlValidator.validateAndNormalize('https://github.com/in/alexchen'),
      ).toThrow(BadRequestException);
    });

    it('should reject non-profile LinkedIn paths', () => {
      expect(() =>
        LinkedInUrlValidator.validateAndNormalize(
          'https://www.linkedin.com/company/google',
        ),
      ).toThrow(BadRequestException);
      expect(() =>
        LinkedInUrlValidator.validateAndNormalize(
          'https://www.linkedin.com/feed/',
        ),
      ).toThrow(BadRequestException);
    });

    it('should reject invalid protocols', () => {
      expect(() =>
        LinkedInUrlValidator.validateAndNormalize(
          'ftp://www.linkedin.com/in/alexchen',
        ),
      ).toThrow(BadRequestException);
    });

    it('should reject slugs that are too short', () => {
      expect(() =>
        LinkedInUrlValidator.validateAndNormalize(
          'https://www.linkedin.com/in/a',
        ),
      ).toThrow(BadRequestException);
    });
  });
});
