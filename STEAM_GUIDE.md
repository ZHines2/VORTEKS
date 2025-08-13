# VORTEKS Steam Distribution Guide

This guide explains how to build and distribute VORTEKS on Steam using Electron for desktop platforms.

## Prerequisites

### Development Environment
- Node.js 18+ and npm
- Electron and electron-builder (included in dependencies)
- SteamCMD (for uploading builds)
- Steamworks SDK (for Steam integration)

### Steam Requirements
- **Steam Partner Account**: Required for publishing (no upfront fee, revenue share applies)
- **Steam App ID**: Obtained after registering your game in Steamworks
- **Steamworks SDK**: Download from Steamworks Partner site
- **App Store Page**: Configure in Steamworks Partner Portal

## Setup

1. **Install Dependencies**:
```bash
npm install
```

2. **Build Web Assets**:
```bash
npm run build
```

## Building for Steam

### 1. Build Desktop Applications

Build for all platforms:
```bash
npm run build-steam
```

Or build for specific platforms:
```bash
# Windows only
npm run build-steam-win

# macOS only  
npm run build-steam-mac

# Linux only
npm run build-steam-linux
```

### 2. Prepare Steam Distribution

Generate Steam configuration files:
```bash
npm run steam-prep
```

This creates:
- `steam/app_build_vorteks.vdf` - Main build configuration
- `steam/depot_build_*.vdf` - Platform-specific depot configs
- `steam/assets/` - Directory for Steam store assets

### 3. Configure Steam IDs

After registering your app in Steamworks:

1. Edit `steam/app_build_vorteks.vdf`
2. Replace `YOUR_STEAM_APP_ID` with your actual Steam App ID
3. Replace depot IDs (`WINDOWS_DEPOT_ID`, `MAC_DEPOT_ID`, `LINUX_DEPOT_ID`) with actual depot IDs from Steamworks

## Steam Integration Features

### Basic Integration
- **Desktop Application**: Native Windows, macOS, and Linux builds
- **Steam Overlay**: Automatically supported in Electron
- **Screenshots**: F12 key support for Steam screenshots
- **Achievements**: Framework ready for Steam achievements

### Optional Advanced Features
For enhanced Steam integration, consider adding:
- **Steam Workshop**: For user-generated content
- **Steam Cloud**: For save game synchronization  
- **Steam Friends**: Social features integration
- **Steam Stats**: Gameplay statistics tracking

## Steam Store Requirements

### Technical Requirements
- ✅ **Windows 10/11 Support**: Electron builds support modern Windows
- ✅ **macOS Support**: Universal builds for Intel and Apple Silicon
- ✅ **Linux Support**: AppImage format for broad compatibility
- ✅ **64-bit Architecture**: All builds are 64-bit
- ✅ **Offline Play**: Game works without internet connection

### Content Requirements
- ✅ **Age Rating**: Game suitable for all ages (no mature content)
- ✅ **Content Warnings**: None required (family-friendly card game)
- ✅ **Accessibility**: Keyboard navigation supported
- ✅ **Multiple Languages**: Currently English (can be expanded)

## Store Page Configuration

### Required Assets (create in `steam/assets/`)

1. **Header Image** (460×215px): `header_image.png`
2. **Small Capsule** (231×87px): `small_capsule.png`  
3. **Main Capsule** (616×353px): `main_capsule.png`
4. **Library Assets** (600×900px): `library_600x900.png`
5. **Library Header** (460×215px): `library_header.png`

### Screenshots Required
- Minimum 5 gameplay screenshots
- 1280×720 resolution or higher
- Show key features: deck building, combat, AI opponents

### Store Description Template

**Short Description:**
A tactical card battler featuring strategic gameplay with unique Unicode aesthetics. Battle AI opponents using energy management and card combinations.

**About This Game:**
VORTEKS combines traditional card game mechanics with modern tactical strategy. Features 13 unique cards, 5 distinct AI personalities, and a progressive unlock system that rewards strategic thinking.

**Key Features:**
- Tactical card-based combat system
- 5 unique AI opponents with distinct personalities  
- 13 specialized cards with unique abilities
- Energy management and combo mechanics
- Progressive unlock system
- Retro Unicode aesthetic
- Single-player focused experience
- No microtransactions or DLC

