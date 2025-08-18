import { Game, setLogFunction } from './game.js';
import { createRenderFunction, bump, bumpHP, bumpShield, fxBurn, fxFreeze, fxZap, fxFocus, fxSlash, fxSurge, fxEcho, fxReconsider, cardText, renderCost } from './ui.js';
import { openDeckBuilder, buildRandomDeck } from './deck-builder.js';
import { runSelfTests } from './tests.js';
import { initFaceGenerator, drawOppFace, setOpponentName } from './face-generator.js';
import { makePersonaDeck, createAIPlayer, createCampaignOpponent } from './ai.js';
import { createPlayer } from './player.js';
import { MOTTOS } from './mottos.js';
import { CARDS } from '../data/cards.js';
import { Campaign } from './campaign.js';
import { 
  getUnlockedCards, 
  isCardUnlocked, 
  unlockCard, 
  getUnlockableCardsInfo, 
  getUnlockableQuirksInfo,
  isQuirkUnlocked,
  getUnlockedQuirks,
  unlockQuirk,
  resetUnlocks,
  resetQuirks, 
  debugUnlock,
  checkPersonaDefeatUnlocks,
  checkAchievementUnlocks,
  recordBattleResult,
  // Flavor functions
  isFlavorUnlocked,
  getUnlockedFlavors,
  unlockFlavor,
  getUnlockableFlavorsInfo,
  getFlavorUnlockInfo,
  getCurrentFlavor,
  setCurrentFlavor,
  applyFlavor,
  checkFlavorUnlocks,
  resetFlavors,
  debugUnlockFlavor
} from './card-unlock.js';
import {
  loadTelemetry,
  saveTelemetry,
  resetTelemetry,
  getTelemetry,
  recordBattle,
  recordCardPlayed,
  recordCombat,
  recordTurn,
  recordQuirk,
  recordOpponent,
  recordAchievement,
  getAnalytics
} from './telemetry.js';
import {
  loadPlayerProfile,
  getPlayerProfile,
  updatePlayerProfile,
  submitToLeaderboard,
  getLeaderboard,
  getLeaderboardCategories,
  getPlayerRank,
  canSubmitToLeaderboard,
  resetLeaderboard,
  syncLeaderboard,
  initializeLeaderboard,
  isBackendOnline,
  isSyncing,
  LEADERBOARD_CATEGORIES,
  loadLeaderboard,
  saveLeaderboard,
  configureJSONBin
} from './leaderboard.js';
import { sanitizeNickname } from './utils.js';
import {
  loadIdleGame,
  saveIdleGame,
  getCreature,
  getCreatureInfo,
  feedCreature,
  playWithCreature,
  getPlayAvailability,
  meditateWithCreature,
  exploreRoom,
  interactWithRoomElement,
  setVortekName,
  resetCreature,
  updateCompanionFromGameplay,
  updateCreatureFromTelemetry,
  getRoomInteractionMessage
} from './idle-game.js';
import { initVortekGenerator, generateVortekAppearance, playVortekSound } from './vortek-generator.js';
import { generateChronicle, getCurrentChronicle, saveCurrentChronicle, clearCurrentChronicle } from './lore.js';
import { initializeAnalysisUI } from './analysis-ui.js';

const MUSIC_FILE = 'VORTEKS.mp3';
const LS_KEY = 'vorteks-muted';
const HELP_SHOWN_KEY = 'vorteks-help-shown';
const DEFEATED_KEY = 'vorteks-defeated';
const QUIRK_KEY = 'vorteks-selected-quirk';

// Initialize telemetry system
loadTelemetry();

// Initialize player profile for leaderboards
loadPlayerProfile();

// Configure JSONBin with public-read test bin before leaderboard initialization
configureJSONBin({ binId: '689f8e49d0ea881f405a220d' });

// Initialize leaderboard backend
initializeLeaderboard().then(() => {
  console.log('Leaderboard system initialized');
}).catch(error => {
  console.warn('Leaderboard initialization error:', error);
});

// Make leaderboard functions available globally for auto-submission and console testing
window.loadPlayerProfile = loadPlayerProfile;
window.getPlayerProfile = getPlayerProfile;
window.updatePlayerProfile = updatePlayerProfile;
window.canSubmitToLeaderboard = canSubmitToLeaderboard;
window.submitToLeaderboard = submitToLeaderboard;
window.getAnalytics = getAnalytics;
window.configureJSONBin = configureJSONBin;
window.initializeLeaderboard = initializeLeaderboard;
window.syncLeaderboard = syncLeaderboard;
window.loadLeaderboard = loadLeaderboard;
window.saveLeaderboard = saveLeaderboard;
window.getLeaderboard = getLeaderboard;
window.resetLeaderboard = resetLeaderboard;
window.getPlayerRank = getPlayerRank;
window.getLeaderboardCategories = getLeaderboardCategories;
window.isBackendOnline = isBackendOnline;
window.isSyncing = isSyncing;
window.LEADERBOARD_CATEGORIES = LEADERBOARD_CATEGORIES;

let music;
window.music = null; // Make music accessible globally for sound functions
const muteBtn = document.getElementById('muteBtn');
const helpBtn = document.getElementById('helpBtn');
const debugBtn = document.getElementById('debugBtn');
const unlocksBtn = document.getElementById('unlocksBtn');
const glossaryBtn = document.getElementById('glossaryBtn');
const defeatedBtn = document.getElementById('defeatedBtn');
const leaderboardBtn = document.getElementById('leaderboardBtn');
const telemetryBtn = document.getElementById('telemetryBtn');
const analysisBtn = document.getElementById('analysisBtn');
const companionBtn = document.getElementById('companionBtn');
const loreBtn = document.getElementById('loreBtn');

// Initialize idle game system
loadIdleGame();

