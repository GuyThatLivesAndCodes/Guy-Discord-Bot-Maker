# Discord Bot Maker - UE5 Blueprint Style Event System Redesign

## Overview
Complete redesign of the event system to match Unreal Engine 5's Blueprint visual scripting system. This will provide proper execution flow, clear data connections, and accurate node behavior.

## Core Concepts

### 1. Execution Flow (White Pins)
- **Exec In** (white arrow input): Control flow enters the node
- **Exec Out** (white arrow output): Control flow exits the node
- Execution flows sequentially through nodes connected by white pins
- Only nodes with exec input are "executed" (perform actions)

### 2. Data Flow (Colored Pins)
- **Data Inputs** (left side, colored by type): Values consumed by the node
- **Data Outputs** (right side, colored by type): Values produced by the node
- Data flows on-demand (pulled when needed during execution)
- Pure nodes compute automatically when outputs are requested

### 3. Node Categories

#### Event Nodes (RED header)
- **No exec input** (events are triggers, not called)
- **One or more exec outputs** (starts execution flow)
- **Data outputs** (provides context data from the event)
- Examples: `On Message Created`, `On Member Joined`, `On Command Received`

```
┌────────────────────────────────┐
│ 🔴 ON MESSAGE CREATED          │
├────────────────────────────────┤
│                    Exec Out ──>│ (white)
│                    Message ───>│ (yellow)
│                    Author ────>│ (blue)
│                    Channel ───>│ (purple)
│                    Guild ─────>│ (green)
└────────────────────────────────┘
```

#### Action Nodes (BLUE header)
- **Has exec input and output** (participates in execution flow)
- **Modifies state** (sends messages, adds roles, bans users, etc.)
- **May have data inputs/outputs**
- Examples: `Send Message`, `Add Role`, `Ban Member`

```
┌────────────────────────────────┐
│ 🔵 SEND MESSAGE                │
├────────────────────────────────┤
│>─ Exec In          Exec Out ──>│
│   Channel <───                 │ (purple)
│   Content <───                 │ (orange)
│   Embed <─────                 │ (gray - optional)
│                    Message ───>│ (yellow - returns sent message)
└────────────────────────────────┘
```

