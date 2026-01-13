# Blueprint System - Usage Guide

## Welcome to the New UE5-Style Event System! 🎉

The Discord Bot Maker now features a completely redesigned event system inspired by Unreal Engine 5's Blueprint visual scripting. This guide will help you understand and use the new system.

## What's New?

### 🔴 Event Nodes (Red)
Event nodes are the **starting point** of your bot's logic. They trigger when something happens in Discord.

**Key Features:**
- No execution input (they are triggers, not called by other nodes)
- One or more execution outputs (white arrows)
- Data outputs (colored pins) that provide information about the event

**Available Event Nodes:**
- `On Message Created` - When a user sends a message
- `On Member Joined` - When a user joins the server
- `On Member Left` - When a user leaves the server
- `On Reaction Added` - When someone reacts to a message
- `On Voice State Changed` - When users join/leave/move in voice channels
- `On Slash Command` - When a slash command is used
- `On Bot Ready` - When the bot starts up

### 🔵 Action Nodes (Blue)
Action nodes **do things** - they modify Discord (send messages, add roles, etc.)

**Key Features:**
- Has execution input (white arrow in) and output (white arrow out)
- Executes when control flow reaches them
- Can have data inputs and outputs
- Modifies Discord state or sends API requests

**Available Action Nodes:**
- `Send Message` - Send a message to a specific channel (**now properly sends to the channel you specify!**)
- `Reply to Message` - Reply to a specific message
- `Reply to Interaction` - Reply to a slash command or button (for ephemeral responses)
- `Edit Message` - Edit an existing message
- `Delete Message` - Delete a message
- `Add Reaction` - React to a message with an emoji
- `Add Role` - Give a role to a member
- `Remove Role` - Remove a role from a member
- `Kick Member` - Kick a user
- `Ban Member` - Ban a user
- `Timeout Member` - Timeout a user
- `Send DM` - Send a direct message to a user
- `Create Embed` - Create a rich embed object

### 🟢 Pure Nodes (Green)
Pure nodes are **data processors** - they don't modify anything, just calculate values.

**Key Features:**
- No execution pins (just data in and out)
- Compute automatically when their outputs are needed
- Same inputs always produce same outputs
- Lazy evaluation (only computed when needed)

**Available Pure Nodes:**

**String Operations:**
- `Join Strings` - Concatenate strings
- `String Contains` - Check if string contains substring
- `String Uppercase` - Convert to uppercase
- `String Lowercase` - Convert to lowercase

**Math Operations:**
- `Add` - Add two numbers
- `Subtract` - Subtract two numbers
- `Multiply` - Multiply two numbers
- `Divide` - Divide two numbers
- `Random Number` - Generate random number

**Comparison:**
- `Equals` - Check if A equals B
- `Greater Than` - Check if A > B
- `Less Than` - Check if A < B

**Boolean Logic:**
- `AND` - Logical AND
- `OR` - Logical OR
- `NOT` - Logical NOT

**Discord Data:**
- `Get User Name` - Extract username from user
- `Get User ID` - Extract user ID
- `Get Channel Name` - Extract channel name
- `Get Guild Name` - Extract server name
- `Get Member Count` - Get total member count
- `Has Role` - Check if member has a role

**Type Conversion:**
- `To String` - Convert to string
- `To Number` - Convert to number

**Constants:**
- `String Constant` - A constant string value
- `Number Constant` - A constant number value
- `Boolean Constant` - A constant true/false value

### 🟠 Flow Control Nodes (Orange)
Flow control nodes manage **how execution flows** through your blueprint.

**Key Features:**
- Has execution input
- Multiple execution outputs (for branching)
- Controls the flow of logic

**Available Flow Control Nodes:**
- `Branch` - If/else conditional (if true, go one way; if false, go another)
- `Delay` - Wait for a duration before continuing
- `Sequence` - Execute multiple paths in order
- `For Each` - Loop through array elements

## Understanding Pins

### White Pins (Execution Flow)
White pins control **when** things happen. Execution flows from left to right through nodes:

```
[Event Node] ─exec─> [Action 1] ─exec─> [Action 2] ─exec─> [Action 3]
```

### Colored Pins (Data Flow)
Colored pins carry **data** between nodes. Data flows on-demand when needed:

