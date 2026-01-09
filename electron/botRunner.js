const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { app } = require('electron');
const { spawn } = require('child_process');
const { Client: SSHClient } = require('ssh2');

// FFmpeg configuration - runs lazily on first access
let ffmpegPath = null;
let ffmpegInitialized = false;

function initializeFFmpeg() {
  if (ffmpegInitialized) {
    return; // Already initialized
  }
  ffmpegInitialized = true;

  try {
    // Use ffmpeg-static which includes platform-specific binaries
    const rawPath = require('ffmpeg-static');
    if (rawPath) {
      console.log(`[Voice] ========== FFmpeg Configuration ==========`);
      console.log(`[Voice] Raw path from ffmpeg-static: ${rawPath}`);

      // Try ASAR unpacked path first
      const unpackedPath = rawPath.replace('app.asar', 'app.asar.unpacked');
      const rawPathExists = fs.existsSync(rawPath);
      const unpackedPathExists = fs.existsSync(unpackedPath);

      console.log(`[Voice] File exists at raw path (in ASAR): ${rawPathExists}`);
      console.log(`[Voice] File exists at unpacked path: ${unpackedPathExists}`);

      // If neither path works, throw error
      if (!unpackedPathExists && !rawPathExists) {
        console.error(`[Voice] ❌ FFmpeg not found at any expected location!`);
        throw new Error('FFmpeg binary not found');
      }

      // Determine source path (prefer unpacked, fallback to raw)
      const sourcePath = unpackedPathExists ? unpackedPath : rawPath;

      // Copy FFmpeg to app data directory for reliable access
      const userDataPath = app.getPath('userData');
      const ffmpegDir = path.join(userDataPath, 'ffmpeg');
      const ffmpegFileName = path.basename(rawPath);
      const targetPath = path.join(ffmpegDir, ffmpegFileName);

      console.log(`[Voice] App data directory: ${userDataPath}`);
      console.log(`[Voice] Target FFmpeg path: ${targetPath}`);

      // Create ffmpeg directory if it doesn't exist
      if (!fs.existsSync(ffmpegDir)) {
        fs.mkdirSync(ffmpegDir, { recursive: true });
        console.log(`[Voice] Created FFmpeg directory: ${ffmpegDir}`);
      }

      // Copy FFmpeg if not already present or if source is newer
      let needsCopy = !fs.existsSync(targetPath);
      if (!needsCopy) {
        // Check if source is newer than target
        const sourceStats = fs.statSync(sourcePath);
        const targetStats = fs.statSync(targetPath);
        needsCopy = sourceStats.mtime > targetStats.mtime;
      }

      if (needsCopy) {
        console.log(`[Voice] Copying FFmpeg from ${sourcePath} to ${targetPath}...`);
        fs.copyFileSync(sourcePath, targetPath);
        // Set executable permissions on Unix-like systems
        if (process.platform !== 'win32') {
          fs.chmodSync(targetPath, 0o755);
        }
        console.log(`[Voice] ✅ FFmpeg copied successfully`);
      } else {
        console.log(`[Voice] FFmpeg already exists at target path`);
      }

      // Use the copied version
      ffmpegPath = targetPath;
      process.env.FFMPEG_PATH = targetPath;

      console.log(`[Voice] Final FFmpeg path: ${ffmpegPath}`);
      console.log(`[Voice] File exists at final path: ${fs.existsSync(ffmpegPath)}`);
      console.log(`[Voice] FFMPEG_PATH env var set to: ${process.env.FFMPEG_PATH}`);
    } else {
      console.error('[Voice] ffmpeg-static returned null path!');
    }
  } catch (ffmpegError) {
    console.error('[Voice] Error configuring FFmpeg:', ffmpegError.message);
    console.error('[Voice] Stack trace:', ffmpegError.stack);
    console.warn('[Voice] FFmpeg not available. Voice streaming will not work.');
  }
}

// Try to load @discordjs/voice module (but don't initialize FFmpeg yet)
let voiceModule = null;
try {
  voiceModule = require('@discordjs/voice');
  console.log('[Voice] @discordjs/voice module loaded');
} catch (error) {
  console.error('[Voice] Error loading @discordjs/voice:', error.message);
  console.warn('[@discordjs/voice] not installed. Voice features will be disabled.');
}

class BotRunner {
  constructor(botId, config, logCallback) {
    this.botId = botId;
    this.config = config;
    this.logCallback = logCallback;
    this.client = null;
    this.isRunning = false;
    this.voiceConnections = new Map(); // Store voice connections per guild
    this.audioPlayers = new Map(); // Store audio players per guild
    this.processes = new Map(); // Store running processes by ID
    this.sshConnections = new Map(); // Store SSH connections by config hash

    // Initialize storage directories
    this.storagePath = path.join(process.cwd(), 'bot-storage', this.botId);
    this.filesPath = path.join(this.storagePath, 'files');
    this.variablesPath = path.join(this.storagePath, 'variables');
    this.ensureStorageDirectories();
  }

  ensureStorageDirectories() {
    try {
      if (!fs.existsSync(this.storagePath)) {
        fs.mkdirSync(this.storagePath, { recursive: true });
      }
      if (!fs.existsSync(this.filesPath)) {
        fs.mkdirSync(this.filesPath, { recursive: true });
      }
      if (!fs.existsSync(this.variablesPath)) {
        fs.mkdirSync(this.variablesPath, { recursive: true });
      }
    } catch (error) {
      this.log('error', `Failed to create storage directories: ${error.message}`);
    }
  }

  // Variable storage methods
  async setVariable(scope, scopeId, key, value) {
    try {
      const filename = scope === 'global'
        ? path.join(this.variablesPath, 'global.json')
        : path.join(this.variablesPath, `${scope}-${scopeId}.json`);

      let data = {};
      if (fs.existsSync(filename)) {
        const fileContent = fs.readFileSync(filename, 'utf8');
        data = JSON.parse(fileContent);
      }

      data[key] = value;
      fs.writeFileSync(filename, JSON.stringify(data, null, 2));
      return true;
    } catch (error) {
      this.log('error', `Failed to set variable: ${error.message}`);
      return false;
    }
  }

  async getVariable(scope, scopeId, key) {
    try {
      const filename = scope === 'global'
        ? path.join(this.variablesPath, 'global.json')
        : path.join(this.variablesPath, `${scope}-${scopeId}.json`);

      if (!fs.existsSync(filename)) {
        return '';
      }

      const fileContent = fs.readFileSync(filename, 'utf8');
      const data = JSON.parse(fileContent);
      return data[key] || '';
    } catch (error) {
      this.log('error', `Failed to get variable: ${error.message}`);
      return '';
    }
  }

  // SSH operations
  async executeSSHCommand(sshConfig, command) {
    return new Promise((resolve, reject) => {
      const conn = new SSHClient();
      let output = '';

      conn.on('ready', () => {
        conn.exec(command, (err, stream) => {
          if (err) {
            conn.end();
            return reject(err);
          }

          stream.on('close', (code, signal) => {
            conn.end();
            resolve(output);
          }).on('data', (data) => {
            output += data.toString();
          }).stderr.on('data', (data) => {
            output += data.toString();
          });
        });
      }).on('error', (err) => {
        reject(err);
      }).connect(sshConfig);
    });
  }

  // File operations
  async saveFileToServer(filename, content) {
    try {
      const filepath = path.join(this.filesPath, filename);
      fs.writeFileSync(filepath, content);
      return true;
    } catch (error) {
      this.log('error', `Failed to save file: ${error.message}`);
      return false;
    }
  }

  async readFileFromServer(filename) {
    try {
      const filepath = path.join(this.filesPath, filename);
      if (!fs.existsSync(filepath)) {
        return '';
      }
      return fs.readFileSync(filepath, 'utf8');
    } catch (error) {
      this.log('error', `Failed to read file: ${error.message}`);
      return '';
    }
  }