// Defeated opponents helper functions
function loadDefeatedOpponents() {
  try {
    const data = localStorage.getItem(DEFEATED_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.warn('Failed to load defeated opponents:', e);
    return [];
  }
}

function saveDefeatedOpponents(list) {
  try {
    localStorage.setItem(DEFEATED_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('Failed to save defeated opponents:', e);
  }
}

function recordDefeatedOpponent(name, persona) {
  if (!name || !persona || name === 'NAME') return;
  
  const defeated = loadDefeatedOpponents();
  const timestamp = new Date().toISOString();
  
  // Check for duplicates (same name and persona)
  const exists = defeated.some(entry => entry.name === name && entry.persona === persona);
  if (!exists) {
    defeated.push({ name, persona, timestamp });
    saveDefeatedOpponents(defeated);
  }
}

function clearDefeatedOpponents() {
  saveDefeatedOpponents([]);
}

// Quirk persistence helper functions
function loadSelectedQuirk() {
  try {
    return localStorage.getItem(QUIRK_KEY);
  } catch (e) {
    console.warn('Failed to load selected quirk:', e);
    return null;
  }
}

function saveSelectedQuirk(quirkId) {
  try {
    if (quirkId) {
      localStorage.setItem(QUIRK_KEY, quirkId);
    } else {
      localStorage.removeItem(QUIRK_KEY);
    }
  } catch (e) {
    console.warn('Failed to save selected quirk:', e);
  }
}

function setupDefeatedOpponents() {
  const defeatedModal = document.getElementById('defeatedModal');
  const defeatedCloseBtn = document.getElementById('defeatedCloseBtn');

  // Defeated button click handler
  defeatedBtn.addEventListener('click', () => {
    renderDefeatedOpponents();
    defeatedModal.hidden = false;
  });

  // Close button handler
  defeatedCloseBtn.addEventListener('click', () => {
    defeatedModal.hidden = true;
  });

  // Telemetry modal setup
  const telemetryModal = document.getElementById('telemetryModal');
  const telemetryCloseBtn = document.getElementById('telemetryCloseBtn');

  // Telemetry button click handler
  telemetryBtn.addEventListener('click', () => {
    renderTelemetryData();
    telemetryModal.hidden = false;
  });

  // Analysis button click handler
  analysisBtn.addEventListener('click', () => {
    if (window.analysisUI) {
      window.analysisUI.show();
    }
  });

  // Telemetry close button handler
  telemetryCloseBtn.addEventListener('click', () => {
    telemetryModal.hidden = true;
  });

  // Lore modal setup
  const loreModal = document.getElementById('loreModal');
  const loreCloseBtn = document.getElementById('loreCloseBtn');
  const generateLoreBtn = document.getElementById('generateLoreBtn');
  const refreshLoreBtn = document.getElementById('refreshLoreBtn');
  const favoriteChronicleBtn = document.getElementById('favoriteChronicleBtn');
  
  // TTS elements
  const ttsToggleBtn = document.getElementById('ttsToggleBtn');
  const ttsControls = document.getElementById('ttsControls');
  const ttsPlayBtn = document.getElementById('ttsPlayBtn');
  const ttsPauseBtn = document.getElementById('ttsPauseBtn');
  const ttsStopBtn = document.getElementById('ttsStopBtn');
  const ttsStatusText = document.getElementById('ttsStatusText');
  
  // TTS state
  let ttsEnabled = localStorage.getItem('vorteks-tts-enabled') === 'true';
  let currentSpeech = null;
  let ttsIsPlaying = false;

  // Lore button click handler
  loreBtn.addEventListener('click', () => {
    renderLoreModal();
    loreModal.hidden = false;
  });

  // Lore close button handler
  loreCloseBtn.addEventListener('click', () => {
    stopChronicle(); // Stop any ongoing speech when closing modal
    loreModal.hidden = true;
  });

  // Generate new chronicle handler
  generateLoreBtn.addEventListener('click', () => {
    generateNewChronicle();
  });

  // Refresh current chronicle handler
  refreshLoreBtn.addEventListener('click', () => {
    refreshCurrentChronicle();
  });

  // Favorite chronicle handler
  favoriteChronicleBtn.addEventListener('click', () => {
    // TODO: Implement favorite system
    alert('Chronicle favoriting will be available in a future update!');
  });

  // TTS event handlers
  ttsToggleBtn.addEventListener('click', () => {
    toggleTTS();
  });
  
  ttsPlayBtn.addEventListener('click', () => {
    playChronicle();
  });
  
  ttsPauseBtn.addEventListener('click', () => {
    pauseChronicle();
  });
  
  ttsStopBtn.addEventListener('click', () => {
    stopChronicle();
  });
  
  // Initialize TTS UI state
  updateTTSButtonState();

  // Leaderboard modal setup
  const leaderboardModal = document.getElementById('leaderboardModal');
  const leaderboardCloseBtn = document.getElementById('leaderboardCloseBtn');
  const refreshLeaderboardBtn = document.getElementById('refreshLeaderboardBtn');
  const profileSettingsBtn = document.getElementById('profileSettingsBtn');
  const profileModal = document.getElementById('profileModal');
  const profileCancelBtn = document.getElementById('profileCancelBtn');
  const profileSaveBtn = document.getElementById('profileSaveBtn');
  const deleteProfileBtn = document.getElementById('deleteProfileBtn');
  const nicknameInput = document.getElementById('nicknameInput');
  const shareStatsCheckbox = document.getElementById('shareStatsCheckbox');

  let currentLeaderboardCategory = 'total_wins';

  // Leaderboard button click handler
  leaderboardBtn.addEventListener('click', async () => {
    await renderLeaderboardData();
    leaderboardModal.hidden = false;
    
    // If user hasn't set up their profile yet, prompt them after a short delay
    const profile = getPlayerProfile();
    if (!profile.nickname || !profile.shareStats) {
      setTimeout(() => {
        if (!leaderboardModal.hidden) { // Only show if leaderboard is still open
          showProfileSettings();
        }
      }, 1000); // 1 second delay to let them see the leaderboard first
    }
  });

  // Leaderboard close button handler
  leaderboardCloseBtn.addEventListener('click', () => {
    leaderboardModal.hidden = true;
  });

  // Refresh leaderboard button handler
  refreshLeaderboardBtn.addEventListener('click', async () => {
    await renderLeaderboardData();
  });

  // Profile settings button handler
  profileSettingsBtn.addEventListener('click', () => {
    showProfileSettings();
  });

  // Profile modal handlers
  profileCancelBtn.addEventListener('click', () => {
    profileModal.hidden = true;
  });

  profileSaveBtn.addEventListener('click', async () => {
    await saveProfileSettings();
  });

  deleteProfileBtn.addEventListener('click', () => {
    deleteLeaderboardEntry();
  });

  // Category tab handlers
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('leaderboard-tab')) {
      // Update active tab
      document.querySelectorAll('.leaderboard-tab').forEach(tab => tab.classList.remove('active'));
      e.target.classList.add('active');
      
      // Update current category and render
      currentLeaderboardCategory = e.target.dataset.category;
      renderLeaderboardCategory(currentLeaderboardCategory);
    }
  });

  // VORTEK Companion modal setup
  const companionModal = document.getElementById('companionModal');
  const companionCloseBtn = document.getElementById('companionCloseBtn');
  const feedCompanionBtn = document.getElementById('feedCompanionBtn');
  const playCompanionBtn = document.getElementById('playCompanionBtn');
  const meditateCompanionBtn = document.getElementById('meditateCompanionBtn');
  const exploreRoomBtn = document.getElementById('exploreRoomBtn');
  const nameEditBtn = document.getElementById('nameEditBtn');

  // VORTEK button click handler
  companionBtn.addEventListener('click', () => {
    // Update VORTEK from current telemetry before showing
    const creature = getCreature();
    if (creature) {
      updateCreatureFromTelemetry(); // Refresh from latest telemetry
    }
    renderCompanionData();
    companionModal.hidden = false;
  });

  // Companion close button handler
  companionCloseBtn.addEventListener('click', () => {
    companionModal.hidden = true;
  });

  // Name editing functionality (reusable function)
  function startNameEdit() {
    const currentName = document.getElementById('companionName').textContent;
    const nameElement = document.getElementById('companionName');
    
    // Create input field
    const input = document.createElement('input');
    input.type = 'text';
    input.id = 'nameEditInput';
    input.value = currentName;
    input.maxLength = 20;
    input.style.cssText = nameElement.style.cssText;
    input.style.background = 'var(--panel)';
    input.style.border = '1px solid var(--border)';
    input.style.borderRadius = '4px';
    input.style.padding = '2px 4px';
    input.style.width = 'auto';
    input.style.minWidth = '120px';
    
    // Replace name display with input
    nameElement.style.display = 'none';
    nameElement.parentNode.insertBefore(input, nameElement.nextSibling);
    input.focus();
    input.select();
    
    // Handle input completion
    function finishEditing() {
      const newName = input.value.trim();
      if (newName && newName !== currentName && setVortekName(newName)) {
        nameElement.textContent = newName;
        showCompanionMessage(`VORTEK renamed to ${newName}!`);
      }
      input.remove();
      nameElement.style.display = 'block';
    }
    
    input.addEventListener('blur', finishEditing);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') finishEditing();
      if (e.key === 'Escape') {
        input.remove();
        nameElement.style.display = 'block';
      }
    });
  }

  // Name edit button handler
  nameEditBtn.addEventListener('click', startNameEdit);

  // Make companion name itself clickable
  document.addEventListener('click', (e) => {
    if (e.target.id === 'companionName') {
      startNameEdit();
    }
  });

  // Room interaction handlers with mystical flavor
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('room-element')) {
      const elementName = e.target.id.replace('room', '').toLowerCase();
      const creature = getCreature();
      if (interactWithRoomElement(elementName)) {
        renderCompanionData();
        const mysticalMessage = getRoomInteractionMessage(elementName, creature, true);
        showCompanionMessage(mysticalMessage);
      } else {
        const failMessage = getRoomInteractionMessage(elementName, creature, false);
        showCompanionMessage(failMessage);
      }
    }
  });

  // VORTEK interaction handlers with personality-driven responses
  feedCompanionBtn.addEventListener('click', () => {
    if (feedCreature()) {
      renderCompanionData();
      const creature = getCreature();
      let message = 'Fed your VORTEK! Energy restored.';
      
      // Enhanced spiritual/philosophical feeding messages
      if (creature.loyalty >= 90) message = `${creature.name} receives your offering with infinite gratitude! Sacred energy flows.`;
      else if (creature.loyalty >= 70) message = `${creature.name} accepts your gift as communion of souls! Energy restored.`;
      else if (creature.playfulness >= 90) message = `${creature.name} transforms nourishment into pure joy! Energy dances!`;
      else if (creature.playfulness >= 70) message = `${creature.name} finds celebration in each morsel! Energy restored.`;
      else if (creature.wisdom >= 90) message = `${creature.name} contemplates the gift of sustenance! Energy flows like wisdom.`;
      else if (creature.wisdom >= 70) message = `${creature.name} understands: food is love made manifest! Energy restored.`;
      else if (creature.happiness >= 80) message = `${creature.name} radiates contentment with each bite! Energy restored.`;
      else if (creature.creativity >= 70) message = `${creature.name} tastes artistry in simple nourishment! Energy restored.`;
      else if (creature.focus >= 70) message = `${creature.name} mindfully savors each moment! Energy restored.`;
      else if (creature.courage >= 70) message = `${creature.name} grows stronger for future challenges! Energy restored.`;
      
      showCompanionMessage(message);
    } else {
      const creature = getCreature();
      let message = 'Your VORTEK is not hungry right now.';
      
      // Enhanced spiritual rejection messages
      if (creature.loyalty >= 90) message = `${creature.name} sends waves of gratitude but needs no earthly sustenance right now.`;
      else if (creature.loyalty >= 70) message = `${creature.name} feels your love but is content for now.`;
      else if (creature.focus >= 90) message = `${creature.name} dwells in perfect satiation of spirit.`;
      else if (creature.focus >= 70) message = `${creature.name} is absorbed in higher contemplation.`;
      else if (creature.wisdom >= 90) message = `${creature.name} has transcended the need for material nourishment.`;
      else if (creature.wisdom >= 70) message = `${creature.name} is sustained by wisdom alone right now.`;
      else if (creature.playfulness >= 70) message = `${creature.name} is too excited about other things to eat!`;
      
      showCompanionMessage(message);
    }
  });

  playCompanionBtn.addEventListener('click', () => {
    const result = playWithCreature();
    if (result.success) {
      renderCompanionData();
      const creature = getCreature();
      let message = 'Played with your VORTEK! Happiness increased.';
      
      // Enhanced mystical play messages
      if (creature.playfulness >= 90) message = `${creature.name} transcends into pure play-bliss! Happiness becomes radiance!`;
      else if (creature.playfulness >= 70) message = `${creature.name} dances with the cosmic joy of existence! Happiness soars!`;
      else if (creature.loyalty >= 90) message = `${creature.name} weaves sacred bonds through shared laughter! Happiness deepens.`;
      else if (creature.loyalty >= 70) message = `${creature.name} treasures these moments beyond measure! Happiness increased.`;
      else if (creature.creativity >= 90) message = `${creature.name} paints reality with pure imagination! Happiness sparkles!`;
      else if (creature.creativity >= 70) message = `${creature.name} creates art from the moment itself! Happiness increased.`;
      else if (creature.courage >= 70) message = `${creature.name} finds strength in joyful connection! Happiness increased.`;
      else if (creature.wisdom >= 70) message = `${creature.name} discovers wisdom hidden in play! Happiness increased.`;
      else if (creature.focus >= 70) message = `${creature.name} enters the meditative flow of pure fun! Happiness increased.`;
      else if (creature.curiosity >= 70) message = `${creature.name} explores the mysteries of joy! Happiness increased.`;
      
      // Add experience gain notification if it occurred
      if (result.effects.gainedExp) {
        message += ' ✨ Experience gained from joyful play!';
      }
      
      showCompanionMessage(message);
    } else {
      const creature = getCreature();
      let message = 'Your VORTEK cannot play right now.';
      
      // Specific messages based on the reason
      if (result.reason === 'cooldown') {
        const mins = result.minutesRemaining;
        if (creature.loyalty >= 90) message = `${creature.name} yearns to play but needs ${mins} minutes to regain enthusiasm.`;
        else if (creature.loyalty >= 70) message = `${creature.name} loves you too much to play half-heartedly. Wait ${mins} minutes.`;
        else if (creature.wisdom >= 70) message = `${creature.name} knows all things have their season. ${mins} minutes until playtime.`;
        else message = `${creature.name} needs ${mins} more minutes before playing again.`;
      } else if (result.reason === 'energy') {
        if (creature.focus >= 70) message = `${creature.name} cannot focus enough energy for proper play. (Need ${result.energyNeeded} energy)`;
        else if (creature.playfulness >= 70) message = `${creature.name} will play with renewed spirit once rested! (Need ${result.energyNeeded} energy)`;
        else message = `${creature.name} is too tired to play. (Need ${result.energyNeeded} energy, have ${result.energyCurrent})`;
      }
      
      showCompanionMessage(message);
    }
  });

  meditateCompanionBtn.addEventListener('click', () => {
    if (meditateWithCreature()) {
      renderCompanionData();
      const creature = getCreature();
      let message = 'Meditated together! Wisdom and focus increased.';
      
      // Enhanced mystical meditation messages
      if (creature.focus >= 90 && creature.wisdom >= 90) message = `${creature.name} touches the infinite mind! Transcendence achieved!`;
      else if (creature.focus >= 90) message = `${creature.name} achieves diamond-clarity awareness! Focus perfected!`;
      else if (creature.wisdom >= 90) message = `${creature.name} drinks from the eternal well! Wisdom overflows!`;
      else if (creature.focus >= 70) message = `${creature.name} enters the stillness beyond thought! Wisdom and focus greatly increased.`;
      else if (creature.wisdom >= 70) message = `${creature.name} channels ancient understanding! Profound insights flow.`;
      else if (creature.loyalty >= 90) message = `${creature.name} merges consciousness with yours! Unity achieved!`;
      else if (creature.loyalty >= 70) message = `${creature.name} finds divine peace in your presence! Wisdom and focus increased.`;
      else if (creature.creativity >= 70) message = `${creature.name} paints visions in the mind's eye! Wisdom and focus increased.`;
      else if (creature.courage >= 70) message = `${creature.name} faces inner depths fearlessly! Wisdom and focus increased.`;
      else if (creature.curiosity >= 70) message = `${creature.name} explores infinite inner worlds! Wisdom and focus increased.`;
      
      showCompanionMessage(message);
    } else {
      const creature = getCreature();
      let message = 'Your VORTEK needs more energy to meditate.';
      
      // Enhanced meditation rejection messages
      if (creature.wisdom >= 90) message = `${creature.name} knows true meditation requires complete presence of energy.`;
      else if (creature.wisdom >= 70) message = `${creature.name} understands: the mind needs fuel for deep contemplation.`;
      else if (creature.focus >= 90) message = `${creature.name} maintains perfect awareness of energy limitations.`;
      else if (creature.focus >= 70) message = `${creature.name} cannot achieve focus without sufficient life force.`;
      else if (creature.loyalty >= 70) message = `${creature.name} honors meditation too much to practice it weakly.`;
      
      showCompanionMessage(message);
    }
  });

  exploreRoomBtn.addEventListener('click', () => {
    if (exploreRoom()) {
      renderCompanionData();
      const creature = getCreature();
      let message = 'Explored the room together! Curiosity increased.';
      
      // Enhanced mystical exploration messages
      if (creature.curiosity >= 90) message = `${creature.name} unravels cosmic mysteries hidden in plain sight! Curiosity transcends!`;
      else if (creature.curiosity >= 70) message = `${creature.name} discovers infinite worlds within finite space! Curiosity greatly increased.`;
      else if (creature.creativity >= 90) message = `${creature.name} reimagines reality through artistic vision! Curiosity inspired!`;
      else if (creature.creativity >= 70) message = `${creature.name} finds beauty in every hidden corner! Curiosity increased.`;
      else if (creature.playfulness >= 90) message = `${creature.name} transforms exploration into cosmic dance! Curiosity celebrates!`;
      else if (creature.playfulness >= 70) message = `${creature.name} makes adventure from simple discovery! Curiosity increased.`;
      else if (creature.wisdom >= 70) message = `${creature.name} seeks understanding in all things! Curiosity increased.`;
      else if (creature.courage >= 70) message = `${creature.name} boldly ventures into unknown territory! Curiosity increased.`;
      else if (creature.focus >= 70) message = `${creature.name} perceives details invisible to others! Curiosity increased.`;
      
      showCompanionMessage(message);
    } else {
      const creature = getCreature();
      let message = 'Need to wait before exploring again.';
      
      // Enhanced exploration cooldown messages
      if (creature.curiosity >= 90) message = `${creature.name} dwells in contemplation of infinite discoveries already made.`;
      else if (creature.curiosity >= 70) message = `${creature.name} is still absorbing the wisdom of the last revelation.`;
      else if (creature.wisdom >= 90) message = `${creature.name} knows all knowledge needs time to ripen in the soul.`;
      else if (creature.wisdom >= 70) message = `${creature.name} believes true understanding cannot be rushed.`;
      else if (creature.focus >= 70) message = `${creature.name} is processing profound insights from recent exploration.`;
      else if (creature.loyalty >= 70) message = `${creature.name} wants to share discoveries when the time is right.`;
      
      showCompanionMessage(message);
    }
  });

  function renderCompanionData() {
    const creatureInfo = getCreatureInfo();
    const creature = getCreature();
    
    // Generate and display pixel art appearance
    const vortekAppearance = generateVortekAppearance(creature);
    
    // Replace the emoji display with canvas
    const pixelArtContainer = document.getElementById('companionPixelArt');
    const existingCanvas = document.getElementById('vortekCanvas');
    if (existingCanvas && pixelArtContainer) {
      // Canvas is already in the DOM from HTML, just update its content
      // The generateVortekAppearance function already draws to the canvas
    }
    
    // Update VORTEK name and allow editing
    document.getElementById('companionName').textContent = creatureInfo.name;
    
    // Update stage display with personality info
    const stageText = creatureInfo.personalityDisplay ? 
      `${creatureInfo.stageName} (${creatureInfo.personalityDisplay})` : 
      creatureInfo.stageName;
    document.getElementById('companionStage').textContent = stageText;
    document.getElementById('companionLevel').textContent = creatureInfo.level;
    
    // Update sound display and add click handler
    const soundElement = document.getElementById('companionSound');
    if (soundElement && vortekAppearance.sound) {
      soundElement.textContent = `🔊 ${vortekAppearance.sound}`;
      soundElement.onclick = () => playVortekSound(vortekAppearance.sound);
      soundElement.title = `Click to hear ${creature.name}'s unique sound: "${vortekAppearance.sound}"`;
    }
    
    // Add visual effects to canvas container based on stats
    const canvasElement = document.getElementById('vortekCanvas');
    if (canvasElement && creatureInfo.visualEffects && creatureInfo.visualEffects.length > 0) {
      canvasElement.title = creatureInfo.visualEffects.join(' • ');
      canvasElement.style.filter = 'drop-shadow(0 0 8px rgba(119, 255, 221, 0.6))';
    } else if (canvasElement) {
      canvasElement.title = '';
      canvasElement.style.filter = 'drop-shadow(0 0 4px rgba(119, 255, 221, 0.3))';
    }
    
    // Update room size class based on evolution stage
    const roomElement = document.getElementById('vortekRoom');
    roomElement.className = `vortek-${creatureInfo.stageSize}`;
    
    // Add personality-based visual effects
    if (creatureInfo.happiness >= 90) roomElement.classList.add('happiness-high');
    if (creatureInfo.energy >= 95) roomElement.classList.add('energy-high');
    if (creatureInfo.power >= 85 || creatureInfo.courage >= 85) roomElement.classList.add('power-high');
    if (creatureInfo.creativity >= 80) roomElement.classList.add('creativity-high');
    if (creatureInfo.focus >= 80) roomElement.classList.add('focus-high');
    if (creatureInfo.playfulness >= 80) roomElement.classList.add('playfulness-high');
    
    // Update core stats
    document.getElementById('companionHappiness').textContent = Math.floor(creatureInfo.happiness);
    document.getElementById('companionEnergy').textContent = Math.floor(creatureInfo.energy);
    document.getElementById('companionWisdom').textContent = Math.floor(creatureInfo.wisdom);
    document.getElementById('companionPower').textContent = Math.floor(creatureInfo.power);
    
    // Update extended stats
    document.getElementById('companionCuriosity').textContent = Math.floor(creatureInfo.curiosity);
    document.getElementById('companionCreativity').textContent = Math.floor(creatureInfo.creativity);
    document.getElementById('companionLoyalty').textContent = Math.floor(creatureInfo.loyalty);
    document.getElementById('companionPlayfulness').textContent = Math.floor(creatureInfo.playfulness);
    document.getElementById('companionFocus').textContent = Math.floor(creatureInfo.focus);
    document.getElementById('companionCourage').textContent = Math.floor(creatureInfo.courage);
    
    // Update progress bars
    document.getElementById('happinessBar').style.width = `${creatureInfo.happiness}%`;
    document.getElementById('energyBar').style.width = `${creatureInfo.energy}%`;
    document.getElementById('wisdomBar').style.width = `${creatureInfo.wisdom}%`;
    document.getElementById('powerBar').style.width = `${creatureInfo.power}%`;
    
    document.getElementById('curiosityBar').style.width = `${creatureInfo.curiosity}%`;
    document.getElementById('creativityBar').style.width = `${creatureInfo.creativity}%`;
    document.getElementById('loyaltyBar').style.width = `${creatureInfo.loyalty}%`;
    document.getElementById('playfulnessBar').style.width = `${creatureInfo.playfulness}%`;
    document.getElementById('focusBar').style.width = `${creatureInfo.focus}%`;
    document.getElementById('courageBar').style.width = `${creatureInfo.courage}%`;
    
    // Update experience
    document.getElementById('companionExp').textContent = Math.floor(creatureInfo.experience);
    document.getElementById('companionExpNeeded').textContent = creatureInfo.expNeeded;
    document.getElementById('expBar').style.width = `${creatureInfo.expProgress}%`;
    
    // Update evolution progress
    updateEvolutionProgress(creatureInfo);
    
    // Update influences with performance modifiers
    document.getElementById('battleInfluence').textContent = `${creatureInfo.battleInfluence}% (+${creatureInfo.performanceModifiers.battleBonus}% battle)`;
    document.getElementById('cardMastery').textContent = `${creatureInfo.cardMastery}% (${creatureInfo.performanceModifiers.experienceMultiplier.toFixed(1)}x exp)`;
    document.getElementById('strategicDepth').textContent = `${creatureInfo.strategicDepth}% (${(100 - creatureInfo.performanceModifiers.energyEfficiency * 100).toFixed(0)}% efficiency)`;
    
    // Update status messages
    document.getElementById('companionStatus').textContent = creatureInfo.statusMessage;
    document.getElementById('companionMood').textContent = creatureInfo.moodMessage;
    document.getElementById('roomActivity').textContent = creatureInfo.roomActivity;
    
    // Update room elements visibility
    updateRoomElements(creatureInfo);
    
    // Update VORTEK button notification
    updateCompanionNotification();
  }

  function updateEvolutionProgress(creatureInfo) {
    const stages = [
      { name: 'EGG', displayName: 'Egg', level: 0 },
      { name: 'HATCHLING', displayName: 'VORTEK Sprite', level: 5 },
      { name: 'JUVENILE', displayName: 'Echo Beast', level: 15 },
      { name: 'ADULT', displayName: 'Card Master', level: 30 },
      { name: 'ELDER', displayName: 'VORTEKS Avatar', level: 50 }
    ];
    
    const currentStageIndex = stages.findIndex(stage => stage.name === creatureInfo.stage);
    const nextStageIndex = currentStageIndex + 1;
    
    if (nextStageIndex < stages.length) {
      const nextStage = stages[nextStageIndex];
      const currentLevel = creatureInfo.level;
      const nextLevel = nextStage.level;
      const progress = Math.min(100, (currentLevel / nextLevel) * 100);
      
      document.getElementById('evolutionText').textContent = `Next Evolution: Level ${nextLevel} (${nextStage.displayName})`;
      document.getElementById('evolutionBar').style.width = `${progress}%`;
      document.getElementById('evolutionProgress').style.display = 'block';
    } else {
      // Max evolution reached
      document.getElementById('evolutionText').textContent = 'Maximum Evolution Achieved!';
      document.getElementById('evolutionBar').style.width = '100%';
      document.getElementById('evolutionProgress').style.display = 'block';
    }
  }

  function updateRoomElements(creatureInfo) {
    const elements = ['bed', 'mirror', 'bookshelf', 'toybox', 'plant', 'artEasel'];
    
    elements.forEach(elementName => {
      const element = document.getElementById(`room${elementName.charAt(0).toUpperCase() + elementName.slice(1)}`);
      if (element) {
        if (creatureInfo.unlockedRoomElements.includes(elementName)) {
          element.classList.remove('hidden');
          element.classList.add('unlocked');
          element.title = getRoomElementDescription(elementName, true);
        } else {
          element.classList.add('hidden');
          element.classList.remove('unlocked');
          // Don't show locked elements for now to maintain clean look
        }
      }
    });
    
    // Add hints about next unlock in the room activity message
    updateRoomUnlockHints(creatureInfo);
  }
  
  function getRoomElementDescription(elementName, unlocked) {
    const descriptions = {
      bed: unlocked ? 'Cozy bed for resting (+15 Energy, +3 Happiness)' : '',
      mirror: unlocked ? 'Magical mirror for self-reflection (+2 Curiosity, +2 Happiness)' : '',
      bookshelf: unlocked ? 'Wisdom-filled bookshelf (-5 Energy, +4 Wisdom, +2 Focus)' : '',
      toybox: unlocked ? 'Playful toybox for fun (-3 Energy, +5 Playfulness, +5 Happiness)' : '',
      plant: unlocked ? 'Peaceful plant for focus (-2 Energy, +3 Focus, +2 Wisdom)' : '',
      artEasel: unlocked ? 'Creative art easel (-8 Energy, +6 Creativity, +4 Happiness)' : ''
    };
    return descriptions[elementName] || '';
  }
  
  function updateRoomUnlockHints(creatureInfo) {
    const creature = getCreature();
    const unlockHints = [];
    
    // Check what can be unlocked next
    if (!creature.roomElements.mirror.unlocked && creature.level >= 5) {
      const curiosityNeeded = Math.max(0, 30 - creature.curiosity);
      if (curiosityNeeded > 0) {
        unlockHints.push(`🪞 Mirror: Need ${curiosityNeeded} more Curiosity`);
      } else {
        unlockHints.push(`🪞 Mirror: Ready to unlock!`);
      }
    }
    
    if (!creature.roomElements.toybox.unlocked && creature.level >= 8) {
      const playfulnessNeeded = Math.max(0, 50 - creature.playfulness);
      if (playfulnessNeeded > 0) {
        unlockHints.push(`🧸 Toybox: Need ${playfulnessNeeded} more Playfulness`);
      } else {
        unlockHints.push(`🧸 Toybox: Ready to unlock!`);
      }
    }
    
    if (!creature.roomElements.bookshelf.unlocked && creature.level >= 10) {
      const wisdomNeeded = Math.max(0, 40 - creature.wisdom);
      if (wisdomNeeded > 0) {
        unlockHints.push(`📚 Bookshelf: Need ${wisdomNeeded} more Wisdom`);
      } else {
        unlockHints.push(`📚 Bookshelf: Ready to unlock!`);
      }
    }
    
    if (!creature.roomElements.plant.unlocked && creature.level >= 15) {
      const focusNeeded = Math.max(0, 45 - creature.focus);
      if (focusNeeded > 0) {
        unlockHints.push(`🪴 Plant: Need ${focusNeeded} more Focus`);
      } else {
        unlockHints.push(`🪴 Plant: Ready to unlock!`);
      }
    }
    
    if (!creature.roomElements.artEasel.unlocked && creature.level >= 20) {
      const creativityNeeded = Math.max(0, 50 - creature.creativity);
      if (creativityNeeded > 0) {
        unlockHints.push(`🎨 Art Easel: Need ${creativityNeeded} more Creativity`);
      } else {
        unlockHints.push(`🎨 Art Easel: Ready to unlock!`);
      }
    }
    
    // Add level-based hints for locked elements
    if (creature.level < 5) unlockHints.push(`Reach Level 5 to unlock the Mirror`);
    else if (creature.level < 8) unlockHints.push(`Reach Level 8 to unlock the Toybox`);
    else if (creature.level < 10) unlockHints.push(`Reach Level 10 to unlock the Bookshelf`);
    else if (creature.level < 15) unlockHints.push(`Reach Level 15 to unlock the Plant`);
    else if (creature.level < 20) unlockHints.push(`Reach Level 20 to unlock the Art Easel`);
    
    // Update hint display
    const hintElement = document.getElementById('roomUnlockHints');
    if (hintElement && unlockHints.length > 0) {
      hintElement.textContent = `Next: ${unlockHints[0]}`;
      hintElement.style.display = 'block';
    } else if (hintElement) {
      hintElement.style.display = 'none';
    }
  }

  function showCompanionMessage(message) {
    // Enhanced message display with better animations
    const statusEl = document.getElementById('companionStatus');
    const originalMessage = statusEl.textContent;
    statusEl.textContent = message;
    statusEl.style.color = 'var(--good)';
    statusEl.style.transform = 'scale(1.05)';
    statusEl.style.transition = 'all 0.3s ease';
    
    setTimeout(() => {
      statusEl.textContent = originalMessage;
      statusEl.style.color = 'var(--accent)';
      statusEl.style.transform = 'scale(1)';
    }, 2500);
  }

  function updateCompanionNotification() {
    const creatureInfo = getCreatureInfo();
    if (creatureInfo.needsAttention) {
      companionBtn.classList.add('needs-attention');
    } else {
      companionBtn.classList.remove('needs-attention');
    }
  }

  // Update VORTEK notification periodically
  setInterval(() => {
    if (!companionModal.hidden) {
      renderCompanionData();
    } else {
      updateCompanionNotification();
    }
  }, 30000); // Update every 30 seconds

  function renderTelemetryData() {
    const analytics = getAnalytics();
    
    // Battle Statistics
    const battleStatsEl = document.getElementById('telemetryBattleStats');
    battleStatsEl.innerHTML = `
      <div><strong>Total Games:</strong> ${analytics.battles.totalGames}</div>
      <div><strong>Record:</strong> ${analytics.battles.wins}W - ${analytics.battles.losses}L (${analytics.battles.winRate})</div>
      <div><strong>Current Streak:</strong> ${analytics.battles.currentStreak} | <strong>Best Streak:</strong> ${analytics.battles.bestStreak}</div>
      <div><strong>Perfect Wins:</strong> ${analytics.battles.perfectWins} | <strong>Quick Wins:</strong> ${analytics.battles.quickWins}</div>
    `;
    
    // Card Usage Analysis
    const cardStatsEl = document.getElementById('telemetryCardStats');
    const favoriteCardName = analytics.cards.favoriteCard ? 
      CARDS.find(c => c.id === analytics.cards.favoriteCard)?.name || analytics.cards.favoriteCard : 'None';
    
    cardStatsEl.innerHTML = `
      <div><strong>Cards Played:</strong> ${analytics.cards.totalPlayed} (${analytics.cards.uniqueCards} unique)</div>
      <div><strong>Favorite Card:</strong> ${favoriteCardName} (${analytics.cards.favoriteCount} times)</div>
      <div><strong>Type Distribution:</strong> ⚔${analytics.cards.typeDistribution.attack} 🛠${analytics.cards.typeDistribution.skill} 💎${analytics.cards.typeDistribution.power}</div>
    `;
    
    // Gameplay Patterns
    const patternsEl = document.getElementById('telemetryPatterns');
    patternsEl.innerHTML = `
      <div><strong>Combat Efficiency:</strong> ${analytics.combat.efficiency} damage per energy</div>
      <div><strong>Total Damage:</strong> ${analytics.combat.totalDamage} dealt | ${analytics.combat.damageTaken} taken</div>
      <div><strong>Healing/Shield:</strong> ${analytics.combat.healingReceived || 0} healed | ${analytics.combat.shieldGained || 0} shield</div>
      <div><strong>Max Single Hit:</strong> ${analytics.combat.maxSingleHit} | <strong>Max Energy:</strong> ${analytics.combat.maxEnergyReached}</div>
      <div><strong>Turn Efficiency:</strong> ${analytics.turns.avgCardsPerTurn} cards, ${analytics.turns.avgEnergyPerTurn} energy per turn</div>
      <div><strong>Echo Uses:</strong> ${analytics.turns.echoUses} | <strong>All-Energy Turns:</strong> ${analytics.turns.efficiencyTurns}</div>
    `;
    
    // Achievement Progress  
    const achievementsEl = document.getElementById('telemetryAchievements');
    const quirkName = analytics.quirks.favorite || 'None';
    const targetName = analytics.opponents.favoriteTarget || 'None';
    
    achievementsEl.innerHTML = `
      <div><strong>Achievements Unlocked:</strong> ${analytics.achievements.unlockedCount}</div>
      <div><strong>Favorite Quirk:</strong> ${quirkName} (${analytics.quirks.favoriteCount} times)</div>
      <div><strong>Opponents Defeated:</strong> ${analytics.opponents.uniqueDefeated} types | <strong>Favorite Target:</strong> ${targetName}</div>
      <div><strong>Easter Eggs Seen:</strong> ${analytics.opponents.easterEggsSeen} | <strong>Play Time:</strong> ${analytics.session.playTime}</div>
      <div><strong>First Played:</strong> ${analytics.session.firstPlayed}</div>
    `;
  }

  // Lore rendering functions
  function renderLoreModal() {
    const currentChronicle = getCurrentChronicle();
    if (currentChronicle) {
      displayChronicle(currentChronicle);
    } else {
      displayWelcomeMessage();
    }
  }

  function generateNewChronicle() {
    const generateBtn = document.getElementById('generateLoreBtn');
    generateBtn.disabled = true;
    generateBtn.textContent = '🌌 Weaving tale...';
    
    // Add a small delay for dramatic effect
    setTimeout(() => {
      try {
        const chronicle = generateChronicle();
        saveCurrentChronicle(chronicle);
        displayChronicle(chronicle);
      } catch (error) {
        console.error('Error generating chronicle:', error);
        displayErrorMessage();
      } finally {
        generateBtn.disabled = false;
        generateBtn.textContent = '🌌 Generate New Chronicle';
      }
    }, 1000);
  }

  function refreshCurrentChronicle() {
    const currentChronicle = getCurrentChronicle();
    if (currentChronicle) {
      displayChronicle(currentChronicle);
    } else {
      generateNewChronicle();
    }
  }

  function displayChronicle(chronicle) {
    const titleEl = document.getElementById('chronicleTitle');
    const textEl = document.getElementById('chronicleText');
    const insightsEl = document.getElementById('chronicleInsights');
    const statsEl = document.getElementById('chronicleStats');

    // Stop any ongoing speech when new chronicle is displayed
    stopChronicle();

    titleEl.textContent = chronicle.title;
    textEl.innerHTML = formatChronicleText(chronicle.content);
    
    // Show insights
    insightsEl.style.display = 'block';
    statsEl.textContent = chronicle.insights;
    
    // Show favorite button
    const favoriteBtn = document.getElementById('favoriteChronicleBtn');
    favoriteBtn.hidden = false;
    
    // Update TTS controls for new content
    if (ttsEnabled) {
      updateTTSControlsState();
    }
  }

  function displayWelcomeMessage() {
    const titleEl = document.getElementById('chronicleTitle');
    const textEl = document.getElementById('chronicleText');
    const insightsEl = document.getElementById('chronicleInsights');

    // Stop any ongoing speech
    stopChronicle();

    titleEl.textContent = 'Welcome to the VORTEKS Chronicles';
    textEl.innerHTML = `
      <div style="text-align:center; opacity:0.7; padding:40px 20px;">
        <div style="font-size:48px; margin-bottom:16px;">📜</div>
        <div style="font-size:16px; color:var(--accent);">The Cosmic Scrolls Await</div>
        <div style="margin-top:8px;">Click "Generate New Chronicle" to weave a tale of your adventures through the VORTEKS universe, drawing from your battles, your VORTEK companion's growth, and the mysteries you've unlocked.</div>
      </div>
    `;
    insightsEl.style.display = 'none';
    
    // Hide favorite button
    const favoriteBtn = document.getElementById('favoriteChronicleBtn');
    favoriteBtn.hidden = true;
    
    // Reset TTS controls
    if (ttsEnabled) {
      updateTTSControlsState();
    }
  }

  function displayErrorMessage() {
    const titleEl = document.getElementById('chronicleTitle');
    const textEl = document.getElementById('chronicleText');
    
    titleEl.textContent = 'Chronicle Generation Error';
    textEl.innerHTML = `
      <div style="text-align:center; opacity:0.7; padding:40px 20px;">
        <div style="font-size:48px; margin-bottom:16px;">⚠️</div>
        <div style="font-size:16px; color:var(--bad);">The Cosmic Scrolls are temporarily unavailable</div>
        <div style="margin-top:8px;">There was an error generating your chronicle. Please try again.</div>
      </div>
    `;
  }

  function formatChronicleText(text) {
    // Add some simple formatting to make the text more readable
    return text
      .split('\n\n')
      .map(paragraph => `<p style="margin-bottom:16px;">${paragraph}</p>`)
      .join('');
  }

  // TTS Functions
  function toggleTTS() {
    ttsEnabled = !ttsEnabled;
    localStorage.setItem('vorteks-tts-enabled', ttsEnabled.toString());
    updateTTSButtonState();
    
    if (!ttsEnabled && currentSpeech) {
      stopChronicle();
    }
  }
  
  function updateTTSButtonState() {
    if (!window.speechSynthesis) {
      ttsToggleBtn.disabled = true;
      ttsToggleBtn.textContent = '🔇 TTS Not Available';
      ttsToggleBtn.title = 'Text-to-speech is not supported in this browser';
      return;
    }
    
    ttsToggleBtn.textContent = ttsEnabled ? '🔊 Read Aloud (ON)' : '🔇 Read Aloud (OFF)';
    ttsToggleBtn.title = ttsEnabled ? 'Disable text-to-speech' : 'Enable text-to-speech';
    ttsControls.style.display = ttsEnabled ? 'flex' : 'none';
    
    if (ttsEnabled) {
      updateTTSControlsState();
    }
  }
  
  function updateTTSControlsState() {
    if (!currentSpeech || !ttsIsPlaying) {
      ttsPlayBtn.disabled = false;
      ttsPauseBtn.disabled = true;
      ttsStopBtn.disabled = true;
      ttsStatusText.textContent = 'Ready to read';
    } else {
      ttsPlayBtn.disabled = ttsIsPlaying && !window.speechSynthesis.paused;
      ttsPauseBtn.disabled = !ttsIsPlaying || window.speechSynthesis.paused;
      ttsStopBtn.disabled = false;
      
      if (window.speechSynthesis.paused) {
        ttsStatusText.textContent = 'Paused';
      } else if (ttsIsPlaying) {
        ttsStatusText.textContent = 'Reading...';
      }
    }
  }
  
  function cleanTextForSpeech(text) {
    // Remove HTML tags and clean up text for speech
    return text
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/\n\n+/g, '. ') // Replace paragraph breaks with pauses
      .replace(/\n/g, ' ') // Replace line breaks with spaces
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }
  
  function playChronicle() {
    if (!window.speechSynthesis || !ttsEnabled) return;
    
    // If paused, resume
    if (currentSpeech && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      updateTTSControlsState();
      return;
    }
    
    // Stop any existing speech
    if (currentSpeech) {
      stopChronicle();
    }
    
    // Get the chronicle text
    const titleEl = document.getElementById('chronicleTitle');
    const textEl = document.getElementById('chronicleText');
    
    if (!titleEl || !textEl) return;
    
    const title = titleEl.textContent;
    const content = cleanTextForSpeech(textEl.textContent);
    
    if (!content.trim()) {
      ttsStatusText.textContent = 'No text to read';
      return;
    }
    
    // Create speech with title and content
    const speechText = `${title}. ${content}`;
    currentSpeech = new SpeechSynthesisUtterance(speechText);
    
    // Configure speech settings
    currentSpeech.rate = 0.9; // Slightly slower for better comprehension
    currentSpeech.pitch = 1.0;
    currentSpeech.volume = 0.8;
    
    // Set event handlers
    currentSpeech.onstart = () => {
      ttsIsPlaying = true;
      updateTTSControlsState();
    };
    
    currentSpeech.onend = () => {
      ttsIsPlaying = false;
      currentSpeech = null;
      ttsStatusText.textContent = 'Reading complete';
      updateTTSControlsState();
    };
    
    currentSpeech.onerror = (event) => {
      console.error('Speech synthesis error:', event.error);
      ttsIsPlaying = false;
      currentSpeech = null;
      ttsStatusText.textContent = 'Error occurred';
      updateTTSControlsState();
    };
    
    currentSpeech.onpause = () => {
      updateTTSControlsState();
    };
    
    currentSpeech.onresume = () => {
      updateTTSControlsState();
    };
    
    // Start speaking
    window.speechSynthesis.speak(currentSpeech);
    ttsStatusText.textContent = 'Starting...';
    updateTTSControlsState();
  }
  
  function pauseChronicle() {
    if (!window.speechSynthesis || !currentSpeech || !ttsIsPlaying) return;
    
    window.speechSynthesis.pause();
    updateTTSControlsState();
  }
  
  function stopChronicle() {
    if (!window.speechSynthesis) return;
    
    window.speechSynthesis.cancel();
    ttsIsPlaying = false;
    currentSpeech = null;
    ttsStatusText.textContent = 'Stopped';
    updateTTSControlsState();
  }

  // Leaderboard rendering functions
  async function renderLeaderboardData() {
    renderProfileStatus();
    await renderLeaderboardCategory(currentLeaderboardCategory);
  }

  function renderProfileStatus() {
    const profile = getPlayerProfile();
    const profileStatus = document.getElementById('profileStatus');
    const backendStatus = document.getElementById('backendStatus');
    
    // Update backend status indicator
    if (backendStatus) {
      if (isBackendOnline()) {
        backendStatus.textContent = '🌐';
        backendStatus.title = 'Connected to global server';
        backendStatus.style.color = 'var(--good)';
      } else {
        backendStatus.textContent = '📱';
        backendStatus.title = 'Using local storage only';
        backendStatus.style.color = 'var(--ink)';
      }
    }
    
    if (profile.shareStats && profile.nickname) {
      profileStatus.innerHTML = `Sharing as <strong>${profile.nickname}</strong> - Last updated: ${profile.lastSubmitted ? new Date(profile.lastSubmitted).toLocaleDateString() : 'Never'}`;
      profileStatus.style.color = 'var(--good)';
      profileStatus.style.cursor = 'pointer';
      profileStatus.title = 'Click to edit profile settings';
    } else if (profile.nickname) {
      profileStatus.innerHTML = `Nickname set: <strong>${profile.nickname}</strong> - <span style="text-decoration: underline; cursor: pointer;">Enable sharing to join leaderboards!</span>`;
      profileStatus.style.color = 'var(--accent)';
      profileStatus.style.cursor = 'pointer';
      profileStatus.title = 'Click to enable sharing and join leaderboards';
    } else {
      profileStatus.innerHTML = `<span style="text-decoration: underline; cursor: pointer;">Set a nickname to join the leaderboards!</span>`;
      profileStatus.style.color = 'var(--accent)';
      profileStatus.style.cursor = 'pointer';
      profileStatus.title = 'Click to set up your profile and join leaderboards';
    }
    
    // Make profile status clickable to open settings
    profileStatus.onclick = () => showProfileSettings();
  }

  async function renderLeaderboardCategory(category) {
    const categories = getLeaderboardCategories();
    const categoryInfo = categories.find(cat => cat.id === category);
    
    // Update title
    const titleEl = document.getElementById('leaderboardTitle');
    titleEl.innerHTML = `<strong>${categoryInfo.icon} ${categoryInfo.name} - ${categoryInfo.description}</strong>`;
    
    // Get leaderboard data
    const leaderboard = await getLeaderboard(category, 50);
    const listEl = document.getElementById('leaderboardList');
    
    if (leaderboard.length === 0) {
      listEl.innerHTML = `
        <div style="text-align:center; color:var(--ink); opacity:0.7; padding:40px;">
          <div style="font-size:24px; margin-bottom:8px;">🏅</div>
          <div>No players on this leaderboard yet!</div>
          <div style="font-size:12px; margin-top:8px;">Be the first to submit your stats!</div>
        </div>
      `;
      return;
    }
    
    // Get player's rank if they're on the leaderboard
    const profile = getPlayerProfile();
    const playerRank = profile.nickname ? await getPlayerRank(category) : null;
    
    // Render leaderboard entries
    listEl.innerHTML = leaderboard.map((entry, index) => {
      const rank = index + 1;
      const isPlayer = profile.nickname === entry.nickname;
      const value = getLeaderboardValue(entry.stats, category);
      const date = new Date(entry.timestamp).toLocaleDateString();
      
      return `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 12px; margin:4px 0; background:${isPlayer ? 'rgba(119, 255, 221, 0.1)' : 'rgba(0,0,0,0.2)'}; border-radius:4px; border-left: ${isPlayer ? '3px solid var(--accent)' : 'none'};">
          <div style="display:flex; align-items:center; gap:12px;">
            <div style="font-weight:bold; color:${getRankColor(rank)}; min-width:30px;">#${rank}</div>
            <div>
              <div style="font-weight:${isPlayer ? 'bold' : 'normal'}; color:${isPlayer ? 'var(--accent)' : 'var(--ink)'};">${entry.nickname}${isPlayer ? ' (You)' : ''}</div>
              <div style="font-size:11px; color:var(--ink); opacity:0.6;">${date}</div>
            </div>
          </div>
          <div style="text-align:right;">
            <div style="font-weight:bold; font-size:16px; color:var(--accent);">${value}</div>
            <div style="font-size:10px; color:var(--ink); opacity:0.6;">${entry.stats.totalGames} games</div>
          </div>
        </div>
      `;
    }).join('');
    
    // Add player rank info if they're not in top 50 but are on leaderboard
    if (playerRank && playerRank > 50) {
      listEl.innerHTML += `
        <div style="margin-top:16px; padding:12px; background:rgba(119, 255, 221, 0.1); border-radius:4px; border-left:3px solid var(--accent);">
          <div style="font-size:12px; color:var(--accent); margin-bottom:4px;"><strong>Your Rank</strong></div>
          <div>#${playerRank} - ${profile.nickname}</div>
        </div>
      `;
    }
  }

  function getLeaderboardValue(stats, category) {
    switch (category) {
      case 'total_wins': return stats.totalWins;
      case 'win_streak': return stats.winStreak;
      case 'perfect_wins': return stats.perfectWins;
      case 'quick_wins': return stats.quickWins;
      case 'win_rate': return stats.winRate.toFixed(1) + '%';
      case 'total_games': return stats.totalGames;
      default: return stats.totalWins;
    }
  }

  function getRankColor(rank) {
    if (rank === 1) return '#FFD700'; // Gold
    if (rank === 2) return '#C0C0C0'; // Silver
    if (rank === 3) return '#CD7F32'; // Bronze
    return 'var(--accent)';
  }

  function showProfileSettings() {
    const profile = getPlayerProfile();
    
    // Populate current values
    nicknameInput.value = profile.nickname || '';
    shareStatsCheckbox.checked = profile.shareStats || false;
    
    profileModal.hidden = false;
  }

  async function saveProfileSettings() {
    const nickname = nicknameInput.value.trim();
    const shareStats = shareStatsCheckbox.checked;
    
    // Validate nickname
    if (shareStats && (!nickname || nickname.length < 3 || nickname.length > 20)) {
      alert('Nickname must be between 3-20 characters to share stats!');
      return;
    }
    
    // Update profile
    updatePlayerProfile({
      nickname: nickname || null,
      shareStats: shareStats
    });
    
    // If sharing is enabled and we have a nickname, submit current stats
    if (shareStats && nickname) {
      const analytics = getAnalytics();
      if (await submitToLeaderboard(analytics)) {
        console.log('Stats submitted to leaderboard');
      }
    }
    
    // Close modal and refresh leaderboard display
    profileModal.hidden = true;
    await renderLeaderboardData();
  }

  async function deleteLeaderboardEntry() {
    if (confirm('Are you sure you want to delete your leaderboard entry? This cannot be undone.')) {
      // Load current leaderboard and remove player's entry
      const profile = getPlayerProfile();
      if (profile.nickname) {
        const leaderboard = await loadLeaderboard();
        // Filter by playerId if available, otherwise by nickname
        const filteredBoard = leaderboard.filter(entry => {
          if (entry.playerId && profile.id) {
            return entry.playerId !== profile.id;
          }
          return entry.nickname !== sanitizeNickname(profile.nickname);
        });
        await saveLeaderboard(filteredBoard);
        
        // Update profile to disable sharing
        updatePlayerProfile({
          shareStats: false,
          lastSubmitted: null
        });
        
        profileModal.hidden = true;
        await renderLeaderboardData();
        alert('Your leaderboard entry has been deleted.');
      }
    }
  }

  function renderDefeatedOpponents() {
    const defeatedList = document.getElementById('defeatedList');
    const defeated = loadDefeatedOpponents();
    
    if (defeated.length === 0) {
      defeatedList.innerHTML = '<div style="text-align:center; color:var(--ink); opacity:0.7; padding:20px;">No opponents defeated yet.</div>';
      return;
    }
    
    defeated.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // Sort by newest first
    
    defeatedList.innerHTML = defeated.map(entry => {
      const date = new Date(entry.timestamp).toLocaleDateString();
      return `<div style="border:1px solid var(--border); padding:8px; margin-bottom:8px; background:black;">
        <div style="color:var(--accent); font-weight:bold;">${entry.name}</div>
        <div style="color:var(--ink); opacity:0.8; font-size:10px;">${entry.persona} • ${date}</div>
      </div>`;
    }).join('');
  }
}