| Color | Type | Description |
|-------|------|-------------|
| 🟠 Orange | String | Text data |
| 🔵 Cyan | Number | Numeric values |
| 🔴 Red | Boolean | True/False |
| 🔵 Blue | User/Member | Discord user |
| 🟣 Purple | Channel | Discord channel |
| 🟢 Green | Guild | Discord server |
| 🟡 Gold | Role | Discord role |
| 🟡 Yellow | Message | Discord message |
| ⚪ Gray | Embed | Discord embed |
| ⚫ Black | Any | Can connect to anything |

## Common Patterns

### Pattern 1: Simple Command Response

```
[On Slash Command]
   Exec ──> [Reply to Interaction]
             ├─ Interaction: (from event)
             └─ Content: "Hello, world!"
```

This responds to any slash command with "Hello, world!"

### Pattern 2: Conditional Logic

```
[On Message Created]
   Exec ──────> [Branch]
   Content ─┐      ├─ Condition: (from Equals node)
            │      ├─ True ──> [Send Message]
            │      │             ├─ Channel: (from event)
            │      │             └─ Content: "You said hello!"
            │      └─ False ──> [Send Message]
            │                    ├─ Channel: (from event)
            │                    └─ Content: "You didn't say hello"
            │
            └──> [Equals]
                 ├─ A: (Content from event)
                 └─ B: "hello" (constant)
```

This checks if a message says "hello" and responds accordingly.

### Pattern 3: Send Message to Specific Channel

**IMPORTANT:** Unlike the old system, `Send Message` now requires you to specify the channel!

```
[On Member Joined]
   Exec ────────────> [Send Message]
   Member ─────┐        ├─ Channel: (welcome channel - you need to get this!)
               │        ├─ Content: (from Join Strings)
               │        └─ Embed: (optional)
               │
               └──> [Get User Name]
                    └─ Result ──> [Join Strings]
                                  ├─ A: "Welcome, "
                                  ├─ B: (username from Get User Name)
                                  └─ Separator: ""
```

To get a specific channel, you'll need to:
1. Use a channel ID (you can create a `Get Channel by ID` pure node - coming soon!)
2. Or use the channel from the event if applicable

### Pattern 4: Role-Based Permissions

```
[On Slash Command]
   Exec ──────────────────> [Branch]
   Member ────┐               ├─ Condition: (from Has Role)
              │               ├─ True ──> [Reply to Interaction]
              │               │            ├─ Content: "You have permission!"
              │               └─ False ──> [Reply to Interaction]
              │                             ├─ Content: "You don't have permission"
              │                             └─ Ephemeral: true
              │
              └──> [Has Role]
                   ├─ Member: (from event)
                   └─ Role: (admin role - you need to specify this)
```

### Pattern 5: Complex Embed Message

```
[On Slash Command]
   Exec ────────────> [Create Embed] ────> [Reply to Interaction]
                       ├─ Title: "Server Info"              ├─ Interaction: (from event)
                       ├─ Description: (from Join Strings)  └─ Embed: (from Create Embed)
                       ├─ Color: "#5865f2"
                       └─ Thumbnail: (server icon URL)

   Guild ──> [Get Guild Name] ──> [Join Strings]
                                   ├─ A: "Welcome to "
                                   ├─ B: (guild name)
                                   └─ Separator: ""
```

## Key Differences from Old System

### ✅ What's Fixed

1. **Send Message is REAL** - It actually sends to the channel you specify, not a fake "reply to interaction"
2. **Reply to Interaction is SEPARATE** - Use this for slash command responses
3. **True Execution Flow** - White exec pins show exactly what order things happen in
4. **Lazy Evaluation** - Pure nodes only compute when their values are needed (efficient!)
5. **Visual Clarity** - You can SEE the flow of logic with your eyes
6. **No More "Fake" Behavior** - Nodes do exactly what they say they do

### 📋 Migration from Old System

If you have bots using the old system, you'll need to rebuild them with the new blueprint system. Here's a quick guide:

**Old "Send Message" (was actually reply to interaction):**
```
Old: Send Message with content "Hello"
     (would reply to the slash command)
```

**New Approach:**
```
New: Reply to Interaction
     ├─ Interaction: (from On Slash Command)
     ├─ Content: "Hello"
     └─ Ephemeral: false
```

