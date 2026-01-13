# Getting Started - Simple Blueprint System

## Your Node Library (Keep It Simple!)

The blueprint system has been simplified to just the essentials. Here's everything you need to know:

## 🔴 Event Nodes (Red - Starting Points)

### On Message Created
Triggers when someone sends a message in your server.

**Outputs:**
- ⚪ **Exec** (white) - Starts the flow
- 🟡 **Message** - The message object
- 🟠 **Content** - The text of the message
- 🔵 **Author** - The user who sent it
- 🟣 **Channel** - The channel it was sent in

### On Slash Command
Triggers when someone uses a slash command.

**Outputs:**
- ⚪ **Exec** (white) - Starts the flow
- 🔵 **Interaction** - The command interaction
- 🔵 **User** - The user who used the command
- 🟣 **Channel** - Where the command was used

---

## 🔵 Action Nodes (Blue - Do Things)

### Send Message
Sends a message to a specific channel.

**Inputs:**
- ⚪ **Exec** - When to execute
- 🟣 **Channel** - Where to send (required)
- 🟠 **Content** - Text to send (optional if you have embed)
- ⚫ **Embed** - Rich embed (optional)

**Outputs:**
- ⚪ **Exec** - Continue to next action
- 🟡 **Message** - The sent message

### Delete Message
Deletes a message.

**Inputs:**
- ⚪ **Exec** - When to execute
- 🟡 **Message** - The message to delete

**Outputs:**
- ⚪ **Exec** - Continue to next action

### Reply to Interaction
Replies to a slash command.

**Inputs:**
- ⚪ **Exec** - When to execute
- 🔵 **Interaction** - The command to reply to
- 🟠 **Content** - Text to send (optional if you have embed)
- ⚫ **Embed** - Rich embed (optional)
- 🔴 **Ephemeral** - Make reply private (true/false)

**Outputs:**
- ⚪ **Exec** - Continue to next action

### Create Embed
Creates a rich Discord embed.

**Inputs:**
- ⚪ **Exec** - When to execute
- 🟠 **Title** - Embed title (optional)
- 🟠 **Description** - Main text (optional)
- 🟠 **Color** - Hex color like "#5865f2" (optional)
- 🟠 **Thumbnail** - Small image URL (optional)
- 🟠 **Image** - Large image URL (optional)
- 🟠 **Footer** - Footer text (optional)

**Outputs:**
- ⚪ **Exec** - Continue to next action
- ⚫ **Embed** - The created embed (connect to Send Message or Reply)

---

## 🟢 Pure Nodes (Green - Provide Values)

### String
A text value you can type in.

**Outputs:**
- 🟠 **Value** - Your text

**How to use:** Double-click the node and type your text in the config box.

### Boolean
A true/false value.

**Outputs:**
- 🔴 **Value** - True or false

**How to use:** Double-click the node and check/uncheck the box.

---

## Examples

### Example 1: Simple Message Response Bot

```
[On Message Created]
   ├─ Exec ────────> [Send Message]
   ├─ Channel ─────┘  └─ Content: [String: "Hello!"]
   └─ (message sent to same channel)
```

**What it does:** Every time someone sends a message, bot replies "Hello!" in that channel.

---

### Example 2: Slash Command with Text

```
[On Slash Command]
   ├─ Exec ────────────> [Reply to Interaction]
   └─ Interaction ─────┘  └─ Content: [String: "Hi there! 👋"]
```

**What it does:** When someone uses your slash command, bot replies with "Hi there! 👋"

---

### Example 3: Send Message with Embed

```
[On Slash Command]
   ├─ Exec ────> [Create Embed] ────> [Reply to Interaction]
   │             ├─ Title: [String: "Welcome!"]    ├─ Interaction: (from event)
   │             ├─ Description: [String: "Thanks  └─ Embed: (from Create Embed)
   │             │    for using this bot!"]
   │             └─ Color: [String: "#5865f2"]
   │
   └─ Interaction ───────────────────────────────────┘
```

**What it does:** Command responds with a fancy blue embed with title and description.

---

### Example 4: Delete Message After Sending

```
[On Message Created]
   ├─ Exec ────> [Send Message] ────> [Delete Message]
   ├─ Channel ─┘  ├─ Content: "msg"  ├─ Message: (from event)
   └─ Message ────────────────────────┘
```

**What it does:** Sends "msg" then immediately deletes the original message.

---

## Tips

### 1. White Arrows = Order of Actions
Follow the white exec arrows to see what happens and when. Left to right!

### 2. Colored Pins = Data Flow
Connect colored pins to pass data between nodes. Colors must match (or be compatible).

### 3. Event Nodes Start Everything
Always start with a red Event node. It's the trigger!

### 4. String Nodes for Text
Whenever you need to provide text, use a green String node and type your text in it.

### 5. Create Embed Then Use It
Create your embed first, then connect its output to Send Message or Reply to Interaction.

---

## Common Patterns

### Pattern: Basic Command Response
```
Event → Reply to Interaction
        └─ Content from String node
```

### Pattern: Message with Embed
```
Event → Create Embed → Send/Reply
        ├─ Text from String nodes
        └─ Embed output connects to Send/Reply
```

### Pattern: Sequential Actions
```
Event → Action 1 → Action 2 → Action 3
```
Actions execute in order following the white exec arrows!

---

## What's Next?

This minimal set gives you everything to build basic bots. As you get comfortable, more nodes can be added:
- Math operations
- Conditionals (if/else)
- Role management
- More Discord events
- And more!

But for now: **Start simple, build something cool!** 🚀