function setupMusic() {
  music = new Audio(MUSIC_FILE);
  window.music = music; // Make music accessible globally
  music.loop = true;
  music.volume = 0.7;
  // Restore mute state from localStorage
  const muted = localStorage.getItem(LS_KEY) === '1';
  music.muted = muted;
  updateMuteBtn(muted);

  // Play after user gesture (browser policy)
  const tryPlay = () => {
    if (music.paused) music.play().catch(()=>{});
    window.removeEventListener('pointerdown', tryPlay);
    window.removeEventListener('keydown', tryPlay);
  };
  window.addEventListener('pointerdown', tryPlay);
  window.addEventListener('keydown', tryPlay);

  muteBtn.addEventListener('click', () => {
    const nowMuted = !music.muted;
    music.muted = nowMuted;
    localStorage.setItem(LS_KEY, nowMuted ? '1' : '0');
    updateMuteBtn(nowMuted);
  });
}

function updateMuteBtn(muted) {
  muteBtn.textContent = muted ? '🔇' : '🔊';
  muteBtn.setAttribute('aria-label', muted ? 'Unmute music' : 'Mute music');
}

// Create and play a bell sound for achievement unlocks
window.playUnlockSound = function() {
  try {
    // Create a simple bell-like tone using Web Audio API
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    // Connect nodes
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Configure the bell sound
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime); // High pitch
    oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.3); // Decay
    
    // Volume envelope for bell-like sound
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.15, audioContext.currentTime + 0.01); // Quick attack
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.8); // Slow decay
    
    // Play the sound
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.8);
    
    // Respect music mute setting
    if (window.music && window.music.muted) {
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    }
  } catch (e) {
    // Fallback: create a simple beep if Web Audio API fails
    console.warn('Could not create bell sound:', e);
  }
};

