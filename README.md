# 🍅 AnotherDoro

A clean, minimal Pomodoro timer application built with modern web technologies. Available for desktop (macOS, Windows, Linux) and mobile (Android) platforms.

![AnotherDoro](assets/icon.png)

## ✨ Features

- 🕐 **Classic Pomodoro Timer** - 25-minute work sessions with 5-minute breaks
- 🖥️ **Cross-Platform** - Runs on macOS, Windows, Linux, and Android devices
- 🎨 **Clean Interface** - Minimal, distraction-free design
- 🔔 **System Notifications** - Get notified when sessions end
- 📱 **Mobile-First** - Responsive design that works everywhere
- ⚡ **Lightweight** - Fast startup and minimal resource usage

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v20 or higher)
- **npm** or **yarn**

#### For desktop builds:
- **macOS:** Xcode Command Line Tools, macOS 10.13+
- **Windows:** Windows 7+ (64-bit), Visual Studio Build Tools
- **Linux:** Standard build tools (build-essential on Ubuntu)

#### For Android builds:
- **Android Studio** or **Android SDK**
- **Java Development Kit (JDK)**
- **ANDROID_HOME** environment variable set

### Installation

```bash
# Clone the repository
git clone https://github.com/herickchann/another-doro.git
cd another-doro

# Install dependencies
npm install
```

## 📦 Build Commands

### macOS Desktop App

```bash
# Build for macOS
npm run build:mac

# Build for all platforms
npm run build

# Build distribution package
npm run dist
```

**Output:** `dist/` folder containing:
- `.dmg` installer files
- `.app` application bundles

### Android Mobile App

```bash
# Debug build (for testing)
npm run build:android

# Release build (for distribution)
npm run build:android-release
```

**Output:** `dist/` folder containing:
- `AnotherDoro-1.0.0-debug.apk` (~4 MB)
- `AnotherDoro-1.0.0-release.apk` (~3 MB)

### Development

```bash
# Run Electron app (production mode)
npm start

# Run in development mode (with hot reload)
npm run dev

# Sync mobile assets
npx cap sync android
npx cap open android
```

## 📱 Installation

### Desktop Apps

#### macOS
1. Download the `.dmg` file from the `dist/` folder
2. Open the DMG and drag AnotherDoro to Applications
3. Launch from Applications folder

#### Windows
1. Download the `.exe` installer from the `dist/` folder
2. Run the installer and follow the setup wizard
3. Launch from Start Menu or Desktop shortcut

#### Linux
1. Download the `.AppImage` file from the `dist/` folder
2. Make it executable: `chmod +x AnotherDoro-*.AppImage`
3. Run the AppImage file

### Android
1. Enable "Unknown Sources" in Settings → Security
2. Install the APK: `adb install dist/AnotherDoro-1.0.0-debug.apk`
3. Or transfer APK to device and tap to install

## 🛠️ Technology Stack

- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **Desktop:** Electron 43
- **Mobile:** Capacitor 8
- **Build System:** Node.js, npm scripts
- **Platforms:** macOS, Windows, Linux, Android

## 📁 Project Structure

AnotherDoro uses a **single-source architecture** to avoid code duplication:

```
another-doro/
├── assets/              # Icons, images, resources  
├── src/                 # Source components and utilities
├── scripts/             # Build and utility scripts
├── android/             # Android/Capacitor project
├── dist/               # Build outputs (ignored by git)
├── www/                # Generated for mobile builds (DO NOT EDIT)
├── index.html          # Main HTML file (source of truth)
├── styles.css          # Application styles (source of truth)
├── renderer.js         # Main application logic (source of truth)
├── main.js             # Electron main process
├── package.json        # Dependencies and scripts
└── capacitor.config.ts # Capacitor configuration
```

**Key Points:**
- Source files live in the root directory
- `www/` is automatically generated for mobile builds
- Never manually edit files in `www/` - they will be overwritten
- See [DEVELOPMENT.md](DEVELOPMENT.md) for detailed development workflow

## 🔧 Advanced Build Options

### Custom Android Builds

```bash
# Build with custom configuration
node build-android.js --release

# Clean build (removes previous builds)
cd android && ./gradlew clean && cd ..
npm run build:android
```

### Cross-Platform Builds

```bash
# Build for Windows
npm run build:win

# Build for Linux
npm run build:linux

# Build for all platforms
npm run build
```

## 🐛 Troubleshooting

### Android Build Issues

```bash
# Check Capacitor setup
npx cap doctor

# Reset Android project
npx cap clean android
npx cap sync android

# Check Android SDK
echo $ANDROID_HOME
```

### macOS Build Issues

```bash
# Clear Electron cache
npm run clean

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## 📋 Build Requirements

### Minimum Versions
- **Node.js:** 20.0+
- **npm:** 8.0+
- **Android SDK:** API 22+ (Android 5.1)
- **macOS:** 10.13+ (High Sierra)

### Disk Space
- **Development:** ~500 MB
- **Build artifacts:** ~200 MB per platform

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Test on both platforms
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Electron](https://electronjs.org/) for desktop
- Mobile version powered by [Capacitor](https://capacitorjs.com/)
- Icons and design inspired by minimalist productivity tools

---

**Made with ❤️ for productivity enthusiasts**

For detailed build instructions, see:
- [BUILD-ANDROID.md](BUILD-ANDROID.md) - Android build guide
- [package.json](package.json) - All available npm scripts 