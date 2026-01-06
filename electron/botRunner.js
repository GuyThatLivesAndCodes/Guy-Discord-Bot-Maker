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
        user: interaction.user,
        channel: interaction.channel,
        guild: interaction.guild,
        member: interaction.member,
      };

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
          const result = this.executeDataNode(sourceNode, flowData, dataContext);

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

    // Store computed data from this node
    if (nodeOutput && typeof nodeOutput === 'object') {
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
      // Get next nodes connected via flow output
      const nextConnections = this.getConnectedNodes(flowData, startNode.id, 'flow');

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
      const result = this.executeDataNode(node, flowData, dataContext);
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
          ephemeral: config.ephemeral || false
        };

        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply(messageOptions);
        } else {
          await interaction.followUp(messageOptions);
        }
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
          ephemeral: config.ephemeral || false
        };

        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply(embedOptions);
        } else {
          await interaction.followUp(embedOptions);
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

      case 'send-dm':
        const dmUser = this.getInputValue(flowData, node.id, 'user', dataContext) || interaction.user;
        let dmContent = config.content || 'Hello!';
        const connectedDmContent = this.getInputValue(flowData, node.id, 'content', dataContext);
        if (connectedDmContent) {
          dmContent = connectedDmContent;
        }

        try {
          await dmUser.send(dmContent);
          this.log('success', `Sent DM to ${dmUser.tag}`);
        } catch (error) {
          this.log('error', `Failed to send DM: ${error.message}`);
        }
        break;

      case 'react-emoji':
        try {
          await interaction.react(config.emoji || '👍');
          this.log('success', `Reacted with ${config.emoji}`);
        } catch (error) {
          this.log('error', `Failed to react: ${error.message}`);
        }
        break;

      case 'branch':
        // Branch node handles conditional flow - handled in executeFlow
        // The branch logic is handled by checking outputs in executeFlow
        break;

      default:
        this.log('warning', `Unknown action type: ${actionType}`);
        break;
    }

    return true; // Continue to next nodes
  }

  executeDataNode(node, flowData, dataContext) {
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
      this.client.destroy();
      this.client = null;
      this.isRunning = false;
      this.log('success', 'Bot stopped successfully');
    }
  }
}

module.exports = BotRunner;