function setupMobileMenu() {
  const menuToggle = document.getElementById('menuToggle');
  const buttonContainer = document.querySelector('.button-container');
  
  if (!menuToggle || !buttonContainer) return;
  
  // Toggle menu visibility on mobile
  menuToggle.addEventListener('click', () => {
    buttonContainer.classList.toggle('menu-open');
    const isOpen = buttonContainer.classList.contains('menu-open');
    menuToggle.setAttribute('aria-expanded', isOpen);
    menuToggle.textContent = isOpen ? '✕' : '☰';
  });
  
  // Close menu when clicking outside (on mobile)
  document.addEventListener('click', (e) => {
    const isClickOutside = !menuToggle.contains(e.target) && !buttonContainer.contains(e.target);
    if (isClickOutside && buttonContainer.classList.contains('menu-open')) {
      buttonContainer.classList.remove('menu-open');
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.textContent = '☰';
    }
  });
  
  // Close menu when a button inside is clicked (on mobile)
  buttonContainer.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON' && window.innerWidth <= 768) {
      buttonContainer.classList.remove('menu-open');
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.textContent = '☰';
    }
  });
  
  // Close menu on escape key (but only if no modals are open)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && buttonContainer.classList.contains('menu-open')) {
      // Check if any modals are open first
      const modals = [
        'helpModal', 'deckModal', 'quirkModal', 'unlocksModal', 
        'glossaryModal', 'victoryModal', 'defeatedModal', 'companionModal',
        'telemetryModal', 'flavorsModal', 'loreModal'
      ];
      
      const hasOpenModal = modals.some(modalId => {
        const modal = document.getElementById(modalId);
        return modal && !modal.hidden;
      });
      
      // Only close mobile menu if no modals are open
      if (!hasOpenModal) {
        buttonContainer.classList.remove('menu-open');
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.textContent = '☰';
      }
    }
  });
}

