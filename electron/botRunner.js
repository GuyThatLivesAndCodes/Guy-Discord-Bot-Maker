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
    // Process command actions from the drag-and-drop builder
    if (!command.actions || command.actions.length === 0) {
      await interaction.reply({ content: 'This command has no actions configured.', ephemeral: true });
      return;
    }

    let response = '';

    for (const action of command.actions) {
      switch (action.type) {
        case 'send-message':
          response += (action.content || 'Hello!') + '\n';
          break;

        case 'embed':
          // For now, simple embed support
          await interaction.reply({
            embeds: [{
              title: action.title || 'Embed',
              description: action.description || '',
              color: parseInt(action.color || '0x0099ff'),
            }]
          });
          return;

        case 'add-role':
          if (action.roleId && interaction.member) {
            const role = interaction.guild.roles.cache.get(action.roleId);
            if (role) {
              await interaction.member.roles.add(role);
              response += `Added role ${role.name}\n`;
            }
          }
          break;

        default:
          // Unknown action type
          break;
      }
    }

    if (response) {
      await interaction.reply({ content: response.trim() });
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
