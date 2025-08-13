const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Steam integration placeholder
  steam: {
    isAvailable: () => {
      try {
        return require('steamworks.js') !== null;
      } catch {
        return false;
      }
    },
    
    // Achievement system (placeholder for Steam integration)
    unlockAchievement: (achievementId) => {
      console.log('Achievement unlocked:', achievementId);
      // TODO: Implement Steam achievement unlock
    },
    
    // Stats system (placeholder for Steam integration)
    setStat: (statName, value) => {
      console.log('Stat updated:', statName, value);
      // TODO: Implement Steam stats
    }
  },
  
  // Desktop-specific features
  platform: process.platform,
  
  // App info
  app: {
    getName: () => 'VORTEKS',
    getVersion: () => '2.0.0'
  }
});

// Make some Node.js features available to the web app
contextBridge.exposeInMainWorld('desktop', {
  platform: process.platform,
  isElectron: true,
  version: process.versions.electron
});