**Old "Send Message to Channel":**
```
Old: Send Message node (but it didn't really work right)
```

**New Approach:**
```
New: Send Message
     ├─ Channel: (specify the actual channel!)
     ├─ Content: "Hello"
     └─ Embed: (optional)
```

## Tips & Best Practices

### 1. Start with an Event Node
Every blueprint must start with a red Event node. This is your entry point.

### 2. Use Pure Nodes for Data Processing
Don't use Action nodes just to transform data. Use green Pure nodes for calculations and data manipulation.

### 3. Follow the Exec Flow
White execution pins show the order of operations. Follow them left to right to understand your logic.

### 4. Type Safety
Pins are color-coded by type. You can only connect compatible types:
- String ➜ String ✅
- Number ➜ String ✅ (auto-converts)
- String ➜ Number ❌ (use "To Number" node)

### 5. Constants for Static Values
Use constant nodes (String Constant, Number Constant, etc.) for values that don't change.

### 6. Branch for Decisions
Use the Branch node for if/else logic. Connect a boolean output to its Condition input.

### 7. Delay for Timing
Use the Delay node to wait before executing the next action.

### 8. For Each for Arrays
Use For Each to loop through lists (like array of members, roles, etc.)

## Troubleshooting

### "My bot doesn't respond to commands"
- Make sure you have an `On Slash Command` event node
- Check that execution flows from the event to `Reply to Interaction`
- Verify the command is registered in your bot settings

### "Send Message doesn't work"
- Make sure you're connecting a Channel to the Channel input
- The channel must be a valid Discord channel object
- Check bot permissions in the target channel

### "My pure node isn't computing"
- Pure nodes compute automatically when their outputs are used
- Make sure the output is connected to something that needs it
- Check that all required inputs are connected

### "Execution stops partway through"
- Check for errors in the console
- Verify all required inputs are provided
- Make sure there are no cycles in your data flow

### "My condition always goes to False"
- Use the Equals, Greater Than, or Less Than nodes for comparisons
- Make sure you're comparing the right types (String to String, Number to Number)
- Check the actual values being compared (use console.log or debug mode)

## Next Steps

1. **Experiment** - Create simple blueprints to get comfortable
2. **Build** - Start with basic commands and work up to complex flows
3. **Learn** - Study the examples in this guide
4. **Iterate** - Refine your blueprints as you learn

## Example Blueprints

### Example 1: Welcome Message Bot

```
[On Member Joined]
   Exec ──────────────> [Send Message]
   Member ───┐           ├─ Channel: (your welcome channel)
             │           ├─ Content: (from Join Strings)
             │           └─ Embed: (optional)
             │
             └─> [Get User Name]
                 └─> [Join Strings]
                      ├─ A: "Welcome to the server, "
                      ├─ B: (username)
                      ├─ Separator: ""
                      └─> Result
```

### Example 2: Moderation Bot

```
[On Message Created]
   Exec ──────────────> [Branch]
   Content ──┐           ├─ Condition: (from String Contains)
             │           ├─ True ──> [Delete Message] ──> [Timeout Member]
             │           │            ├─ Message (from event)  ├─ Member (from event)
             │           │                                      ├─ Duration: 60
             │           └─ False ──> (do nothing)             └─ Reason: "Bad word"
             │
             └─> [String Contains]
                 ├─ String: (content from event)
                 ├─ Substring: "badword"
                 └─> Result
```

### Example 3: Info Command

```
[On Slash Command]
   Exec ──────> [Create Embed] ──────> [Reply to Interaction]
   Guild ─┐      ├─ Title: "Server Info"    ├─ Interaction (from event)
          │      ├─ Description: (joined)   └─ Embed (from Create Embed)
          │      ├─ Color: "#5865f2"
          │      └─ Thumbnail: (optional)
          │
          ├──> [Get Guild Name] ──┐
          │                        ├──> [Join Strings]
          └──> [Get Member Count] ─┘     ├─ A: (guild name)
                                         ├─ B: " has "
                                         ├─ C: (member count)
                                         ├─ D: " members"
                                         └─> Result
```

## Contributing

Found a bug? Have a feature request? Open an issue on GitHub!

Want to add new nodes? Check out the developer guide in `BLUEPRINT_REDESIGN.md`.

---

**Happy Bot Making! 🤖**
