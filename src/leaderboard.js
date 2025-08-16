// src/leaderboard.js
// JSONBin-backed leaderboard adapter with localStorage fallback.
// - Configure with configureJSONBin({ binId, masterKey })
// - Public-read bins work without masterKey; writes require MASTER_KEY (dev-only) or server proxy.

import { generateUUID, sanitizeNickname } from './utils.js';

const PROFILE_LS = 'vorteks-player-profile';
const LB_LS = 'vorteks-global-leaderboard';
const DEFAULT_TIMEOUT = 5000;

// Leaderboard categories used by UI
export const LEADERBOARD_CATEGORIES = [
  { id: 'total_wins', name: 'Total Wins', icon: '🏆', description: 'Most wins overall' },
  { id: 'win_streak', name: 'Win Streak', icon: '🔥', description: 'Longest current streak' },
  { id: 'perfect_wins', name: 'Perfect Wins', icon: '💎', description: 'Wins with full HP' },
  { id: 'quick_wins', name: 'Quick Wins', icon: '⚡', description: 'Wins in few turns' },
  { id: 'win_rate', name: 'Win Rate', icon: '📈', description: 'Highest win percentage' },
  { id: 'total_games', name: 'Total Games', icon: '🎮', description: 'Most active players' }
];

// JSONBin configuration (can be set via configureJSONBin or window.*)
let JSONBIN_BASE = 'https://api.jsonbin.io/v3';
let JSONBIN_BIN_ID = window.JSONBIN_BIN_ID || '689f8e49d0ea881f405a220d'; // public-read bin provided by user
let JSONBIN_MASTER_KEY = window.JSONBIN_MASTER_KEY || null;

// runtime state
let backendOnline = false;
let syncing = false;

// helpers
function timeoutFetch(url, opts = {}, timeout = DEFAULT_TIMEOUT) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  opts.signal = controller.signal;
  return fetch(url, opts).finally(() => clearTimeout(id));
}

export function configureJSONBin({ baseUrl, binId, masterKey } = {}) {
  if (baseUrl) JSONBIN_BASE = baseUrl;
  if (binId) {
    JSONBIN_BIN_ID = binId;
    window.JSONBIN_BIN_ID = binId;
  }
  if (masterKey) {
    JSONBIN_MASTER_KEY = masterKey;
    window.JSONBIN_MASTER_KEY = masterKey;
  }
}

// PROFILE MANAGEMENT (local only)
function saveProfileToLS(profile) {
  try { localStorage.setItem(PROFILE_LS, JSON.stringify(profile)); } catch {}
}
export function loadPlayerProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_LS);
    if (!raw) {
      const p = { id: generateUUID(), nickname: null, shareStats: false, lastSubmitted: null };
      saveProfileToLS(p);
      return p;
    }
    const parsed = JSON.parse(raw);
    // ensure id
    if (!parsed.id) parsed.id = generateUUID();
    return parsed;
  } catch (e) {
    const p = { id: generateUUID(), nickname: null, shareStats: false, lastSubmitted: null };
    saveProfileToLS(p);
    return p;
  }
}
export function getPlayerProfile() {
  return loadPlayerProfile();
}
export function updatePlayerProfile(updates = {}) {
  const p = loadPlayerProfile();
  const merged = { ...p, ...updates };
  if (merged.nickname) merged.nickname = sanitizeNickname(merged.nickname);
  saveProfileToLS(merged);
  return merged;
}
export function resetLeaderboardProfile() {
  const p = { id: generateUUID(), nickname: null, shareStats: false, lastSubmitted: null };
  saveProfileToLS(p);
  return p;
}

