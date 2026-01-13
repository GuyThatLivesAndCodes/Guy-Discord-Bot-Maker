# Quick Reference - Blueprint System

## Creating an Event

### Step 1: Choose Event Type
- **Command** - Slash commands (/hello, /info, etc.)
- **Event Trigger** - Discord events (messages, members joining, etc.)
- **Anti-Hack** - Spam detection and prevention

### Step 2: Choose Mode
- **✅ Basic Event** - Simple system with 8 essential nodes
- **⏳ Advanced Event** - Coming soon! (Full feature set)

### Step 3: Build Your Blueprint
Use the visual node editor to create your bot's logic.

---

## Available Nodes (Basic Mode)

### 🔴 Event Nodes (2) - Red
**Starting points for your bot:**

1. **On Message Created** 💬
   - Triggers when someone sends a message
   - Outputs: Message, Content, Author, Channel

2. **On Slash Command** ⚡
   - Triggers when someone uses a slash command
   - Outputs: Interaction, User, Channel

---

### 🔵 Action Nodes (4) - Blue
**Actions that modify Discord:**

1. **Send Message** 📤
   - Send a message to any channel
   - Inputs: Channel (required), Content, Embed
   - Outputs: Message

2. **Delete Message** 🗑️
   - Delete a message
   - Inputs: Message (required)

3. **Reply to Interaction** 💬
   - Reply to a slash command
   - Inputs: Interaction (required), Content, Embed, Ephemeral
   - Use this for command responses!

4. **Create Embed** 📋
   - Create a rich Discord embed
   - Inputs: Title, Description, Color, Thumbnail, Image, Footer
   - Outputs: Embed (connect to Send Message or Reply)

---

### 🟢 Pure Nodes (2) - Green
**Provide values:**

1. **String** 📝
   - A text value you type in
   - Double-click to configure
   - Outputs: Value (text)

2. **Boolean** ✓
   - A true/false checkbox
   - Double-click to configure
   - Outputs: Value (true/false)

---

## How to Build

### Example 1: Simple Command Response
```
[On Slash Command]
   ├─ Exec ──────> [Reply to Interaction]
   ├─ Interaction ──┘  ├─ Content: [String: "Hello!"]
   └─────────────────────┘
```

### Example 2: Message with Embed
```
[On Slash Command]
   ├─ Exec ──────> [Create Embed] ──────> [Reply to Interaction]
   │                ├─ Title: [String]    ├─ Interaction: (event)
   │                ├─ Color: [String]    └─ Embed: (from Create)
   │                └─ Description: [String]
   └─ Interaction ────────────────────────────┘
```

### Example 3: Send to Specific Channel
```
[On Message Created]
   ├─ Exec ──────> [Send Message]
   └─ Channel ────┘  └─ Content: [String: "New message!"]
```

---

## Pin Colors

| Color | Type | Description |
|-------|------|-------------|
| ⚪ White | Exec | Order of execution (follows left to right) |
| 🟠 Orange | String | Text data |
| 🔴 Red | Boolean | True/False |
| 🔵 Blue | User | Discord user |
| 🟣 Purple | Channel | Discord channel |
| 🟡 Yellow | Message | Discord message |
| ⚫ Gray | Embed | Discord embed |
| 🔵 Cyan | Interaction | Command interaction |

---

## Tips

1. **Start with an Event node** (red) - Every blueprint needs one
2. **Follow the white arrows** - Shows execution order
3. **Connect matching colors** - Data flows through colored pins
4. **String nodes for text** - Type your text values
5. **Click Save when done** - Don't forget to save!

---

## Troubleshooting

**"Nothing happens when I use the command"**
- Make sure you have an Event node (red)
- Check white exec arrows connect event → action
- Verify the command name is set correctly

**"Can't connect two pins"**
- Pins must be compatible colors
- Data inputs only accept one connection
- Exec pins (white) only connect to other exec pins

**"Node config not showing"**
- Double-click the node header to expand/collapse
- String and Boolean nodes have editable configs
- Type your value in the text box

**"Bot sends to wrong channel"**
- Make sure Channel pin is connected properly
- Use the channel from the event, or specify one

---

## What's Next?

Basic mode gives you everything for:
- ✅ Command responses
- ✅ Message triggers
- ✅ Rich embeds
- ✅ Simple workflows

Advanced mode (coming soon) will add:
- Variables (global, server, user scoped)
- Conditionals (if/else branching)
- Loops (for each, while)
- Math operations
- Role management
- More Discord events
- And much more!

---

**Need help?** Check GETTING_STARTED.md for detailed examples!