## Build and Upload Process

### 1. Build Release Versions
```bash
# Clean build for all platforms
npm run build-steam
```

### 2. Test Builds Locally
```bash
# Test Windows build
./dist-steam/win-unpacked/VORTEKS.exe

# Test macOS build (on macOS)
open ./dist-steam/mac/VORTEKS.app

# Test Linux build
./dist-steam/linux-unpacked/vorteks
```

### 3. Upload to Steam

Using SteamCMD:
```bash
# Navigate to steam directory
cd steam

# Login to Steam (replace username)
steamcmd +login YOUR_STEAM_USERNAME

# Upload build
steamcmd +run_app_build_http ../steam/app_build_vorteks.vdf

# Set build live (optional)
steamcmd +set_steam_guard_code YOUR_2FA_CODE +run_app_build_http ../steam/app_build_vorteks.vdf +quit
```

## Pricing and Monetization

### Recommended Pricing
- **Base Price**: $4.99 - $7.99 (premium indie card game range)
- **Launch Discount**: 20% off for first week
- **Seasonal Sales**: Participate in Steam sales (Summer, Winter, etc.)

### Revenue Share
- **Steam Cut**: 30% (reduces to 25% after $10M, 20% after $50M)
- **Payment Threshold**: $100 minimum before payout
- **Payment Schedule**: Monthly payments

## Marketing and Visibility

### Steam Algorithm Optimization
- **Relevant Tags**: Card Game, Strategy, Indie, Singleplayer, Tactical, Retro
- **Category**: Games > Card
- **Regular Updates**: Maintain visibility with content updates
- **Community**: Engage with reviews and community posts

### Launch Strategy
1. **Coming Soon Page**: Set up 2-4 weeks before launch
2. **Wishlist Campaign**: Drive pre-launch wishlists
3. **Launch Week**: Coordinate with any other platform launches
4. **Content Creator Outreach**: Provide press kits and keys

## File Structure

```
steam/
├── app_build_vorteks.vdf          # Main build configuration
├── depot_build_windows_depot.vdf  # Windows depot config
├── depot_build_mac_depot.vdf      # macOS depot config  
├── depot_build_linux_depot.vdf    # Linux depot config
└── assets/                        # Steam store assets
    ├── header_image.png
    ├── small_capsule.png
    ├── main_capsule.png
    ├── library_600x900.png
    ├── library_header.png
    └── screenshots/
        ├── screenshot1.png
        ├── screenshot2.png
        └── ...

dist-steam/                        # Built applications
├── win-unpacked/                  # Windows build
├── mac/                          # macOS build
└── linux-unpacked/               # Linux build
```

## Troubleshooting

### Build Issues
- **Electron build fails**: Ensure all dependencies are installed with `npm install`
- **Permission errors**: Run terminal/command prompt as administrator (Windows)
- **Code signing**: macOS builds require Apple Developer ID for distribution

### Steam Upload Issues
- **SteamCMD authentication**: Enable Steam Guard and use app passwords
- **Depot size limits**: Keep individual depots under 2GB for faster uploads
- **Build verification**: Test downloads from Steam before going live

### Store Page Issues
- **Asset rejection**: Ensure all images meet Steam's technical requirements
- **Content warnings**: Add appropriate content descriptors in Steamworks
- **Age rating**: Submit for IARC rating if targeting global markets

## Support and Updates

### Post-Launch Support
- Monitor Steam reviews and community discussions
- Regular bug fixes and content updates
- Seasonal events or themed content
- Community-requested features

### Version Control
- Use semantic versioning (2.0.0, 2.1.0, etc.)
- Document changes in Steam announcements
- Maintain backward compatibility for save files

## Revenue Expectations

### Realistic Targets (based on similar indie card games)
- **Launch Month**: 100-500 copies ($500-$3,500 revenue)
- **Year 1**: 1,000-5,000 copies ($5,000-$35,000 revenue)
- **Long-term**: Depends on updates, sales participation, and word-of-mouth

Success factors include pricing strategy, store page quality, and ongoing content updates.