// LOCAL leaderboard read/save
export async function loadLeaderboardFromLocal() {
  try {
    const raw = localStorage.getItem(LB_LS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}
export async function saveLeaderboardToLocal(board) {
  try {
    localStorage.setItem(LB_LS, JSON.stringify(board || []));
    return true;
  } catch (e) {
    console.warn('Failed saving leaderboard to localStorage', e);
    return false;
  }
}

// JSONBin helpers
function jsonbinGetHeaders() {
  return { 'Content-Type': 'application/json' };
}
function jsonbinPutHeaders() {
  const h = { 'Content-Type': 'application/json' };
  if (JSONBIN_MASTER_KEY) h['X-Master-Key'] = JSONBIN_MASTER_KEY;
  return h;
}
async function fetchLeaderboardFromJSONBin() {
  if (!JSONBIN_BIN_ID) throw new Error('JSONBIN_BIN_ID not configured');
  const url = `${JSONBIN_BASE}/b/${JSONBIN_BIN_ID}/latest`;
  const res = await timeoutFetch(url, { method: 'GET', headers: jsonbinGetHeaders() }, DEFAULT_TIMEOUT);
  if (!res.ok) {
    const text = await res.text().catch(()=>null);
    const err = new Error(`JSONBin GET failed ${res.status} ${text || ''}`);
    err.status = res.status;
    throw err;
  }
  const json = await res.json();
  // JSONBin v3 wraps record in .record
  const record = json && (json.record || json);
  // Accept array or { entries: [] } shape
  if (Array.isArray(record)) return record;
  if (record && record.entries && Array.isArray(record.entries)) return record.entries;
  // If stored shape is object with leaderboard property
  if (record && record.leaderboard && Array.isArray(record.leaderboard)) return record.leaderboard;
  // Fallback: return the record as single-entry array
  return record ? (Array.isArray(record) ? record : [record]) : [];
}
async function putLeaderboardToJSONBin(entries) {
  if (!JSONBIN_BIN_ID) throw new Error('JSONBIN_BIN_ID not configured');
  const url = `${JSONBIN_BASE}/b/${JSONBIN_BIN_ID}`;
  const payload = { leaderboard: entries };
  const res = await timeoutFetch(url, {
    method: 'PUT',
    headers: jsonbinPutHeaders(),
    body: JSON.stringify(payload)
  }, DEFAULT_TIMEOUT + 2000);
  if (!res.ok) {
    const text = await res.text().catch(()=>null);
    const err = new Error(`JSONBin PUT failed ${res.status} ${text || ''}`);
    err.status = res.status;
    throw err;
  }
  return true;
}

// Generic load/save with auto-fallback
export async function loadLeaderboard() {
  // Prefer backend if configured
  if (JSONBIN_BIN_ID) {
    try {
      const entries = await fetchLeaderboardFromJSONBin();
      backendOnline = true;

      // If backend returned an array, merge any local-only entries so users who
      // submitted locally without a master key still see themselves in the UI.
      if (Array.isArray(entries)) {
        const local = await loadLeaderboardFromLocal();
        const map = new Map();
        const keyFor = e => e.playerId ? `id:${e.playerId}` : (e.nickname ? `nick:${sanitizeNickname(e.nickname)}` : null);

        // Backend entries take precedence
        (entries || []).forEach(e => {
          const k = keyFor(e);
          if (k) map.set(k, e);
        });

        // Add local entries that do not exist on backend
        (local || []).forEach(e => {
          const k = keyFor(e);
          if (!k) return;
          if (!map.has(k)) map.set(k, e);
        });

        return Array.from(map.values());
      }

      return Array.isArray(entries) ? entries : [];
    } catch (e) {
      backendOnline = false;
      // Fall back to local
      return await loadLeaderboardFromLocal();
    }
  } else {
    // No bin configured -> local only
    backendOnline = false;
    return await loadLeaderboardFromLocal();
  }
}

export async function saveLeaderboard(entries) {
  // Try backend if configured and master key present
  if (JSONBIN_BIN_ID && JSONBIN_MASTER_KEY) {
    try {
      await putLeaderboardToJSONBin(entries);
      // Also mirror to local
      await saveLeaderboardToLocal(entries);
      backendOnline = true;
      return true;
    } catch (e) {
      console.warn('Backend save failed, saving locally instead', e);
      backendOnline = false;
      return await saveLeaderboardToLocal(entries);
    }
  }
  // If no master key or not configured, save locally
  return await saveLeaderboardToLocal(entries);
}

// High-level leaderboard utilities used by UI
function normalizeEntry(e) {
  return {
    playerId: e.playerId || e.id || null,
    nickname: sanitizeNickname(e.nickname || e.name || 'Anon'),
    timestamp: Number(e.timestamp || e.ts || Date.now()),
    stats: e.stats || e.data || {}
  };
}

export function getLeaderboardCategories() {
  return LEADERBOARD_CATEGORIES;
}

// comparator by category (desc)
function sortByCategory(entries, category) {
  const copy = (entries || []).map(e => ({ ...e }));
  switch (category) {
    case 'total_wins':
      return copy.sort((a,b) => (b.stats.totalWins||0) - (a.stats.totalWins||0));
    case 'win_streak':
      return copy.sort((a,b) => (b.stats.winStreak||0) - (a.stats.winStreak||0));
    case 'perfect_wins':
      return copy.sort((a,b) => (b.stats.perfectWins||0) - (a.stats.perfectWins||0));
    case 'quick_wins':
      return copy.sort((a,b) => (b.stats.quickWins||0) - (a.stats.quickWins||0));
    case 'win_rate':
      return copy.sort((a,b) => (b.stats.winRate||0) - (a.stats.winRate||0));
    case 'total_games':
      return copy.sort((a,b) => (b.stats.totalGames||0) - (a.stats.totalGames||0));
    default:
      return copy.sort((a,b) => (b.stats.totalWins||0) - (a.stats.totalWins||0));
  }
}

export async function getLeaderboard(category = 'total_wins', limit = 50) {
  const raw = await loadLeaderboard();
  const normalized = raw.map(normalizeEntry);
  const sorted = sortByCategory(normalized, category);
  return sorted.slice(0, limit);
}

export async function getPlayerRank(category = 'total_wins') {
  const profile = loadPlayerProfile();
  if (!profile || !profile.nickname) return null;
  const raw = await loadLeaderboard();
  const normalized = raw.map(normalizeEntry);
  const sorted = sortByCategory(normalized, category);
  // match by playerId if available, else by nickname
  const idx = sorted.findIndex(e => (profile.id && e.playerId === profile.id) || (e.nickname === sanitizeNickname(profile.nickname)));
  return idx >= 0 ? idx + 1 : null;
}

// Merge local analytics into leaderboard and save
export async function submitToLeaderboard(analytics) {
  try {
    const profile = loadPlayerProfile();
    if (!profile || !profile.nickname || !profile.shareStats) {
      console.warn('Profile not set or sharing disabled');
      return false;
    }
    const now = Date.now();
    
    // Transform analytics from nested structure to flat structure expected by UI
    const flattenedStats = {
      totalWins: analytics.battles?.wins || 0,
      winStreak: analytics.battles?.currentStreak || 0,
      perfectWins: analytics.battles?.perfectWins || 0,
      quickWins: analytics.battles?.quickWins || 0,
      winRate: parseFloat(analytics.battles?.winRate?.replace('%', '') || '0'),
      totalGames: analytics.battles?.totalGames || 0
    };
    
    const entry = {
      playerId: profile.id || generateUUID(),
      nickname: sanitizeNickname(profile.nickname),
      timestamp: now,
      stats: flattenedStats
    };
    // Load backend or local list
    const list = await loadLeaderboard();
    // Find existing by id or nickname
    const keyFor = e => e.playerId || (e.nickname ? sanitizeNickname(e.nickname) : null);
    const k = keyFor(entry);
    let found = false;
    const merged = (list || []).map(e => {
      const existingKey = keyFor(e);
      if (existingKey && existingKey === k) {
        found = true;
        // prefer newest timestamp
        return (Number(e.timestamp || 0) > Number(entry.timestamp || 0)) ? e : entry;
      }
      return e;
    });
    if (!found) merged.push(entry);
    // Save
    const saved = await saveLeaderboard(merged);
    if (saved) {
      // update profile lastSubmitted
      updatePlayerProfile({ id: entry.playerId, lastSubmitted: now });
    }
    return saved;
  } catch (e) {
    console.warn('submitToLeaderboard error', e);
    return false;
  }
}

// Remove player's entry from leaderboard (delete)
export async function resetLeaderboard() {
  const profile = loadPlayerProfile();
  const list = await loadLeaderboard();
  const filtered = (list || []).filter(e => {
    if (!profile) return true;
    if (e.playerId && profile.id) return e.playerId !== profile.id;
    if (e.nickname && profile.nickname) return sanitizeNickname(e.nickname) !== sanitizeNickname(profile.nickname);
    return true;
  });
  const ok = await saveLeaderboard(filtered);
  // clear profile sharing info locally
  updatePlayerProfile({ shareStats: false, lastSubmitted: null });
  return ok;
}

// Sync local analytics with backend (merge)
export async function syncLeaderboard() {
  syncing = true;
  try {
    const local = await loadLeaderboardFromLocal();
    let backend = [];
    try {
      backend = await loadLeaderboard();
    } catch {}
    // Build map keyed by playerId or nickname
    const map = new Map();
    const keyFor = e => e.playerId ? `id:${e.playerId}` : (e.nickname ? `nick:${sanitizeNickname(e.nickname)}` : null);
    (backend || []).forEach(e => {
      const k = keyFor(e);
      if (k) map.set(k, normalizeEntry(e));
    });
    (local || []).forEach(e => {
      const k = keyFor(e);
      if (!k) return;
      const existing = map.get(k);
      const candidate = normalizeEntry(e);
      if (!existing || (candidate.timestamp || 0) > (existing.timestamp || 0)) {
        map.set(k, candidate);
      }
    });
    const merged = Array.from(map.values());
    const saved = await saveLeaderboard(merged);
    syncing = false;
    return merged;
  } catch (e) {
    syncing = false;
    console.warn('syncLeaderboard failed', e);
    return null;
  }
}

export async function initializeLeaderboard() {
  // If JSONBIN_BIN_ID available, check backend health; else prepare local
  if (JSONBIN_BIN_ID) {
    try {
      await fetchLeaderboardFromJSONBin();
      backendOnline = true;
    } catch (e) {
      backendOnline = false;
    }
  } else {
    backendOnline = false;
  }
  // Ensure local cache exists
  const local = await loadLeaderboardFromLocal();
  if (!local || !local.length) {
    await saveLeaderboardToLocal(local || []);
  }
  return backendOnline || true;
}

export function isBackendOnline() { return backendOnline; }
export function isSyncing() { return syncing; }
export function canSubmitToLeaderboard() {
  const p = loadPlayerProfile();
  return !!(p && p.nickname && p.shareStats);
}

// Expose low-level configure for console/testing
window.configureJSONBin = configureJSONBin;
window.JSONBIN_BIN_ID = JSONBIN_BIN_ID;
window.JSONBIN_MASTER_KEY = JSONBIN_MASTER_KEY;