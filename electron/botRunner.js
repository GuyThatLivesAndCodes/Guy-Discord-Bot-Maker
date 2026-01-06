const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');

class BotRunner {
  constructor(botId, config, logCallback) {
    this.botId = botId;
    this.config = config;
    this.logCallback = logCallback;
    this.client = null;
    this.isRunning = false;
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

  async start() {
    if (this.isRunning) {
      throw new Error('Bot is already running');
    }

    if (!this.config.token) {
      throw new Error('Bot token is required');
    }

    this.log('info', 'Starting bot...');

    // Create Discord client with necessary intents
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
      ],
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
    const commands = commandEvents.map(cmd => ({
      name: cmd.name,
      description: cmd.description || 'No description provided',
    }));

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

    this.client.on('error', (error) => {
      this.log('error', `Client error: ${error.message}`);
    });

    this.client.on('disconnect', () => {
      this.log('info', 'Bot disconnected');
    });
  }

  async executeCommand(interaction, command) {
    // Execute graph-based command flow
    const flowData = command.flowData;

    if (!flowData || !flowData.nodes || flowData.nodes.length === 0) {
      await interaction.reply({ content: 'This command has no actions configured.', ephemeral: true });
      return;
    }

    try {
      // Find starting nodes (nodes with no incoming edges)
      const startNodes = this.findStartNodes(flowData);

      if (startNodes.length === 0) {
        await interaction.reply({ content: 'No starting point found in command flow.', ephemeral: true });
        return;
      }

      // Execute the flow starting from the first start node
      await this.executeFlow(interaction, flowData, startNodes[0]);
    } catch (error) {
      this.log('error', `Command execution error: ${error.message}`);
      await interaction.reply({ content: 'An error occurred while executing this command.', ephemeral: true });
    }
  }

  findStartNodes(flowData) {
    const nodesWithIncoming = new Set();
    flowData.edges.forEach((edge) => nodesWithIncoming.add(edge.target));
    return flowData.nodes.filter((node) => !nodesWithIncoming.has(node.id));
  }

  getNextNodes(flowData, currentNodeId) {
    const outgoingEdges = flowData.edges.filter((edge) => edge.source === currentNodeId);
    return outgoingEdges.map((edge) =>
      flowData.nodes.find((node) => node.id === edge.target)
    ).filter(Boolean);
  }

  async executeFlow(interaction, flowData, startNode, visited = new Set()) {
    if (!startNode || visited.has(startNode.id)) {
      return; // Prevent infinite loops
    }

    visited.add(startNode.id);

    // Execute current node
    const shouldContinue = await this.executeNode(interaction, startNode);

    if (!shouldContinue) {
      return; // Stop execution if node returns false
    }

    // Get next nodes
    const nextNodes = this.getNextNodes(flowData, startNode.id);

    // Execute all next nodes
    for (const nextNode of nextNodes) {
      await this.executeFlow(interaction, flowData, nextNode, visited);
    }
  }

  async executeNode(interaction, node) {
    const actionType = node.data.actionType;
    const config = node.data.config;

    switch (actionType) {
      case 'send-message':
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({ content: config.content || 'Hello!' });
        } else {
          await interaction.followUp({ content: config.content || 'Hello!' });
        }
        break;

      case 'embed':
        const embed = {
          color: parseInt(config.color?.replace('#', '0x') || '0x5865f2'),
        };

        if (config.title) embed.title = config.title;
        if (config.description) embed.description = config.description;
        if (config.url) embed.url = config.url;
        if (config.thumbnail) embed.thumbnail = { url: config.thumbnail };
        if (config.image) embed.image = { url: config.image };

        if (config.author) {
          embed.author = { name: config.author };
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

        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({ embeds: [embed] });
        } else {
          await interaction.followUp({ embeds: [embed] });
        }
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

      case 'condition':
        // Evaluate condition and return false to stop flow if condition fails
        return this.evaluateCondition(interaction, config);

      default:
        break;
    }

    return true; // Continue to next nodes
  }

  evaluateCondition(interaction, config) {
    const condition = config.condition;
    const value = config.value;

    switch (condition) {
      case 'has-role':
        if (value && interaction.member) {
          return interaction.member.roles.cache.has(value);
        }
        return false;

      case 'user-id':
        return interaction.user.id === value;

      case 'random':
        const chance = parseInt(value) || 50;
        return Math.random() * 100 < chance;

      default:
        return true;
    }
  }

  stop() {
    if (this.client) {
      this.log('info', 'Stopping bot...');
      this.client.destroy();
      this.client = null;
      this.isRunning = false;
      this.log('success', 'Bot stopped successfully');
    }
  }
}

module.exports = BotRunner;