function setupHelp() {
  const helpModal = document.getElementById('helpModal');
  const helpCloseBtn = document.getElementById('helpCloseBtn');
  
  // Tab switching functionality
  function setupHelpTabs() {
    const tabs = helpModal.querySelectorAll('.help-tab');
    const panels = helpModal.querySelectorAll('.help-panel');
    
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetTab = tab.dataset.tab;
        
        // Remove active class from all tabs and hide all panels
        tabs.forEach(t => t.classList.remove('active'));
        panels.forEach(p => p.style.display = 'none');
        
        // Activate clicked tab and show corresponding panel
        tab.classList.add('active');
        const targetPanel = helpModal.querySelector(`[data-panel="${targetTab}"]`);
        if (targetPanel) {
          targetPanel.style.display = 'block';
        }
      });
    });
  }

  // Help button click handler
  helpBtn.addEventListener('click', () => {
    helpModal.hidden = false;
    // Initialize tabs if not already done
    if (!helpModal.dataset.tabsInitialized) {
      setupHelpTabs();
      helpModal.dataset.tabsInitialized = 'true';
    }
  });

  // Debug button click handler
  debugBtn.addEventListener('click', () => {
    document.getElementById('debugScreen').hidden = false;
    
    // Trigger Impervious card unlock for debug access
    checkAchievementUnlocks({
      event: 'debugAccess'
    });
  });

  // Close button handler
  helpCloseBtn.addEventListener('click', () => {
    helpModal.hidden = true;
    // Mark help as shown for future visits
    localStorage.setItem(HELP_SHOWN_KEY, '1');
  });

  // Global ESC key handler for modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      // Close any open modals
      const modals = [
        'helpModal',
        'deckModal', 
        'quirkModal',
        'unlocksModal',
        'glossaryModal',
        'victoryModal',
        'defeatedModal',
        'companionModal'
      ];
      
      modals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (modal && !modal.hidden) {
          modal.hidden = true;
          
          // Special handling for deck builder - return to start
          if (modalId === 'deckModal' && window.showStart) {
            window.showStart();
          }
          
          // Mark help as shown if closed
          if (modalId === 'helpModal') {
            localStorage.setItem(HELP_SHOWN_KEY, '1');
          }
        }
      });
    }
  });

  // Auto-show for first-time players
  const hasSeenHelp = localStorage.getItem(HELP_SHOWN_KEY) === '1';
  if (!hasSeenHelp) {
    // Delay to ensure all modals are ready
    setTimeout(() => {
      const startModal = document.getElementById('startModal');
      // Only show if start modal is not visible
      if (startModal && startModal.hidden) {
        helpModal.hidden = false;
      }
    }, 500);
  }
}

function setupGlossary() {
  const glossaryModal = document.getElementById('glossaryModal');
  const glossaryCloseBtn = document.getElementById('glossaryCloseBtn');
  const glossaryGrid = document.getElementById('glossaryGrid');

  // Glossary button click handler
  glossaryBtn.addEventListener('click', () => {
    renderGlossary();
    glossaryModal.hidden = false;
  });

  // Close button handler
  glossaryCloseBtn.addEventListener('click', () => {
    glossaryModal.hidden = true;
  });

  function renderGlossary() {
    const cardsInfo = getUnlockableCardsInfo();
    // Get all cards including starters
    import('../data/cards.js').then(({ CARDS }) => {
      // Import renderCost for proper cost display
      import('./ui.js').then(({ renderCost }) => {
        glossaryGrid.innerHTML = '';
        
        CARDS.forEach(card => {
          const unlocked = isCardUnlocked(card.id);
          const cardMeta = cardsInfo.find(c => c.id === card.id);
          
          const div = document.createElement('div');
          div.className = 'qcard';
          if (!unlocked) {
            div.style.opacity = '0.5';
            div.style.filter = 'grayscale(1)';
          }
          
          // Use card.name without sym prefix, render sym separately  
          const cardName = card.name.startsWith(card.sym) ? card.name.substring(card.sym.length).trim() : card.name;
          const title = `${card.sym} ${cardName}`;
          const costText = ` (${renderCost(card)})`;
          const description = getCardDescription(card);
          
          div.innerHTML = `<strong>${title}${costText}</strong><br/><small>${description}</small>`;
          glossaryGrid.appendChild(div);
        });
      });
    });
  }

  function getCardDescription(card) {
    const parts = [];
    if (card.effects.damage > 0) parts.push(`${card.effects.damage} damage`);
    if (card.effects.heal > 0) parts.push(`Heal ${card.effects.heal}`);
    if (card.effects.shield > 0) parts.push(`+${card.effects.shield} shield`);
    if (card.effects.draw > 0) parts.push(`Draw ${card.effects.draw}`);
    if (card.effects.pierce) parts.push('Pierce');
    if (card.effects.reconsider) parts.push('Spend all energy. Reshuffle your deck.');
    if (card.status.target.burn) parts.push(`Burn ${card.status.target.burn.amount} for ${card.status.target.burn.turns} turns`);
    if (card.status.target.freezeEnergy > 0) parts.push(`Freeze ${card.status.target.freezeEnergy} energy`);
    if (card.status.self.nextPlus > 0) parts.push(`+${card.status.self.nextPlus} to next card`);
    if (card.status.self.maxEnergyDelta !== 0) parts.push(`${card.status.self.maxEnergyDelta > 0 ? '+' : ''}${card.status.self.maxEnergyDelta} max energy`);
    if (card.status.self.energyNowDelta !== 0) parts.push(`${card.status.self.energyNowDelta > 0 ? '+' : ''}${card.status.self.energyNowDelta} energy now`);
    
    return parts.length > 0 ? parts.join(', ') : 'Special effect';
  }
}

