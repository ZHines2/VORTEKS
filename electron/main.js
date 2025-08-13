const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');

// Keep a global reference of the window object
let mainWindow;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    icon: path.join(__dirname, '../icons/icon-512x512.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true
    },
    show: false,
    titleBarStyle: 'default',
    frame: true
  });

  // Load the app
  mainWindow.loadFile('index.html');

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Focus on window
    if (process.platform === 'darwin') {
      app.dock.show();
    }
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Prevent navigation to external sites
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('file://')) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  // Development tools (only in dev mode)
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
}

// App event handlers
app.whenReady().then(() => {
  createWindow();
  
  // Create application menu
  createMenu();
  
  app.on('activate', () => {
    // On macOS, re-create window when dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // On macOS, apps stay active until explicitly quit
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Steam integration (if available)
let steamworks;
try {
  // Optional Steam integration - will fail gracefully if not available
  steamworks = require('steamworks.js');
  
  if (steamworks) {
    console.log('Steam integration initialized');
    
    // Initialize Steam achievements if available
    app.whenReady().then(() => {
      try {
        const client = steamworks.init(/* your Steam app ID here */);
        console.log('Steam client initialized:', client);
      } catch (error) {
        console.log('Steam initialization failed (normal for development):', error.message);
      }
    });
  }
} catch (error) {
  console.log('Steam integration not available (normal for development)');
}

function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Game',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.executeJavaScript('if (window.newGame) window.newGame();');
          }
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Game',
      submenu: [
        {
          label: 'Quick Start',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            mainWindow.webContents.executeJavaScript('if (window.quickStart) window.quickStart();');
          }
        },
        {
          label: 'Build Deck',
          accelerator: 'CmdOrCtrl+B',
          click: () => {
            mainWindow.webContents.executeJavaScript('if (window.buildDeck) window.buildDeck();');
          }
        },
        { type: 'separator' },
        {
          label: 'Toggle Fullscreen',
          accelerator: 'F11',
          click: () => {
            const isFullScreen = mainWindow.isFullScreen();
            mainWindow.setFullScreen(!isFullScreen);
          }
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            mainWindow.reload();
          }
        },
        {
          label: 'Developer Tools',
          accelerator: 'F12',
          click: () => {
            mainWindow.webContents.toggleDevTools();
          }
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About VORTEKS',
          click: () => {
            const options = {
              type: 'info',
              title: 'About VORTEKS',
              message: 'VORTEKS v2.0.0',
              detail: 'Unicode Minimal Card Battler\nDeveloped by ZHines2\n\nA tactical card game featuring strategic gameplay with unique Unicode aesthetics.'
            };
            require('electron').dialog.showMessageBox(mainWindow, options);
          }
        },
        {
          label: 'Game Controls',
          click: () => {
            shell.openExternal('https://github.com/ZHines2/VORTEKS');
          }
        }
      ]
    }
  ];

  // macOS specific menu adjustments
  if (process.platform === 'darwin') {
    template.unshift({
      label: 'VORTEKS',
      submenu: [
        {
          label: 'About VORTEKS',
          role: 'about'
        },
        { type: 'separator' },
        {
          label: 'Hide VORTEKS',
          accelerator: 'Command+H',
          role: 'hide'
        },
        {
          label: 'Hide Others',
          accelerator: 'Command+Shift+H',
          role: 'hideothers'
        },
        {
          label: 'Show All',
          role: 'unhide'
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: 'Command+Q',
          click: () => app.quit()
        }
      ]
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}