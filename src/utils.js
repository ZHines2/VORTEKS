// Utility Functions

export const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

export const rng = (n) => Math.floor(Math.random() * n);

export const shuffle = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = rng(i + 1);
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

// Generate a UUIDv4
export function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Sanitize nickname for leaderboard use
export function sanitizeNickname(nickname) {
  if (!nickname || typeof nickname !== 'string') return '';
  return nickname.trim().substring(0, 20); // Max 20 chars, trimmed
}

// DOM helper
export const $ = (selector) => document.querySelector(selector);