function setupFlavors() {
  const flavorsBtn = document.getElementById('flavorsBtn');
  const flavorsModal = document.getElementById('flavorsModal');
  const flavorsCloseBtn = document.getElementById('flavorsCloseBtn');
  const flavorsGrid = document.getElementById('flavorsGrid');

  // If buttons don't exist yet, we'll add them to the UI later
  if (!flavorsBtn || !flavorsModal || !flavorsCloseBtn || !flavorsGrid) {
    console.log('Flavor UI elements not found, flavor system will be added to debug panel');
    return;
  }

  // Flavors button click handler
  flavorsBtn.addEventListener('click', () => {
    renderFlavors();
    flavorsModal.hidden = false;
  });

  // Close button handler
  flavorsCloseBtn.addEventListener('click', () => {
    flavorsModal.hidden = true;
  });

  function renderFlavors() {
    const flavorsInfo = getUnlockableFlavorsInfo();
    const unlockInfo = getFlavorUnlockInfo();
    const currentFlavor = getCurrentFlavor();
    
    flavorsGrid.innerHTML = '';
    
    flavorsInfo.forEach(flavor => {
      const unlockData = unlockInfo.find(u => u.id === flavor.id);
      const isSelected = flavor.id === currentFlavor;
      
      const div = document.createElement('div');
      div.className = 'flavor-card';
      if (!flavor.unlocked) {
        div.style.opacity = '0.5';
        div.style.filter = 'grayscale(1)';
      }
      if (isSelected) {
        div.style.border = '3px solid var(--accent)';
        div.style.background = 'var(--panel)';
      }
      
      // Create color preview
      const preview = document.createElement('div');
      preview.className = 'color-preview';
      preview.style.cssText = `
        display: flex; 
        height: 20px; 
        margin: 4px 0; 
        border-radius: 4px; 
        overflow: hidden;
      `;
      
      // Show main colors as stripes
      const colors = [flavor.colors.bg, flavor.colors.panel, flavor.colors.border, flavor.colors.accent];
      colors.forEach(color => {
        const stripe = document.createElement('div');
        stripe.style.cssText = `flex: 1; background: ${color};`;
        preview.appendChild(stripe);
      });
      
      const statusText = flavor.unlocked ? 
        (isSelected ? '(ACTIVE)' : '(UNLOCKED)') : 
        (unlockData ? `(${unlockData.progress || 'LOCKED'})` : '(LOCKED)');
      
      div.innerHTML = `
        <strong>${flavor.name} ${statusText}</strong><br/>
        <small>${flavor.description}</small>
      `;
      div.appendChild(preview);
      
      if (flavor.unlocked) {
        div.style.cursor = 'pointer';
        div.addEventListener('click', () => {
          setCurrentFlavor(flavor.id);
          renderFlavors(); // Refresh to show new selection
        });
      }
      
      flavorsGrid.appendChild(div);
    });
  }
}

// --- Attach to window for modularity (if needed) ---
window.bump = bump;
window.bumpHP = bumpHP;
window.bumpShield = bumpShield;
window.openDeckBuilder = openDeckBuilder;
window.buildRandomDeck = buildRandomDeck;

// --- FX microinteraction helpers ---
window.fxBurn = fxBurn;
window.fxFreeze = fxFreeze;
window.fxZap = fxZap;
window.fxFocus = fxFocus;
window.fxSlash = fxSlash;
window.fxSurge = fxSurge;
window.fxEcho = fxEcho;
window.fxReconsider = fxReconsider;

// --- Expose unlock system for debugging ---
window.CardUnlock = {
  getUnlockedCards,
  isCardUnlocked,
  unlockCard,
  getUnlockableCardsInfo,
  getUnlockableQuirksInfo,
  isQuirkUnlocked,
  getUnlockedQuirks,
  unlockQuirk,
  resetUnlocks,
  debugUnlock,
  checkPersonaDefeatUnlocks,
  checkAchievementUnlocks,
  recordBattleResult,
  // Flavor functions
  isFlavorUnlocked,
  getUnlockedFlavors,
  unlockFlavor,
  getUnlockableFlavorsInfo,
  getFlavorUnlockInfo,
  getCurrentFlavor,
  setCurrentFlavor,
  applyFlavor,
  checkFlavorUnlocks,
  resetFlavors,
  debugUnlockFlavor
};

// --- Expose Game Stats for debugging ---
window.GameStats = {
  get current() {
    return window.Game ? window.Game.stats : null;
  },
  reset() {
    if (window.Game) {
      window.Game.stats = {
        maxEnergyDuringRun: 3,
        peakOverheal: 0,
        totalOverhealGained: 0,
        maxHandSizeTurn: 5,
        maxBurnAmount: 0,
        firstPerfectWin: false
      };
    }
  }
};

// --- Expose Campaign for debugging and unlock system ---
window.Campaign = Campaign;

// --- Debug Screen Functions ---
function debugLog(message) {
  const logEl = document.getElementById('debugLog');
  if (logEl) {
    const timestamp = new Date().toLocaleTimeString();
    logEl.innerHTML += `[${timestamp}] ${message}<br>`;
    logEl.scrollTop = logEl.scrollHeight;
  }
  console.log(`[DEBUG] ${message}`);
}

function setupDebugScreen() {
  // Close button
  document.getElementById('debugCloseBtn').onclick = () => {
    document.getElementById('debugScreen').hidden = true;
  };

  // Clear log button
  document.getElementById('debugClearLog').onclick = () => {
    document.getElementById('debugLog').innerHTML = '';
  };

  // Card Testing Section
  document.getElementById('debugUnlockAll').onclick = () => {
    const cards = CARDS.map(c => c.id);
    let unlocked = 0;
    cards.forEach(cardId => {
      if (unlockCard(cardId, 'debug')) unlocked++;
    });
    debugLog(`Unlocked ${unlocked} cards`);
  };

  document.getElementById('debugLockAll').onclick = () => {
    resetUnlocks();
    debugLog('All cards locked (reset to starter cards)');
  };

  document.getElementById('debugUnlockFerriglobin').onclick = () => {
    if (unlockCard('ferriglobin', 'debug')) {
      debugLog('Ferriglobin unlocked!');
    } else {
      debugLog('Ferriglobin was already unlocked');
    }
  };

  document.getElementById('debugUnlockImpervious').onclick = () => {
    if (unlockCard('impervious', 'debug')) {
      debugLog('Impervious unlocked!');
    } else {
      debugLog('Impervious was already unlocked');
    }
  };

  document.getElementById('debugShowUnlocks').onclick = () => {
    const unlocked = getUnlockedCards();
    debugLog(`Unlocked cards: ${unlocked.join(', ')}`);
    const unlockInfo = getUnlockableCardsInfo();
    unlockInfo.forEach(info => {
      const status = info.unlocked ? '✓' : '✗';
      debugLog(`${status} ${info.id}: ${info.description}`);
    });
  };

  document.getElementById('debugUnlockCard').onclick = () => {
    const cardId = document.getElementById('debugCardId').value.trim();
    if (!cardId) {
      debugLog('Please enter a card ID');
      return;
    }
    if (unlockCard(cardId, 'debug')) {
      debugLog(`Card '${cardId}' unlocked!`);
    } else {
      debugLog(`Card '${cardId}' was already unlocked or doesn't exist`);
    }
    document.getElementById('debugCardId').value = '';
  };

  // Campaign Testing Section
  document.getElementById('debugStartCampaign').onclick = () => {
    Campaign.start();
    debugLog('Campaign started');
  };

  document.getElementById('debugEndCampaign').onclick = () => {
    if (Campaign.active) {
      Campaign.abandon();
      debugLog('Campaign ended');
    } else {
      debugLog('No active campaign to end');
    }
  };

  document.getElementById('debugShowCampaign').onclick = () => {
    if (Campaign.active) {
      debugLog(`Campaign active - Victories: ${Campaign.victories}, Booster Level: ${Campaign.boosterLevel}`);
      debugLog(`Deck: ${Campaign.deck.join(', ')}`);
    } else {
      debugLog('No active campaign');
    }
  };

  document.getElementById('debugSetBooster').onclick = () => {
    const level = parseInt(document.getElementById('debugBoosterLevel').value);
    if (isNaN(level) || level < 0) {
      debugLog('Please enter a valid booster level (0 or higher)');
      return;
    }
    
    if (!Campaign.active) {
      Campaign.start();
      debugLog('Started campaign for booster level testing');
    }
    
    // Simulate victories to reach the booster level
    const currentLevel = Campaign.boosterLevel;
    if (level > currentLevel) {
      const victories = level - currentLevel;
      for (let i = 0; i < victories; i++) {
        Campaign.recordVictory(['swords', 'shield', 'heart']); // Dummy deck
      }
      debugLog(`Set booster level to ${level} (added ${victories} victories)`);
    } else {
      debugLog(`Booster level is already ${currentLevel} (requested ${level})`);
    }
    document.getElementById('debugBoosterLevel').value = '';
  };

  // Player State Testing Section
  document.getElementById('debugMaxHP').onclick = () => {
    if (window.Game && window.Game.you) {
      window.Game.you.hp = 999;
      debugLog('Player HP set to 999');
      window.render();
    } else {
      debugLog('No active game to modify');
    }
  };

  document.getElementById('debugMaxShield').onclick = () => {
    if (window.Game && window.Game.you) {
      window.Game.you.shield = 999;
      debugLog('Player shield set to 999');
      window.render();
    } else {
      debugLog('No active game to modify');
    }
  };

  document.getElementById('debugMaxEnergy').onclick = () => {
    if (window.Game && window.Game.you) {
      window.Game.you.energy = 999;
      window.Game.you.maxEnergy = 999;
      debugLog('Player energy set to 999');
      window.render();
    } else {
      debugLog('No active game to modify');
    }
  };

  document.getElementById('debugResetPlayer').onclick = () => {
    if (window.Game && window.Game.you) {
      window.Game.you.hp = 20;
      window.Game.you.shield = 0;
      window.Game.you.energy = 3;
      window.Game.you.maxEnergy = 3;
      debugLog('Player state reset to defaults');
      window.render();
    } else {
      debugLog('No active game to modify');
    }
  };

  document.getElementById('debugApplyHP').onclick = () => {
    const hp = parseInt(document.getElementById('debugSetHP').value);
    if (isNaN(hp) || hp < 1) {
      debugLog('Please enter a valid HP amount (1 or higher)');
      return;
    }
    if (window.Game && window.Game.you) {
      window.Game.you.hp = hp;
      debugLog(`Player HP set to ${hp}`);
      window.render();
    } else {
      debugLog('No active game to modify');
    }
    document.getElementById('debugSetHP').value = '';
  };

  document.getElementById('debugApplyShield').onclick = () => {
    const shield = parseInt(document.getElementById('debugSetShield').value);
    if (isNaN(shield) || shield < 0) {
      debugLog('Please enter a valid shield amount (0 or higher)');
      return;
    }
    if (window.Game && window.Game.you) {
      window.Game.you.shield = shield;
      debugLog(`Player shield set to ${shield}`);
      window.render();
    } else {
      debugLog('No active game to modify');
    }
    document.getElementById('debugSetShield').value = '';
  };

  // Testing & Analytics Section
  document.getElementById('debugRunTests').onclick = () => {
    debugLog('Running self tests...');
    runSelfTests(Game, (msg) => debugLog(`TEST: ${msg}`), () => {});
  };

  document.getElementById('debugClearTelemetry').onclick = () => {
    resetTelemetry();
    debugLog('Telemetry data cleared');
  };

  document.getElementById('debugShowAnalytics').onclick = () => {
    const analytics = getAnalytics();
    debugLog('Analytics Data:');
    Object.entries(analytics).forEach(([key, value]) => {
      debugLog(`  ${key}: ${JSON.stringify(value)}`);
    });
  };

  document.getElementById('debugResetCompanion').onclick = () => {
    resetCreature();
    debugLog('VORTEK companion reset');
  };

  // Game Control Section
  document.getElementById('debugQuickBattle').onclick = () => {
    if (window.Game && !window.Game.battleActive) {
      // Use the existing quickstart functionality
      buildRandomDeck();
      debugLog('Started quick battle with random deck');
    } else {
      debugLog('Battle already active or game not initialized');
    }
  };

  document.getElementById('debugEndTurn').onclick = () => {
    if (window.Game && window.Game.battleActive && window.Game.turn === 'you') {
      window.Game.endTurn();
      debugLog('Forced turn end');
    } else {
      debugLog('Cannot end turn (no active battle or not your turn)');
    }
  };

  document.getElementById('debugWinBattle').onclick = () => {
    if (window.Game && window.Game.battleActive) {
      window.Game.opp.hp = 0;
      debugLog('Opponent HP set to 0 - battle should end');
      window.render();
    } else {
      debugLog('No active battle to win');
    }
  };

  document.getElementById('debugLoseBattle').onclick = () => {
    if (window.Game && window.Game.battleActive) {
      window.Game.you.hp = 0;
      debugLog('Player HP set to 0 - battle should end');
      window.render();
    } else {
      debugLog('No active battle to lose');
    }
  };

  // Quirk Testing Section
  document.getElementById('debugUnlockAllQuirks').onclick = () => {
    const quirks = getUnlockableQuirksInfo();
    let unlocked = 0;
    quirks.forEach(quirk => {
      if (unlockQuirk(quirk.id, 'debug')) unlocked++;
    });
    debugLog(`Unlocked ${unlocked} quirks`);
  };

  document.getElementById('debugResetQuirks').onclick = () => {
    resetQuirks();
    debugLog('All quirks reset to defaults');
  };

  document.getElementById('debugShowQuirks').onclick = () => {
    const quirks = getUnlockableQuirksInfo();
    debugLog('Quirk Status:');
    quirks.forEach(quirk => {
      const status = quirk.unlocked ? '✓' : '✗';
      debugLog(`  ${status} ${quirk.name}: ${quirk.description}`);
    });
  };

  // Flavor Testing Section
  document.getElementById('debugUnlockAllFlavors').onclick = () => {
    const flavors = getUnlockableFlavorsInfo();
    let unlocked = 0;
    flavors.forEach(flavor => {
      if (unlockFlavor(flavor.id, 'debug')) unlocked++;
    });
    debugLog(`Unlocked ${unlocked} flavors`);
  };

  document.getElementById('debugResetFlavors').onclick = () => {
    resetFlavors();
    debugLog('All flavors reset to defaults');
  };

  document.getElementById('debugShowFlavors').onclick = () => {
    const flavors = getUnlockableFlavorsInfo();
    const unlockInfo = getFlavorUnlockInfo();
    debugLog('Flavor Status:');
    flavors.forEach(flavor => {
      const status = flavor.unlocked ? '✓' : '✗';
      const unlockData = unlockInfo.find(u => u.id === flavor.id);
      const progress = unlockData ? unlockData.progress : '';
      debugLog(`  ${status} ${flavor.name}: ${flavor.description} ${progress ? '(' + progress + ')' : ''}`);
    });
  };

  document.getElementById('debugUnlockFlavor').onclick = () => {
    const flavorId = document.getElementById('debugFlavorId').value.trim();
    if (!flavorId) {
      debugLog('Please enter a flavor ID');
      return;
    }
    if (unlockFlavor(flavorId, 'debug')) {
      debugLog(`Flavor '${flavorId}' unlocked!`);
    } else {
      debugLog(`Flavor '${flavorId}' was already unlocked or doesn't exist`);
    }
    document.getElementById('debugFlavorId').value = '';
  };

  debugLog('Debug screen initialized successfully');
}