  async downloadFile(url, filename) {
    return new Promise((resolve, reject) => {
      const filepath = path.join(this.filesPath, filename);
      const file = fs.createWriteStream(filepath);
      const protocol = url.startsWith('https') ? https : http;

      protocol.get(url, (response) => {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve(true);
        });
      }).on('error', (err) => {
        fs.unlink(filepath, () => {});
        reject(err);
      });
    });
  }

  async readFileFromURL(url) {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https') ? https : http;

      protocol.get(url, (response) => {
        let data = '';
        response.on('data', (chunk) => {
          data += chunk;
        });
        response.on('end', () => {
          resolve(data);
        });
      }).on('error', (err) => {
        reject(err);
      });
    });
  }

  log(type, message) {
    const logEntry = {
      type, // 'info', 'error', 'success'
      message: `[${this.config.name || 'Bot'}] ${message}`,
      timestamp: new Date().toISOString(),
    };
    if (this.logCallback) {
      this.logCallback(logEntry);
    }
  }

  determineRequiredIntents() {
    // Base intents always needed
    const intents = [
      GatewayIntentBits.Guilds,
    ];

    // Analyze all events to determine which intents are needed
    const events = this.config.events || [];
    const usedNodeTypes = new Set();
    const usedTriggerTypes = new Set();

    // Collect all node types and trigger types used across all events
    events.forEach(event => {
      // Track event trigger types
      if (event.type === 'event' && event.triggerType) {
        usedTriggerTypes.add(event.triggerType);
      }

      // Track node types
      if (event.flowData && event.flowData.nodes) {
        event.flowData.nodes.forEach(node => {
          if (node.type === 'dataNode' && node.data?.nodeType) {
            usedNodeTypes.add(node.data.nodeType);
          } else if (node.data?.actionType) {
            usedNodeTypes.add(node.data.actionType);
          }
        });
      }
    });

    // Event triggers that need specific intents
    if (usedTriggerTypes.has('messageCreate') || usedTriggerTypes.has('messageDelete')) {
      intents.push(GatewayIntentBits.GuildMessages);
      intents.push(GatewayIntentBits.MessageContent);
      this.log('info', 'Message event triggers detected - loading GuildMessages and MessageContent intents');
    }

    if (usedTriggerTypes.has('guildMemberAdd') || usedTriggerTypes.has('guildMemberRemove')) {
      intents.push(GatewayIntentBits.GuildMembers);
      this.log('info', 'Member event triggers detected - loading GuildMembers intent');
    }

    if (usedTriggerTypes.has('messageReactionAdd')) {
      intents.push(GatewayIntentBits.GuildMessageReactions);
      this.log('info', 'Reaction event triggers detected - loading GuildMessageReactions intent');
    }

    if (usedTriggerTypes.has('voiceStateUpdate')) {
      intents.push(GatewayIntentBits.GuildVoiceStates);
      this.log('info', 'Voice event triggers detected - loading GuildVoiceStates intent');
    }

    // Voice-related nodes need GuildVoiceStates
    const voiceNodes = ['join-voice', 'leave-voice', 'move-member-voice', 'mute-member-voice', 'deafen-member-voice', 'stream-file-voice'];
    if (voiceNodes.some(nodeType => usedNodeTypes.has(nodeType))) {
      intents.push(GatewayIntentBits.GuildVoiceStates);
      this.log('info', 'Voice nodes detected - loading GuildVoiceStates intent');
    }

    // Message-related nodes need GuildMessages and MessageContent
    const messageNodes = ['send-message', 'delete-message', 'pin-message', 'create-thread', 'react-emoji'];
    if (messageNodes.some(nodeType => usedNodeTypes.has(nodeType))) {
      intents.push(GatewayIntentBits.GuildMessages);
      intents.push(GatewayIntentBits.MessageContent);
      this.log('info', 'Message nodes detected - loading GuildMessages and MessageContent intents');
    }

    // Member-related nodes need GuildMembers
    const memberNodes = ['timeout-member', 'kick-member', 'ban-member', 'unban-member', 'add-role', 'remove-role',
                         'get-member-joindate', 'get-member-count', 'check-has-role'];
    if (memberNodes.some(nodeType => usedNodeTypes.has(nodeType))) {
      intents.push(GatewayIntentBits.GuildMembers);
      this.log('info', 'Member nodes detected - loading GuildMembers intent');
    }

    // Remove duplicates and return
    return [...new Set(intents)];
  }

  async start() {
    if (this.isRunning) {
      throw new Error('Bot is already running');
    }

    if (!this.config.token) {
      throw new Error('Bot token is required');
    }

    this.log('info', 'Starting bot...');

    // Initialize FFmpeg on first bot start (lazy initialization)
    initializeFFmpeg();

    // Determine required intents based on nodes used
    const requiredIntents = this.determineRequiredIntents();
    this.log('info', `Loading ${requiredIntents.length} intents based on nodes used`);

    // Create Discord client with dynamically determined intents
    this.client = new Client({
      intents: requiredIntents,
    });

    // Set up commands collection
    this.client.commands = new Collection();

    // Get command events from the events array
    const commandEvents = (this.config.events || []).filter(event => event.type === 'command');

    // Register commands from events
    if (commandEvents.length > 0) {
      await this.registerCommands(commandEvents);
    }

    // Set up event handlers
    this.setupEventHandlers();

    // Login to Discord
    try {
      await this.client.login(this.config.token);
      this.isRunning = true;
    } catch (error) {
      this.log('error', `Failed to login: ${error.message}`);
      throw error;
    }
  }

  async registerCommands(commandEvents) {
    const commands = commandEvents.map(cmd => {
      const command = {
        name: cmd.name,
        description: cmd.description || 'No description provided',
      };

      // Add command options if they exist
      if (cmd.options && cmd.options.length > 0) {
        command.options = cmd.options.map(opt => {
          const option = {
            name: opt.name.toLowerCase().replace(/[^a-z0-9_-]/g, '_'), // Discord requires lowercase alphanumeric
            description: opt.description || `${opt.name} parameter`,
            required: opt.required || false,
          };

          // Map our types to Discord's ApplicationCommandOptionType
          const typeMap = {
            'STRING': 3,
            'NUMBER': 10,
            'BOOLEAN': 5,
            'USER': 6,
            'CHANNEL': 7,
            'ROLE': 8,
            'ATTACHMENT': 11,
          };

          option.type = typeMap[opt.type] || 3; // Default to STRING
          return option;
        });
      }

      return command;
    });

    // Store commands in the client
    commandEvents.forEach(cmd => {
      this.client.commands.set(cmd.name, cmd);
    });

    // Register slash commands with Discord
    if (this.config.applicationId) {
      try {
        const rest = new REST({ version: '10' }).setToken(this.config.token);

        if (this.config.guildId) {
          // Register to specific guild (instant update)
          await rest.put(
            Routes.applicationGuildCommands(this.config.applicationId, this.config.guildId),
            { body: commands }
          );
          this.log('info', `Registered ${commands.length} guild commands`);
        } else {
          // Register globally (takes up to 1 hour)
          await rest.put(
            Routes.applicationCommands(this.config.applicationId),
            { body: commands }
          );
          this.log('info', `Registered ${commands.length} global commands`);
        }
      } catch (error) {
        this.log('error', `Failed to register commands: ${error.message}`);
      }
    }
  }

  setupEventHandlers() {
    this.client.once('ready', () => {
      this.log('success', `Bot is online as ${this.client.user.tag}`);
      this.log('info', `Serving ${this.client.guilds.cache.size} servers`);
    });

    // Command interaction handler
    this.client.on('interactionCreate', async (interaction) => {
      if (!interaction.isChatInputCommand()) return;

      const command = this.client.commands.get(interaction.commandName);
      if (!command) return;

      try {
        // Execute command based on its actions
        await this.executeCommand(interaction, command);
        this.log('info', `Executed command: /${interaction.commandName} by ${interaction.user.tag}`);
      } catch (error) {
        this.log('error', `Command error: ${error.message}`);
        const errorMessage = 'There was an error executing this command!';

        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ content: errorMessage, ephemeral: true });
        } else {
          await interaction.reply({ content: errorMessage, ephemeral: true });
        }
      }
    });

    // Register Discord event triggers
    const eventTriggers = (this.config.events || []).filter(event => event.type === 'event');
    eventTriggers.forEach(eventTrigger => {
      this.registerEventTrigger(eventTrigger);
    });

    this.client.on('error', (error) => {
      this.log('error', `Client error: ${error.message}`);
    });

    this.client.on('disconnect', () => {
      this.log('info', 'Bot disconnected');
    });
  }

  registerEventTrigger(eventTrigger) {
    const triggerType = eventTrigger.triggerType;

    switch (triggerType) {
      case 'messageCreate':
        this.client.on('messageCreate', async (message) => {
          if (message.author.bot) return; // Ignore bot messages
          try {
            await this.executeEventFlow(eventTrigger, { message });
          } catch (error) {
            this.log('error', `Event trigger error: ${error.message}`);
          }
        });
        this.log('info', 'Registered event trigger: On Message Sent');
        break;

      case 'guildMemberAdd':
        this.client.on('guildMemberAdd', async (member) => {
          try {
            await this.executeEventFlow(eventTrigger, { member });
          } catch (error) {
            this.log('error', `Event trigger error: ${error.message}`);
          }
        });
        this.log('info', 'Registered event trigger: On Member Join');
        break;

      case 'guildMemberRemove':
        this.client.on('guildMemberRemove', async (member) => {
          try {
            await this.executeEventFlow(eventTrigger, { member });
          } catch (error) {
            this.log('error', `Event trigger error: ${error.message}`);
          }
        });
        this.log('info', 'Registered event trigger: On Member Leave');
        break;

      case 'messageReactionAdd':
        this.client.on('messageReactionAdd', async (reaction, user) => {
          try {
            await this.executeEventFlow(eventTrigger, { reaction, user });
          } catch (error) {
            this.log('error', `Event trigger error: ${error.message}`);
          }
        });
        this.log('info', 'Registered event trigger: On Reaction Added');
        break;

      case 'messageDelete':
        this.client.on('messageDelete', async (message) => {
          try {
            await this.executeEventFlow(eventTrigger, { message });
          } catch (error) {
            this.log('error', `Event trigger error: ${error.message}`);
          }
        });
        this.log('info', 'Registered event trigger: On Message Deleted');
        break;

      case 'voiceStateUpdate':
        this.client.on('voiceStateUpdate', async (oldState, newState) => {
          try {
            await this.executeEventFlow(eventTrigger, { oldState, newState });
          } catch (error) {
            this.log('error', `Event trigger error: ${error.message}`);
          }
        });
        this.log('info', 'Registered event trigger: On Voice State Change');
        break;

      default:
        this.log('warning', `Unknown event trigger type: ${triggerType}`);
    }
  }

  async executeEventFlow(eventTrigger, eventData) {
    const flowData = eventTrigger.flowData;

    if (!flowData || !flowData.nodes || flowData.nodes.length === 0) {
      return;
    }

    this.log('info', `Executing event flow: ${eventTrigger.triggerType}`);

    // Initialize data context based on event type
    const dataContext = {};

    switch (eventTrigger.triggerType) {
      case 'messageCreate':
        dataContext.message = eventData.message.content;
        dataContext.user = eventData.message.author;
        dataContext.channel = eventData.message.channel;
        dataContext.guild = eventData.message.guild;
        break;

      case 'guildMemberAdd':
      case 'guildMemberRemove':
        dataContext.user = eventData.member.user;
        dataContext.guild = eventData.member.guild;
        break;

      case 'messageReactionAdd':
        dataContext.emoji = eventData.reaction.emoji.name;
        dataContext.user = eventData.user;
        dataContext.channel = eventData.reaction.message.channel;
        break;

      case 'messageDelete':
        dataContext.content = eventData.message.content || '';
        dataContext.channel = eventData.message.channel;
        break;

      case 'voiceStateUpdate':
        dataContext.user = eventData.newState.member?.user;
        dataContext.guild = eventData.newState.guild;
        break;
    }

    // Find trigger node
    const triggerNode = flowData.nodes.find(n => n.type === 'triggerNode');
    if (!triggerNode) {
      this.log('error', 'No trigger node found in event flow');
      return;
    }

    // Execute flow starting from trigger node (no interaction for event triggers)
    await this.executeNode(null, flowData, triggerNode, dataContext);
  }

  async executeCommand(interaction, command) {
    // Execute graph-based command flow with data flow support
    const flowData = command.flowData;

    if (!flowData || !flowData.nodes || flowData.nodes.length === 0) {
      await interaction.reply({ content: 'This command has no actions configured.', ephemeral: true });
      return;
    }

    try {
      this.log('info', `Executing command graph with ${flowData.nodes.length} nodes and ${flowData.edges?.length || 0} edges`);

      // Initialize data context with trigger data
      const dataContext = {
        interaction: interaction,
        user: interaction.user,
        channel: interaction.channel,
        guild: interaction.guild,
        member: interaction.member,
      };

      // Add command option values to data context
      if (command.options && command.options.length > 0) {
        command.options.forEach(opt => {
          const optionName = opt.name.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
          const value = interaction.options.get(optionName);

          if (value) {
            // Store the actual value based on type
            if (opt.type === 'USER') {
              dataContext[`option-${opt.name}`] = value.user || value.member?.user;
            } else if (opt.type === 'CHANNEL') {
              dataContext[`option-${opt.name}`] = value.channel;
            } else if (opt.type === 'ROLE') {
              dataContext[`option-${opt.name}`] = value.role;
            } else if (opt.type === 'ATTACHMENT') {
              dataContext[`option-${opt.name}`] = value.attachment;
            } else {
              dataContext[`option-${opt.name}`] = value.value;
            }
          }
        });
      }

      // Find trigger node or start nodes
      const triggerNode = flowData.nodes.find(n => n.type === 'triggerNode');
      const startNodes = triggerNode ? [triggerNode] : this.findStartNodes(flowData);

      if (startNodes.length === 0) {
        this.log('error', 'No starting point found in command flow');
        await interaction.reply({ content: 'No starting point found in command flow.', ephemeral: true });
        return;
      }

      this.log('info', `Starting execution from node: ${startNodes[0].id}`);

      // Execute the flow starting from the trigger/start node
      await this.executeFlow(interaction, flowData, startNodes[0], dataContext);

      this.log('success', 'Command executed successfully');
    } catch (error) {
      this.log('error', `Command execution error: ${error.message}\nStack: ${error.stack}`);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: 'An error occurred while executing this command.', ephemeral: true });
      }
    }
  }

  findStartNodes(flowData) {
    const nodesWithIncoming = new Set();
    flowData.edges.forEach((edge) => nodesWithIncoming.add(edge.target));
    return flowData.nodes.filter((node) => !nodesWithIncoming.has(node.id));
  }

  getConnectedNodes(flowData, currentNodeId, handleId = null) {
    const outgoingEdges = flowData.edges.filter((edge) => {
      if (handleId) {
        return edge.source === currentNodeId && edge.sourceHandle === handleId;
      }
      return edge.source === currentNodeId;
    });
    return outgoingEdges.map((edge) => ({
      node: flowData.nodes.find((node) => node.id === edge.target),
      edge: edge,
    })).filter(item => item.node);
  }

  getInputValue(flowData, nodeId, inputHandle, dataContext) {
    // Find incoming edge for this input handle
    const incomingEdge = flowData.edges.find(
      e => e.target === nodeId && e.targetHandle === inputHandle
    );

    if (!incomingEdge) return null;

    const sourceNode = flowData.nodes.find(n => n.id === incomingEdge.source);
    if (!sourceNode) return null;

    // Get value from data context based on source handle
    const sourceHandle = incomingEdge.sourceHandle;

    // Direct context data
    if (sourceHandle === 'user') return dataContext.user;
    if (sourceHandle === 'channel') return dataContext.channel;
    if (sourceHandle === 'guild') return dataContext.guild;

    // Check for command option values
    if (sourceHandle.startsWith('option-')) {
      return dataContext[sourceHandle] || null;
    }

    // Check if value was computed by a data node
    if (dataContext.computed && dataContext.computed[incomingEdge.source]) {
      return dataContext.computed[incomingEdge.source][sourceHandle];
    }

    return null;
  }

  async executeDependencies(interaction, flowData, nodeId, inputHandle, dataContext) {
    try {
      // Find the edge connected to this input
      const incomingEdge = flowData.edges.find(
        e => e.target === nodeId && e.targetHandle === inputHandle
      );

      if (!incomingEdge) return;

      const sourceNode = flowData.nodes.find(n => n.id === incomingEdge.source);
      if (!sourceNode) {
        this.log('warning', `Source node not found for edge to ${nodeId}.${inputHandle}`);
        return;
      }

      // If this is a data node and it hasn't been computed yet, execute it
      if (sourceNode.type === 'dataNode') {
        if (!dataContext.computed || !dataContext.computed[sourceNode.id]) {
          this.log('info', `Executing data dependency: ${sourceNode.id}`);

          // Recursively execute any dependencies this data node has
          if (sourceNode.data && sourceNode.data.inputs) {
            for (const input of sourceNode.data.inputs) {
              await this.executeDependencies(interaction, flowData, sourceNode.id, input.id, dataContext);
            }
          }

          // Execute the data node
          const result = await this.executeDataNode(sourceNode, flowData, dataContext);

          // Store the result
          if (!dataContext.computed) dataContext.computed = {};
          dataContext.computed[sourceNode.id] = result;

          this.log('info', `Data dependency result: ${JSON.stringify(result)}`);
        }
      }
    } catch (error) {
      this.log('error', `Error executing dependency for ${nodeId}.${inputHandle}: ${error.message}`);
    }
  }

  async executeFlow(interaction, flowData, startNode, dataContext, visited = new Set()) {
    if (!startNode || visited.has(startNode.id)) {
      return; // Prevent infinite loops
    }

    visited.add(startNode.id);

    // Execute current node and get its output data
    const nodeOutput = await this.executeNode(interaction, flowData, startNode, dataContext);

    if (nodeOutput === false) {
      return; // Stop execution if node returns false
    }

    // Store computed data from this node (if it's an object and not a result object)
    if (nodeOutput && typeof nodeOutput === 'object' && !nodeOutput.hasOwnProperty('success')) {
      if (!dataContext.computed) dataContext.computed = {};
      dataContext.computed[startNode.id] = nodeOutput;
    }

    // Handle branch nodes with conditional flow
    if (startNode.data.actionType === 'branch') {
      // Get the condition value
      const conditionValue = this.getInputValue(flowData, startNode.id, 'condition', dataContext);

      // If condition is null or undefined, don't execute either path
      if (conditionValue === null || conditionValue === undefined) {
        this.log('info', `Branch node condition is null/undefined, skipping both paths`);
        return;
      }

      const outputHandle = conditionValue ? 'true' : 'false';
      this.log('info', `Branch node condition: ${conditionValue}, following ${outputHandle} path`);

      // Follow the appropriate output path
      const nextConnections = this.getConnectedNodes(flowData, startNode.id, outputHandle);
      for (const { node } of nextConnections) {
        await this.executeFlow(interaction, flowData, node, dataContext, visited);
      }
    } else {
      // Determine which output to follow (success or fail)
      let outputHandle = 'flow';

      // If node returned execution result with success flag
      if (nodeOutput && typeof nodeOutput === 'object' && nodeOutput.hasOwnProperty('success')) {
        outputHandle = nodeOutput.success ? 'flow' : 'fail';

        // Store any returned data
        if (nodeOutput.data) {
          if (!dataContext.computed) dataContext.computed = {};
          dataContext.computed[startNode.id] = nodeOutput.data;
        }
      }

      // Get next nodes connected via the determined output
      const nextConnections = this.getConnectedNodes(flowData, startNode.id, outputHandle);

      // Execute all next nodes
      for (const { node } of nextConnections) {
        await this.executeFlow(interaction, flowData, node, dataContext, visited);
      }
    }
  }

  async executeNode(interaction, flowData, node, dataContext) {
    this.log('info', `Executing node: ${node.id} (type: ${node.type})`);

    // Handle trigger nodes (just pass through)
    if (node.type === 'triggerNode') {
      this.log('info', 'Trigger node - passing through');
      return true; // Continue to next nodes
    }

    // Handle data converter nodes
    if (node.type === 'dataNode') {
      this.log('info', `Data node: ${node.data?.nodeType || 'unknown'}`);
      const result = await this.executeDataNode(node, flowData, dataContext);
      this.log('info', `Data node output: ${JSON.stringify(result)}`);
      return result;
    }

    // Handle action nodes - first execute any data dependencies
    if (node.data.inputs) {
      for (const input of node.data.inputs) {
        if (input.type !== 'FLOW') {
          // Find and execute any connected data nodes that haven't been executed yet
          await this.executeDependencies(interaction, flowData, node.id, input.id, dataContext);
        }
      }
    }

    // Handle action nodes
    const actionType = node.data.actionType;
    const config = node.data.config;
    this.log('info', `Action node: ${actionType}`);

    // Wrap all actions in try-catch for error handling
    try {

    switch (actionType) {
      case 'send-message':
        // Check for connected string input
        let messageContent = config.content || 'Hello!';
        const connectedContent = this.getInputValue(flowData, node.id, 'content', dataContext);
        if (connectedContent) {
          messageContent = connectedContent;
        }

        const messageOptions = {
          content: messageContent,
        };

        // Check for connected file attachment
        const connectedFile = this.getInputValue(flowData, node.id, 'file', dataContext);
        if (connectedFile) {
          // If it's a file object with path and name
          if (connectedFile.path) {
            const { AttachmentBuilder } = require('discord.js');
            messageOptions.files = [new AttachmentBuilder(connectedFile.path, { name: connectedFile.name })];
          }
          // If it's a Discord attachment (from command input)
          else if (connectedFile.url) {
            const { AttachmentBuilder } = require('discord.js');
            messageOptions.files = [connectedFile.url];
          }
        }

        // Check for connected INTERACTION input (for replying to specific interaction)
        const connectedInteraction = this.getInputValue(flowData, node.id, 'interaction', dataContext);
        const useInteraction = connectedInteraction || interaction;

        // Add ephemeral flag if using interaction
        if (useInteraction) {
          messageOptions.ephemeral = config.ephemeral || false;
        }

        let sentMessage;
        // If we have an interaction, use it to reply
        if (useInteraction) {
          if (!useInteraction.replied && !useInteraction.deferred) {
            sentMessage = await useInteraction.reply({ ...messageOptions, fetchReply: true });
          } else {
            sentMessage = await useInteraction.followUp({ ...messageOptions, fetchReply: true });
          }
        } else {
          // No interaction - send to channel from context
          const channel = dataContext.channel;
          if (!channel) {
            throw new Error('No channel available for sending message');
          }
          sentMessage = await channel.send(messageOptions);
        }

        // Store the sent message in dataContext for MESSAGE output
        dataContext[`${node.id}_message`] = sentMessage;
        break;

      case 'embed':
        const embed = {
          color: parseInt(config.color?.replace('#', '0x') || '0x5865f2'),
        };

        // Check for connected string inputs
        const embedTitle = this.getInputValue(flowData, node.id, 'title', dataContext) || config.title;
        const embedDesc = this.getInputValue(flowData, node.id, 'description', dataContext) || config.description;
        const embedAuthor = this.getInputValue(flowData, node.id, 'author', dataContext) || config.author;
        const embedThumbnail = this.getInputValue(flowData, node.id, 'thumbnail', dataContext) || config.thumbnail;
        const embedImage = this.getInputValue(flowData, node.id, 'image', dataContext) || config.image;

        if (embedTitle) embed.title = embedTitle;
        if (embedDesc) embed.description = embedDesc;
        if (config.url) embed.url = config.url;
        if (embedThumbnail) embed.thumbnail = { url: embedThumbnail };
        if (embedImage) embed.image = { url: embedImage };

        if (embedAuthor) {
          embed.author = { name: embedAuthor };
          if (config.authorIcon) embed.author.iconURL = config.authorIcon;
          if (config.authorUrl) embed.author.url = config.authorUrl;
        }

        if (config.footer) {
          embed.footer = { text: config.footer };
          if (config.footerIcon) embed.footer.iconURL = config.footerIcon;
        }

        if (config.fields && config.fields.length > 0) {
          embed.fields = config.fields;
        }

        if (config.timestamp) {
          embed.timestamp = new Date().toISOString();
        }

        const embedOptions = {
          embeds: [embed],
        };

        // Check for connected INTERACTION input (for replying to specific interaction)
        const connectedEmbedInteraction = this.getInputValue(flowData, node.id, 'interaction', dataContext);
        const useEmbedInteraction = connectedEmbedInteraction || interaction;

        // Add ephemeral flag if using interaction
        if (useEmbedInteraction) {
          embedOptions.ephemeral = config.ephemeral || false;
        }

        let sentEmbedMessage;
        // If we have an interaction, use it to reply
        if (useEmbedInteraction) {
          if (!useEmbedInteraction.replied && !useEmbedInteraction.deferred) {
            sentEmbedMessage = await useEmbedInteraction.reply({ ...embedOptions, fetchReply: true });
          } else {
            sentEmbedMessage = await useEmbedInteraction.followUp({ ...embedOptions, fetchReply: true });
          }
        } else {
          // No interaction - send to channel from context
          const embedChannel = dataContext.channel;
          if (!embedChannel) {
            throw new Error('No channel available for sending embed');
          }
          sentEmbedMessage = await embedChannel.send(embedOptions);
        }

        // Store the sent message in dataContext for MESSAGE output
        dataContext[`${node.id}_message`] = sentEmbedMessage;
        break;

      case 'add-role':
        if (config.roleId && interaction.member) {
          const role = interaction.guild.roles.cache.get(config.roleId);
          if (role) {
            await interaction.member.roles.add(role);
            if (!interaction.replied) {
              await interaction.reply({ content: `Added role ${role.name}`, ephemeral: true });
            }
          }
        }
        break;

      case 'remove-role':
        if (config.roleId && interaction.member) {
          const role = interaction.guild.roles.cache.get(config.roleId);
          if (role) {
            await interaction.member.roles.remove(role);
            if (!interaction.replied) {
              await interaction.reply({ content: `Removed role ${role.name}`, ephemeral: true });
            }
          }
        }
        break;

      case 'send-dm':
        const dmUser = this.getInputValue(flowData, node.id, 'user', dataContext) || interaction.user;
        let dmContent = config.content || 'Hello!';
        const connectedDmContent = this.getInputValue(flowData, node.id, 'content', dataContext);
        if (connectedDmContent) {
          dmContent = connectedDmContent;
        }

        await dmUser.send(dmContent);
        this.log('success', `Sent DM to ${dmUser.tag}`);
        break;

      case 'react-emoji':
        await interaction.react(config.emoji || '👍');
        this.log('success', `Reacted with ${config.emoji}`);
        break;

      case 'branch':
        // Branch node handles conditional flow - handled in executeFlow
        // The branch logic is handled by checking outputs in executeFlow
        break;

      case 'wait':
        // Wait/delay action
        const delaySeconds = this.getInputValue(flowData, node.id, 'seconds', dataContext) || config.seconds || 1;
        const delayMs = delaySeconds * 1000;
        this.log('info', `Waiting for ${delaySeconds} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        this.log('success', `Wait completed`);
        break;

      case 'timeout-member':
        const timeoutUser = this.getInputValue(flowData, node.id, 'user', dataContext) || interaction.member;
        const duration = this.getInputValue(flowData, node.id, 'duration', dataContext) || config.duration || 60;
        const timeoutReason = this.getInputValue(flowData, node.id, 'reason', dataContext) || config.reason || 'No reason provided';

        if (!timeoutUser) {
          throw new Error('No user specified for timeout');
        }
        if (!timeoutUser.moderatable) {
          throw new Error(`Cannot timeout ${timeoutUser.user?.tag || 'user'} - user has higher or equal role`);
        }

        const durationMs = duration * 1000; // Convert seconds to milliseconds
        await timeoutUser.timeout(durationMs, timeoutReason);
        this.log('success', `Timed out ${timeoutUser.user?.tag || 'user'} for ${duration}s`);
        break;

      case 'kick-member':
        const kickUser = this.getInputValue(flowData, node.id, 'user', dataContext) || interaction.member;
        const kickReason = this.getInputValue(flowData, node.id, 'reason', dataContext) || config.reason || 'No reason provided';

        if (!kickUser) {
          throw new Error('No user specified for kick');
        }
        if (!kickUser.kickable) {
          throw new Error(`Cannot kick ${kickUser.user?.tag || 'user'} - user has higher or equal role`);
        }

        await kickUser.kick(kickReason);
        this.log('success', `Kicked ${kickUser.user?.tag || 'user'}`);
        break;

      case 'ban-member':
        const banUser = this.getInputValue(flowData, node.id, 'user', dataContext) || interaction.member;
        const banReason = this.getInputValue(flowData, node.id, 'reason', dataContext) || config.reason || 'No reason provided';

        if (!banUser) {
          throw new Error('No user specified for ban');
        }
        if (!banUser.bannable) {
          throw new Error(`Cannot ban ${banUser.user?.tag || 'user'} - user has higher or equal role`);
        }

        await banUser.ban({ reason: banReason, deleteMessageDays: 0 });
        this.log('success', `Banned ${banUser.user?.tag || 'user'}`);
        break;

      case 'unban-member':
        const unbanUserId = this.getInputValue(flowData, node.id, 'userId', dataContext) || config.userId || '';

        if (!unbanUserId) {
          throw new Error('No user ID specified for unban');
        }
        if (!interaction.guild) {
          throw new Error('Cannot unban - no guild context');
        }

        await interaction.guild.members.unban(unbanUserId);
        this.log('success', `Unbanned user ${unbanUserId}`);
        break;

      case 'move-member-voice':
        const moveUser = this.getInputValue(flowData, node.id, 'user', dataContext) || interaction.member;
        const targetChannel = this.getInputValue(flowData, node.id, 'channel', dataContext);

        if (!moveUser) {
          throw new Error('No user specified for voice move');
        }
        if (!targetChannel) {
          throw new Error('No target channel specified');
        }
        if (!moveUser.voice?.channel) {
          throw new Error(`${moveUser.user?.tag || 'User'} is not in a voice channel`);
        }

        await moveUser.voice.setChannel(targetChannel);
        this.log('success', `Moved ${moveUser.user?.tag} to ${targetChannel.name}`);
        break;

      case 'mute-member-voice':
        const muteUser = this.getInputValue(flowData, node.id, 'user', dataContext) || interaction.member;

        if (!muteUser) {
          throw new Error('No user specified for voice mute');
        }
        if (!muteUser.voice?.channel) {
          throw new Error(`${muteUser.user?.tag || 'User'} is not in a voice channel`);
        }

        await muteUser.voice.setMute(true);
        this.log('success', `Voice muted ${muteUser.user?.tag}`);
        break;

      case 'deafen-member-voice':
        const deafenUser = this.getInputValue(flowData, node.id, 'user', dataContext) || interaction.member;

        if (!deafenUser) {
          throw new Error('No user specified for voice deafen');
        }
        if (!deafenUser.voice?.channel) {
          throw new Error(`${deafenUser.user?.tag || 'User'} is not in a voice channel`);
        }

        await deafenUser.voice.setDeaf(true);
        this.log('success', `Voice deafened ${deafenUser.user?.tag}`);
        break;

      case 'delete-message':
        // Check for connected MESSAGE input
        const messageToDelete = this.getInputValue(flowData, node.id, 'message', dataContext);

        if (messageToDelete) {
          // Delete the connected message
          await messageToDelete.delete();
          this.log('success', 'Deleted message from MESSAGE input');
        } else if (interaction && interaction.message) {
          // Fallback: delete interaction message (for message component interactions)
          await interaction.message.delete();
          this.log('success', 'Deleted interaction message');
        } else {
          throw new Error('No message to delete - connect a MESSAGE input or use on a message component');
        }
        break;

      case 'pin-message':
        if (!interaction.message) {
          throw new Error('No message to pin');
        }

        await interaction.message.pin();
        this.log('success', 'Pinned message');
        break;

      case 'create-thread':
        const threadName = this.getInputValue(flowData, node.id, 'name', dataContext) || config.name || 'New Thread';

        if (!interaction.channel?.threads) {
          throw new Error('This channel does not support threads');
        }

        const thread = await interaction.channel.threads.create({
          name: threadName,
          autoArchiveDuration: 60,
          reason: 'Created via bot command',
        });
        this.log('success', `Created thread: ${threadName}`);
        break;

      case 'join-voice':
        if (!voiceModule) {
          throw new Error('Voice support not available. Please install @discordjs/voice: npm install @discordjs/voice');
        }

        const voiceChannel = this.getInputValue(flowData, node.id, 'channel', dataContext);

        if (!voiceChannel) {
          throw new Error('No voice channel specified');
        }

        if (!voiceChannel.isVoiceBased()) {
          throw new Error(`${voiceChannel.name} is not a voice channel`);
        }

        if (!interaction.guild) {
          throw new Error('Cannot join voice channel outside of a guild');
        }

        try {
          const { joinVoiceChannel } = voiceModule;

          // Check if already connected to this guild
          const existingConnection = this.voiceConnections.get(interaction.guild.id);
          if (existingConnection) {
            existingConnection.destroy();
          }

          const connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: interaction.guild.id,
            adapterCreator: interaction.guild.voiceAdapterCreator,
          });

          this.voiceConnections.set(interaction.guild.id, connection);
          this.log('success', `Joined voice channel: ${voiceChannel.name}`);
        } catch (error) {
          throw new Error(`Failed to join voice channel: ${error.message}`);
        }
        break;

      case 'leave-voice':
        if (!voiceModule) {
          throw new Error('Voice support not available. Please install @discordjs/voice: npm install @discordjs/voice');
        }

        if (!interaction.guild) {
          throw new Error('Cannot leave voice channel outside of a guild');
        }

        const connection = this.voiceConnections.get(interaction.guild.id);
        if (!connection) {
          throw new Error('Not connected to any voice channel in this server');
        }

        try {
          // Stop any playing audio first
          const player = this.audioPlayers.get(interaction.guild.id);
          if (player) {
            player.stop();
            this.audioPlayers.delete(interaction.guild.id);
          }

          connection.destroy();
          this.voiceConnections.delete(interaction.guild.id);
          this.log('success', 'Left voice channel');
        } catch (error) {
          throw new Error(`Failed to leave voice channel: ${error.message}`);
        }
        break;

      case 'stream-file-voice':
        if (!voiceModule) {
          throw new Error('Voice support not available. Please install @discordjs/voice: npm install @discordjs/voice');
        }

        if (!interaction.guild) {
          throw new Error('Cannot stream audio outside of a guild');
        }

        const voiceConnection = this.voiceConnections.get(interaction.guild.id);
        if (!voiceConnection) {
          throw new Error('Not connected to any voice channel. Use "Join Voice Channel" first.');
        }

        try {
          const { createAudioResource, createAudioPlayer, AudioPlayerStatus, VoiceConnectionStatus } = voiceModule;

          // Get file input - either from ATTACHMENT or filename STRING
          let fileToStream = this.getInputValue(flowData, node.id, 'file', dataContext);
          const filenameInput = this.getInputValue(flowData, node.id, 'filename', dataContext);

          let filePath;
          if (fileToStream && fileToStream.path) {
            // File object from Read File from Server or String to File
            filePath = fileToStream.path;
          } else if (filenameInput) {
            // Filename string - look in server storage
            filePath = path.join(this.filesPath, filenameInput);
            if (!fs.existsSync(filePath)) {
              throw new Error(`File not found: ${filenameInput}`);
            }
          } else {
            throw new Error('No file specified. Connect a file or filename.');
          }

          // Verify FFmpeg is available
          if (!ffmpegPath) {
            throw new Error('FFmpeg not found. ffmpeg-static may not be installed. Please reinstall: npm install ffmpeg-static');
          }

          this.log('info', `Using FFmpeg at: ${ffmpegPath}`);
          this.log('info', `FFMPEG_PATH env var: ${process.env.FFMPEG_PATH}`);

          // Stop any currently playing audio
          let player = this.audioPlayers.get(interaction.guild.id);
          if (player) {
            player.stop();
          } else {
            player = createAudioPlayer();
            this.audioPlayers.set(interaction.guild.id, player);
          }

          // Create audio resource from file
          // FFmpeg path is already set in process.env.FFMPEG_PATH
          const resource = createAudioResource(filePath, {
            inlineVolume: true,
            metadata: {
              title: path.basename(filePath)
            }
          });

          // Subscribe connection to player
          voiceConnection.subscribe(player);

          // Play the audio
          player.play(resource);

          // Log when finished playing
          player.on(AudioPlayerStatus.Idle, () => {
            this.log('info', 'Finished playing audio');
          });

          player.on('error', (error) => {
            this.log('error', `Audio player error: ${error.message}`);
          });

          const filename = path.basename(filePath);
          this.log('success', `Started streaming: ${filename}`);
        } catch (error) {
          throw new Error(`Failed to stream file: ${error.message}`);
        }
        break;

      case 'stop-voice-stream':
        if (!voiceModule) {
          throw new Error('Voice support not available. Please install @discordjs/voice: npm install @discordjs/voice');
        }

        if (!interaction.guild) {
          throw new Error('Cannot stop stream outside of a guild');
        }

        const audioPlayer = this.audioPlayers.get(interaction.guild.id);
        if (!audioPlayer) {
          throw new Error('No audio is currently playing');
        }

        try {
          audioPlayer.stop();
          this.log('success', 'Stopped audio stream');
        } catch (error) {
          throw new Error(`Failed to stop stream: ${error.message}`);
        }
        break;

      // File operations
      case 'save-file-to-server':
        const saveFilename = this.getInputValue(flowData, node.id, 'filename', dataContext) || config.filename || 'file.txt';
        const saveContent = this.getInputValue(flowData, node.id, 'content', dataContext) || '';

        const saveSuccess = await this.saveFileToServer(saveFilename, saveContent);
        if (!saveSuccess) {
          throw new Error('Failed to save file to server');
        }
        this.log('success', `Saved file: ${saveFilename}`);
        break;

      case 'save-attachment-to-server':
        const attachment = this.getInputValue(flowData, node.id, 'file', dataContext);
        const attachmentFilename = this.getInputValue(flowData, node.id, 'filename', dataContext) || config.filename || attachment?.name || 'file.dat';

        if (!attachment) {
          throw new Error('No attachment provided');
        }

        try {
          await this.downloadFile(attachment.url, attachmentFilename);
          this.log('success', `Saved attachment: ${attachmentFilename}`);
        } catch (error) {
          throw new Error(`Failed to save attachment: ${error.message}`);
        }
        break;

      // Variable operations
      case 'set-variable-global':
        const globalKey = this.getInputValue(flowData, node.id, 'key', dataContext) || config.key || '';
        const globalValue = this.getInputValue(flowData, node.id, 'value', dataContext) || config.value || '';

        if (!globalKey) {
          throw new Error('Variable key is required');
        }

        const globalSetSuccess = await this.setVariable('global', null, globalKey, globalValue);
        if (!globalSetSuccess) {
          throw new Error('Failed to set global variable');
        }
        this.log('success', `Set global variable: ${globalKey} = ${globalValue}`);
        break;

      case 'set-variable-server':
        const serverGuild = this.getInputValue(flowData, node.id, 'guild', dataContext) || interaction.guild;
        const serverKey = this.getInputValue(flowData, node.id, 'key', dataContext) || config.key || '';
        const serverValue = this.getInputValue(flowData, node.id, 'value', dataContext) || config.value || '';

        if (!serverKey) {
          throw new Error('Variable key is required');
        }
        if (!serverGuild) {
          throw new Error('Guild context is required');
        }

        const serverSetSuccess = await this.setVariable('server', serverGuild.id, serverKey, serverValue);
        if (!serverSetSuccess) {
          throw new Error('Failed to set server variable');
        }
        this.log('success', `Set server variable: ${serverKey} = ${serverValue} (Server: ${serverGuild.name})`);
        break;

      case 'set-variable-user':
        const userForVar = this.getInputValue(flowData, node.id, 'user', dataContext) || interaction.user;
        const userKey = this.getInputValue(flowData, node.id, 'key', dataContext) || config.key || '';
        const userValue = this.getInputValue(flowData, node.id, 'value', dataContext) || config.value || '';

        if (!userKey) {
          throw new Error('Variable key is required');
        }
        if (!userForVar) {
          throw new Error('User context is required');
        }

        const userSetSuccess = await this.setVariable('user', userForVar.id, userKey, userValue);
        if (!userSetSuccess) {
          throw new Error('Failed to set user variable');
        }
        this.log('success', `Set user variable: ${userKey} = ${userValue} (User: ${userForVar.tag || userForVar.id})`);
        break;

      // System Management Actions
      case 'ssh-execute':
        const sshCommand = this.getInputValue(flowData, node.id, 'command', dataContext) || config.command;
        const sshConfig = {
          host: config.host,
          port: config.port || 22,
          username: config.username,
          password: config.password,
          privateKey: config.usePrivateKey ? fs.readFileSync(config.privateKey) : undefined
        };

        if (!sshConfig.host || !sshConfig.username) {
          throw new Error('SSH host and username are required');
        }

        const sshOutput = await this.executeSSHCommand(sshConfig, sshCommand);
        dataContext[`${node.id}_output`] = sshOutput;
        this.log('success', `SSH command executed: ${sshCommand.substring(0, 50)}...`);
        break;

      case 'file-read':
        const readPath = this.getInputValue(flowData, node.id, 'path', dataContext) || config.path;
        if (!readPath) {
          throw new Error('File path is required');
        }

        let readContent;
        if (config.ssh) {
          throw new Error('SSH file operations require SSH Execute node first (not yet implemented)');
        } else {
          readContent = fs.readFileSync(readPath, 'utf8');
        }

        dataContext[`${node.id}_content`] = readContent;
        this.log('success', `Read file: ${readPath}`);
        break;

      case 'file-write':
        const writePath = this.getInputValue(flowData, node.id, 'path', dataContext) || config.path;
        const writeContent = this.getInputValue(flowData, node.id, 'content', dataContext) || config.content;

        if (!writePath) {
          throw new Error('File path is required');
        }

        if (config.ssh) {
          throw new Error('SSH file operations require SSH Execute node first (not yet implemented)');
        } else {
          // Ensure directory exists
          const writeDir = path.dirname(writePath);
          if (!fs.existsSync(writeDir)) {
            fs.mkdirSync(writeDir, { recursive: true });
          }
          fs.writeFileSync(writePath, writeContent || '', 'utf8');
        }

        this.log('success', `Wrote file: ${writePath}`);
        break;

      case 'file-delete':
        const deletePath = this.getInputValue(flowData, node.id, 'path', dataContext) || config.path;
        if (!deletePath) {
          throw new Error('File path is required');
        }

        if (config.ssh) {
          throw new Error('SSH file operations require SSH Execute node first (not yet implemented)');
        } else {
          if (fs.existsSync(deletePath)) {
            fs.unlinkSync(deletePath);
          } else {
            throw new Error(`File not found: ${deletePath}`);
          }
        }

        this.log('success', `Deleted file: ${deletePath}`);
        break;

      case 'directory-list':
        const listPath = this.getInputValue(flowData, node.id, 'path', dataContext) || config.path || '.';

        let fileList;
        if (config.ssh) {
          throw new Error('SSH file operations require SSH Execute node first (not yet implemented)');
        } else {
          if (!fs.existsSync(listPath)) {
            throw new Error(`Directory not found: ${listPath}`);
          }
          const files = fs.readdirSync(listPath);
          fileList = files.join('\n');
        }

        dataContext[`${node.id}_files`] = fileList;
        this.log('success', `Listed directory: ${listPath} (${fileList.split('\n').length} items)`);
        break;

      case 'process-start':
        const processCommand = this.getInputValue(flowData, node.id, 'command', dataContext) || config.command;
        const processArgs = this.getInputValue(flowData, node.id, 'args', dataContext) || config.args;
        const processCwd = config.cwd || process.cwd();

        if (!processCommand) {
          throw new Error('Command is required');
        }

        // Parse arguments
        const args = processArgs ? processArgs.split(' ').filter(a => a.trim()) : [];

        // Start process
        const proc = spawn(processCommand, args, {
          cwd: processCwd,
          shell: true,
          stdio: ['pipe', 'pipe', 'pipe']
        });

        // Generate unique process ID
        const processId = `proc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Store process with output buffer
        this.processes.set(processId, {
          process: proc,
          output: [],
          startTime: Date.now(),
          command: processCommand,
          args: args
        });

        // Capture output
        proc.stdout.on('data', (data) => {
          const procData = this.processes.get(processId);
          if (procData) {
            procData.output.push({ type: 'stdout', data: data.toString(), time: Date.now() });
            // Keep only last 1000 lines
            if (procData.output.length > 1000) {
              procData.output = procData.output.slice(-1000);
            }
          }
        });

        proc.stderr.on('data', (data) => {
          const procData = this.processes.get(processId);
          if (procData) {
            procData.output.push({ type: 'stderr', data: data.toString(), time: Date.now() });
            if (procData.output.length > 1000) {
              procData.output = procData.output.slice(-1000);
            }
          }
        });

        proc.on('exit', (code) => {
          const procData = this.processes.get(processId);
          if (procData) {
            procData.exitCode = code;
            procData.exited = true;
            this.log('info', `Process ${processId} exited with code ${code}`);
          }
        });

        dataContext[`${node.id}_processId`] = processId;
        this.log('success', `Started process: ${processCommand} (ID: ${processId})`);
        break;

      case 'process-stop':
        const stopProcessId = this.getInputValue(flowData, node.id, 'processId', dataContext) || config.processId;

        if (!stopProcessId) {
          throw new Error('Process ID is required');
        }

        const procToStop = this.processes.get(stopProcessId);
        if (!procToStop) {
          throw new Error(`Process not found: ${stopProcessId}`);
        }

        if (procToStop.exited) {
          throw new Error(`Process already exited: ${stopProcessId}`);
        }

        procToStop.process.kill();
        this.log('success', `Stopped process: ${stopProcessId}`);
        break;

      case 'process-output':
        const outputProcessId = this.getInputValue(flowData, node.id, 'processId', dataContext) || config.processId;
        const outputLines = config.lines || 50;

        if (!outputProcessId) {
          throw new Error('Process ID is required');
        }

        const procForOutput = this.processes.get(outputProcessId);
        if (!procForOutput) {
          throw new Error(`Process not found: ${outputProcessId}`);
        }

        // Get last N lines of output
        const lastLines = procForOutput.output.slice(-outputLines);
        const outputText = lastLines.map(line => line.data).join('');

        dataContext[`${node.id}_output`] = outputText;
        this.log('success', `Retrieved ${lastLines.length} lines from process: ${outputProcessId}`);
        break;

      case 'process-input':
        const inputProcessId = this.getInputValue(flowData, node.id, 'processId', dataContext) || config.processId;
        const inputText = this.getInputValue(flowData, node.id, 'input', dataContext) || config.input;

        if (!inputProcessId) {
          throw new Error('Process ID is required');
        }

        const procForInput = this.processes.get(inputProcessId);
        if (!procForInput) {
          throw new Error(`Process not found: ${inputProcessId}`);
        }

        if (procForInput.exited) {
          throw new Error(`Process already exited: ${inputProcessId}`);
        }

        procForInput.process.stdin.write(inputText + '\n');
        this.log('success', `Sent input to process ${inputProcessId}: ${inputText}`);
        break;

      default:
        this.log('warning', `Unknown action type: ${actionType}`);
        break;
    }

    // Action executed successfully
    return { success: true };

    } catch (error) {
      // Action failed - log error and return failure status
      this.log('error', `Action ${actionType} failed: ${error.message}`);
      return { success: false };
    }
  }

  async executeDataNode(node, flowData, dataContext) {
    const nodeType = node.data.nodeType;

    if (!nodeType) {
      this.log('error', `Data node ${node.id} missing nodeType`);
      return {};
    }

    // Get input values with error handling
    const getUserInput = (inputId) => {
      try {
        return this.getInputValue(flowData, node.id, inputId, dataContext);
      } catch (error) {
        this.log('error', `Error getting input ${inputId} for node ${node.id}: ${error.message}`);
        return null;
      }
    };

    const output = {};

    try {

    switch (nodeType) {
      // Static value nodes (constants)
      case 'static-boolean':
        output.value = node.data.config?.value || false;
        break;

      case 'static-number':
        output.value = node.data.config?.value || 0;
        break;

      case 'static-string':
        output.value = node.data.config?.value || '';
        break;

      case 'get-user-name':
        const user = getUserInput('user');
        output.name = user?.username || 'Unknown';
        break;

      case 'get-user-avatar':
        const avatarUser = getUserInput('user');
        output.url = avatarUser?.displayAvatarURL?.() || '';
        break;

      case 'get-user-id':
        const idUser = getUserInput('user');
        output.id = idUser?.id || '';
        break;

      case 'get-channel-name':
        const channel = getUserInput('channel');
        output.name = channel?.name || 'Unknown';
        break;

      case 'get-channel-id':
        const idChannel = getUserInput('channel');
        output.id = idChannel?.id || '';
        break;

      case 'get-guild-name':
        const guild = getUserInput('guild');
        output.name = guild?.name || 'Unknown';
        break;

      // Utility nodes
      case 'join-strings':
        const string1 = getUserInput('string1') || '';
        const string2 = getUserInput('string2') || '';
        output.result = string1 + string2;
        break;

      case 'number-to-string':
        const number = getUserInput('number');
        output.string = number !== null && number !== undefined ? String(number) : '';
        break;

      case 'add-numbers':
        const addA = parseFloat(getUserInput('a')) || 0;
        const addB = parseFloat(getUserInput('b')) || 0;
        output.result = addA + addB;
        break;

      case 'subtract-numbers':
        const subA = parseFloat(getUserInput('a')) || 0;
        const subB = parseFloat(getUserInput('b')) || 0;
        output.result = subA - subB;
        break;

      case 'multiply-numbers':
        const mulA = parseFloat(getUserInput('a')) || 0;
        const mulB = parseFloat(getUserInput('b')) || 0;
        output.result = mulA * mulB;
        break;

      case 'divide-numbers':
        const divA = parseFloat(getUserInput('a')) || 0;
        const divB = parseFloat(getUserInput('b')) || 1; // Avoid division by zero
        output.result = divB !== 0 ? divA / divB : 0;
        break;

      case 'check-has-role':
        const checkUser = getUserInput('user');
        const roleId = getUserInput('roleId');
        output.result = false;
        if (checkUser && roleId && dataContext.member) {
          output.result = dataContext.member.roles.cache.has(roleId);
        }
        break;

      // String operations
      case 'string-length':
        const strForLength = getUserInput('string') || '';
        output.length = strForLength.length;
        break;

      case 'string-contains':
        const searchString = getUserInput('string') || '';
        const searchTerm = getUserInput('search') || '';
        output.result = searchString.includes(searchTerm);
        break;

      case 'string-lowercase':
        const lowerStr = getUserInput('string') || '';
        output.result = lowerStr.toLowerCase();
        break;

      case 'string-uppercase':
        const upperStr = getUserInput('string') || '';
        output.result = upperStr.toUpperCase();
        break;

      case 'string-to-number':
        const numStr = getUserInput('string') || '0';
        output.number = parseFloat(numStr) || 0;
        break;

      // Comparison operations
      case 'number-greater-than':
        const gtA = parseFloat(getUserInput('a')) || 0;
        const gtB = parseFloat(getUserInput('b')) || 0;
        output.result = gtA > gtB;
        break;

      case 'number-less-than':
        const ltA = parseFloat(getUserInput('a')) || 0;
        const ltB = parseFloat(getUserInput('b')) || 0;
        output.result = ltA < ltB;
        break;

      case 'number-equals':
        const eqA = parseFloat(getUserInput('a')) || 0;
        const eqB = parseFloat(getUserInput('b')) || 0;
        output.result = eqA === eqB;
        break;

      case 'compare-strings':
        const strA = getUserInput('a') || '';
        const strB = getUserInput('b') || '';
        output.result = strA === strB;
        break;

      // Boolean operations
      case 'boolean-not':
        const boolValue = getUserInput('value');
        output.result = !boolValue;
        break;

      case 'boolean-and':
        const andA = getUserInput('a');
        const andB = getUserInput('b');
        output.result = andA && andB;
        break;

      case 'boolean-or':
        const orA = getUserInput('a');
        const orB = getUserInput('b');
        output.result = orA || orB;
        break;

      // Random number
      case 'random-number':
        const min = parseFloat(getUserInput('min')) || 0;
        const max = parseFloat(getUserInput('max')) || 100;
        output.result = Math.floor(Math.random() * (max - min + 1)) + min;
        break;

      // Guild operations
      case 'get-member-count':
        const memberGuild = getUserInput('guild');
        output.count = memberGuild?.memberCount || 0;
        break;

      // New data nodes - user info
      case 'get-member-joindate':
        const joinUser = getUserInput('user');
        if (joinUser && dataContext.member) {
          const joinDate = dataContext.member.joinedAt;
          output.date = joinDate ? joinDate.toISOString() : '';
        } else {
          output.date = '';
        }
        break;

      case 'get-user-created':
        const createdUser = getUserInput('user');
        if (createdUser && createdUser.createdAt) {
          output.date = createdUser.createdAt.toISOString();
        } else {
          output.date = '';
        }
        break;

      // Utility nodes
      case 'wait-delay':
        const seconds = parseFloat(getUserInput('seconds')) || 0;
        if (seconds > 0) {
          await new Promise(resolve => setTimeout(resolve, seconds * 1000));
        }
        output.result = seconds;
        break;

      case 'format-number':
        const numToFormat = parseFloat(getUserInput('number')) || 0;
        const decimals = parseInt(getUserInput('decimals')) || 2;
        output.result = numToFormat.toFixed(decimals);
        break;

      case 'current-timestamp':
        output.timestamp = Math.floor(Date.now() / 1000); // Unix timestamp in seconds
        break;

      // File operation data nodes
      case 'get-file-name':
        const fileForName = getUserInput('file');
        output.name = fileForName?.name || '';
        break;

      case 'get-file-url':
        const fileForUrl = getUserInput('file');
        output.url = fileForUrl?.url || '';
        break;

      case 'get-file-size':
        const fileForSize = getUserInput('file');
        output.size = fileForSize?.size || 0;
        break;

      case 'read-file-from-url':
        const fileUrl = getUserInput('url');
        if (fileUrl) {
          try {
            const fileContent = await this.readFileFromURL(fileUrl);
            output.content = fileContent;
          } catch (error) {
            this.log('error', `Failed to read file from URL: ${error.message}`);
            output.content = '';
          }
        } else {
          output.content = '';
        }
        break;

      case 'read-file-from-server':
        const filename = getUserInput('filename');
        if (filename) {
          const filepath = path.join(this.filesPath, filename);
          if (fs.existsSync(filepath)) {
            output.file = {
              path: filepath,
              name: filename,
              size: fs.statSync(filepath).size
            };
          } else {
            output.file = null;
          }
        } else {
          output.file = null;
        }
        break;

      case 'file-to-string':
        const fileToRead = getUserInput('file');
        if (fileToRead) {
          // If it's a local file with path
          if (fileToRead.path && fs.existsSync(fileToRead.path)) {
            try {
              output.content = fs.readFileSync(fileToRead.path, 'utf8');
            } catch (error) {
              this.log('error', `Failed to read file: ${error.message}`);
              output.content = '';
            }
          }
          // If it's a Discord attachment with URL
          else if (fileToRead.url) {
            try {
              output.content = await this.readFileFromURL(fileToRead.url);
            } catch (error) {
              this.log('error', `Failed to read file from URL: ${error.message}`);
              output.content = '';
            }
          } else {
            output.content = '';
          }
        } else {
          output.content = '';
        }
        break;

      case 'string-to-file':
        const contentToFile = getUserInput('content');
        const filenameForFile = getUserInput('filename') || node.data.config?.filename || 'file.txt';

        if (contentToFile && filenameForFile) {
          // Create a temporary file
          const tempFilePath = path.join(this.filesPath, `temp_${Date.now()}_${filenameForFile}`);
          try {
            fs.writeFileSync(tempFilePath, contentToFile, 'utf8');
            output.file = {
              path: tempFilePath,
              name: filenameForFile,
              size: Buffer.byteLength(contentToFile, 'utf8')
            };
          } catch (error) {
            this.log('error', `Failed to create file: ${error.message}`);
            output.file = null;
          }
        } else {
          output.file = null;
        }
        break;

      case 'check-file-exists':
        const fileToCheck = getUserInput('filename');
        if (fileToCheck) {
          const checkFilePath = path.join(this.filesPath, fileToCheck);
          output.exists = fs.existsSync(checkFilePath);
        } else {
          output.exists = false;
        }
        break;

      // Variable data nodes
      case 'get-variable-global':
        const globalVarKey = getUserInput('key');
        if (globalVarKey) {
          output.value = await this.getVariable('global', null, globalVarKey);
        } else {
          output.value = '';
        }
        break;

      case 'get-variable-server':
        const serverVarGuild = getUserInput('guild');
        const serverVarKey = getUserInput('key');
        if (serverVarGuild && serverVarKey) {
          output.value = await this.getVariable('server', serverVarGuild.id, serverVarKey);
        } else {
          output.value = '';
        }
        break;

      case 'get-variable-user':
        const userVarUser = getUserInput('user');
        const userVarKey = getUserInput('key');
        if (userVarUser && userVarKey) {
          output.value = await this.getVariable('user', userVarUser.id, userVarKey);
        } else {
          output.value = '';
        }
        break;

      default:
        this.log('warning', `Unknown data node type: ${nodeType}`);
        break;
    }

    } catch (error) {
      this.log('error', `Error executing data node ${nodeType}: ${error.message}`);
      return {};
    }

    return output; // Return computed values
  }

  stop() {
    if (this.client) {
      this.log('info', 'Stopping bot...');

      // Stop all audio players
      if (this.audioPlayers.size > 0) {
        this.log('info', `Stopping ${this.audioPlayers.size} audio players...`);
        for (const [guildId, player] of this.audioPlayers) {
          try {
            player.stop();
          } catch (error) {
            this.log('error', `Failed to stop audio player in guild ${guildId}: ${error.message}`);
          }
        }
        this.audioPlayers.clear();
      }

      // Disconnect from all voice channels
      if (this.voiceConnections.size > 0) {
        this.log('info', `Disconnecting from ${this.voiceConnections.size} voice channels...`);
        for (const [guildId, connection] of this.voiceConnections) {
          try {
            connection.destroy();
          } catch (error) {
            this.log('error', `Failed to disconnect from voice in guild ${guildId}: ${error.message}`);
          }
        }
        this.voiceConnections.clear();
      }

      this.client.destroy();
      this.client = null;
      this.isRunning = false;
      this.log('success', 'Bot stopped successfully');
    }
  }
}

module.exports = BotRunner;
