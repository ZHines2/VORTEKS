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

// DOM helper
export const $ = (selector) => document.querySelector(selector);