function clearSelectedQuirk() {
  saveSelectedQuirk(null);
}

// --- Game boot logic ---
document.addEventListener('DOMContentLoaded', () => {
  setupMusic();
  setupMobileMenu();
  setupHelp();
  setupGlossary();
  setupDefeatedOpponents();

  // Initialize face generator
  initFaceGenerator();
  
  // Initialize VORTEK generator
  initVortekGenerator();

  // Setup title image fallback logic
  setupTitleImage();

  // Setup Campaign functionality
  setupCampaign();

  // Setup Debug Screen
  setupDebugScreen();
  
  // Setup Flavor system
  setupFlavors();

  // Initialize Analysis UI
  initializeAnalysisUI();

  // Apply current flavor on page load
  applyFlavor(getCurrentFlavor());

  // Usual game boot
  const logFunction = function log(entry){
    const logBox = document.getElementById('log');
    if (typeof entry === 'string') {
      const p = document.createElement('div');
      
      // Make unlock notifications less prominent but add sound
      if (entry.includes('UNLOCKED')) {
        p.classList.add('unlock-notification');
        p.textContent = '> ' + entry;
        
        // Play a bell sound for achievement unlocks
        window.playUnlockSound();
      } else {
        p.textContent = '> ' + entry;
      }
      
      logBox.prepend(p);
    } else if (entry && typeof entry === 'object') {
      // actor-aware - map opponent logs to current opponent name
      let actor = entry.actor;
      if (actor === 'OPP' || actor === 'opp') {
        const oppNameEl = document.getElementById('oppName');
        if (oppNameEl && oppNameEl.textContent !== 'NAME') {
          actor = oppNameEl.textContent;
        }
      }
      const p = document.createElement('div');
      p.textContent = `[${actor}] ${entry.text}`;
      logBox.prepend(p);
    }
  };
  
  setLogFunction(logFunction);
  window.log = logFunction;

  window.render = createRenderFunction(Game);

  // Controls
  document.getElementById('endTurn').onclick = () => Game.endTurn();
  document.getElementById('restart').onclick = () => { 
    Game.clearLog();
    clearSelectedQuirk(); // Clear selected quirk on restart
    
    // Abandon campaign if active when restarting
    if (Campaign && Campaign.active) {
      Campaign.abandon();
    }
    
    // Ensure UI shows streak (not booster) when returning to start
    updateCampaignUI();
    
    document.getElementById('startModal').hidden = false; 
  };
  document.getElementById('selfTest').onclick = () => {
    document.getElementById('debugScreen').hidden = false;
    
    // Trigger Impervious card unlock for debug access
    checkAchievementUnlocks({
      event: 'debugAccess'
    });
  };

  // Quirk selection handler
  window.onQuirkSelected = function(quirkId) {
    saveSelectedQuirk(quirkId);
    if (window.Game) {
      window.Game.selectedQuirk = quirkId;
    }
  };

  // Victory modal event handlers
  document.getElementById('nextBattleBtn').onclick = () => {
    recordCurrentDefeatedOpponent();
    
    // Update companion for victory
    updateCompanionFromGameplay('battle_won');
    
    // Check if we're in campaign mode
    if (Campaign.active) {
      // Handle campaign victory flow instead of normal next battle
      handleCampaignVictory();
    } else {
      Game.nextBattle();
    }
  };
  document.getElementById('victoryUnlocksBtn').onclick = () => {
    renderUnlocksModal();
    document.getElementById('unlocksModal').hidden = false;
  };
  document.getElementById('victoryDeckBtn').onclick = () => {
    recordCurrentDefeatedOpponent();
    document.getElementById('victoryModal').hidden = true;
    Game.init(); // Return to deck builder flow
  };
  document.getElementById('victoryRestartBtn').onclick = () => {
    recordCurrentDefeatedOpponent();
    Game.resetGameToStart();
  };

  function recordCurrentDefeatedOpponent() {
    if (Game && Game.persona) {
      const oppNameEl = document.getElementById('oppName');
      const oppName = oppNameEl ? oppNameEl.textContent : null;
      if (oppName && oppName !== 'NAME') {
        recordDefeatedOpponent(oppName, Game.persona);
      }
    }
  }

  // Unlocks modal event handlers
  document.getElementById('unlocksBtn').onclick = () => {
    renderUnlocksModal();
    document.getElementById('unlocksModal').hidden = false;
  };
  document.getElementById('unlocksCloseBtn').onclick = () => {
    document.getElementById('unlocksModal').hidden = true;
  };

  // Reroll Face button handler
  document.getElementById('rerollFace').onclick = () => {
    const faceInfo = drawOppFace();
    Game.persona = faceInfo.persona;
    Game.oppFeatures = faceInfo.features; // Store features for logging
    setOpponentName(Game.persona, Game.oppFeatures);
    // Rebuild opponent deck to match new face/persona and redraw their hand to same size
    const keepN = Game.opp.hand ? Game.opp.hand.length : 5;
    Game.opp.deck = makePersonaDeck(Game.persona);
    Game.opp.hand = [];
    Game.opp.discard = [];
    Game.opp.draw(keepN || 5);
    
    // Enhanced logging for easter eggs
    let logMessage = 'Opponent shifts to ' + Game.persona + ' persona. Deck re-tuned.';
    if (Game.oppFeatures.isEasterEgg) {
      logMessage = `✨ RARE FACE! ${Game.oppFeatures.easterEggType} ${Game.persona} appears! ✨ [${Game.oppFeatures.rarity.toUpperCase()}] Deck re-tuned.`;
    }
    if (window.log) window.log(logMessage);
    if (window.render) window.render();
  };

  // Quirk grid rendering
  function renderQuirkGrid() {
    const quirkGrid = document.getElementById('quirkGrid');
    const quirksInfo = getUnlockableQuirksInfo();
    
    quirkGrid.innerHTML = '';
    
    quirksInfo.forEach(quirk => {
      const div = document.createElement('div');
      div.className = 'qcard';
      div.setAttribute('data-quirk', quirk.id);
      
      if (!quirk.unlocked) {
        div.style.opacity = '0.5';
        div.style.filter = 'grayscale(1)';
        div.style.cursor = 'not-allowed';
      } else {
        div.style.cursor = 'pointer';
        div.addEventListener('click', () => {
          if (quirk.unlocked) {
            // Set selected quirk and call the global handler
            document.querySelectorAll('.qcard').forEach(c => c.classList.remove('selected'));
            div.classList.add('selected');
            if (window.onQuirkSelected) {
              window.onQuirkSelected(quirk.id);
            }
          }
        });
      }
      
      const description = quirk.unlocked ? quirk.description : quirk.hint;
      div.innerHTML = `${quirk.name}<br/><small>${description}</small>`;
      quirkGrid.appendChild(div);
    });
  }

  // Unlocks modal rendering
  function renderUnlocksModal() {
    const cardsGrid = document.getElementById('unlocksCardsGrid');
    const quirksGrid = document.getElementById('unlocksQuirksGrid');
    
    // Render cards
    const cardsInfo = getUnlockableCardsInfo();
    cardsGrid.innerHTML = '';
    cardsInfo.forEach(card => {
      const div = document.createElement('div');
      div.className = 'qcard';
      if (!card.unlocked) {
        div.style.opacity = '0.5';
        div.style.filter = 'grayscale(1)';
      }
      
      const status = card.unlocked ? 'Unlocked' : card.progress;
      // Get the proper card name from CARDS data
      const cardData = CARDS.find(c => c.id === card.id);
      const cardName = cardData ? cardData.name.toUpperCase() : card.id.toUpperCase();
      div.innerHTML = `<strong>${cardName}</strong><br/><small>${card.description}</small><br/><em>${status}</em>`;
      cardsGrid.appendChild(div);
    });
    
    // Render quirks
    const quirksInfo = getUnlockableQuirksInfo();
    quirksGrid.innerHTML = '';
    quirksInfo.forEach(quirk => {
      const div = document.createElement('div');
      div.className = 'qcard';
      if (!quirk.unlocked) {
        div.style.opacity = '0.5';
        div.style.filter = 'grayscale(1)';
      }
      
      const status = quirk.unlocked ? 'Unlocked' : quirk.hint;
      div.innerHTML = `<strong>${quirk.name}</strong><br/><small>${quirk.description}</small><br/><em>${status}</em>`;
      quirksGrid.appendChild(div);
    });
  }

  // Setup title image with fallback logic
  function setupTitleImage() {
    const titleImg = document.getElementById('titleImg');
    const titleText = document.getElementById('titleText');
    
    if (!titleImg || !titleText) return;
    
    // Get fallback list from data-fallback attribute
    const fallbacks = titleImg.getAttribute('data-fallback')?.split(',') || [];
    let currentIndex = -1; // Start with the original src
    
    function tryNextImage() {
      currentIndex++;
      
      if (currentIndex === 0) {
        // Original src already set, just wait for load/error
        return;
      } else if (currentIndex <= fallbacks.length) {
        // Try fallback images
        const fallbackSrc = fallbacks[currentIndex - 1]?.trim();
        if (fallbackSrc) {
          titleImg.src = fallbackSrc;
        } else {
          // No more fallbacks, show text
          showTextFallback();
        }
      } else {
        // All fallbacks exhausted, show text
        showTextFallback();
      }
    }
    
    function showTextFallback() {
      titleImg.style.display = 'none';
      titleText.style.display = 'block';
    }
    
    function showImageSuccess() {
      titleImg.style.display = 'block';
      titleText.style.display = 'none';
    }
    
    // Set up event listeners
    titleImg.onload = showImageSuccess;
    titleImg.onerror = tryNextImage;
    
    // Start the fallback process
    tryNextImage();
  }

  // Consolidated reset all data functionality
  function resetAllGameData() {
    const confirmed = confirm('⚠️ RESET ALL DATA?\n\nThis will permanently delete:\n• All unlocked cards and achievements\n• All quirks and progress\n• Campaign data\n• VORTEK companion\n• Analytics and stats\n• Defeated opponents history\n\nThis action cannot be undone. Are you sure?');
    
    if (confirmed) {
      try {
        // Reset all card and quirk unlocks
        resetUnlocks();
        resetQuirks();
        resetFlavors();
        clearSelectedQuirk();
        
        // Reset defeated opponents history
        clearDefeatedOpponents();
        
        // Reset telemetry/analytics data
        resetTelemetry();
        
        // Reset VORTEK companion
        resetCreature();
        
        // Abandon any active campaign
        if (window.Campaign && window.Campaign.active) {
          window.Campaign.abandon();
        }
        
        // Clear any other localStorage keys we might have missed
        const keysToRemove = [
          'vorteks-muted',
          'vorteks-help-shown'
        ];
        
        keysToRemove.forEach(key => {
          try {
            localStorage.removeItem(key);
          } catch (e) {
            console.warn('Failed to remove localStorage key:', key, e);
          }
        });
        
        // Show success message and reload the page to ensure clean state
        alert('✅ All game data has been reset successfully!\n\nThe page will now reload to apply changes.');
        window.location.reload();
        
      } catch (error) {
        console.error('Error during data reset:', error);
        alert('❌ Error occurred during reset. Some data may not have been cleared properly.');
      }
    }
  }

  // Setup Campaign functionality
  function setupCampaign() {
    // Load existing campaign and show continue button if active
    if (Campaign.load()) {
      const continueBtn = document.getElementById('campaignContinueBtn');
      if (continueBtn) {
        continueBtn.hidden = false;
      }
    }
  }

  // Start screen logic
  function showStart() {
    const modal = document.getElementById('startModal');
    modal.hidden = false;
    
    // Append additional mottos at runtime for more variety
    const additionalMottos = [
      // Song lyric puns
      "Don't stop believin' in your deck composition!",
      "Sweet child o' mine... energy management",
      "We will, we will, VORTEKS you!",
      "Stayin' alive with 1 HP clutch plays",
      "Another one bites the... shield",
      "Bohemian Rhapsody: Is this the real life? Is this just strategy?",
      "Can't touch this! (Overhealed beyond belief)",
      "Eye of the Tiger: Rising up to the challenge of RNG",
      "We are the champions... of Unicode cards",
      "Poker Face: Keep them guessing your next move",

      // Literary and philosophical riffs  
      "To be or not to be... that is the mulligan",
      "I think, therefore I draw",
      "The pen is mightier than the sword... but cards beat both",
      "In the beginning was the Word... and the Word was VORTEKS",
      "All roads lead to victory... eventually",
      "Fortune favors the bold... and the well-constructed deck",
      "The die is cast... wait, wrong game",
      "Et tu, Brute? Et tu, energy shortage?",
      "Cogito ergo sum... cogito ergo I need more energy",
      "The unexamined deck is not worth playing",

      // More VORTEKS puns and mechanics
      "Energy efficiency: it's not just for appliances anymore",
      "Deck diversity: the spice of tactical life",
      "Mulligan decisions: harder than quantum physics",
      "RNG stands for 'Really Nice Gameplay' (citation needed)",
      "Status effects: because vanilla damage is so yesterday",
      "Card synergy: when 1+1 = VICTORY",
      "Hand management: like life management, but with more pixels",
      "Turn order: civilized combat since ancient times",
      "Resource allocation: MBA not required",
      "Meta gaming: thinking about thinking about playing",
      "Deck construction: building tomorrow's victory today",
      "Strategic depth: deeper than your average Unicode ocean",
      "Tactical brilliance: 99% preparation, 1% clicking buttons",
      "Victory conditions: clear as crystal, elusive as shadows",
      "Game balance: the eternal quest for perfect imperfection",

      // Additional classic references with VORTEKS twist
      "May the cards be with you",
      "Live long and prosper... with energy management",
      "Houston, we have a... perfect hand",
      "One small step for player, one giant leap for streak-kind",
      "That's one small mulligan for a player...",
      "Frankly my dear, I don't give a damn... about energy caps",
      "I'll be back... after this deck rebuild",
      "Show me the money... I mean, show me the energy",
      "You can't handle the truth... about optimal play",
      "Elementary, my dear Watson... always draw first"
    ];
    
    // Add the additional mottos to the existing array
    const allMottos = [...MOTTOS, ...additionalMottos];
    
    // Set random motto from expanded list
    const mottoElement = document.getElementById('motto');
    if (mottoElement && allMottos.length > 0) {
      const randomMotto = allMottos[Math.floor(Math.random() * allMottos.length)];
      mottoElement.textContent = randomMotto;
    }
    
    renderQuirkGrid(); // Render dynamic quirk grid when showing start
    document.getElementById('startBtn').onclick = ()=>{ modal.hidden=true; Game.init(); };
    document.getElementById('quickBtn').onclick = ()=>{ modal.hidden=true; Game.initQuick(); };
    
    // Campaign button handlers
    document.getElementById('campaignBtn').onclick = () => {
      modal.hidden = true;
      startNewCampaign();
    };
    
    document.getElementById('campaignContinueBtn').onclick = () => {
      modal.hidden = true;
      continueCampaign();
    };
    
    // Reset all data button handler
    document.getElementById('resetAllDataBtn').onclick = () => {
      resetAllGameData();
    };
  }
  window.showStart = showStart;

  // Expose Game functions for UI event handlers
  window.Game = Game;

  // Campaign Functions
  function startNewCampaign() {
    // Show quirk picker for campaign
    const quirkModal = document.getElementById('quirkModal');
    quirkModal.hidden = false;
    
    // Override quirk selection for campaign
    window.onQuirkSelected = (quirkId) => {
      Campaign.start(quirkId);
      quirkModal.hidden = true;
      initCampaignBattle();
    };
  }

  function continueCampaign() {
    if (Campaign.load()) {
      initCampaignBattle();
    } else {
      console.error('No campaign to continue');
      showStart();
    }
  }

  function initCampaignBattle() {
    // Initialize game with campaign settings
    Game.you = createPlayer(false);
    Game.opp = createPlayer(true);
    Game.ai = createAIPlayer(Game);
    
    // Set campaign deck
    Game.you.deck = Campaign.deck.map(cardId => ({ ...CARDS.find(c => c.id === cardId) }));
    Game.you.hand = [];
    Game.you.discard = [];
    Game.you.draw(5);
    
    // Set campaign quirk
    Game.selectedQuirk = Campaign.selectedQuirk;
    Game.you.quirk = Campaign.selectedQuirk;
    
    // Apply quirk effects
    Game.applyQuirkBattleStart(Game.you);
    
    // Start the player's first turn to give them energy
    Game.startTurn(Game.you);
    
    // Generate opponent with campaign scaling
    const faceInfo = drawOppFace();
    Game.persona = faceInfo.persona;
    Game.oppFeatures = faceInfo.features;
    setOpponentName(Game.persona, Game.oppFeatures);
    
    // Create enhanced deck with campaign booster scaling
    const campaignBooster = Campaign.boosterLevel;
    Game.opp.deck = makePersonaDeck(Game.persona, getUnlockedCards(), campaignBooster);
    
    // Apply campaign stat bonuses to opponent
    if (campaignBooster > 0) {
      const hpBonus = Math.floor(campaignBooster * 2); // +2 HP per booster level
      const energyBonus = Math.min(Math.floor(campaignBooster * 0.5), 3); // +0.5 energy per level, capped at +3
      
      Game.opp.maxHP += hpBonus;
      Game.opp.hp += hpBonus;
      Game.opp.maxEnergy += energyBonus;
      Game.opp.energy += energyBonus;
      
      // Log the enhanced opponent
      if (campaignBooster >= 5) {
        if (window.log) window.log(`⚠️ ELITE OPPONENT: Enhanced ${Game.persona} (+${hpBonus} HP, +${energyBonus} Energy)!`);
      } else if (campaignBooster >= 2) {
        if (window.log) window.log(`💪 Stronger ${Game.persona} appears (+${hpBonus} HP, +${energyBonus} Energy)!`);
      }
    }
    
    // Initialize game state
    Game.over = false;
    Game.turn = 'you';
    Game.turnTypes = new Set();
    Game.playerTurnDamage = 0;
    
    // Show/hide appropriate UI elements
    updateCampaignUI();
    
    // Hide start modal and render
    document.getElementById('startModal').hidden = true;
    if (window.render) window.render();
    
    console.log('Campaign battle initialized');
  }

  function updateCampaignUI() {
    const streakPill = document.getElementById('streakPill');
    const boosterPill = document.getElementById('boosterPill');
    
    if (Campaign.active) {
      // Hide streak, show booster
      streakPill.hidden = true;
      boosterPill.hidden = false;
      document.getElementById('booster').textContent = Campaign.boosterLevel;
    } else {
      // Show streak, hide booster
      streakPill.hidden = false;
      boosterPill.hidden = true;
    }
  }

  // Expose updateCampaignUI globally for game modes to call
  window.updateCampaignUI = updateCampaignUI;

  // Setup Campaign modal event handlers
  setupCampaignModals();

  function setupCampaignModals() {
    // Campaign Reward Modal handlers
    document.getElementById('campaignRewardsConfirmBtn').onclick = () => {
      confirmCampaignRewards();
      initCampaignBattle(); // Start next battle after accepting rewards
    };
    
    document.getElementById('campaignRewardsEditDeckBtn').onclick = () => {
      confirmCampaignRewards();
      showCampaignDeckEdit();
    };
    
    document.getElementById('campaignRewardsAbandonBtn').onclick = () => {
      if (confirm('Abandon this campaign run? All progress will be lost.')) {
        Campaign.abandon();
        document.getElementById('campaignRewardModal').hidden = true;
        showStart();
      }
    };
    
    // Campaign Deck Edit Modal handlers
    document.getElementById('campaignDeckContinueBtn').onclick = () => {
      const modal = document.getElementById('campaignDeckModal');
      
      // Apply working counts to campaign deck
      if (modal._workingCounts) {
        if (Campaign.updateDeckFromCounts(modal._workingCounts)) {
          modal.hidden = true;
          initCampaignBattle(); // Start next battle
        } else {
          alert('Invalid deck configuration. Please ensure you have at least 10 cards.');
        }
      } else {
        // Fallback for old behavior
        modal.hidden = true;
        initCampaignBattle();
      }
    };
    
    document.getElementById('campaignDeckAbandonBtn').onclick = () => {
      if (confirm('Abandon this campaign run? All progress will be lost.')) {
        Campaign.abandon();
        document.getElementById('campaignDeckModal').hidden = true;
        showStart();
      }
    };
  }

  function confirmCampaignRewards() {
    // Get reward selections from checkboxes
    const rewardElements = document.querySelectorAll('.campaign-reward-item input[type="checkbox"]');
    const selections = Array.from(rewardElements).map(el => el.checked);
    
    Campaign.acceptRewards(selections);
    document.getElementById('campaignRewardModal').hidden = true;
  }

  function showCampaignDeckEdit() {
    const modal = document.getElementById('campaignDeckModal');
    const deckList = document.getElementById('campaignDeckList');
    const deckCount = document.getElementById('campaignDeckCount');
    
    // Get collection and deck counts
    const collectionCounts = Campaign.getCollectionCounts();
    const deckCounts = Campaign.getDeckCounts();
    const totalDeckSize = Campaign.deck.length;
    
    // Get unique cards from collection
    const uniqueCardIds = Object.keys(collectionCounts);
    const availableCards = uniqueCardIds.map(cardId => CARDS.find(c => c.id === cardId)).filter(Boolean);
    
    deckCount.textContent = totalDeckSize;
    
    // Create working copy of deck counts for editing
    let workingCounts = { ...deckCounts };
    
    function rebuild() {
      deckList.innerHTML = '';
      
      availableCards.forEach(card => {
        const cardId = card.id;
        const inDeck = workingCounts[cardId] || 0;
        const owned = collectionCounts[cardId] || 0;
        
        const cardEl = document.createElement('div');
        cardEl.className = 'campaign-deck-card';
        cardEl.style.cssText = 'display:flex; justify-content:space-between; align-items:center; padding:8px; margin:4px 0; background:rgba(255,255,255,0.1); border-radius:4px;';
        
        cardEl.innerHTML = `
          <div style="flex-grow:1;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <div><span style="margin-right:6px">${card.sym}</span>${card.name}</div>
              <div class="cost">${renderCost(card)}</div>
            </div>
            <div style="margin-top:6px; font-size:10px;">${cardText(card)}</div>
          </div>
          <div style="display:flex; gap:6px; margin-left:12px; align-items:center;">
            <button class="btn campaign-card-btn" data-act="sub" data-id="${cardId}" ${inDeck <= 0 ? 'disabled' : ''}>-</button>
            <div style="min-width:40px; text-align:center;">
              <span style="font-weight:bold;">${inDeck}</span>/<span style="opacity:0.7;">${owned}</span>
            </div>
            <button class="btn campaign-card-btn" data-act="add" data-id="${cardId}" ${inDeck >= owned ? 'disabled' : ''}>+</button>
          </div>
        `;
        
        deckList.appendChild(cardEl);
      });
      
      // Update deck count
      const newTotal = Object.values(workingCounts).reduce((sum, count) => sum + count, 0);
      deckCount.textContent = newTotal;
      
      // Update continue button state
      const continueBtn = document.getElementById('campaignDeckContinueBtn');
      if (continueBtn) {
        continueBtn.disabled = newTotal < 10;
        if (newTotal < 10) {
          continueBtn.style.opacity = '0.5';
          continueBtn.style.cursor = 'not-allowed';
        } else {
          continueBtn.style.opacity = '1';
          continueBtn.style.cursor = 'pointer';
        }
      }
    }
    
    // Add click handler for +/- buttons
    deckList.onclick = (e) => {
      const button = e.target.closest('button.campaign-card-btn');
      if (!button) return;
      
      const cardId = button.getAttribute('data-id');
      const action = button.getAttribute('data-act');
      const owned = collectionCounts[cardId] || 0;
      const current = workingCounts[cardId] || 0;
      
      if (action === 'add' && current < owned) {
        workingCounts[cardId] = current + 1;
      } else if (action === 'sub' && current > 0) {
        workingCounts[cardId] = current - 1;
        if (workingCounts[cardId] === 0) {
          delete workingCounts[cardId];
        }
      }
      
      rebuild();
    };
    
    // Store working counts for the continue button
    modal._workingCounts = workingCounts;
    
    rebuild();
    modal.hidden = false;
  }

  function renderCampaignRewards(rewards) {
    const rewardsList = document.getElementById('campaignRewardsList');
    
    rewardsList.innerHTML = '';
    rewards.forEach((reward, index) => {
      const card = CARDS.find(c => c.id === reward.cardId);
      if (card) {
        const rewardEl = document.createElement('div');
        rewardEl.className = 'campaign-reward-item';
        rewardEl.style.cssText = 'display:flex; justify-content:space-between; align-items:center; padding:8px; margin:4px 0; background:rgba(255,255,255,0.1); border-radius:4px;';
        
        const mandatoryLabel = reward.mandatory ? ' <span style="color:var(--bad)">(MANDATORY)</span>' : '';
        rewardEl.innerHTML = `
          <span>${card.sym} ${card.name}${mandatoryLabel}</span>
          <input type="checkbox" ${reward.accepted ? 'checked' : ''} ${reward.mandatory ? 'disabled' : ''}>
        `;
        rewardsList.appendChild(rewardEl);
      }
    });
  }

  // Global function for removing campaign cards
  window.removeCampaignCard = function(index) {
    if (Campaign.removeCard(index)) {
      showCampaignDeckEdit(); // Refresh the deck edit modal
    }
  };

  // Handle campaign victory flow
  function handleCampaignVictory() {
    // Hide victory modal first
    document.getElementById('victoryModal').hidden = true;
    
    // Get opponent deck for rewards
    const opponentDeck = Game.opp.deck.map(card => card.id);
    
    // Record victory and generate rewards
    const rewards = Campaign.recordVictory(opponentDeck);
    
    // Update UI
    updateCampaignUI();
    
    // Show campaign reward modal
    renderCampaignRewards(rewards);
    document.getElementById('campaignRewardModal').hidden = false;
  }

  showStart();
});
