const fs = require('fs');
const path = require('path');

// Steam preparation script
// This script prepares the built app for Steam distribution

const STEAM_CONFIG = {
  appId: '', // TODO: Replace with actual Steam App ID when obtained
  depots: {
    windows: {
      id: '', // TODO: Windows depot ID
      path: 'dist-steam/win-unpacked/'
    },
    mac: {
      id: '', // TODO: Mac depot ID  
      path: 'dist-steam/mac/'
    },
    linux: {
      id: '', // TODO: Linux depot ID
      path: 'dist-steam/linux-unpacked/'
    }
  }
};

async function prepareSteamBuild() {
  console.log('Preparing VORTEKS for Steam distribution...');
  
  // Create steam directory if it doesn't exist
  const steamDir = path.join(__dirname, '../steam');
  if (!fs.existsSync(steamDir)) {
    fs.mkdirSync(steamDir, { recursive: true });
  }
  
  // Generate Steam app configuration template
  const appConfigTemplate = {
    appid: STEAM_CONFIG.appId || 'YOUR_STEAM_APP_ID',
    desc: 'VORTEKS - Unicode Card Battler',
    buildoutput: '../steam-build-logs',
    contentroot: '../dist-steam/',
    setlive: '',
    preview: 0,
    local: '',
    depots: {
      [STEAM_CONFIG.depots.windows.id || 'WINDOWS_DEPOT_ID']: {
        FileMapping: {
          LocalPath: 'win-unpacked/*',
          DepotPath: '.',
          recursive: 1
        }
      },
      [STEAM_CONFIG.depots.mac.id || 'MAC_DEPOT_ID']: {
        FileMapping: {
          LocalPath: 'mac/*',
          DepotPath: '.',
          recursive: 1
        }
      },
      [STEAM_CONFIG.depots.linux.id || 'LINUX_DEPOT_ID']: {
        FileMapping: {
          LocalPath: 'linux-unpacked/*',
          DepotPath: '.',
          recursive: 1
        }
      }
    }
  };
  
  // Write Steam app configuration
  const appConfigPath = path.join(steamDir, 'app_build_vorteks.vdf');
  const vdfContent = generateVDF(appConfigTemplate);
  fs.writeFileSync(appConfigPath, vdfContent);
  
  // Generate depot configurations
  generateDepotConfigs(steamDir);
  
  // Copy Steam assets
  copySteamAssets(steamDir);
  
  console.log('Steam build preparation complete!');
  console.log('Next steps:');
  console.log('1. Replace placeholder IDs in steam/app_build_vorteks.vdf with actual Steam App ID and Depot IDs');
  console.log('2. Install Steamworks SDK');
  console.log('3. Use SteamCMD to upload builds');
  console.log('4. Configure store page in Steamworks');
}

function generateVDF(config) {
  return `"appbuild"
{
  "appid" "${config.appid}"
  "desc" "${config.desc}"
  "buildoutput" "${config.buildoutput}"
  "contentroot" "${config.contentroot}"
  "setlive" "${config.setlive}"
  "preview" "${config.preview}"
  "local" "${config.local}"
  
  "depots"
  {
    ${Object.entries(config.depots).map(([depotId, depot]) => `
    "${depotId}"
    {
      "FileMapping"
      {
        "LocalPath" "${depot.FileMapping.LocalPath}"
        "DepotPath" "${depot.FileMapping.DepotPath}"
        "recursive" "${depot.FileMapping.recursive}"
      }
    }`).join('')}
  }
}`;
}

function generateDepotConfigs(steamDir) {
  const depots = [
    {
      id: 'WINDOWS_DEPOT_ID',
      name: 'Windows Content',
      path: 'win-unpacked/*'
    },
    {
      id: 'MAC_DEPOT_ID', 
      name: 'Mac Content',
      path: 'mac/*'
    },
    {
      id: 'LINUX_DEPOT_ID',
      name: 'Linux Content', 
      path: 'linux-unpacked/*'
    }
  ];
  
  depots.forEach(depot => {
    const depotConfig = `"DepotBuildConfig"
{
  "DepotID" "${depot.id}"
  "ContentRoot" "../dist-steam/"
  "FileMapping"
  {
    "LocalPath" "${depot.path}"
    "DepotPath" "."
    "recursive" "1"
  }
}`;
    
    fs.writeFileSync(path.join(steamDir, `depot_build_${depot.id.toLowerCase()}.vdf`), depotConfig);
  });
}

function copySteamAssets(steamDir) {
  // Create assets directory
  const assetsDir = path.join(steamDir, 'assets');
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }
  
  // Copy main icon as Steam header image (needs to be 460x215)
  const iconPath = path.join(__dirname, '../vortexicon.png');
  if (fs.existsSync(iconPath)) {
    fs.copyFileSync(iconPath, path.join(assetsDir, 'header_image.png'));
  }
  
  // Create README for Steam assets
  const assetsReadme = `# Steam Assets for VORTEKS

This directory contains assets needed for Steam store page configuration.

## Required Steam Assets

### Store Images
- **Header Image** (460×215): header_image.png - Main store header
- **Small Capsule** (231×87): small_capsule.png - Used in lists
- **Main Capsule** (616×353): main_capsule.png - Featured placement
- **Library Assets** (600×900): library_600x900.png - Steam library
- **Library Header** (460×215): library_header.png - Library header

### Screenshots
- Minimum 5 screenshots at 1280×720 or higher
- First screenshot becomes primary
- Show key gameplay features

### Videos (Optional)
- MP4 format, H.264 codec
- 1280×720 minimum resolution
- Maximum 500MB file size

## Current Assets
- header_image.png (copied from vortexicon.png - needs resizing to 460×215)

## Next Steps
1. Resize header_image.png to 460×215 pixels
2. Create additional required store images
3. Take gameplay screenshots
4. Upload assets to Steamworks Partner Portal
`;
  
  fs.writeFileSync(path.join(assetsDir, 'README.md'), assetsReadme);
}

if (require.main === module) {
  prepareSteamBuild().catch(console.error);
}

module.exports = { prepareSteamBuild };