#### Pure Nodes (GREEN header)
- **No exec pins** (doesn't execute, just computes)
- **Only data inputs/outputs**
- **Deterministic** (same inputs = same outputs)
- Examples: `Add Numbers`, `Join Strings`, `Get User Name`

```
┌────────────────────────────────┐
│ 🟢 JOIN STRINGS                │
├────────────────────────────────┤
│   String A <──                 │ (orange)
│   String B <──                 │ (orange)
│   Separator <─                 │ (orange)
│                    Result ────>│ (orange)
└────────────────────────────────┘
```

#### Flow Control Nodes (ORANGE header)
- **Has exec input, multiple exec outputs**
- **Controls execution flow** (branching, loops, delays)
- Examples: `Branch`, `For Each`, `Delay`, `Sequence`

```
┌────────────────────────────────┐
│ 🟠 BRANCH                      │
├────────────────────────────────┤
│>─ Exec In          True ──────>│ (white)
│   Condition <──    False ─────>│ (white)
└────────────────────────────────┘
```

## Pin Color System

| Type | Color | Hex | Description |
|------|-------|-----|-------------|
| EXEC | White | #FFFFFF | Execution flow |
| STRING | Orange | #faa61a | Text data |
| NUMBER | Cyan | #00D8FF | Numeric values |
| BOOLEAN | Red | #f23f43 | True/False |
| USER | Blue | #5865f2 | Discord user/member |
| CHANNEL | Purple | #9b59b6 | Discord channel |
| GUILD | Green | #2ecc71 | Discord server/guild |
| ROLE | Gold | #f1c40f | Discord role |
| MESSAGE | Yellow | #fee75c | Discord message |
| EMBED | Gray | #95a5a6 | Discord embed object |
| ATTACHMENT | Brown | #a0826d | File attachments |
| ARRAY | Teal | #16a085 | Array/list of items |

## New Node Library

### Event Nodes

#### Discord Events
- `On Message Created` - User sends a message
- `On Message Deleted` - Message is deleted
- `On Message Edited` - Message is edited
- `On Reaction Added` - User adds reaction
- `On Reaction Removed` - User removes reaction
- `On Member Joined` - User joins server
- `On Member Left` - User leaves server
- `On Member Updated` - Member roles/nickname changes
- `On Voice State Changed` - User joins/leaves/moves voice channel
- `On Channel Created` - New channel created
- `On Channel Deleted` - Channel deleted
- `On Role Created` - New role created
- `On Role Deleted` - Role deleted

#### Command Events
- `On Slash Command` - User runs a slash command (with option outputs)
- `On Button Clicked` - User clicks a button
- `On Select Menu Used` - User selects from dropdown
- `On Modal Submitted` - User submits a modal form

#### Custom Events
- `On Timer` - Runs on interval (cron-like)
- `On Bot Ready` - Bot starts up
- `On Error` - Error occurs

### Action Nodes

#### Messages
- `Send Message` - Send message to a channel
  - Inputs: Exec, Channel, Content, Embeds (array), Files (array)
  - Outputs: Exec, Message
- `Reply to Message` - Reply to a specific message
  - Inputs: Exec, Message, Content, Embeds, Files
  - Outputs: Exec, Message
- `Reply to Interaction` - Reply to slash command/button/etc
  - Inputs: Exec, Interaction, Content, Embeds, Ephemeral (bool)
  - Outputs: Exec, Message
- `Edit Message` - Edit an existing message
  - Inputs: Exec, Message, Content, Embeds
  - Outputs: Exec
- `Delete Message` - Delete a message
  - Inputs: Exec, Message
  - Outputs: Exec
- `Add Reaction` - React to a message
  - Inputs: Exec, Message, Emoji
  - Outputs: Exec

#### Member Management
- `Add Role` - Give role to member
  - Inputs: Exec, Member, Role
  - Outputs: Exec
- `Remove Role` - Remove role from member
  - Inputs: Exec, Member, Role
  - Outputs: Exec
- `Kick Member` - Kick user from server
  - Inputs: Exec, Member, Reason (optional)
  - Outputs: Exec
- `Ban Member` - Ban user from server
  - Inputs: Exec, Member, Reason, Delete Message Days (number)
  - Outputs: Exec
- `Unban User` - Unban user
  - Inputs: Exec, Guild, User ID (string)
  - Outputs: Exec
- `Timeout Member` - Timeout a member
  - Inputs: Exec, Member, Duration (seconds, number), Reason
  - Outputs: Exec
- `Send DM` - Send direct message to user
  - Inputs: Exec, User, Content, Embeds
  - Outputs: Exec, Message

#### Channel Management
- `Create Channel` - Create new channel
  - Inputs: Exec, Guild, Name, Type (text/voice/category)
  - Outputs: Exec, Channel
- `Delete Channel` - Delete a channel
  - Inputs: Exec, Channel
  - Outputs: Exec
- `Set Channel Permissions` - Modify channel permissions
  - Inputs: Exec, Channel, Role/Member, Permissions
  - Outputs: Exec

#### Voice
- `Join Voice Channel` - Bot joins voice
  - Inputs: Exec, Channel
  - Outputs: Exec, Connection
- `Leave Voice Channel` - Bot leaves voice
  - Inputs: Exec, Guild
  - Outputs: Exec
- `Play Audio` - Play audio file in voice
  - Inputs: Exec, Connection, File Path/URL
  - Outputs: Exec
- `Stop Audio` - Stop playing audio
  - Inputs: Exec, Connection
  - Outputs: Exec

### Pure Nodes

#### String Operations
- `Join Strings` - Concatenate strings
- `Split String` - Split string by delimiter
- `String Length` - Get string length
- `String Contains` - Check if string contains substring
- `String Uppercase` - Convert to uppercase
- `String Lowercase` - Convert to lowercase
- `String Replace` - Replace substring
- `Format String` - String interpolation with variables

#### Math Operations
- `Add` - A + B
- `Subtract` - A - B
- `Multiply` - A × B
- `Divide` - A ÷ B
- `Modulo` - A % B
- `Random Number` - Random integer between min and max
- `Round` - Round to nearest integer
- `Clamp` - Limit number between min and max

#### Comparison
- `Equals` - A == B
- `Not Equals` - A != B
- `Greater Than` - A > B
- `Less Than` - A < B
- `Greater or Equal` - A >= B
- `Less or Equal` - A <= B

#### Boolean Logic
- `AND` - A && B
- `OR` - A || B
- `NOT` - !A
- `XOR` - A xor B

#### Discord Data Extraction
- `Get User Name` - Extract username from user
- `Get User ID` - Extract ID from user
- `Get User Avatar URL` - Get avatar URL
- `Get Channel Name` - Extract channel name
- `Get Channel ID` - Extract channel ID
- `Get Guild Name` - Extract server name
- `Get Guild ID` - Extract server ID
- `Get Guild Member Count` - Get total member count
- `Get Message Content` - Extract message text
- `Get Message Author` - Extract message author
- `Get Member Roles` - Get array of member's roles
- `Has Role` - Check if member has specific role

#### Arrays
- `Make Array` - Create array from items
- `Get Array Element` - Get item at index
- `Array Length` - Get array size
- `Array Contains` - Check if array contains item
- `Add to Array` - Append item
- `Remove from Array` - Remove item
- `For Each` - Iterate over array items

#### Type Conversion
- `To String` - Convert to string
- `To Number` - Convert to number
- `To Boolean` - Convert to boolean

#### Variables
- `Get Global Variable` - Read global variable
- `Get Server Variable` - Read server-scoped variable
- `Get User Variable` - Read user-scoped variable
- `Set Global Variable` - Write global variable (IMPURE - has exec)
- `Set Server Variable` - Write server-scoped variable (IMPURE)
- `Set User Variable` - Write user-scoped variable (IMPURE)

### Flow Control Nodes

- `Branch` - If/else conditional
  - Inputs: Exec, Condition (bool)
  - Outputs: True (exec), False (exec)
- `Sequence` - Execute multiple paths in order
  - Inputs: Exec
  - Outputs: Then 1, Then 2, Then 3 (exec)
- `Delay` - Wait for duration
  - Inputs: Exec, Duration (seconds, number)
  - Outputs: Exec
- `For Loop` - Loop N times
  - Inputs: Exec, Start Index, End Index
  - Outputs: Loop Body (exec), Index (number), Completed (exec)
- `For Each` - Iterate array
  - Inputs: Exec, Array
  - Outputs: Loop Body (exec), Element, Index (number), Completed (exec)
- `While Loop` - Loop while condition is true
  - Inputs: Exec, Condition (bool)
  - Outputs: Loop Body (exec), Completed (exec)
- `Break` - Exit current loop early
  - Inputs: Exec
  - Outputs: Exec

## Execution Model

### Event-Driven Execution
1. Discord event occurs (message sent, member joins, command used, etc.)
2. Find matching Event node in the graph
3. Event node provides context data through data outputs
4. Execution starts from Event node's exec output

### Execution Flow
1. Follow white exec connections from node to node
2. When exec reaches a node:
   - Pull all required input data (recursively compute Pure nodes if needed)
   - Execute the node's action (for Action nodes)
   - Continue to next node via exec output
3. Pure nodes are computed on-demand when their outputs are requested
4. Flow Control nodes branch or loop execution

### Example: Simple "Hello World" Bot

```
[On Message Created]
    Exec Out ──────────────> [Branch]
    Content ────┐                ├─ Condition (Content == "!hello")
                │                ├─ True ──────> [Reply to Message]
                │                │                    ├─ Message (from event)
                └──> [Equals]────┘                    └─ Content ("Hello, world!")
                     A: (Content from event)
                     B: "!hello" (constant)
```

Execution flow:
1. User sends message
2. `On Message Created` event fires
3. Exec flows to `Branch` node
4. Branch needs `Condition` input
5. `Equals` pure node computes: content == "!hello"
6. Branch evaluates: if true, exec flows to `Reply to Message`
7. `Reply to Message` pulls its inputs and executes
8. Reply is sent to Discord

### Example: Advanced Role Assignment

```
[On Slash Command] (/assignrole)
    Exec Out ──────> [Get Server Variable]
                         Exec In/Out ──────> [Branch]
                         Key: "allowed_role_id"     Condition: (Has Role)
                         Value ───┐                 True ──────> [Add Role]
                                  │                                 Member: (target option)
[Get Member Roles] <─── Member   │                                 Role: (role option)
    (from command option)         │                                 Exec Out ──> [Reply]
          │                       │                                              Content: "✅ Role added"
          └──> [Array Contains]───┘                                False ─────> [Reply]
               Item: (variable value)                                           Content: "❌ Not authorized"
                                                                                 Ephemeral: true
```

## UI/UX Improvements

### Visual Design
- **Node headers** color-coded by category (Event=red, Action=blue, Pure=green, Flow=orange)
- **Rounded corners** for modern look
- **Drop shadows** for depth
- **Smooth animations** for connections
- **Bezier curves** for connection lines
- **Animated flow particles** on exec connections during execution

### Connection Rules
- **Type matching** - Can only connect pins of same type
- **Exec flow** - White exec pins can only connect to other exec pins
- **No cycles** - Detect and prevent circular data dependencies
- **One input** - Data inputs can only have one connection (outputs can have many)
- **Visual feedback** - Invalid connections show red, valid show green on hover

### Performance
- **Lazy evaluation** - Pure nodes only compute when outputs are needed
- **Caching** - Cache pure node results during single execution
- **Async execution** - Action nodes run asynchronously
- **Error handling** - Visual error indicators on failed nodes

### Node Search
- **Category tabs** - Events, Actions, Pure, Flow Control
- **Fuzzy search** - Search by node name, description, tags
- **Context-aware** - Show relevant nodes based on what's connected
- **Favorites** - Pin frequently used nodes

## Implementation Plan

### Phase 1: Core Architecture
1. Define new node type system (Event/Action/Pure/Flow)
2. Create pin system (exec + data pins)
3. Build execution engine with proper async flow
4. Implement lazy evaluation for pure nodes

### Phase 2: Node Library
1. Convert existing nodes to new system
2. Add missing essential nodes
3. Implement all Discord operations correctly
4. Add proper error handling

### Phase 3: UI/UX
1. Redesign node renderer with UE5 style
2. Implement smooth connection animations
3. Add visual execution flow indicators
4. Improve search and node palette

### Phase 4: Testing & Polish
1. Test common bot scenarios
2. Performance optimization
3. Add documentation
4. Create example blueprints

## Migration Strategy

### For Existing Bots
- **Convert old events** - Map old nodes to new equivalents
- **Show warnings** - Notify users of deprecated patterns
- **Provide examples** - Show how to rebuild with new system
- **Gradual rollout** - Support both systems temporarily

### Breaking Changes
- `Send Message` now requires explicit Channel input (was using interaction context)
- `Reply to Interaction` is separate from `Send Message`
- All data must flow through connections (no implicit context)
- Event nodes are the only entry points (no auto-execution)

## Benefits

1. **Clarity** - Visual execution flow makes logic obvious
2. **Correctness** - Nodes do exactly what they say
3. **Flexibility** - Pure nodes can be reused anywhere
4. **Performance** - Lazy evaluation, proper async
5. **Debugging** - Visual flow indicators show execution path
6. **Familiar** - UE5 users will feel at home
7. **Scalable** - Complex bots remain manageable
8. **Type-safe** - Connection validation prevents errors

## Technical Stack

- **ReactFlow** - Keep for graph rendering (good library)
- **Custom node components** - Redesign to match UE5 style
- **New execution engine** - Rewrite botRunner.js execution logic
- **Type system** - Enforce pin type matching
- **Async/await** - Proper promise handling throughout

## File Structure

```
src/
  components/
    nodes/
      EventNode.jsx           # Red event nodes
      ActionNode.jsx          # Blue action nodes
      PureNode.jsx           # Green pure nodes
      FlowControlNode.jsx    # Orange flow control nodes
    NodeCanvas.jsx           # Main ReactFlow canvas
    NodePalette.jsx          # Searchable node library
    NodeInspector.jsx        # Selected node properties
  constants/
    nodeDefinitions.js       # All node type definitions
    pinTypes.js              # Pin type system
  utils/
    executionEngine.js       # New execution engine
    nodeEvaluator.js         # Pure node lazy evaluation
    typeChecker.js           # Connection validation
electron/
  botRunner.js               # Rewritten for new system
  executors/
    eventNodes.js            # Event node handlers
    actionNodes.js           # Action node executors
    pureNodes.js             # Pure node functions
    flowNodes.js             # Flow control logic
```

---

This redesign will transform the Discord Bot Maker into a professional, intuitive, and powerful visual scripting tool that truly rivals Unreal Engine 5's Blueprint system.
