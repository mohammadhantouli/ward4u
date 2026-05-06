import DOMPurify from 'dompurify';

// Sanitize any user-supplied string to prevent XSS
export function sanitizeText(input) {
  if (typeof input !== 'string') return '';
  return DOMPurify.sanitize(input.trim(), { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
}

// Sanitize HTML content (for rich-text fields)
export function sanitizeHTML(input) {
  if (typeof input !== 'string') return '';
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: [],
  });
}

// Validate and sanitize a search query
export function sanitizeSearch(query) {
  if (typeof query !== 'string') return '';
  // Remove characters that could interfere with DB queries
  return query.replace(/[<>"'%;()&+]/g, '').trim().slice(0, 100);
}

// Validate email format
export function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
}

// Validate phone (Saudi format: 05xxxxxxxx or +9665xxxxxxxx)
export function isValidPhone(phone) {
  const re = /^(\+9665|05)\d{8}$/;
  return re.test(String(phone).replace(/\s/g, ''));
}

// Validate positive number
export function isPositiveNumber(val) {
  const n = Number(val);
  return Number.isFinite(n) && n > 0;
}

// Clamp a number to a safe range
export function clampNumber(val, min, max) {
  const n = Number(val);
  if (!Number.isFinite(n)) return min;
  return Math.min(Math.max(n, min), max);
}

// Rate limiter — returns false if the action is allowed, true if rate-limited
const rateLimitMap = new Map();
export function isRateLimited(key, maxCalls = 5, windowMs = 60_000) {
  const now = Date.now();
  const record = rateLimitMap.get(key) || { count: 0, start: now };

  if (now - record.start > windowMs) {
    rateLimitMap.set(key, { count: 1, start: now });
    return false;
  }
  if (record.count >= maxCalls) return true;

  record.count += 1;
  rateLimitMap.set(key, record);
  return false;
}

// Sanitize URL params — only allow alphanumeric + hyphens
export function sanitizeURLParam(param) {
  if (typeof param !== 'string') return '';
  return param.replace(/[^a-zA-Z0-9-_]/g, '').slice(0, 50);
}
