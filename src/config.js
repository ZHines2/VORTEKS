// config.js
// Configuration constants for VORTEKS gameplay mechanics

// Overheal System
export const OVERHEAL_LIMIT_MULT = 1.5; // Allow overheal up to 150% of maxHP
export const AI_ALLOW_OVERHEAL = false; // Initially restrict AI overheal for balance

// Energy System  
export const SAFETY_MAX_ENERGY = 12; // Maximum energy for UI display safety
export const LEGACY_MAX_ENERGY = 6; // Previous hard cap

// Burn System
export const MIN_BURN_TICK = 1; // Minimum burn damage per tick

// Storage & Migration
export const MIGRATION_VERSION = 2; // Increment for new storage schema

// Achievement Thresholds - Rebalanced for better progression
export const ACHIEVEMENTS = {
  MINTY_ENERGY_THRESHOLD: 7, // Reduced from 10 - Energy spent in single turn for Minty unlock
  SPICY_BURN_THRESHOLD: 8, // Reduced from 10 - Cumulative burn damage in battle for Spicy unlock
  PIERCER_DAMAGE_THRESHOLD: 8, // Reduced from 10 - Cumulative pierce damage in battle for Piercer unlock
  SCHOLAR_DRAW_THRESHOLD: 4, // Reduced from 5 - Cards drawn in single turn for Scholar unlock
  HEARTY_HP_THRESHOLD: 1, // Max HP to win battle for Hearty unlock
};

// UI Configuration
export const DECK_BUILDER = {
  MIN_CARD_WIDTH: 140, // Minimum card width for mobile responsiveness
  SCROLL_CONTAINER_SELECTOR: '.modal .box', // Scroll container for modals
};

// Debug Configuration
export const DEBUG = {
  EXPOSE_GAME_STATS: true, // Expose window.GameStats for QA
  LOG_MIGRATIONS: true, // Log storage migrations
};