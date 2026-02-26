/**
 * Blocked personal email domains for sign-up restriction.
 * ClawBroker requires business email addresses.
 */
export const BLOCKED_EMAIL_DOMAINS = [
  // Google
  "gmail.com",
  "googlemail.com",
  // Microsoft
  "outlook.com",
  "hotmail.com",
  "live.com",
  "msn.com",
  // Yahoo
  "yahoo.com",
  "yahoo.co.uk",
  "yahoo.ca",
  "yahoo.com.au",
  "ymail.com",
  "rocketmail.com",
  // Apple
  "icloud.com",
  "me.com",
  "mac.com",
  // AOL / Verizon
  "aol.com",
  "aim.com",
  "verizon.net",
  // Proton
  "protonmail.com",
  "proton.me",
  "pm.me",
  // Zoho (free tier)
  "zohomail.com",
  // GMX / Mail.com
  "gmx.com",
  "gmx.net",
  "mail.com",
  // Yandex
  "yandex.com",
  "yandex.ru",
  // Tutanota
  "tutanota.com",
  "tuta.io",
  // FastMail (free)
  "fastmail.com",
  // ISPs
  "comcast.net",
  "att.net",
  "sbcglobal.net",
  "bellsouth.net",
  "charter.net",
  "cox.net",
  "earthlink.net",
  "juno.com",
  "netzero.com",
  // Regional
  "btinternet.com",
  "virginmedia.com",
  "sky.com",
  "orange.fr",
  "wanadoo.fr",
  "t-online.de",
  "web.de",
  "libero.it",
  "qq.com",
  "163.com",
  "126.com",
  "naver.com",
  "rediffmail.com",
] as const;

const blockedSet: Set<string> = new Set(BLOCKED_EMAIL_DOMAINS);

/**
 * Returns true if the email belongs to a known personal/free domain.
 */
export function isPersonalEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return false;
  return blockedSet.has(domain);
}
