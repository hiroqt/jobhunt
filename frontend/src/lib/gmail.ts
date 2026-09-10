/**
 * Safe, zero-token Gmail and email composition utilities.
 * Designed specifically for stateless and session-based architectures
 * where zero Google credentials or tokens are stored on the server.
 */

export interface EmailDispatchOptions {
  to?: string;
  subject: string;
  body: string;
  cc?: string;
  bcc?: string;
}

/**
 * Builds the official Gmail Web Intent URL.
 * Automatically respects URI encoding and browser URL length standards.
 * Opens directly inside the user's active browser Gmail account.
 */
export function buildGmailComposeUrl({ to = "", subject, body, cc, bcc }: EmailDispatchOptions): string {
  const params = new URLSearchParams();
  params.set("view", "cm");
  params.set("fs", "1");
  if (to.trim()) params.set("to", to.trim());
  if (subject.trim()) params.set("su", subject.trim());
  if (body.trim()) params.set("body", body.trim());
  if (cc && cc.trim()) params.set("cc", cc.trim());
  if (bcc && bcc.trim()) params.set("bcc", bcc.trim());

  return `https://mail.google.com/mail/?${params.toString()}`;
}

/**
 * Builds a standard RFC 6068 mailto: URL for default OS email clients
 * (Apple Mail, Microsoft Outlook, Thunderbird, etc.).
 */
export function buildMailtoUrl({ to = "", subject, body, cc, bcc }: EmailDispatchOptions): string {
  const params = new URLSearchParams();
  if (subject.trim()) params.set("subject", subject.trim());
  if (body.trim()) params.set("body", body.trim());
  if (cc && cc.trim()) params.set("cc", cc.trim());
  if (bcc && bcc.trim()) params.set("bcc", bcc.trim());

  const query = params.toString();
  return `mailto:${encodeURIComponent(to.trim())}${query ? `?${query}` : ""}`;
}

/**
 * Checks whether the total URL length exceeds typical browser safety limits (~6,000 characters).
 * Most modern browsers safely support up to 8,000 characters in URLs.
 */
export function isUrlLengthSafe(url: string, limit: number = 6000): boolean {
  return url.length <= limit;
}

/**
 * Client-side email detection regex for instant feedback.
 */
const EMAIL_REGEX = /[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/g;
const BLACKLIST_DOMAINS = [
  "linkedin.com", "jobstreet.com", "indeed.com", "facebook.com", "fb.com",
  "google.com", "w3.org", "sentry.io", "github.com", "example.com"
];

export function extractEmailsClientSide(text: string): string[] {
  if (!text) return [];
  const matches = text.match(EMAIL_REGEX) || [];
  const cleanMatches = matches
    .map((e) => e.trim().toLowerCase().replace(/[.,;:!?)]+$/, ""))
    .filter((e) => {
      const parts = e.split("@");
      if (parts.length !== 2) return false;
      const domain = parts[1];
      return !BLACKLIST_DOMAINS.some((bl) => domain === bl || domain.endsWith("." + bl));
    });

  return Array.from(new Set(cleanMatches));
}
