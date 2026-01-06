# Discord Bot Maker

A visual Discord bot creator with drag-and-drop command builder and automatic executable generation.

## Features

- 🎯 **Visual Command Builder** - Create Discord bot commands using drag-and-drop actions
- 🔐 **Secure Configuration** - Easy setup for bot tokens and credentials
- ▶️ **One-Click Start/Stop** - Simple bot runtime management
- 📊 **Real-Time Console** - Monitor bot activity with a built-in console display
- 🚀 **Auto-Built Executables** - GitHub Actions automatically builds .exe, .dmg, and .AppImage files
- 🎨 **Modern UI** - Beautiful, Discord-themed interface

## Quick Start

### Prerequisites

- Node.js 18 or higher
- A Discord bot token ([Get one here](https://discord.com/developers/applications))

### Installation

1. Clone the repository:
```bash
git clone https://github.com/YourUsername/Guy-Discord-Bot-Maker.git
cd Guy-Discord-Bot-Maker
```

2. Install dependencies:
```bash
npm install
```

3. Run the development version:
```bash
npm run dev
```

### Building Executables

Build for your platform:

```bash
# Windows
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux
```

The built files will be in the `dist-electron` folder.

## Getting Your Bot Token

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and give it a name
3. Go to the "Bot" tab and click "Add Bot"
4. Copy the bot token (you'll need this in the app)
5. Enable "Message Content Intent" under Privileged Gateway Intents
6. Go to OAuth2 → URL Generator:
   - Select "bot" and "applications.commands" scopes
   - Select desired permissions
   - Use the generated URL to invite your bot to your server

## Using the Bot Maker

### 1. Configuration Tab

Enter your bot's credentials:
- **Bot Token** (required) - From Discord Developer Portal
- **Application ID** (optional but recommended) - For slash commands
- **Guild ID** (optional) - For instant command updates in a specific server

### 2. Commands Tab

Create bot commands using the drag-and-drop builder:

1. Click "New Command"
2. Enter command name and description
3. Drag action blocks from the left panel into the drop zone
4. Configure each action (message content, embed details, etc.)
5. Click "Save Command"

### 3. Start Your Bot

1. Click "Start Bot" in the top-right corner
2. Watch the console for real-time logs
3. Use your commands in Discord!
4. Click "Stop Bot" when done

## Available Actions

- **💬 Send Message** - Send a text message
- **📋 Send Embed** - Send a rich embed with title, description, and color
- **🎭 Add Role** - Add a role to the user who runs the command

More actions coming soon!

## GitHub Actions

This repository includes automatic build workflows:

- **On Push** - Builds executables for Windows, macOS, and Linux
- **On Tag** - Creates a GitHub release with downloadable executables
- **Artifacts** - All builds are uploaded as artifacts

To create a release:

```bash
git tag v1.0.0
git push origin v1.0.0
```

The workflow will automatically build and create a release with all executables.

## Development

### Project Structure

```
Guy-Discord-Bot-Maker/
├── electron/           # Electron main process
│   ├── main.js        # Application entry point
│   ├── preload.js     # Preload script for IPC
│   └── botRunner.js   # Discord bot runtime
├── src/               # React frontend
│   ├── components/    # UI components
│   ├── App.jsx        # Main app component
│   └── main.jsx       # React entry point
├── .github/
│   └── workflows/     # GitHub Actions workflows
└── package.json       # Dependencies and scripts
```

### Tech Stack

- **Electron** - Desktop application framework
- **React** - UI library
- **Vite** - Build tool
- **Discord.js** - Discord bot library
- **React DnD** - Drag-and-drop functionality

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for anything you like!

## Support

If you encounter issues or have questions:
1. Check the [Discord Developer Documentation](https://discord.com/developers/docs)
2. Open an issue on GitHub
3. Make sure your bot has the required intents enabled

## Roadmap

- [ ] More action types (remove role, kick, ban, etc.)
- [ ] Command permissions system
- [ ] Event handlers (on member join, etc.)
- [ ] Variable system for dynamic responses
- [ ] Import/export bot configurations
- [ ] Multi-bot management
- [ ] Built-in bot templates

---

Made with ❤️ for the Discord community
